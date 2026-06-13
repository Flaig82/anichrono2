import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { NextResponse } from "next/server";

interface DraftEntry {
  id: string;
  position: number;
  title: string;
  entry_type: string;
  curator_note: string | null;
  is_essential: boolean;
}

/**
 * GET /api/admin/franchise/drafts — franchises awaiting review.
 *
 * Returns review_status 'draft' (pending) and 'rejected' (kept for audit /
 * re-approval), each with its ordered entries so the queue can be reviewed
 * inline. Admin only; reads via the service client so RLS doesn't hide drafts.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("franchise")
    .select(
      "id, title, slug, cover_image_url, banner_image_url, review_status, created_at, year_started, studio, genres, entry(id, position, title, entry_type, curator_note, is_essential)",
    )
    .in("review_status", ["draft", "rejected"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    banner_image_url: string | null;
    review_status: string;
    created_at: string;
    year_started: number | null;
    studio: string | null;
    genres: string[] | null;
    entry: DraftEntry[];
  };

  const rows = (data ?? []) as unknown as Row[];
  const franchises = rows.map((f) => ({
    id: f.id,
    title: f.title,
    slug: f.slug,
    cover_image_url: f.cover_image_url,
    banner_image_url: f.banner_image_url,
    review_status: f.review_status,
    created_at: f.created_at,
    year_started: f.year_started,
    studio: f.studio,
    genres: f.genres ?? [],
    entries: (f.entry ?? []).sort((a, b) => a.position - b.position),
  }));

  return NextResponse.json(franchises);
}
