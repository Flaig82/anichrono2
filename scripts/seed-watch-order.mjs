/**
 * Create a franchise + seeded Watch Order directly via the service role — the
 * script equivalent of the site's claim flow (app/api/franchise/create), for
 * the generate-list routine (agents can't drag-and-drop; this path is
 * deterministic).
 *
 * Mirrors the app's seeding policy (lib/anilist.ts relation filters +
 * lib/chronicle-builder.ts), but gathers the WHOLE franchise by walking the
 * AniList relation graph (BFS) rather than one hop — AniList has no "collection"
 * the way IGDB does, so multi-season franchises (Naruto -> Shippuden -> Boruto)
 * are only fully connected through PREQUEL/SEQUEL/SIDE_STORY edges.
 *
 * Usage (from repo root):
 *   node scripts/seed-watch-order.mjs --anilist <mediaId> [--title "Franchise"] [--dry-run]
 *                                     [--exclude <id,id,...>]   # drop junk found in the dry run
 *   node scripts/seed-watch-order.mjs --query "naruto"          # search, print candidates, exit
 *
 * Output: the created franchise slug + an entry table (position, title,
 * anilist_id, year) in airing order, ready to be re-ordered with
 * scripts/apply-watch-order.mjs.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// --- env --------------------------------------------------------------------
function loadEnv() {
  const raw = readFileSync(resolve(import.meta.dirname, "../.env.local"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}
const env = loadEnv();
// AniList is a keyless public GraphQL API — only Supabase creds are required.
for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (!env[key]) {
    console.error(`Missing ${key} in .env.local`);
    process.exit(1);
  }
}
const SITE_URL = (env.NEXT_PUBLIC_SITE_URL ?? "https://www.animechrono.com").replace(/\/$/, "");

// --- args -------------------------------------------------------------------
const args = process.argv.slice(2);
function argValue(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
}
const anilistIdArg = argValue("--anilist");
const queryArg = argValue("--query");
const titleArg = argValue("--title");
const dryRun = args.includes("--dry-run");
const excluded = new Set(
  (argValue("--exclude") ?? "")
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n)),
);
if (!anilistIdArg && !queryArg) {
  console.error('Usage: node scripts/seed-watch-order.mjs --anilist <id> [--title "..."] [--dry-run] | --query "name"');
  process.exit(1);
}

// --- AniList client (mirrors lib/anilist.ts policies) -----------------------
const ANILIST_URL = "https://graphql.anilist.co";
const ANILIST_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent": "AnimeChrono/1.0 (https://animechrono.com)",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function anilist(query, variables) {
  const maxRetries = 6;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: ANILIST_HEADERS,
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 429 || res.status === 403) {
      // AniList is currently degraded to ~30 req/min; honour Retry-After.
      const retryAfter = parseInt(res.headers.get("retry-after") ?? "", 10);
      const wait = Number.isFinite(retryAfter) ? Math.min(retryAfter, 65) * 1000 : 700 * Math.pow(2, attempt);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`AniList ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (json.errors) throw new Error(`AniList query error: ${JSON.stringify(json.errors)}`);
    return json.data;
  }
  throw new Error("AniList request failed after retries (rate-limited).");
}

const RELEVANT_FORMATS = new Set(["TV", "TV_SHORT", "MOVIE", "OVA", "ONA", "SPECIAL"]);
const RELEVANT_RELATION_TYPES = new Set([
  "SEQUEL", "PREQUEL", "SIDE_STORY", "PARENT", "ALTERNATIVE", "SPIN_OFF",
]);
const FORMAT_TO_ENTRY_TYPE = {
  TV: "episodes", TV_SHORT: "episodes", MOVIE: "movie", OVA: "ova", ONA: "ona", SPECIAL: "special",
};
const formatToEntryType = (f) => FORMAT_TO_ENTRY_TYPE[f] ?? "episodes";
const displayTitle = (m) => m.title.english ?? m.title.romaji;
const dateKey = (d, fallbackYear) => {
  const y = d?.year ?? fallbackYear ?? 9999;
  return y * 10000 + (d?.month ?? 99) * 100 + (d?.day ?? 99);
};

// --- search mode ------------------------------------------------------------
if (queryArg) {
  const data = await anilist(
    `query ($search: String) {
       Page(perPage: 10) {
         media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
           id title { english romaji } format episodes
           startDate { year } popularity
         }
       }
     }`,
    { search: queryArg },
  );
  const rows = (data.Page?.media ?? []).filter((m) => RELEVANT_FORMATS.has(m.format ?? ""));
  for (const m of rows) {
    console.log(
      `${String(m.id).padStart(7)}  ${displayTitle(m)}  (${m.startDate?.year ?? "?"}, ${m.format}, ${m.popularity ?? 0} members)`,
    );
  }
  console.log("\nRe-run with --anilist <id> using the franchise's first/flagship series (the seed expands the whole franchise from any member).");
  process.exit(0);
}

// --- 1. fetch the flagship media --------------------------------------------
const rootId = parseInt(anilistIdArg, 10);
const mainData = await anilist(
  `query ($id: Int) {
     Media(id: $id, type: ANIME) {
       id title { english romaji } description(asHtml: false)
       coverImage { extraLarge large } bannerImage
       popularity status genres
       studios(isMain: true) { nodes { name isAnimationStudio } }
       seasonYear startDate { year } format episodes
     }
   }`,
  { id: rootId },
);
const main = mainData.Media;
if (!main) {
  console.error(`AniList media ${rootId} not found`);
  process.exit(1);
}

// --- 2. BFS the relation graph to gather the whole franchise ----------------
const MAX_NODES = 60; // hard cap so a runaway graph can't seed hundreds of rows
const memberIds = new Set([rootId]);
const queue = [rootId];
let truncated = false;
while (queue.length) {
  const id = queue.shift();
  const data = await anilist(
    `query ($id: Int) {
       Media(id: $id, type: ANIME) {
         relations { edges { relationType node { id format } } }
       }
     }`,
    { id },
  );
  const edges = data.Media?.relations?.edges ?? [];
  for (const e of edges) {
    const nid = e.node?.id;
    if (nid == null) continue;
    if (!RELEVANT_RELATION_TYPES.has(e.relationType)) continue;
    if (!RELEVANT_FORMATS.has(e.node.format ?? "")) continue;
    if (memberIds.has(nid) || excluded.has(nid)) continue;
    if (memberIds.size >= MAX_NODES) { truncated = true; continue; }
    memberIds.add(nid);
    queue.push(nid);
  }
}
if (truncated) {
  console.warn(`\n⚠ Relation graph exceeded ${MAX_NODES} nodes — seed truncated. Verify nothing important was dropped.`);
}

// --- 3. hydrate all members -------------------------------------------------
const allIds = [...memberIds].filter((id) => !excluded.has(id));
const hydrated = [];
for (let i = 0; i < allIds.length; i += 50) {
  const data = await anilist(
    `query ($ids: [Int]) {
       Page(perPage: 50) {
         media(id_in: $ids, type: ANIME) {
           id title { english romaji } format episodes status
           startDate { year month day } seasonYear
           coverImage { extraLarge large }
         }
       }
     }`,
    { ids: allIds.slice(i, i + 50) },
  );
  hydrated.push(...(data.Page?.media ?? []));
}

// --- 4. build the seed (airing order; curated order applied later) ----------
const pool = hydrated
  .filter((m) => RELEVANT_FORMATS.has(m.format ?? ""))
  .sort((a, b) => dateKey(a.startDate, a.seasonYear) - dateKey(b.startDate, b.seasonYear));

if (pool.length === 0) {
  console.error("Seed is empty after filtering — check the AniList id.");
  process.exit(1);
}

const franchiseTitle = (titleArg ?? displayTitle(main)).trim();

console.log(`\nFranchise: ${franchiseTitle}`);
console.log(`Seed (${pool.length} entries, airing order):`);
pool.forEach((m, i) =>
  console.log(
    `  ${String(i + 1).padStart(2)}. ${displayTitle(m)}  [anilist ${m.id}, ${m.startDate?.year ?? "?"}, ${m.format}]`,
  ),
);

if (dryRun) {
  console.log("\n--dry-run: nothing written.");
  process.exit(0);
}

// --- 5. write to Supabase ---------------------------------------------------
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Attribution: the site's curator (first admin — mirrors the UI claim flow).
const { data: curator } = await supabase
  .from("users")
  .select("id, display_name")
  .eq("is_admin", true)
  .order("created_at", { ascending: true })
  .limit(1)
  .maybeSingle();
if (!curator) {
  console.error("No admin user found for attribution (users.is_admin = true).");
  process.exit(1);
}

// Duplicate guard: any seed member already claimed on the site?
const [{ data: fDup }, { data: eDup }] = await Promise.all([
  supabase.from("franchise").select("slug, title").in("anilist_id", allIds).limit(1),
  supabase.from("entry").select("franchise_id, title").in("anilist_id", allIds).limit(1),
]);
if (fDup?.length || eDup?.length) {
  console.error(`Aborting: already claimed — "${fDup?.[0]?.title ?? eDup?.[0]?.title}" exists on the site.`);
  process.exit(1);
}

// Obscurity tier from AniList popularity (we have it now — no need to wait for cron).
function getObscurityTier(memberCount) {
  if (memberCount >= 500_000) return { score: 0.5, tier: "mainstream" };
  if (memberCount >= 100_000) return { score: 1.0, tier: "popular" };
  if (memberCount >= 10_000) return { score: 2.0, tier: "cult" };
  return { score: 4.0, tier: "obscure" };
}
const { score, tier } = getObscurityTier(main.popularity ?? 0);

// Map AniList status to our CHECK constraint.
const statusMap = { FINISHED: "finished", RELEASING: "releasing" };
const status = statusMap[main.status] ?? "not_yet_released";

const mainStudio =
  main.studios?.nodes?.find((s) => s.isAnimationStudio)?.name ??
  main.studios?.nodes?.[0]?.name ??
  null;

// Slug (unique)
const baseSlug = franchiseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
let slug = baseSlug;
for (let n = 2; ; n++) {
  const { data } = await supabase.from("franchise").select("id").eq("slug", slug).maybeSingle();
  if (!data) break;
  slug = `${baseSlug}-${n}`;
}

const { data: franchise, error: fErr } = await supabase
  .from("franchise")
  .insert({
    title: franchiseTitle,
    slug,
    created_by: curator.id,
    genres: main.genres ?? [],
    year_started: main.startDate?.year ?? pool[0]?.startDate?.year ?? null,
    studio: mainStudio,
    anilist_id: main.id,
    status,
    cover_image_url: main.coverImage?.extraLarge ?? main.coverImage?.large ?? null,
    banner_image_url: main.bannerImage ?? null,
    description: main.description ?? null,
    obscurity_score: score,
    obscurity_tier: tier,
  })
  .select("id, slug")
  .single();
if (fErr) {
  console.error(`Franchise insert failed: ${fErr.message}`);
  process.exit(1);
}

const entryRows = pool.map((m, i) => {
  const entryType = formatToEntryType(m.format);
  const isEpisodes = entryType === "episodes";
  return {
    franchise_id: franchise.id,
    position: i + 1,
    title: isEpisodes && m.episodes ? `Episodes 1–${m.episodes}` : displayTitle(m),
    entry_type: entryType,
    episode_start: isEpisodes ? 1 : null,
    episode_end: isEpisodes ? (m.episodes ?? null) : null,
    parent_series: displayTitle(m),
    anilist_id: m.id,
    is_essential: true,
    curator_note: null,
    cover_image_url: m.coverImage?.extraLarge ?? m.coverImage?.large ?? null,
  };
});
const { error: eErr } = await supabase.from("entry").insert(entryRows);
if (eErr) {
  await supabase.from("franchise").delete().eq("id", franchise.id);
  console.error(`Entry insert failed (franchise rolled back): ${eErr.message}`);
  process.exit(1);
}

// +50 Archivist, matching the UI claim flow (awardAura in lib/aura.ts).
const { data: aura } = await supabase
  .from("user_aura")
  .select("id, value")
  .eq("user_id", curator.id)
  .eq("aura_type", "archivist")
  .maybeSingle();
if (aura) {
  await supabase.from("user_aura").update({ value: aura.value + 50, last_calculated: new Date().toISOString() }).eq("id", aura.id);
} else {
  await supabase.from("user_aura").insert({ user_id: curator.id, aura_type: "archivist", value: 50, last_calculated: new Date().toISOString() });
}
const { data: allAura } = await supabase.from("user_aura").select("value").eq("user_id", curator.id);
const totalAura = (allAura ?? []).reduce((sum, a) => sum + a.value, 0);
await supabase.from("users").update({ total_aura: totalAura }).eq("id", curator.id);

console.log(`\nCreated: ${SITE_URL}/franchise/${franchise.slug} (as ${curator.display_name}, +50 Archivist)`);
console.log(`Next: research the watch order, then run:`);
console.log(`  node scripts/apply-watch-order.mjs ${franchise.slug} <plan.json>`);
