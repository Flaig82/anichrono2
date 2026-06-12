/**
 * Apply a curated watch order (positions, curator notes, essential flags) to an
 * existing franchise's Watch Order. Used by the generate-list routine after
 * seeding a franchise: the seed lays down airing order; this script applies the
 * researched watch order.
 *
 * Usage (from repo root):
 *   node scripts/apply-watch-order.mjs <franchise-slug> <plan.json>
 *
 * plan.json: array of
 *   {
 *     "anilist_id": 20,            // required — must match an existing entry
 *     "position": 1,                // required — 1-based, unique
 *     "curator_note": "...",        // optional — why it sits here (reader-facing)
 *     "is_essential": true,         // optional
 *     "entry_type": "episodes",     // optional: episodes|movie|ova|ona|manga|special
 *     "parent_series": "..."        // optional: sub-series group header (string or null)
 *   }
 *
 * Every non-removed entry of the franchise must appear in the plan exactly once
 * (the script refuses partial plans so positions stay coherent).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ENTRY_TYPES = new Set(["episodes", "movie", "ova", "ona", "manga", "special"]);

function loadEnv() {
  const raw = readFileSync(resolve(import.meta.dirname, "../.env.local"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const [slug, planPath] = process.argv.slice(2);
if (!slug || !planPath) {
  console.error("Usage: node scripts/apply-watch-order.mjs <franchise-slug> <plan.json>");
  process.exit(1);
}

const env = loadEnv();
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const plan = JSON.parse(readFileSync(planPath, "utf8"));
if (!Array.isArray(plan) || plan.length === 0) {
  console.error("Plan must be a non-empty array");
  process.exit(1);
}

const positions = new Set();
for (const item of plan) {
  if (typeof item.anilist_id !== "number" || typeof item.position !== "number") {
    console.error(`Plan item missing anilist_id/position: ${JSON.stringify(item)}`);
    process.exit(1);
  }
  if (positions.has(item.position)) {
    console.error(`Duplicate position ${item.position}`);
    process.exit(1);
  }
  positions.add(item.position);
  if (item.entry_type && !ENTRY_TYPES.has(item.entry_type)) {
    console.error(`Invalid entry_type "${item.entry_type}"`);
    process.exit(1);
  }
  if (item.parent_series !== undefined && item.parent_series !== null && typeof item.parent_series !== "string") {
    console.error(`Invalid parent_series (must be string or null): ${JSON.stringify(item)}`);
    process.exit(1);
  }
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: franchise, error: fErr } = await supabase
  .from("franchise")
  .select("id, title")
  .eq("slug", slug)
  .single();
if (fErr || !franchise) {
  console.error(`Franchise "${slug}" not found: ${fErr?.message ?? ""}`);
  process.exit(1);
}

const { data: entries, error: eErr } = await supabase
  .from("entry")
  .select("id, anilist_id, title, position")
  .eq("franchise_id", franchise.id)
  .eq("is_removed", false);
if (eErr) {
  console.error(`Entries fetch failed: ${eErr.message}`);
  process.exit(1);
}

const byAniList = new Map(entries.filter((e) => e.anilist_id != null).map((e) => [e.anilist_id, e]));

const planIds = new Set(plan.map((p) => p.anilist_id));
const missingFromPlan = entries.filter((e) => e.anilist_id == null || !planIds.has(e.anilist_id));
const unknownInPlan = plan.filter((p) => !byAniList.has(p.anilist_id));
if (missingFromPlan.length || unknownInPlan.length) {
  for (const e of missingFromPlan) {
    console.error(`Entry not covered by plan: ${e.title} (anilist ${e.anilist_id ?? "none"})`);
  }
  for (const p of unknownInPlan) {
    console.error(`Plan anilist_id ${p.anilist_id} matches no entry`);
  }
  process.exit(1);
}

for (const item of plan) {
  const entry = byAniList.get(item.anilist_id);
  const update = { position: item.position };
  if (item.curator_note !== undefined) update.curator_note = item.curator_note;
  if (item.is_essential !== undefined) update.is_essential = item.is_essential;
  if (item.entry_type !== undefined) update.entry_type = item.entry_type;
  if (item.parent_series !== undefined) update.parent_series = item.parent_series;

  const { error } = await supabase.from("entry").update(update).eq("id", entry.id);
  if (error) {
    console.error(`Update failed for ${entry.title}: ${error.message}`);
    process.exit(1);
  }
  console.log(`#${String(item.position).padStart(2)} ${entry.title}${item.curator_note ? " — note set" : ""}`);
}

console.log(`\nApplied ${plan.length} positions to "${franchise.title}" (${slug}).`);
