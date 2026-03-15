import { createClient } from "@supabase/supabase-js";

const ANILIST_URL = "https://graphql.anilist.co";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      coverImage { extraLarge large }
    }
  }
`;

async function fetchCover(anilistId) {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { id: anilistId } }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const media = json.data?.Media;
  if (!media) return null;
  return media.coverImage.extraLarge ?? media.coverImage.large ?? null;
}

async function run() {
  // Get unique anilist_ids from entries
  const { data: entries } = await supabase
    .from("entry")
    .select("parent_series, anilist_id")
    .not("anilist_id", "is", null);

  const anilistIds = new Map();
  for (const e of entries || []) {
    if (!anilistIds.has(e.anilist_id)) {
      anilistIds.set(e.anilist_id, e.parent_series);
    }
  }

  console.log(`Fetching covers for ${anilistIds.size} unique AniList IDs...\n`);

  for (const [anilistId, parentSeries] of anilistIds) {
    const coverUrl = await fetchCover(anilistId);

    if (!coverUrl) {
      console.log(`✗ ${parentSeries} (${anilistId}) — no cover found`);
      await new Promise((r) => setTimeout(r, 700));
      continue;
    }

    // Update all entries with this anilist_id
    const { error } = await supabase
      .from("entry")
      .update({ cover_image_url: coverUrl })
      .eq("anilist_id", anilistId);

    if (error) {
      console.log(`✗ ${parentSeries} (${anilistId}) — ${error.message}`);
    } else {
      console.log(`✓ ${parentSeries} — ${coverUrl.substring(0, 60)}...`);
    }

    // Respect AniList rate limit
    await new Promise((r) => setTimeout(r, 700));
  }

  // Also handle entries without anilist_id — they keep null
  console.log("\nDone!");
}

run().catch(console.error);
