import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { createReviewSchema } from "@/lib/validations/review";
import { awardAura } from "@/lib/aura";

const SCHOLAR_REVIEW_AURA = 20;

/** GET /api/review?franchise_id=X — list reviews for a franchise */
export async function GET(request: Request) {
  const supabase = createClient();

  const url = new URL(request.url);
  const franchiseId = url.searchParams.get("franchise_id");
  if (!franchiseId) {
    return NextResponse.json(
      { error: "franchise_id required" },
      { status: 400 },
    );
  }

  const { data: reviews, error } = await supabase
    .from("review")
    .select(
      "id, body, score, word_count, upvotes, created_at, user_id, users:user_id(display_name, handle, avatar_url)",
    )
    .eq("franchise_id", franchiseId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(reviews ?? []);
}

/** POST /api/review — submit a review */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { franchise_id, body: reviewBody, score } = parsed.data;
  const wordCount = reviewBody.trim().split(/\s+/).length;

  // Check for existing review (unique constraint will catch it, but nicer error)
  const { data: existing } = await supabase
    .from("review")
    .select("id")
    .eq("user_id", user.id)
    .eq("franchise_id", franchise_id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "You already reviewed this franchise" },
      { status: 409 },
    );
  }

  const { data: review, error } = await supabase
    .from("review")
    .insert({
      user_id: user.id,
      franchise_id,
      body: reviewBody,
      score,
      word_count: wordCount,
    })
    .select("id, body, score, word_count, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Award Scholar aura
  const { totalAura, era } = await awardAura(
    supabase,
    user.id,
    "scholar",
    SCHOLAR_REVIEW_AURA,
  );

  // Log activity
  await supabase.from("activity").insert({
    user_id: user.id,
    type: "review",
    franchise_id,
    metadata: {
      review_id: review.id,
      score,
      word_count: wordCount,
      aura_awarded: SCHOLAR_REVIEW_AURA,
    },
  });

  return NextResponse.json({
    review,
    auraAwarded: SCHOLAR_REVIEW_AURA,
    totalAura,
    era,
  });
}
