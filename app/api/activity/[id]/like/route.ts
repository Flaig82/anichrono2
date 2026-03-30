import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { activityLikeSchema } from "@/lib/validations/activity";
import { createRateLimiter } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { progressQuests } from "@/lib/quests";
import { NextResponse } from "next/server";

const likeLimiter = createRateLimiter("likes", {
  burstLimit: 30,
  burstWindowMs: 60_000,
  dailyLimit: 500,
});

/** POST /api/activity/[id]/like — like an activity item */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const itemId = (await params).id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limit: 30/min burst, 500/day
  const limit = likeLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const body: unknown = await request.json();
  const result = activityLikeSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { item_type } = result.data;

  // Upsert — ignore if already liked
  const { error: insertError } = await supabase
    .from("activity_like")
    .upsert(
      { item_type, item_id: itemId, user_id: user.id },
      { onConflict: "item_type,item_id,user_id" },
    );

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Get updated count
  const { count } = await supabase
    .from("activity_like")
    .select("*", { count: "exact", head: true })
    .eq("item_type", item_type)
    .eq("item_id", itemId);

  // Notify the content owner about the like (fire-and-forget)
  (async () => {
    try {
      const service = createServiceClient();
      let ownerId: string | null = null;

      if (item_type === "activity") {
        const { data: activity } = await service
          .from("activity")
          .select("user_id")
          .eq("id", itemId)
          .single();
        ownerId = activity?.user_id ?? null;
      } else if (item_type === "discussion_reply") {
        const { data: reply } = await service
          .from("discussion_reply")
          .select("author_id")
          .eq("id", itemId)
          .single();
        ownerId = reply?.author_id ?? null;
      }

      if (ownerId) {
        // Look up actor display name for the notification message
        const { data: actor } = await service
          .from("users")
          .select("display_name")
          .eq("id", user.id)
          .single();
        const actorName = actor?.display_name ?? "Someone";

        await createNotification({
          userId: ownerId,
          type: "like",
          actorId: user.id,
          entityType: item_type,
          entityId: itemId,
          message: `${actorName} liked your activity`,
        });
      }
    } catch {
      // Non-critical — don't fail the like
    }
  })();

  // Secret mastery quest: hitting 500 daily likes
  if (limit.dailyCount === 500) {
    // Reveal the mastery quest by creating a user_quest row, then auto-complete it
    const { data: masteryQuest } = await supabase
      .from("quest")
      .select("id")
      .eq("category", "mastery")
      .filter("condition->>type", "eq", "daily_likes")
      .single();

    if (masteryQuest) {
      // Create user_quest row to reveal it (upsert to avoid dupes)
      await supabase.from("user_quest").upsert(
        {
          user_id: user.id,
          quest_id: masteryQuest.id,
          progress: 0,
          week_key: null,
        },
        { onConflict: "user_id,quest_id,week_key" },
      );

      // Progress it to completion
      await progressQuests(supabase, user.id, "daily_likes");
    }
  }

  return NextResponse.json({ liked: true, likeCount: count ?? 0 });
}

/** DELETE /api/activity/[id]/like?item_type=... — unlike an activity item */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const itemId = (await params).id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limit: shares the same 30/min, 500/day pool as POST
  const limit = likeLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const item_type = searchParams.get("item_type");
  if (!item_type || !["activity", "proposal", "franchise", "discussion_reply"].includes(item_type)) {
    return NextResponse.json({ error: "Invalid item_type" }, { status: 400 });
  }

  await supabase
    .from("activity_like")
    .delete()
    .eq("item_type", item_type)
    .eq("item_id", itemId)
    .eq("user_id", user.id);

  // Get updated count
  const { count } = await supabase
    .from("activity_like")
    .select("*", { count: "exact", head: true })
    .eq("item_type", item_type)
    .eq("item_id", itemId);

  return NextResponse.json({ liked: false, likeCount: count ?? 0 });
}
