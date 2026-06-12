/**
 * Pick the best NOT-YET-BUILT anime franchises to seed, sourced from AniList's
 * most-popular + trending series (the same POPULARITY_DESC / TRENDING_DESC
 * signals the app's Discover surface uses). Chasing high-search-volume
 * franchises is the SEO play — established popular series + current buzz.
 *
 * Pipeline:
 *   1. Pull a pool of popular series (POPULARITY_DESC) + trending series
 *      (TRENDING_DESC) from AniList (type ANIME, TV/TV_SHORT, countryOfOrigin JP).
 *   2. AniList has no "collection"/franchise id, so collapse seasons of the same
 *      franchise via the relation graph: fetch each candidate's direct relations
 *      and union-find candidates connected by PREQUEL/SEQUEL/PARENT/SIDE_STORY/
 *      SPIN_OFF/ALTERNATIVE edges. Representative = the earliest-airing member
 *      (the safest seed root; the seed script expands the whole franchise from
 *      any member anyway).
 *   3. Drop standalone non-series (no relevant relations → no order to curate),
 *      anything already on the site (franchise/entry anilist_id), and anything
 *      already logged in SEED-QUEUE.md. The seed script's own duplicate-guard is
 *      the hard backstop if one slips through.
 *   4. Rank by popularity (the SEO prize), trending as a proportional 1.5x
 *      tiebreaker, and print the top N as a table + JSON for the skill to parse.
 *
 * Read-only: queries AniList + reads our DB for dedup. Writes nothing.
 *
 * Usage (from repo root):
 *   node .claude/skills/generate-list/scripts/pick-series.mjs --count 10
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// --- env (from repo root cwd) -----------------------------------------------
function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
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
// AniList is keyless — only Supabase creds are required (for site dedup).
for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (!env[key]) {
    console.error(`Missing ${key} in .env.local`);
    process.exit(1);
  }
}

// --- args -------------------------------------------------------------------
const args = process.argv.slice(2);
const ci = args.indexOf("--count");
const count = ci !== -1 ? Math.max(1, parseInt(args[ci + 1], 10) || 10) : 10;

// --- AniList client (mirrors lib/anilist.ts) --------------------------------
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

const RELEVANT_RELATION_TYPES = new Set([
  "SEQUEL", "PREQUEL", "SIDE_STORY", "PARENT", "ALTERNATIVE", "SPIN_OFF",
]);
const norm = (s) => (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const displayTitle = (m) => m.title.english ?? m.title.romaji;

const POOL_QUERY = `
  query ($page: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: 50) {
      media(type: ANIME, sort: $sort, format_in: [TV, TV_SHORT], countryOfOrigin: JP) {
        id title { english romaji } popularity startDate { year }
      }
    }
  }
`;

// --- 1. gather pool ---------------------------------------------------------
const pool = new Map(); // id -> { id, title, popularity, year, trending }
function addToPool(m, trending) {
  const ex = pool.get(m.id);
  if (ex) { ex.trending = ex.trending || trending; return; }
  pool.set(m.id, {
    id: m.id, title: m, popularity: m.popularity ?? 0,
    year: m.startDate?.year ?? null, trending,
  });
}
// Popular: established, high-search-volume franchises (best long-tail SEO).
for (let page = 1; page <= 2; page++) {
  const data = await anilist(POOL_QUERY, { page, sort: ["POPULARITY_DESC"] });
  for (const m of data.Page?.media ?? []) addToPool(m, false);
}
// Trending: current community buzz.
{
  const data = await anilist(POOL_QUERY, { page: 1, sort: ["TRENDING_DESC"] });
  for (const m of data.Page?.media ?? []) addToPool(m, true);
}

// --- 2. fetch each candidate's relations; union-find into franchises --------
const parent = new Map();
const find = (x) => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
const union = (a, b) => { parent.set(find(a), find(b)); };
for (const id of pool.keys()) parent.set(id, id);

const relatedOf = new Map(); // candidate id -> Set of all related ids (for dedup widening)
const hasSeriesEdge = new Set(); // candidate id -> has any relevant relation

// Batch relations lookups via aliased queries — AniList is rate-limited, so
// fetch ~10 media per request instead of one query per candidate.
const ids = [...pool.keys()];
for (let i = 0; i < ids.length; i += 10) {
  const batch = ids.slice(i, i + 10);
  const query = `query {\n${batch
    .map((id) => `  m${id}: Media(id: ${id}, type: ANIME) { relations { edges { relationType node { id } } } }`)
    .join("\n")}\n}`;
  const data = await anilist(query, {});
  for (const id of batch) {
    const related = new Set();
    for (const e of data[`m${id}`]?.relations?.edges ?? []) {
      if (!RELEVANT_RELATION_TYPES.has(e.relationType)) continue;
      const nid = e.node?.id;
      if (nid == null) continue;
      related.add(nid);
      hasSeriesEdge.add(id);
      // Group seasons that are both in the pool.
      if (pool.has(nid)) union(id, nid);
    }
    relatedOf.set(id, related);
  }
}

// --- 3. collapse to franchise groups (rep = earliest-airing member) ---------
const groups = new Map(); // root -> { rep, memberIds:Set, popularity, trending, seriesEdge }
for (const cand of pool.values()) {
  const root = find(cand.id);
  const g = groups.get(root) ?? { rep: cand, memberIds: new Set(), popularity: 0, trending: false, seriesEdge: false };
  g.memberIds.add(cand.id);
  g.popularity = Math.max(g.popularity, cand.popularity);
  g.trending = g.trending || cand.trending;
  g.seriesEdge = g.seriesEdge || hasSeriesEdge.has(cand.id);
  // Representative: earliest year, then lowest popularity-tiebreak by id.
  const better =
    (cand.year ?? 9999) < (g.rep.year ?? 9999) ||
    ((cand.year ?? 9999) === (g.rep.year ?? 9999) && cand.id < g.rep.id);
  if (better) g.rep = cand;
  groups.set(root, g);
}

// --- 4. dedup vs site + build log -------------------------------------------
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
// Widen the id set with each candidate's direct relations so a franchise whose
// root isn't in the pool is still caught if any related season is on the site.
const allCheckIds = [
  ...new Set([
    ...pool.keys(),
    ...[...relatedOf.values()].flatMap((s) => [...s]),
  ]),
];
const [{ data: fRows }, { data: eRows }, { data: fTitles }] = await Promise.all([
  supabase.from("franchise").select("anilist_id").in("anilist_id", allCheckIds),
  supabase.from("entry").select("anilist_id").in("anilist_id", allCheckIds),
  supabase.from("franchise").select("title"),
]);
const claimedIds = new Set([...(fRows ?? []), ...(eRows ?? [])].map((r) => r.anilist_id).filter((x) => x != null));
const claimedNames = new Set((fTitles ?? []).map((r) => norm(r.title)));

// Built/known names from SEED-QUEUE.md (checked items).
let queueNames = new Set();
try {
  const q = readFileSync(resolve(process.cwd(), "SEED-QUEUE.md"), "utf8");
  for (const m of q.matchAll(/^\s*[-*]\s*\[[xX]\]\s*(.+?)(?:\s*\(|$)/gm)) {
    queueNames.add(norm(m[1]));
  }
} catch { /* no queue file — fine */ }

