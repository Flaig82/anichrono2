/**
 * Migrate all franchise watch orders from the old animechrono.com site.
 *
 * Approach:
 * 1. Fetch each franchise page from animechrono.com
 * 2. Extract __NEXT_DATA__ JSON (SSR props)
 * 3. Parse segments + segment items into our Entry schema
 * 4. Enrich each franchise with AniList metadata (cover, banner, genres, etc.)
 * 5. Write everything to scripts/data/all-franchises.json
 *
 * Run with: npx tsx scripts/migrate-from-old-site.ts
 */

import { writeFileSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// All franchise slugs from animechrono.com/sitemap.xml
// ---------------------------------------------------------------------------
const OLD_SITE_SLUGS = [
  "91-days-series-watch-order",
  "a-certain-magical-scientific-series-watch-order",
  "afro-samurai-series-watch-order",
  "aggretsuko-series-watch-order",
  "ajin-series-watch-order",
  "akame-ga-kill-series-watch-order",
  "angel-beats-series-watch-order",
  "angels-of-death-series-watch-order",
  "anohana-the-flower-we-saw-that-day-series-watch-order",
  "another-series-watch-order",
  "appleseed-series-watch-order",
  "assassination-classroom-series-watch-order",
  "attack-on-titan-series-watch-order",
  "avatar-series-watch-order",
  "azumanga-daioh-series-watch-order",
  "baka-and-test-series-watch-order",
  "baki-series-watch-order",
  "beastars-series-watch-order",
  "beezlebub-series-watch-order",
  "berserk-series-watch-order",
  "beyblade-series-watch-order",
  "beyond-the-boundary-series-watch-order",
  "black-butler-series-watch-order",
  "black-clover-series-watch-order",
  "black-jack-series-watch-order",
  "black-lagoon-series-watch-order",
  "bleach-series-watch-order",
  "blood-blockade-battlefront-series-watch-order",
  "blood-series-watch-order",
  "blue-exorcist-series-watch-order",
  "blue-spring-ride-series-watch-order",
  "boruto-series-watch-order",
  "bungou-stray-dogs-series-watch-order",
  "cardcaptor-sakura-series-watch-order",
  "castlevania-series-watch-order",
  "cells-at-work-series-watch-order",
  "chainsaw-man-series-watch-order",
  "clannad-series-watch-order",
  "code-geass-series-watch-order",
  "cowboy-bebop-series-watch-order",
  "d-gray-man-series-watch-order",
  "daily-lives-of-high-school-boys-series-watch-order",
  "danganronpa-series-watch-order",
  "darling-in-the-franxx-series-watch-order",
  "darwins-game-series-watch-order",
  "date-a-live-series-watch-order",
  "death-note-series-watch-order",
  "death-parade-series-watch-order",
  "demon-slayer-series-watch-order",
  "detective-conan-series-watch-order",
  "devilman-series-watch-order",
  "devils-line-series-watch-order",
  "digimon-series-watch-order",
  "doraemon-series-watch-order",
  "dorohedoro-series-watch-order",
  "dororo-series-watch-order",
  "dr-stone-series-watch-order",
  "dragon-ball-daima-series-watch-order",
  "dragon-ball-gt-series-watch-order",
  "dragon-ball-series-watch-order",
  "dragon-ball-super-series-watch-order",
  "dragon-ball-z-series-watch-order",
  "drifters-series-watch-order",
  "durarara-series-watch-order",
  "elfen-lied-series-watch-order",
  "erased-series-watch-order",
  "fairy-tail-series-watch-order",
  "fate-series-watch-order",
  "fire-force-series-watch-order",
  "fist-of-the-north-star-series-watch-order",
  "flcl-series-watch-order",
  "food-wars-series-watch-order",
  "free-series-watch-order",
  "fruits-basket-series-watch-order",
  "full-metal-alchemist-brotherhood-series-watch-order",
  "full-metal-alchemist-series-watch-order",
  "full-metal-panic-series-watch-order",
  "future-diary-series-watch-order",
  "ghost-in-the-shell-series-watch-order",
  "gintama-series-watch-order",
  "given-series-watch-order",
  "gleipnir-series-watch-order",
  "goblin-slayer-series-watch-order",
  "grimgar-of-fantasy-and-ash-series-watch-order",
  "gundam-wing-series-watch-order",
  "gurren-lagann-series-watch-order",
  "hack-series-watch-order",
  "haikyu-series-watch-order",
  "haikyuu-series-watch-order",
  "havent-you-heard-im-sakamoto-series-watch-order",
  "hell-girl-series-watch-order",
  "hellsing-series-watch-order",
  "high-school-dxd-series-watch-order",
  "hinamatsuri-series-watch-order",
  "horimiya-series-watch-order",
  "hunter-x-hunter-series-watch-order",
  "hyouka-series-watch-order",
  "inazuma-eleven-series-watch-order",
  "initial-d-series-watch-order",
  "inuyasha-series-watch-order",
  "is-it-wrong-to-try-to-pick-up-girls-in-a-dungeon-series-watch-order",
  "jojos-bizarre-adventure-series-watch-order",
  "jujutsu-kaisen-series-watch-order",
  "junjou-romantica-series-watch-order",
  "k-series-watch-order",
  "kabaneri-of-the-iron-fortress-series-watch-order",
  "kado-the-right-answer-series-watch-order",
  "kaguya-sama-love-is-war-series-watch-order",
  "kakegurui-series-watch-order",
  "kamisama-kiss-series-watch-order",
  "kengan-ashura-series-watch-order",
  "kill-la-kill-series-watch-order",
  "kimi-ni-todoke-series-watch-order",
  "kingdom-series-watch-order",
  "kiznaiver-series-watch-order",
  "konosuba-gods-blessing-on-this-wonderful-world-series-watch-order",
  "kurokos-no-basket-series-watch-order",
  "land-of-lustrous-series-watch-order",
  "love-chunibyou-other-delusions-series-watch-order",
  "lucky-star-series-watch-order",
  "lupin-series-watch-order",
  "macross-series-watch-order",
  "made-in-abyss-series-watch-order",
  "magi-the-labyrinth-of-magic-series-watch-order",
  "maid-sama-series-watch-order",
  "masamunekuns-revenge-series-watch-order",
  "megalobox-series-watch-order",
  "mob-psycho-100-series-watch-order",
  "monogatari-series-watch-order",
  "my-hero-academia-series-watch-order",
  "my-little-monster-series-watch-order",
  "my-teen-romantic-comedy-snafu-series-watch-order",
  "nana-series-watch-order",
  "naruto-series-watch-order",
  "naruto-shippuden-series-watch-order",
  "natsumes-book-of-friends-series-watch-order",
  "negima-series-watch-order",
  "neon-genesis-evangelion-series-watch-order",
  "nichijou-my-ordinary-life-series-watch-order",
  "nisekoi-series-watch-order",
  "no-game-no-life-series-watch-order",
  "noragami-series-watch-order",
  "one-piece-series-watch-order",
  "one-punch-man-series-watch-order",
  "orange-series-watch-order",
  "overlord-series-watch-order",
  "parasyte-the-maxim-series-watch-order",
  "penguindrum-series-watch-order",
  "plastic-memories-series-watch-order",
  "pokemon-series-watch-order",
  "prince-of-tennis-series-watch-order",
  "psycho-pass-series-watch-order",
  "psychopass-series-watch-order",
  "queens-blade-series-watch-order",
  "rascal-does-not-dream-of-a-bunny-girl-senpai-series-watch-order",
  "re-zero-series-watch-order",
  "rent-a-girlfriend-series-watch-order",
  "rin-daughters-of-mnemosyne-series-watch-order",
  "rurouni-kenshin-series-watch-order",
  "sailor-moon-series-watch-order",
  "samurai-champloo-series-watch-order",
  "school-days-series-watch-order",
  "seraph-of-the-end-series-watch-order",
  "seven-deadly-sins-series-watch-order",
  "sket-dance-series-watch-order",
  "sketchbook-full-colors-series-watch-order",
  "skullface-bookseller-hondasan-series-watch-order",
  "slam-dunk-series-watch-order",
  "slayers-series-watch-order",
  "snow-white-with-the-red-hair-series-watch-order",
  "soul-eater-series-watch-order",
  "steins-gate-series-watch-order",
  "sword-art-online-series-watch-order",
  "sword-gai-series-watch-order",
  "symphogear-series-watch-order",
  "tamako-market-series-watch-order",
  "teasing-master-takagi-san-series-watch-order",
  "tenchi-muyo-series-watch-order",
  "tenjho-tenge-series-watch-order",
  "that-time-i-got-reincarnated-as-a-slime-series-watch-order",
  "the-ancient-magus-bride-series-watch-order",
  "the-devil-is-a-part-timer-series-watch-order",
  "the-disastrous-life-of-saiki-k-series-watch-order",
  "the-garden-of-sinners-series-watch-order",
  "the-god-of-high-school-series-watch-order",
  "the-kings-avatar-series-watch-order",
  "the-melancholy-of-haruhi-suzumiya-series-watch-order",
  "the-misfit-of-demon-king-academy-series-watch-order",
  "the-promised-neverland-series-watch-order",
  "the-rising-of-the-shield-hero-series-watch-order",
  "the-world-god-only-knows-series-watch-order",
  "toilet-bound-hanako-kun-series-watch-order",
  "tokyo-ghoul-series-watch-order",
  "tokyo-revengers-series-watch-order",
  "tonari-no-sekikun-series-watch-order",
  "toradora-series-watch-order",
  "toriko-series-watch-order",
  "tower-of-god-series-watch-order",
  "trinity-blood-series-watch-order",
  "tsuki-ga-kirei-series-watch-order",
  "vinland-saga-series-watch-order",
  "violet-evergarden-series-watch-order",
  "wotakoi-love-is-hard-for-otaku-series-watch-order",
  "yo-kai-watch-series-watch-order",
  "yona-of-the-dawn-series-watch-order",
  "your-lie-in-april-series-watch-order",
  "yu-gi-oh-series-watch-order",
  "yu-yu-hakusho-series-watch-order",
  "yuri-on-ice-series-watch-order",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OldSegmentItem {
  SegmentID: number;
  SegmentName: string;
  SegmentChronologicalOrder: number;
  SegmentReleaseOrder: number;
  SegmentItemID: number;
  SegmentItemName: string;
  SegmentItemType: string;
  SegmentItemChronologicalOrder: number;
  SegmentItemReleaseOrder: number;
}

interface OldListData {
  id: number;
  aniListID: number;
  name: string;
  slug: string;
  coverArtURL: string;
  bgColor: string;
  excerpt: string;
  statusID: number;
  tags: string;
  StatusCode: string;
}

interface OutputEntry {
  title: string;
  entry_type: "episodes" | "movie" | "ova" | "ona" | "manga" | "special";
  episode_start: number | null;
  episode_end: number | null;
  parent_series: string;
  anilist_id: number | null;
  is_essential: boolean;
}

interface OutputFranchise {
  title: string;
  slug: string;
  anilist_id: number | null;
  year_started: number | null;
  studio: string | null;
  status: "finished" | "releasing" | "not_yet_released";
  genres: string[];
  cover_image_url: string | null;
  banner_image_url: string | null;
  description: string | null;
  obscurity_score: number | null;
  obscurity_tier: string | null;
  entries: OutputEntry[];
}

// ---------------------------------------------------------------------------
// AniList enrichment
// ---------------------------------------------------------------------------

const ANILIST_URL = "https://graphql.anilist.co";

const ANILIST_BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { english romaji }
      coverImage { extraLarge large }
      bannerImage
      genres
      studios(isMain: true) {
        nodes { name isAnimationStudio }
      }
      startDate { year }
      description(asHtml: false)
      status
      popularity
    }
  }
