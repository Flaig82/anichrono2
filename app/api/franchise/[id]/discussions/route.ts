import { createClient } from "@/lib/supabase-server";
import { createDiscussionSchema } from "@/lib/validations/discussion";
import { createRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const discussionLimiter = createRateLimiter("discussions", {
  burstLimit: 5,
  burstWindowMs: 60_000,
  dailyLimit: 20,
});

/** GET /api/franchise/[id]/discussions — list discussions for a franchise */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const franchiseId = (await params).id;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
  const offset = Number(searchParams.get("offset")) || 0;

  const { data: discussions, error } = await supabase
    .from("discussion")
    .select(
      "id, franchise_id, author_id, title, body, reply_count, last_reply_at, is_pinned, created_at",
    )
    .eq("franchise_id", franchiseId)
    .order("is_pinned", { ascending: false })
    .order("last_reply_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get total count
  const { count: total } = await supabase
    .from("discussion")
    .select("*", { count: "exact", head: true })
    .eq("franchise_id", franchiseId);

  // Batch-fetch authors
  const authorIds = [
    ...new Set((discussions ?? []).map((d) => d.author_id)),
  ];
  let authorMap = new Map<
    string,
    { display_name: string; handle: string | null; avatar_url: string | null }
  >();

  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("users")
      .select("id, display_name, handle, avatar_url")
      .in("id", authorIds);

    if (authors) {
      authorMap = new Map(authors.map((a) => [a.id, a]));
    }
  }

  const enriched = (discussions ?? []).map((d) => ({
    ...d,
    author: authorMap.get(d.author_id) ?? null,
  }));

  return NextResponse.json({ discussions: enriched, total: total ?? 0 });
}

/** POST /api/franchise/[id]/discussions — create a new discussion */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const franchiseId = (await params).id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = discussionLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const body: unknown = await request.json();
  const result = createDiscussionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { title, body: discussionBody } = result.data;

  const { data: discussion, error: insertError } = await supabase
    .from("discussion")
    .insert({
      franchise_id: franchiseId,
      author_id: user.id,
      title,
      body: discussionBody,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ id: discussion.id }, { status: 201 });
}