const memberClaimed = (g) =>
  [...g.memberIds].some((id) => claimedIds.has(id)) ||
  [...g.memberIds].some((id) => [...(relatedOf.get(id) ?? [])].some((r) => claimedIds.has(r)));

const ranked = [...groups.values()]
  // Real series only — a standalone show (no relations, single member) has no order to curate.
  .filter((g) => g.seriesEdge || g.memberIds.size > 1)
  .filter((g) => !memberClaimed(g))
  .filter((g) => !claimedNames.has(norm(displayTitle(g.rep.title))) && !queueNames.has(norm(displayTitle(g.rep.title))))
  // Popularity is the SEO prize; trending is a proportional tiebreaker, not an
  // override — so a big franchise outranks a low-popularity blip.
  .map((g) => ({ ...g, score: g.popularity * (g.trending ? 1.5 : 1) }))
  .sort((a, b) => b.score - a.score);

const picks = ranked.slice(0, count);

// --- 5. output --------------------------------------------------------------
if (picks.length === 0) {
  console.error("No unbuilt trending/popular franchises found (everything in the pool is already on the site).");
  process.exit(1);
}
console.log(`Top ${picks.length} unbuilt anime franchise${picks.length > 1 ? "s" : ""} by SEO value:\n`);
picks.forEach((g, i) =>
  console.log(
    `  ${String(i + 1).padStart(2)}. ${displayTitle(g.rep.title)}  [flagship anilist ${g.rep.id}, ${g.popularity} members${g.trending ? ", TRENDING" : ""}]`,
  ),
);
console.log("\nJSON:");
console.log(
  JSON.stringify(
    picks.map((g) => ({ anilist_id: g.rep.id, name: displayTitle(g.rep.title), popularity: g.popularity, trending: g.trending })),
  ),
);
