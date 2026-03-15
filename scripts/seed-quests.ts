/**
 * Seed quest definitions into the quest table.
 * Run with: npx tsx scripts/seed-quests.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually so we don't need dotenv as a dependency
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
  console.error("Missing env vars. Found URL:", !!supabaseUrl, "Found key:", !!serviceRoleKey);
  console.error("Make sure .env.local exists in:", process.cwd());
  process.exit(1);
}

console.log("Connecting to:", supabaseUrl);

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface QuestSeed {
  category: string;
  title: string;
  flavour_text: string | null;
  description: string;
  aura_type: string;
  aura_amount: number;
  target: number;
  condition: Record<string, unknown>;
  era_required: string | null;
  is_hidden: boolean;
  sort_order: number;
  season: string | null;
}

const QUESTS: QuestSeed[] = [
  // ── Journey Quests (5) ──
  {
    category: "journey",
    title: "Complete your profile",
    flavour_text: "Your signal is faint. Begin.",
    description:
      "Fill out your display name, handle, and avatar to initialize your Aura tree.",
    aura_type: "aura",
    aura_amount: 25,
    target: 1,
    condition: { type: "complete_anime", count: 0 },
    era_required: null,
    is_hidden: false,
    sort_order: 1,
    season: null,
  },
  {
    category: "journey",
    title: "Mark your first anime as complete",
    flavour_text: "Every journey starts with one.",
    description:
      "Add any anime to your watch history and mark it as completed.",
    aura_type: "aura",
    aura_amount: 50,
    target: 1,
    condition: { type: "complete_anime", count: 1 },
    era_required: null,
    is_hidden: false,
    sort_order: 2,
    season: null,
  },
  {
    category: "journey",
    title: "Complete 5 anime",
    flavour_text: "Reach five.",
    description:
      "Mark 5 different anime as completed in your watch history to unlock the Wanderer era.",
    aura_type: "aura",
    aura_amount: 150,
    target: 5,
    condition: { type: "complete_anime", count: 5 },
    era_required: null,
    is_hidden: false,
    sort_order: 3,
    season: null,
  },
  {
    category: "journey",
    title: "Complete a pre-2000 anime",
    flavour_text: "Old light travels far.",
    description:
      "Finish an anime that started airing before the year 2000. The classics shaped everything that followed.",
    aura_type: "aura",
    aura_amount: 120,
    target: 1,
    condition: { type: "complete_pre_year", year: 2000 },
    era_required: "wanderer",
    is_hidden: false,
    sort_order: 4,
    season: null,
  },
  {
    category: "journey",
    title: "Complete an 8+ entry franchise",
    flavour_text: "Depth over breadth.",
    description:
      "Finish every entry in a franchise with 8 or more items in its master order.",
    aura_type: "aura",
    aura_amount: 250,
    target: 1,
    condition: { type: "complete_franchise", min_entries: 8 },
    era_required: "wanderer",
    is_hidden: false,
    sort_order: 5,
    season: null,
  },

  // ── Weekly Quests (5) ──
  {
    category: "weekly",
    title: "Complete 2 episodes from any Chronicle",
    flavour_text: null,
    description:
      "Make progress on any active Chronicle this week. Steady viewing earns steady Aura.",
    aura_type: "aura",
    aura_amount: 40,
    target: 2,
    condition: { type: "watch_episodes", count: 2 },
    era_required: null,
    is_hidden: false,
    sort_order: 1,
    season: null,
  },
  {
    category: "weekly",
    title: "Write a review for any completed anime",
    flavour_text: null,
    description:
      "Share your thoughts on a show you've finished. Minimum 50 words.",
    aura_type: "scholar",
    aura_amount: 35,
    target: 1,
    condition: { type: "write_review", count: 1 },
    era_required: null,
    is_hidden: false,
    sort_order: 2,
    season: null,
  },
  {
    category: "weekly",
    title: "Vote on a Chronicle proposal",
    flavour_text: null,
    description:
      "Help the community decide which watch orders are worthy of approval.",
    aura_type: "archivist",
    aura_amount: 20,
    target: 1,
    condition: { type: "vote_proposal", count: 1 },
    era_required: null,
    is_hidden: false,
    sort_order: 3,
    season: null,
  },
  {
    category: "weekly",
    title: "Rate a completed show",
    flavour_text: null,
    description: "Leave a score on something in your completed list.",
    aura_type: "scholar",
    aura_amount: 15,
    target: 1,
    condition: { type: "write_review", count: 1 },
    era_required: null,
    is_hidden: false,
    sort_order: 4,
    season: null,
  },
  {
    category: "weekly",
    title: "Submit a score prediction",
    flavour_text: null,
    description: "Predict the final AniList score for an airing show.",
    aura_type: "scholar",
    aura_amount: 15,
    target: 1,
    condition: { type: "submit_prediction", count: 1 },
    era_required: null,
    is_hidden: false,
    sort_order: 5,
    season: null,
  },

  // ── Seasonal Quests (4) ──
  {
    category: "seasonal",
    title: "Winter Warrior",
    flavour_text: null,
    description:
      "Complete 3 anime that are currently airing in the Winter 2026 season.",
    aura_type: "aura",
    aura_amount: 200,
    target: 3,
    condition: { type: "complete_anime", count: 3 },
    era_required: null,
    is_hidden: false,
    sort_order: 1,
    season: "winter_2026",
  },
  {
    category: "seasonal",
    title: "Oracle's Trial",
    flavour_text: null,
    description:
      "Submit 5 score predictions for currently airing shows this season.",
    aura_type: "scholar",
    aura_amount: 150,
    target: 5,
    condition: { type: "submit_prediction", count: 5 },
    era_required: null,
    is_hidden: false,
    sort_order: 2,
    season: "winter_2026",
  },
  {
    category: "seasonal",
    title: "Community Pillar",
    flavour_text: null,
    description:
      "Submit 2 Chronicle proposals to help improve the community watch orders.",
    aura_type: "archivist",
    aura_amount: 100,
    target: 2,
    condition: { type: "submit_proposal", count: 2 },
    era_required: null,
    is_hidden: false,
    sort_order: 3,
    season: "winter_2026",
  },
  {
    category: "seasonal",
    title: "Season Review",
    flavour_text: null,
    description:
      "Write 3 reviews for anime airing in the Winter 2026 season.",
    aura_type: "scholar",
    aura_amount: 120,
    target: 3,
    condition: { type: "write_review", count: 3 },
    era_required: null,
    is_hidden: false,
    sort_order: 4,
    season: "winter_2026",
  },

  // ── Mastery Quests (4: 2 revealed, 2 hidden) ──
  {
    category: "mastery",
    title: "Ghost",
    flavour_text: "Some signals are heard only by those who listen.",
    description:
      "Complete an anime with fewer than 1,000 members on AniList. Unlocks the Ghost title.",
    aura_type: "aura",
    aura_amount: 500,
    target: 1,
    condition: { type: "complete_obscure", max_members: 1000 },
    era_required: null,
    is_hidden: false,
    sort_order: 1,
    season: null,
  },
  {
    category: "mastery",
    title: "Time Traveler",
    flavour_text: "Every decade has a voice. Listen to them all.",
    description:
      "Complete anime from 5 different decades. Unlocks the Time Traveler title.",
    aura_type: "aura",
    aura_amount: 600,
    target: 5,
    condition: { type: "complete_decades", count: 5 },
    era_required: null,
    is_hidden: false,
    sort_order: 2,
    season: null,
  },
  {
    category: "mastery",
    title: "Polymath",
    flavour_text: "The universe speaks in many tongues.",
    description:
      "Complete anime from every major genre. Unlocks the Polymath title.",
    aura_type: "aura",
    aura_amount: 800,
    target: 1,
    condition: { type: "complete_anime", count: 1 },
    era_required: null,
    is_hidden: true,
    sort_order: 3,
    season: null,
  },
  {
    category: "mastery",
    title: "Oracle's Eye",
    flavour_text: "Ten perfect readings. The future bends to your sight.",
    description:
      "Achieve 10 perfect score predictions. Unlocks the Oracle's Eye title and tree cosmetic.",
    aura_type: "scholar",
    aura_amount: 1000,
    target: 10,
    condition: { type: "submit_prediction", count: 10 },
    era_required: null,
    is_hidden: true,
    sort_order: 4,
    season: null,
  },
];

async function seed() {
  console.log(`Seeding ${QUESTS.length} quest definitions...`);

  // Clear existing quests (idempotent re-seed)
  const { error: deleteError } = await supabase
    .from("quest")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all

  if (deleteError) {
    console.error("Failed to clear existing quests:", deleteError.message);
    process.exit(1);
  }

  const { data, error } = await supabase
    .from("quest")
    .insert(QUESTS)
    .select("id, title, category");

  if (error) {
    console.error("Failed to seed quests:", error.message);
    process.exit(1);
  }

  console.log(`Seeded ${data.length} quests:`);
  for (const q of data) {
    console.log(`  [${q.category}] ${q.title}`);
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
