import type { SupabaseClient } from "@supabase/supabase-js";

interface SyncLogEntry {
  job: string;
  ok: boolean;
  synced?: number;
  warnings?: string[];
  error?: string;
}

/**
 * Best-effort write of a cron sync outcome to the sync_log table.
 * Swallows its own errors so logging can never break the sync itself.
 */
export async function logSync(
  supabase: SupabaseClient,
  entry: SyncLogEntry,
): Promise<void> {
  try {
    await supabase.from("sync_log").insert({
      job: entry.job,
      ok: entry.ok,
      synced: entry.synced ?? 0,
      warnings: entry.warnings ?? [],
      error: entry.error ?? null,
    });
  } catch (e) {
    console.error("logSync failed:", e);
  }
}
