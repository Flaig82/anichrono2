/**
 * Seed bracket + awards for the current anime season.
 * Fetches top 8 from AniList, creates bracket matchups and award categories.
 * Idempotent: skips if bracket already exists for the season.
 *
 * Run with: npx tsx scripts/seed-bracket.ts
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing env vars. Found URL:",
    !!supabaseUrl,
    "Found key:",
    !!serviceRoleKey,
  );
  console.error("Make sure .env.local exists in:", process.cwd());
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// --- AniList fetch ---

const ANILIST_URL = "https://graphql.anilist.co";

const SEASONAL_QUERY = `
  query ($season: MediaSeason, $seasonYear: Int) {
    Page(page: 1, perPage: 20) {
      media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
        id
        title { english romaji }
        coverImage { large }
        averageScore
        popularity
      }
    }
  }
`;

interface ALMedia {
  id: number;
  title: { english: string | null; romaji: string };
  coverImage: { large: string | null };
  averageScore: number | null;
  popularity: number | null;
}

async function fetchTopSeasonal(
  season: string,
  year: number,
): Promise<ALMedia[]> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: SEASONAL_QUERY,
      variables: { season, seasonYear: year },
    }),
  });
  if (!res.ok) {
    console.error(`AniList API error: ${res.status}`);
    return [];
  }
  const json = await res.json();
  return json.data?.Page?.media ?? [];
}

// --- Season helpers ---

function getCurrentSeason(): {
  season: string;
  year: number;
  key: string;
  label: string;
} {
  const month = new Date().getMonth() + 1;
  let season: string;
  let label: string;
  if (month <= 3) {
    season = "WINTER";
    label = "Winter";
  } else if (month <= 6) {
    season = "SPRING";
    label = "Spring";
  } else if (month <= 9) {
    season = "SUMMER";
    label = "Summer";
  } else {
    season = "FALL";
    label = "Fall";
  }
  const year = new Date().getFullYear();
  return { season, year, key: `${label.toLowerCase()}_${year}`, label };
}

// --- Award categories ---

const AWARD_CATEGORIES = [
  { category: "aots", label: "Anime of the Season", emoji: "🏆" },
  { category: "best_op", label: "Best Opening", emoji: "🎵" },
  { category: "best_ed", label: "Best Ending", emoji: "🎶" },
  { category: "best_fight", label: "Best Fight Scene", emoji: "⚔️" },
  { category: "best_character", label: "Best New Character", emoji: "⭐" },
  { category: "most_underrated", label: "Most Underrated", emoji: "💎" },
];

// --- Main ---

async function main() {
  const { season, year, key, label } = getCurrentSeason();
  console.log(`Season: ${label} ${year} (key: ${key})`);

  // Check if bracket already exists
  const { data: existing } = await supabase
    .from("bracket")
    .select("id")
    .eq("season", key)
    .single();

  if (existing) {
    console.log(`Bracket already exists for ${key}. Skipping.`);
    return;
  }

  // Fetch from AniList
  console.log("Fetching seasonal anime from AniList...");
  const anime = await fetchTopSeasonal(season, year);
  if (anime.length < 8) {
    console.error(`Only got ${anime.length} anime — need at least 8.`);
    process.exit(1);
  }

  const top8 = anime.slice(0, 8);
  console.log(
    "Top 8:",
    top8.map((a) => a.title.english ?? a.title.romaji).join(", "),
  );

  // Create bracket
  const { data: bracket, error: bracketErr } = await supabase
    .from("bracket")
    .insert({ season: key })
    .select("id")
    .single();

  if (bracketErr || !bracket) {
    console.error("Failed to create bracket:", bracketErr?.message);
    process.exit(1);
  }
  console.log("Created bracket:", bracket.id);

  // Create matchups — standard seeding: 1v8, 4v5, 2v7, 3v6
  const qfPairs: [number, number][] = [
    [0, 7], // 1v8
    [3, 4], // 4v5
    [1, 6], // 2v7
    [2, 5], // 3v6
  ];

  const matchupRows = [];

  // 4 quarterfinals (active)
  for (let i = 0; i < qfPairs.length; i++) {
    const [aIdx, bIdx] = qfPairs[i]!;
    const a = top8[aIdx]!;
    const b = top8[bIdx]!;
    matchupRows.push({
      bracket_id: bracket.id,
      round: "quarterfinal",
      position: i + 1,
      anime_a_id: a.id,
      anime_a_title: a.title.english ?? a.title.romaji,
      anime_a_cover: a.coverImage.large,
      anime_a_seed: aIdx + 1,
      anime_b_id: b.id,
      anime_b_title: b.title.english ?? b.title.romaji,
      anime_b_cover: b.coverImage.large,
      anime_b_seed: bIdx + 1,
      status: "active",
      activated_at: new Date().toISOString(),
    });
  }

  // 2 semifinal slots (upcoming)
  for (let i = 0; i < 2; i++) {
    matchupRows.push({
      bracket_id: bracket.id,
      round: "semifinal",
      position: i + 1,
      status: "upcoming",
    });
  }

  // 1 final slot (upcoming)
  matchupRows.push({
    bracket_id: bracket.id,
    round: "final",
    position: 1,
    status: "upcoming",
  });

  const { error: matchupErr } = await supabase
    .from("matchup")
    .insert(matchupRows);

  if (matchupErr) {
    console.error("Failed to create matchups:", matchupErr.message);
    process.exit(1);
  }
  console.log(`Created ${matchupRows.length} matchups (4 QF + 2 SF + 1 F)`);

  // Create awards + nominees
  // Use all fetched anime (up to 20) for nominee distribution
  const allAnime = anime.slice(0, 16);

  for (const cat of AWARD_CATEGORIES) {
    const { data: award, error: awardErr } = await supabase
      .from("award")
      .insert({
        season: key,
        category: cat.category,
        label: cat.label,
        emoji: cat.emoji,
      })
      .select("id")
      .single();

    if (awardErr || !award) {
      console.error(`Failed to create award ${cat.category}:`, awardErr?.message);
      continue;
    }

    // Pick 4-6 nominees per category with offset so categories differ
    const catIdx = AWARD_CATEGORIES.indexOf(cat);
    const offset = (catIdx * 3) % allAnime.length;
    const nominees: ALMedia[] = [];
    for (let i = 0; i < 5 && i < allAnime.length; i++) {
      nominees.push(allAnime[(offset + i) % allAnime.length]!);
    }

    // Deduplicate by anime id
    const unique = Array.from(new Map(nominees.map((n) => [n.id, n])).values());

    const nomineeRows = unique.map((n) => ({
      award_id: award.id,
      anime_id: n.id,
      title: n.title.english ?? n.title.romaji,
      cover_image_url: n.coverImage.large,
    }));

    const { error: nomErr } = await supabase
      .from("award_nominee")
      .insert(nomineeRows);

    if (nomErr) {
      console.error(`Failed to create nominees for ${cat.category}:`, nomErr.message);
    } else {
      console.log(`  ${cat.emoji} ${cat.label}: ${nomineeRows.length} nominees`);
    }
  }

  console.log("\nDone! Bracket and awards seeded for", key);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
