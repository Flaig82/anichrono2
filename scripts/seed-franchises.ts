import { createClient } from "@supabase/supabase-js";

// Uses service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

interface FranchiseData {
  title: string;
  slug: string;
  anilist_id: number;
  year_started: number;
  studio: string;
  status: "finished" | "releasing" | "not_yet_released";
  genres: string[];
  entries: EntryData[];
}

interface EntryData {
  title: string;
  entry_type: "episodes" | "movie" | "ova" | "ona" | "manga" | "special";
  episode_start?: number;
  episode_end?: number;
  parent_series: string;
  anilist_id?: number;
  is_essential?: boolean;
}

// -------------------------------------------------------------------
// Franchise + Entry Data (sourced from animechrono.com)
// -------------------------------------------------------------------

const FRANCHISES: FranchiseData[] = [
  // ================================================================
  // NARUTO — 39 entries
  // ================================================================
  {
    title: "Naruto",
    slug: "naruto",
    anilist_id: 20,
    year_started: 2002,
    studio: "Pierrot",
    status: "finished",
    genres: ["Action", "Adventure", "Fantasy"],
    entries: [
      // -- Naruto --
      { title: "Episodes 1–5", entry_type: "episodes", episode_start: 1, episode_end: 5, parent_series: "Naruto", anilist_id: 20 },
      { title: "Find the Four-Leaf Red Clover!", entry_type: "ova", parent_series: "Naruto", anilist_id: 761, is_essential: false },
      { title: "Episodes 6–19", entry_type: "episodes", episode_start: 6, episode_end: 19, parent_series: "Naruto", anilist_id: 20 },
      { title: "Naruto: The Cross Roads", entry_type: "ova", parent_series: "Naruto", anilist_id: 7367, is_essential: false },
      { title: "Episodes 20–101", entry_type: "episodes", episode_start: 20, episode_end: 101, parent_series: "Naruto", anilist_id: 20 },
      { title: "Mission: Protect the Waterfall Village!", entry_type: "ova", parent_series: "Naruto", anilist_id: 594, is_essential: false },
      { title: "Ninja Clash in the Land of Snow", entry_type: "movie", parent_series: "Naruto", anilist_id: 442 },
      { title: "Episodes 102–160", entry_type: "episodes", episode_start: 102, episode_end: 160, parent_series: "Naruto", anilist_id: 20 },
      { title: "The Legend of the Stone of Gelel", entry_type: "movie", parent_series: "Naruto", anilist_id: 936 },
      { title: "Episodes 161–196", entry_type: "episodes", episode_start: 161, episode_end: 196, parent_series: "Naruto", anilist_id: 20 },
      { title: "Guardians of the Crescent Moon Kingdom", entry_type: "movie", parent_series: "Naruto", anilist_id: 2144 },
      { title: "Episodes 197–220", entry_type: "episodes", episode_start: 197, episode_end: 220, parent_series: "Naruto", anilist_id: 20 },
      // -- Naruto Shippuden --
      { title: "Episodes 1–32", entry_type: "episodes", episode_start: 1, episode_end: 32, parent_series: "Naruto Shippuden", anilist_id: 1735 },
      { title: "Naruto Shippuden the Movie", entry_type: "movie", parent_series: "Naruto Shippuden", anilist_id: 2472 },
      { title: "Episodes 33–71", entry_type: "episodes", episode_start: 33, episode_end: 71, parent_series: "Naruto Shippuden", anilist_id: 1735 },
      { title: "Bonds", entry_type: "movie", parent_series: "Naruto Shippuden", anilist_id: 4437 },
      { title: "Episodes 72–126", entry_type: "episodes", episode_start: 72, episode_end: 126, parent_series: "Naruto Shippuden", anilist_id: 1735 },
      { title: "The Will of Fire", entry_type: "movie", parent_series: "Naruto Shippuden", anilist_id: 6325 },
      { title: "Episodes 127–143", entry_type: "episodes", episode_start: 127, episode_end: 143, parent_series: "Naruto Shippuden", anilist_id: 1735 },
      { title: "The Lost Tower", entry_type: "movie", parent_series: "Naruto Shippuden", anilist_id: 8246 },
      { title: "Episodes 144–196", entry_type: "episodes", episode_start: 144, episode_end: 196, parent_series: "Naruto Shippuden", anilist_id: 1735 },
      { title: "Blood Prison", entry_type: "movie", parent_series: "Naruto Shippuden", anilist_id: 10589 },
      { title: "Episodes 197–219", entry_type: "episodes", episode_start: 197, episode_end: 219, parent_series: "Naruto Shippuden", anilist_id: 1735 },
      { title: "Chunin Exam on Fire! Naruto vs. Konohamaru!", entry_type: "ova", parent_series: "Naruto Shippuden", anilist_id: 10686, is_essential: false },
      { title: "Episodes 220–251", entry_type: "episodes", episode_start: 220, episode_end: 251, parent_series: "Naruto Shippuden", anilist_id: 1735 },
      { title: "Road to Ninja: Naruto the Movie", entry_type: "movie", parent_series: "Naruto Shippuden", anilist_id: 13667 },
      { title: "Episodes 252–483", entry_type: "episodes", episode_start: 252, episode_end: 483, parent_series: "Naruto Shippuden", anilist_id: 1735 },
      { title: "Kakashi Hiden: Lightning in the Icy Sky", entry_type: "manga", parent_series: "Naruto Shippuden", is_essential: false },
      { title: "Episodes 484–488", entry_type: "episodes", episode_start: 484, episode_end: 488, parent_series: "Naruto Shippuden", anilist_id: 1735 },
      { title: "Episodes 489–493", entry_type: "episodes", episode_start: 489, episode_end: 493, parent_series: "Naruto Shippuden", anilist_id: 1735 },
      { title: "The Last: Naruto the Movie", entry_type: "movie", parent_series: "Naruto Shippuden", anilist_id: 16870 },
      { title: "Sakura Hidden: Thoughts of Love, Riding Upon a Spring Breeze", entry_type: "manga", parent_series: "Naruto Shippuden", is_essential: false },
      { title: "Episodes 494–500", entry_type: "episodes", episode_start: 494, episode_end: 500, parent_series: "Naruto Shippuden", anilist_id: 1735 },
      { title: "Gaara Hiden: A Sandstorm Mirage", entry_type: "manga", parent_series: "Naruto Shippuden", is_essential: false },
      { title: "Akatsuki Hiden: Evil Flowers in Full Bloom", entry_type: "manga", parent_series: "Naruto Shippuden", is_essential: false },
      { title: "The Day Naruto Became Hokage", entry_type: "ova", parent_series: "Naruto Shippuden", anilist_id: 21579, is_essential: false },
      // -- Boruto --
      { title: "Episodes 1–51", entry_type: "episodes", episode_start: 1, episode_end: 51, parent_series: "Boruto: Naruto Next Generations", anilist_id: 97938 },
      { title: "Boruto: Naruto the Movie", entry_type: "movie", parent_series: "Boruto: Naruto Next Generations", anilist_id: 21220 },
      { title: "Episodes 52–260", entry_type: "episodes", episode_start: 52, episode_end: 260, parent_series: "Boruto: Naruto Next Generations", anilist_id: 97938 },
    ],
  },

  // ================================================================
  // JUJUTSU KAISEN — 3 entries
  // ================================================================
  {
    title: "Jujutsu Kaisen",
    slug: "jujutsu-kaisen",
    anilist_id: 113415,
    year_started: 2020,
    studio: "MAPPA",
    status: "finished",
    genres: ["Action", "Fantasy", "Supernatural"],
    entries: [
      { title: "Episodes 1–24", entry_type: "episodes", episode_start: 1, episode_end: 24, parent_series: "Jujutsu Kaisen", anilist_id: 113415 },
      { title: "Jujutsu Kaisen 0", entry_type: "movie", parent_series: "Jujutsu Kaisen", anilist_id: 131573 },
      { title: "Episodes 25–47", entry_type: "episodes", episode_start: 25, episode_end: 47, parent_series: "Jujutsu Kaisen Season 2", anilist_id: 145064 },
    ],
  },

  // ================================================================
  // ONE PIECE — 45 entries
  // ================================================================
  {
    title: "One Piece",
    slug: "one-piece",
    anilist_id: 21,
    year_started: 1999,
    studio: "Toei Animation",
    status: "releasing",
    genres: ["Action", "Adventure", "Fantasy", "Comedy"],
    entries: [
      // -- East Blue Saga --
      { title: "Defeat Him! The Pirate Ganzack", entry_type: "ova", parent_series: "East Blue Saga", anilist_id: 466, is_essential: false },
      { title: "Episodes 1–16", entry_type: "episodes", episode_start: 1, episode_end: 16, parent_series: "East Blue Saga", anilist_id: 21 },
      { title: "One Piece: The Movie", entry_type: "movie", parent_series: "East Blue Saga", anilist_id: 459 },
      { title: "Episodes 17–60", entry_type: "episodes", episode_start: 17, episode_end: 60, parent_series: "East Blue Saga", anilist_id: 21 },
      { title: "Clockwork Island Adventure", entry_type: "movie", parent_series: "East Blue Saga", anilist_id: 460 },
      { title: "Jango's Dance Carnival", entry_type: "special", parent_series: "East Blue Saga", anilist_id: 2385, is_essential: false },
      { title: "Episode 61", entry_type: "episodes", episode_start: 61, episode_end: 61, parent_series: "East Blue Saga", anilist_id: 21 },
      // -- Alabasta Saga --
      { title: "Episodes 62–102", entry_type: "episodes", episode_start: 62, episode_end: 102, parent_series: "Alabasta Saga", anilist_id: 21 },
      { title: "Chopper's Kingdom on the Island of Strange Animals", entry_type: "movie", parent_series: "Alabasta Saga", anilist_id: 461 },
      { title: "Episodes 103–135", entry_type: "episodes", episode_start: 103, episode_end: 135, parent_series: "Alabasta Saga", anilist_id: 21 },
      // -- Sky Island Saga --
      { title: "Episodes 136–146", entry_type: "episodes", episode_start: 136, episode_end: 146, parent_series: "Sky Island Saga", anilist_id: 21 },
      { title: "Dead End Adventure", entry_type: "movie", parent_series: "Sky Island Saga", anilist_id: 462 },
      { title: "Episodes 147–183", entry_type: "episodes", episode_start: 147, episode_end: 183, parent_series: "Sky Island Saga", anilist_id: 21 },
      { title: "The Cursed Holy Sword", entry_type: "movie", parent_series: "Sky Island Saga", anilist_id: 463 },
      { title: "Episodes 184–206", entry_type: "episodes", episode_start: 184, episode_end: 206, parent_series: "Sky Island Saga", anilist_id: 21 },
      // -- Water 7 Saga --
      { title: "Episodes 207–223", entry_type: "episodes", episode_start: 207, episode_end: 223, parent_series: "Water 7 Saga", anilist_id: 21 },
      { title: "Baron Omatsuri and the Secret Island", entry_type: "movie", parent_series: "Water 7 Saga", anilist_id: 464 },
      { title: "Episodes 224–257", entry_type: "episodes", episode_start: 224, episode_end: 257, parent_series: "Water 7 Saga", anilist_id: 21 },
      { title: "The Giant Mechanical Soldier of Karakuri Castle", entry_type: "movie", parent_series: "Water 7 Saga", anilist_id: 465 },
      { title: "Episodes 258–298", entry_type: "episodes", episode_start: 258, episode_end: 298, parent_series: "Water 7 Saga", anilist_id: 21 },
      { title: "Episode of Alabasta: The Desert Princess and the Pirates", entry_type: "movie", parent_series: "Water 7 Saga", anilist_id: 2107, is_essential: false },
      { title: "Episodes 299–325", entry_type: "episodes", episode_start: 299, episode_end: 325, parent_series: "Water 7 Saga", anilist_id: 21 },
      // -- Thriller Bark Saga --
      { title: "Episodes 326–344", entry_type: "episodes", episode_start: 326, episode_end: 344, parent_series: "Thriller Bark Saga", anilist_id: 21 },
      { title: "Episode of Chopper Plus: Bloom in Winter, Miracle Sakura", entry_type: "movie", parent_series: "Thriller Bark Saga", anilist_id: 3848, is_essential: false },
      { title: "Episodes 345–377", entry_type: "episodes", episode_start: 345, episode_end: 377, parent_series: "Thriller Bark Saga", anilist_id: 21 },
      { title: "Romance Dawn Story", entry_type: "ova", parent_series: "Thriller Bark Saga", anilist_id: 5252, is_essential: false },
      { title: "Episodes 378–384", entry_type: "episodes", episode_start: 378, episode_end: 384, parent_series: "Thriller Bark Saga", anilist_id: 21 },
      // -- Summit War Saga --
      { title: "Episodes 385–429", entry_type: "episodes", episode_start: 385, episode_end: 429, parent_series: "Summit War Saga", anilist_id: 21 },
      { title: "Strong World", entry_type: "movie", parent_series: "Summit War Saga", anilist_id: 4155 },
      { title: "Episodes 430–448", entry_type: "episodes", episode_start: 430, episode_end: 448, parent_series: "Summit War Saga", anilist_id: 21 },
      { title: "One Piece Film Strong World Episode:0", entry_type: "ova", parent_series: "Summit War Saga", anilist_id: 8740, is_essential: false },
      { title: "Episodes 449–488", entry_type: "episodes", episode_start: 449, episode_end: 488, parent_series: "Summit War Saga", anilist_id: 21 },
      { title: "Infiltration! Thousand Sunny!", entry_type: "special", parent_series: "Summit War Saga", anilist_id: 102639, is_essential: false },
      { title: "Episode 489", entry_type: "episodes", episode_start: 489, episode_end: 489, parent_series: "Summit War Saga", anilist_id: 21 },
      { title: "One Piece 3D: Straw Hat Chase", entry_type: "movie", parent_series: "Summit War Saga", anilist_id: 9999, is_essential: false },
      { title: "Episodes 490–516", entry_type: "episodes", episode_start: 490, episode_end: 516, parent_series: "Summit War Saga", anilist_id: 21 },
      // -- Fish-Man Island Saga --
      { title: "Episodes 517–574", entry_type: "episodes", episode_start: 517, episode_end: 574, parent_series: "Fish-Man Island Saga", anilist_id: 21 },
      // -- Dressrosa Saga --
      { title: "Episodes 575–576", entry_type: "episodes", episode_start: 575, episode_end: 576, parent_series: "Dressrosa Saga", anilist_id: 21 },
      { title: "One Piece Film: Z", entry_type: "movie", parent_series: "Dressrosa Saga", anilist_id: 12859 },
      { title: "Episodes 577–746", entry_type: "episodes", episode_start: 577, episode_end: 746, parent_series: "Dressrosa Saga", anilist_id: 21 },
      // -- Yonko Saga --
      { title: "Episodes 747–750", entry_type: "episodes", episode_start: 747, episode_end: 750, parent_series: "Yonko Saga", anilist_id: 21 },
      { title: "One Piece Film: Gold", entry_type: "movie", parent_series: "Yonko Saga", anilist_id: 21335 },
      { title: "Episodes 751–896", entry_type: "episodes", episode_start: 751, episode_end: 896, parent_series: "Yonko Saga", anilist_id: 21 },
      { title: "One Piece: Stampede", entry_type: "movie", parent_series: "Yonko Saga", anilist_id: 105143 },
      { title: "Episodes 897–1032", entry_type: "episodes", episode_start: 897, episode_end: 1032, parent_series: "Yonko Saga", anilist_id: 21 },
    ],
  },

  // ================================================================
  // ATTACK ON TITAN — 11 entries
  // ================================================================
  {
    title: "Attack on Titan",
    slug: "attack-on-titan",
    anilist_id: 16498,
    year_started: 2013,
    studio: "Wit Studio",
    status: "finished",
    genres: ["Action", "Drama", "Fantasy", "Mystery"],
    entries: [
      { title: "Episodes 1–25", entry_type: "episodes", episode_start: 1, episode_end: 25, parent_series: "Attack on Titan", anilist_id: 16498 },
      { title: "Ilse's Notebook: Notes from a Scout Regiment Member", entry_type: "ova", parent_series: "Attack on Titan", anilist_id: 18397, is_essential: false },
      { title: "A Sudden Visitor: The Torturous Curse of Adolescence", entry_type: "ova", parent_series: "Attack on Titan", anilist_id: 18397, is_essential: false },
      { title: "Distress", entry_type: "ova", parent_series: "Attack on Titan", anilist_id: 18397, is_essential: false },
      { title: "No Regrets", entry_type: "ova", parent_series: "Attack on Titan", anilist_id: 20811, is_essential: false },
      { title: "Episodes 26–37", entry_type: "episodes", episode_start: 26, episode_end: 37, parent_series: "Attack on Titan Season 2", anilist_id: 20958 },
      { title: "Episodes 38–49", entry_type: "episodes", episode_start: 38, episode_end: 49, parent_series: "Attack on Titan Season 3", anilist_id: 99147 },
      { title: "Lost Girls", entry_type: "ova", parent_series: "Attack on Titan", anilist_id: 36106, is_essential: false },
      { title: "Episodes 50–59", entry_type: "episodes", episode_start: 50, episode_end: 59, parent_series: "Attack on Titan Season 3 Part 2", anilist_id: 104578 },
      { title: "Episodes 60–75", entry_type: "episodes", episode_start: 60, episode_end: 75, parent_series: "Attack on Titan The Final Season", anilist_id: 110277 },
      { title: "Episodes 76–87", entry_type: "episodes", episode_start: 76, episode_end: 87, parent_series: "Attack on Titan The Final Season Part 2", anilist_id: 131681 },
    ],
  },

  // ================================================================
  // DEMON SLAYER — 8 entries (supplemented beyond AnimeChro's outdated 2-entry page)
  // ================================================================
  {
    title: "Demon Slayer: Kimetsu no Yaiba",
    slug: "demon-slayer",
    anilist_id: 101922,
    year_started: 2019,
    studio: "ufotable",
    status: "releasing",
    genres: ["Action", "Fantasy", "Supernatural"],
    entries: [
      { title: "Episodes 1–26", entry_type: "episodes", episode_start: 1, episode_end: 26, parent_series: "Demon Slayer: Kimetsu no Yaiba", anilist_id: 101922 },
      { title: "Mugen Train", entry_type: "movie", parent_series: "Demon Slayer: Kimetsu no Yaiba", anilist_id: 112151 },
      { title: "Mugen Train Arc (TV)", entry_type: "episodes", episode_start: 1, episode_end: 7, parent_series: "Demon Slayer: Mugen Train Arc", anilist_id: 129874 },
      { title: "Entertainment District Arc", entry_type: "episodes", episode_start: 1, episode_end: 11, parent_series: "Demon Slayer: Entertainment District Arc", anilist_id: 142329 },
      { title: "Swordsmith Village Arc", entry_type: "episodes", episode_start: 1, episode_end: 11, parent_series: "Demon Slayer: Swordsmith Village Arc", anilist_id: 145139 },
      { title: "Hashira Training Arc", entry_type: "episodes", episode_start: 1, episode_end: 8, parent_series: "Demon Slayer: Hashira Training Arc", anilist_id: 166240 },
      { title: "Infinity Castle", entry_type: "movie", parent_series: "Demon Slayer: Kimetsu no Yaiba", anilist_id: 178788 },
      { title: "Infinity Castle: Part II", entry_type: "movie", parent_series: "Demon Slayer: Kimetsu no Yaiba" },
    ],
  },
];

