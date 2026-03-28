import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createRateLimiter } from "@/lib/rate-limit";
import { importAniListSchema } from "@/lib/validations/import";
import { fetchUserAnimeList } from "@/lib/anilist";
import { importFromAniList } from "@/lib/import-anilist";

const limiter = createRateLimiter("anilist-import", {
  burstLimit: 2,
  burstWindowMs: 60_000,
  dailyLimit: 5,
});

export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit
  const rl = limiter.check(user.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: rl.message }, { status: 429 });
  }

  // Parse optional body
  let dryRun = false;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = importAniListSchema.parse(body);
    dryRun = parsed.dry_run ?? false;
  } catch {
    // Body is optional, default to non-dry-run
  }

  // Fetch user's AniList username from profile
  const { data: profile } = await supabase
    .from("users")
    .select("anilist_username")
    .eq("id", user.id)
    .single();

  if (!profile?.anilist_username) {
    return NextResponse.json(
      { error: "No AniList username linked. Save your AniList username in settings first." },
      { status: 400 },
    );
  }

  // Fetch from AniList
  const anilistEntries = await fetchUserAnimeList(profile.anilist_username);
  if (anilistEntries === null) {
    return NextResponse.json(
      { error: "Could not fetch AniList data. Make sure your AniList username is correct and your list is public." },
      { status: 422 },
    );
  }

  if (anilistEntries.length === 0) {
    return NextResponse.json({
      entries_imported: 0,
      entries_skipped: 0,
      franchises_updated: 0,
      aura_awarded: 0,
      completed_quests: [],
      message: "No anime found on your AniList (excluding Planning).",
    });
  }

  // Run import
  const result = await importFromAniList(
    supabase,
    user.id,
    anilistEntries,
    dryRun,
  );

  return NextResponse.json(result);
}
