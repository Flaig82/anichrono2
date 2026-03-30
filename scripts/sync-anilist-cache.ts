/**
 * Local fallback: run this from your machine if the Vercel Cron gets 403'd by AniList.
 * Your home IP won't be blocked.
 *
 * Usage: npx tsx scripts/sync-anilist-cache.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually (no dotenv dependency)
const envPath = resolve(process.cwd(), ".env.local");
try {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found — rely on existing env vars
}

const ANILIST_URL = "https://graphql.anilist.co";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Season = "WINTER" | "SPRING" | "SUMMER" | "FALL";

function getCurrentSeason(): { season: Season; year: number; key: string } {
  const month = new Date().getMonth() + 1;
  let season: Season;
  if (month <= 3) season = "WINTER";
  else if (month <= 6) season = "SPRING";
  else if (month <= 9) season = "SUMMER";
  else season = "FALL";
  const year = new Date().getFullYear();
  return { season, year, key: `trending_${season.toLowerCase()}_${year}` };
}

async function anilistQuery(query: string, variables: Record<string, unknown>) {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "AnimeChrono/1.0 (https://animechrono.com)",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AniList API error: ${res.status} ${res.statusText}\n${body}`);
  }

  return res.json();
}

const SEASONAL_QUERY = `
  query ($season: MediaSeason, $seasonYear: Int) {
    Page(perPage: 12) {
      media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC, format_in: [TV, TV_SHORT]) {
        id
        title { english romaji }
        coverImage { large }
        averageScore
        popularity
        episodes
        format
        genres
        relations {
          edges {
            relationType
            node { id }
          }
        }
      }
    }
  }
`;

const DISCOVER_QUERY = `
  query ($page: Int, $sort: [MediaSort], $popularityGreater: Int, $popularityLesser: Int, $format_in: [MediaFormat]) {
    Page(page: $page, perPage: 18) {
      media(type: ANIME, sort: $sort, format_in: $format_in, popularity_greater: $popularityGreater, popularity_lesser: $popularityLesser, countryOfOrigin: JP) {
        id
        title { english romaji }
        coverImage { large }
        averageScore
        popularity
        genres
        seasonYear
        format
      }
    }
  }
`;

interface RawMedia {
  id: number;
  title: { english: string | null; romaji: string };
  coverImage: { large: string | null };
  averageScore: number | null;
  popularity: number | null;
  genres: string[];
  seasonYear?: number | null;
  format: string | null;
  episodes?: number | null;
  relations?: {
    edges: { relationType: string; node: { id: number } }[];
  };
}

async function main() {
  const { season, year, key: trendingKey } = getCurrentSeason();
  const now = new Date().toISOString();

  console.log(`Syncing AniList cache for ${season} ${year}...`);

  // Fetch trending
  console.log("  Fetching trending...");
  const trendingJson = await anilistQuery(SEASONAL_QUERY, { season, seasonYear: year });
  const trending: RawMedia[] = trendingJson.data?.Page?.media ?? [];
  console.log(`  → ${trending.length} trending`);
  await delay(1000);

  // Fetch popular
  console.log("  Fetching popular...");
  const popularJson = await anilistQuery(DISCOVER_QUERY, {
    page: 1, sort: "POPULARITY_DESC", popularityGreater: 50000,
    format_in: ["TV", "TV_SHORT", "MOVIE", "OVA", "ONA"],
  });
  const popular: RawMedia[] = popularJson.data?.Page?.media ?? [];
  console.log(`  → ${popular.length} popular`);
  await delay(1000);

  // Fetch niche
  console.log("  Fetching niche...");
  const nicheJson = await anilistQuery(DISCOVER_QUERY, {
    page: 1, sort: "SCORE_DESC", popularityGreater: 10000, popularityLesser: 50000,
    format_in: ["TV", "TV_SHORT", "MOVIE", "OVA", "ONA"],
  });
  const niche: RawMedia[] = nicheJson.data?.Page?.media ?? [];
  console.log(`  → ${niche.length} niche`);
  await delay(1000);

  // Fetch hidden
  console.log("  Fetching hidden gems...");
  const hiddenJson = await anilistQuery(DISCOVER_QUERY, {
    page: 1, sort: "SCORE_DESC", popularityLesser: 10000, popularityGreater: 2000,
    format_in: ["TV", "TV_SHORT", "MOVIE", "OVA", "ONA"],
  });
  const hidden: RawMedia[] = hiddenJson.data?.Page?.media ?? [];
  console.log(`  → ${hidden.length} hidden`);

  // Build cache rows
  const seen = new Set<number>();
  const rows: Record<string, unknown>[] = [];

  function addMedia(m: RawMedia) {
    if (seen.has(m.id)) return;
    seen.add(m.id);

    const relatedIds = (m.relations?.edges ?? [])
      .filter((e) => ["PREQUEL", "PARENT"].includes(e.relationType))
      .map((e) => e.node.id);

    rows.push({
      anilist_id: m.id,
      title_english: m.title.english,
      title_romaji: m.title.romaji,
      cover_image_url: m.coverImage.large,
      average_score: m.averageScore,
      popularity: m.popularity,
      genres: m.genres ?? [],
      season_year: m.seasonYear ?? null,
      season: null,
      format: m.format,
      episodes: m.episodes ?? null,
      status: null,
      related_ids: relatedIds,
      synced_at: now,
    });
  }

  for (const m of trending) addMedia(m);
  for (const m of popular) addMedia(m);
  for (const m of niche) addMedia(m);
  for (const m of hidden) addMedia(m);

  console.log(`\nUpserting ${rows.length} unique media into anilist_media_cache...`);
  const { error: upsertError } = await supabase
    .from("anilist_media_cache")
    .upsert(rows, { onConflict: "anilist_id" });

  if (upsertError) {
    console.error("Upsert error:", upsertError);
    process.exit(1);
  }

  // Update discover lists
  const lists = [
    { list_key: trendingKey, anilist_ids: trending.map((m) => m.id), synced_at: now },
    { list_key: "popular", anilist_ids: popular.map((m) => m.id), synced_at: now },
    { list_key: "niche", anilist_ids: niche.map((m) => m.id), synced_at: now },
    { list_key: "hidden", anilist_ids: hidden.map((m) => m.id), synced_at: now },
  ];

  console.log("Upserting discover lists...");
  const { error: listError } = await supabase
    .from("anilist_discover_list")
    .upsert(lists, { onConflict: "list_key" });

  if (listError) {
    console.error("List upsert error:", listError);
    process.exit(1);
  }

  console.log("\nSync complete!");
  console.log(`  Trending: ${trending.length}`);
  console.log(`  Popular: ${popular.length}`);
  console.log(`  Niche: ${niche.length}`);
  console.log(`  Hidden: ${hidden.length}`);
  console.log(`  Total cached: ${rows.length}`);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
