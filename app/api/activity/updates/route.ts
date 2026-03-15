import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { ContentUpdateItem } from "@/types/activity";

/** GET /api/activity/updates — applied proposals + recently added franchises */
export async function GET() {
  const supabase = createClient();

  // Recently applied proposals
  const { data: proposals } = await supabase
    .from("order_proposal")
    .select(
      "id, title, description, applied_at, franchise:franchise!franchise_id(title, slug, cover_image_url)",
    )
    .eq("status", "applied")
    .not("applied_at", "is", null)
    .order("applied_at", { ascending: false })
    .limit(10);

  // Recently added franchises
  const { data: franchises } = await supabase
    .from("franchise")
    .select("id, title, slug, cover_image_url, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  // Normalize into a single sorted array
  const items: ContentUpdateItem[] = [];

  if (proposals) {
    for (const p of proposals) {
      const fRaw = p.franchise as unknown;
      const f = Array.isArray(fRaw) ? fRaw[0] as { title: string; slug: string; cover_image_url: string | null } | undefined : fRaw as { title: string; slug: string; cover_image_url: string | null } | null;
      items.push({
        id: p.id,
        kind: "proposal_applied",
        title: f?.title ?? "Unknown Franchise",
        description: p.title,
        poster: f?.cover_image_url ?? null,
        created_at: p.applied_at!,
      });
    }
  }

  if (franchises) {
    for (const f of franchises) {
      items.push({
        id: f.id,
        kind: "new_franchise",
        title: f.title,
        description: "Added to franchise database",
        poster: f.cover_image_url ?? null,
        created_at: f.created_at,
      });
    }
  }

  // Sort descending by date, take top 10
  items.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return NextResponse.json(items.slice(0, 10));
}