// -------------------------------------------------------------------
// Seed logic
// -------------------------------------------------------------------

async function seed() {
  console.log("Seeding 5 franchises...\n");

  for (const franchise of FRANCHISES) {
    const { entries, ...franchiseData } = franchise;

    // Upsert franchise by slug (idempotent)
    const { data: upserted, error: franchiseError } = await supabase
      .from("franchise")
      .upsert(franchiseData, { onConflict: "slug" })
      .select("id, slug")
      .single();

    if (franchiseError) {
      console.error(`✗ Failed to upsert franchise "${franchise.title}":`, franchiseError.message);
      continue;
    }

    const franchiseId = upserted.id;

    // Delete existing entries for this franchise (clean slate)
    const { error: deleteError } = await supabase
      .from("entry")
      .delete()
      .eq("franchise_id", franchiseId);

    if (deleteError) {
      console.error(`✗ Failed to delete entries for "${franchise.title}":`, deleteError.message);
      continue;
    }

    // Insert entries with position
    const entryRows = entries.map((entry, index) => ({
      franchise_id: franchiseId,
      position: index + 1,
      title: entry.title,
      entry_type: entry.entry_type,
      episode_start: entry.episode_start ?? null,
      episode_end: entry.episode_end ?? null,
      parent_series: entry.parent_series,
      anilist_id: entry.anilist_id ?? null,
      is_essential: entry.is_essential ?? true,
    }));

    const { error: insertError } = await supabase
      .from("entry")
      .insert(entryRows);

    if (insertError) {
      console.error(`✗ Failed to insert entries for "${franchise.title}":`, insertError.message);
      continue;
    }

    console.log(`✓ ${franchise.title} — ${entries.length} entries`);
  }

  console.log("\nDone!");
}

seed().catch(console.error);