`;

const ANILIST_SEARCH_QUERY = `
  query ($search: String) {
    Media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      id
      title { english romaji }
      coverImage { extraLarge large }
      bannerImage
      genres
      studios(isMain: true) {
        nodes { name isAnimationStudio }
      }
      startDate { year }
      description(asHtml: false)
      status
      popularity
    }
  }
`;

interface AniListResult {
  id: number;
  title: { english: string | null; romaji: string };
  coverImage: { extraLarge: string | null; large: string | null };
  bannerImage: string | null;
  genres: string[];
  studios: { nodes: Array<{ name: string; isAnimationStudio: boolean }> };
  startDate: { year: number | null };
  description: string | null;
  status: string | null;
  popularity: number | null;
}

async function fetchAniListById(id: number): Promise<AniListResult | null> {
  return anilistRequest(ANILIST_BY_ID_QUERY, { id });
}

async function searchAniList(title: string): Promise<AniListResult | null> {
  return anilistRequest(ANILIST_SEARCH_QUERY, { search: title });
}

async function anilistRequest(
  query: string,
  variables: Record<string, unknown>,
): Promise<AniListResult | null> {
  try {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "60", 10);
      console.log(`  ⏳ Rate limited, waiting ${retryAfter}s...`);
      await sleep(retryAfter * 1000);
      return anilistRequest(query, variables);
    }

    if (!res.ok) {
      console.error(`  AniList error ${res.status}`);
      return null;
    }

    const json = await res.json();
    return json.data?.Media ?? null;
  } catch (err) {
    console.error(`  AniList fetch failed:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Map old-site type names to our schema types */
