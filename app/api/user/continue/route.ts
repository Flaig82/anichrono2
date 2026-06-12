import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface ContinueFranchise {
  title: string;
  slug: string;
  cover_image_url: string | null;
  banner_image_url: string | null;
}

/**
 * GET /api/user/continue — the user's most relevant in-progress franchise.
 *
 * Picks the franchise of the user's most recently touched watch_entry, then
 * computes total entries, how many the user has completed, and the next
 * unwatched entry (lowest position). Returns { franchise: null } when the
 * user has no watch activity.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Most recently touched watch entry → its franchise
  const { data: recent } = await supabase
    .from("watch_entry")
    .select(
      "franchise_id, updated_at, franchise:franchise_id(title, slug, cover_image_url, banner_image_url)",
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const franchise = (recent?.franchise ?? null) as unknown as ContinueFranchise | null;
  if (!recent || !franchise) {
    return NextResponse.json({ franchise: null });
  }

  // All non-removed entries in master order
  const { data: entries } = await supabase
    .from("entry")
    .select("id, title, position")
    .eq("franchise_id", recent.franchise_id)
    .eq("is_removed", false)
    .order("position", { ascending: true });

  // User's watch progress in this franchise
  const { data: watched } = await supabase
    .from("watch_entry")
    .select("entry_id, status")
    .eq("user_id", user.id)
    .eq("franchise_id", recent.franchise_id);

  const completedIds = new Set(
    (watched ?? []).filter((w) => w.status === "completed").map((w) => w.entry_id),
  );

  const orderedEntries = entries ?? [];
  const total = orderedEntries.length;
  const played = orderedEntries.filter((e) => completedIds.has(e.id)).length;
  const nextEntry = orderedEntries.find((e) => !completedIds.has(e.id)) ?? null;

  return NextResponse.json({
    franchise: {
      title: franchise.title,
      slug: franchise.slug,
      cover_image_url: franchise.cover_image_url,
      banner_image_url: franchise.banner_image_url,
    },
    played,
    total,
    nextEntry: nextEntry ? { title: nextEntry.title } : null,
  });
}
