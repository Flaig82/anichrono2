/**
 * Seed all franchises from the migrated JSON data into Supabase.
 * Reads scripts/data/all-franchises.json and upserts into franchise + entry tables.
 *
 * Run with: npx tsx scripts/seed-all-franchises.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Load .env.local manually (same pattern as seed-quests.ts)
// ---------------------------------------------------------------------------
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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ---------------------------------------------------------------------------
// Types (matching the JSON output from migrate-from-old-site.ts)
// ---------------------------------------------------------------------------

interface EntryData {
  title: string;
  entry_type: "episodes" | "movie" | "ova" | "ona" | "manga" | "special";
  episode_start: number | null;
  episode_end: number | null;
  parent_series: string;
  anilist_id: number | null;
  is_essential: boolean;
}

interface FranchiseData {
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
  entries: EntryData[];
}

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------

async function seed() {
  const dataPath = resolve(__dirname, "data/all-franchises.json");
  let franchises: FranchiseData[];

  try {
    const raw = readFileSync(dataPath, "utf-8");
    franchises = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read ${dataPath}:`, err);
    console.error("Run migrate-from-old-site.ts first to generate the JSON.");
    process.exit(1);
  }

  console.log(`\nSeeding ${franchises.length} franchises...\n`);

  let successCount = 0;
  let failCount = 0;
  let totalEntries = 0;

  for (const franchise of franchises) {
    const { entries, ...franchiseData } = franchise;

    // Upsert franchise by slug (idempotent)
    const { data: upserted, error: franchiseError } = await supabase
      .from("franchise")
      .upsert(franchiseData, { onConflict: "slug" })
      .select("id, slug")
      .single();

    if (franchiseError) {
      console.error(
        `✗ Failed to upsert franchise "${franchise.title}":`,
        franchiseError.message,
      );
      failCount++;
      continue;
    }

    const franchiseId = upserted.id;

    // Delete existing entries for this franchise (clean slate)
    const { error: deleteError } = await supabase
      .from("entry")
      .delete()
      .eq("franchise_id", franchiseId);

    if (deleteError) {
      console.error(
        `✗ Failed to delete entries for "${franchise.title}":`,
        deleteError.message,
      );
      failCount++;
      continue;
    }

    // Insert entries with position
    if (entries.length > 0) {
      const entryRows = entries.map((entry, index) => ({
        franchise_id: franchiseId,
        position: index + 1,
        title: entry.title,
        entry_type: entry.entry_type,
        episode_start: entry.episode_start,
        episode_end: entry.episode_end,
        parent_series: entry.parent_series,
        anilist_id: entry.anilist_id,
        is_essential: entry.is_essential,
      }));

      const { error: insertError } = await supabase
        .from("entry")
        .insert(entryRows);

      if (insertError) {
        console.error(
          `✗ Failed to insert entries for "${franchise.title}":`,
          insertError.message,
        );
        failCount++;
        continue;
      }
    }

    totalEntries += entries.length;
    successCount++;
    console.log(`✓ ${franchise.title} — ${entries.length} entries`);
  }

  console.log(`\n✅ Done!`);
  console.log(`   Succeeded: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`   Total entries: ${totalEntries}`);
}

seed().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