function mapEntryType(oldType: string): OutputEntry["entry_type"] {
  const normalized = oldType.toLowerCase().trim();
  switch (normalized) {
    case "episode":
      return "episodes";
    case "episodes":
      return "episodes";
    case "movie":
      return "movie";
    case "ova":
      return "ova";
    case "ona":
      return "ona";
    case "manga":
      return "manga";
    case "special":
      return "special";
    default:
      return "episodes";
  }
}

/** Parse episode range from entry name, e.g. "Episodes 1-22" → [1, 22] */
function parseEpisodeRange(
  name: string,
  entryType: string,
): { start: number | null; end: number | null } {
  if (entryType !== "episodes") return { start: null, end: null };

  // Match "Episodes 1-22", "Episode 23", "Episodes 1–22" (en-dash), "Episode 23β"
  const rangeMatch = name.match(
    /episodes?\s+(\d+)\s*[-–]\s*(\d+)/i,
  );
  if (rangeMatch?.[1] && rangeMatch[2]) {
    return { start: parseInt(rangeMatch[1], 10), end: parseInt(rangeMatch[2], 10) };
  }

  const singleMatch = name.match(/episodes?\s+(\d+)/i);
  if (singleMatch?.[1]) {
    return { start: parseInt(singleMatch[1], 10), end: parseInt(singleMatch[1], 10) };
  }

  return { start: null, end: null };
}

