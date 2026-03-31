import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: news, error } = await supabase
    .from("news_cache")
    .select("id, title, description, source_url, published_at, category")
    .eq("franchise_id", id)
    .order("published_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("News fetch error:", error);
    return NextResponse.json([], { status: 200 });
  }

  const items = (news ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    sourceUrl: n.source_url,
    publishedAt: n.published_at,
    category: n.category,
  }));

  return NextResponse.json(items, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300",
    },
  });
}