/** Convert old slug to new slug: strip "-series-watch-order" */
function toNewSlug(oldSlug: string): string {
  return oldSlug.replace(/-series-watch-order$/, "");
}

/** Map AniList status to our schema */
function mapStatus(
  anilistStatus: string | null,
): "finished" | "releasing" | "not_yet_released" {
  switch (anilistStatus) {
    case "FINISHED":
      return "finished";
    case "RELEASING":
      return "releasing";
    case "NOT_YET_RELEASED":
      return "not_yet_released";
    case "CANCELLED":
      return "finished";
    case "HIATUS":
      return "releasing";
    default:
      return "finished";
  }
}

/** Calculate obscurity tier from AniList popularity (member count) */
function calcObscurity(popularity: number | null): {
  score: number | null;
  tier: string | null;
} {
  if (popularity == null) return { score: null, tier: null };
  if (popularity >= 500000)
    return { score: 0.5, tier: "mainstream" };
  if (popularity >= 100000)
    return { score: 1.0, tier: "popular" };
  if (popularity >= 10000)
    return { score: 2.0, tier: "cult" };
  return { score: 4.0, tier: "obscure" };
}

/** Heuristic for is_essential */
function isEssential(entryType: OutputEntry["entry_type"]): boolean {
  switch (entryType) {
    case "episodes":
    case "movie":
    case "ona":
      return true;
    case "ova":
    case "special":
    case "manga":
      return false;
  }
}

/** Strip HTML tags from description */
function stripHtml(html: string | null): string | null {
  if (!html) return null;
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Fetch + parse a single franchise page
// ---------------------------------------------------------------------------

async function fetchFranchisePage(
  oldSlug: string,
): Promise<{ listData: OldListData; items: OldSegmentItem[] } | null> {
  const url = `https://www.animechrono.com/${oldSlug}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  ✗ HTTP ${res.status} for ${url}`);
      return null;
    }

    const html = await res.text();

    // Extract __NEXT_DATA__ JSON
    const match = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
    );
    if (!match) {
      console.error(`  ✗ No __NEXT_DATA__ found for ${oldSlug}`);
      return null;
    }

    const nextData = JSON.parse(match[1] as string);
    const pageProps = nextData?.props?.pageProps;
    if (!pageProps?.listData?.[0]) {
      console.error(`  ✗ No listData found for ${oldSlug}`);
      return null;
    }

    const listData: OldListData = pageProps.listData[0];

    // Skip inactive/coming-soon
    if (listData.StatusCode === "coming-soon" || listData.StatusCode === "inactive") {
      console.log(`  ⊘ Skipping ${oldSlug} (status: ${listData.StatusCode})`);
      return null;
    }

    // Flatten grouped segment data into ordered items
    const grouped = pageProps.groupedSegmentData as Record<
      string,
      OldSegmentItem[]
    >;
    if (!grouped || Object.keys(grouped).length === 0) {
      console.error(`  ✗ No segment data for ${oldSlug}`);
      return null;
    }

    // Items are already ordered by SegmentChronologicalOrder + SegmentItemChronologicalOrder
    // from the SQL query, but groupedSegmentData is a Record keyed by SegmentName.
    // We need to flatten in the correct order.
    const allItems: OldSegmentItem[] = [];
    // Sort segments by their chronological order
    const segmentEntries = Object.entries(grouped);
    segmentEntries.sort((a, b) => {
      const aOrder = a[1][0]?.SegmentChronologicalOrder ?? 0;
      const bOrder = b[1][0]?.SegmentChronologicalOrder ?? 0;
      return aOrder - bOrder;
    });
    for (const [, items] of segmentEntries) {
      // Items within a segment are already sorted
      const sorted = [...items].sort(
        (a, b) => a.SegmentItemChronologicalOrder - b.SegmentItemChronologicalOrder,
      );
      allItems.push(...sorted);
    }

    return { listData, items: allItems };
  } catch (err) {
    console.error(`  ✗ Failed to fetch ${oldSlug}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\nMigrating ${OLD_SITE_SLUGS.length} franchise pages from animechrono.com...\n`);

  const franchises: OutputFranchise[] = [];
  const seenSlugs = new Set<string>();

  for (let i = 0; i < OLD_SITE_SLUGS.length; i++) {
    const oldSlug = OLD_SITE_SLUGS[i]!;
    const newSlug = toNewSlug(oldSlug);

    // Skip duplicates (haikyu/haikyuu, psycho-pass/psychopass)
    if (seenSlugs.has(newSlug)) {
      console.log(`  ⊘ Skipping duplicate slug: ${newSlug}`);
      continue;
    }

    console.log(
      `[${i + 1}/${OLD_SITE_SLUGS.length}] Fetching ${oldSlug}...`,
    );

    const result = await fetchFranchisePage(oldSlug);
    if (!result) continue;

    const { listData, items } = result;

    // Transform entries (strip HTML from titles first)
    const entries: OutputEntry[] = items.map((item) => {
      const cleanTitle = stripHtml(item.SegmentItemName) ?? item.SegmentItemName;
      const entryType = mapEntryType(item.SegmentItemType);
      const range = parseEpisodeRange(cleanTitle, entryType);
      return {
        title: cleanTitle,
        entry_type: entryType,
        episode_start: range.start,
        episode_end: range.end,
        parent_series: item.SegmentName,
        anilist_id: null, // We don't have per-item AniList IDs from old site
        is_essential: isEssential(entryType),
      };
    });

    // Build franchise record with defaults (enriched by AniList below)
    const franchise: OutputFranchise = {
      title: listData.name,
      slug: newSlug,
      anilist_id: listData.aniListID || null,
      year_started: null,
      studio: null,
      status: "finished",
      genres: [],
      cover_image_url: null,
      banner_image_url: null,
      description: null,
      obscurity_score: null,
      obscurity_tier: null,
      entries,
    };

    // Enrich with AniList data (by ID if available, otherwise search by title)
    await sleep(2000); // Rate limit: ~30 req/min
    let anilist: AniListResult | null = null;
    if (listData.aniListID && listData.aniListID > 0) {
      anilist = await fetchAniListById(listData.aniListID);
    } else {
      anilist = await searchAniList(listData.name);
      if (anilist) {
        franchise.anilist_id = anilist.id;
      }
    }
    if (anilist) {
      const mainStudio =
        anilist.studios.nodes.find((s) => s.isAnimationStudio) ??
        anilist.studios.nodes[0] ??
        null;
      const { score, tier } = calcObscurity(anilist.popularity);

      franchise.year_started = anilist.startDate?.year ?? null;
      franchise.studio = mainStudio?.name ?? null;
      franchise.status = mapStatus(anilist.status);
      franchise.genres = anilist.genres ?? [];
      franchise.cover_image_url =
        anilist.coverImage.extraLarge ?? anilist.coverImage.large ?? null;
      franchise.banner_image_url = anilist.bannerImage ?? null;
      franchise.description = stripHtml(anilist.description);
      franchise.obscurity_score = score;
      franchise.obscurity_tier = tier;
    }

    seenSlugs.add(newSlug);
    franchises.push(franchise);
    console.log(
      `  ✓ ${franchise.title} — ${entries.length} entries${franchise.anilist_id ? ` (AniList: ${franchise.anilist_id})` : ""}`,
    );

    // Small delay between page fetches to be polite
    await sleep(200);
  }

  // Write output
  const outputPath = resolve(__dirname, "data/all-franchises.json");
  writeFileSync(outputPath, JSON.stringify(franchises, null, 2));

  console.log(`\n✅ Done! ${franchises.length} franchises written to ${outputPath}`);

  // Summary stats
  const totalEntries = franchises.reduce((sum, f) => sum + f.entries.length, 0);
  const withAniList = franchises.filter((f) => f.anilist_id).length;
  console.log(`   Total entries: ${totalEntries}`);
  console.log(`   With AniList data: ${withAniList}`);
  console.log(`   Without AniList data: ${franchises.length - withAniList}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
