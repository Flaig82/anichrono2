import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { createReplySchema } from "@/lib/validations/discussion";
import { createRateLimiter } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

const replyLimiter = createRateLimiter("discussion_replies", {
  burstLimit: 10,
  burstWindowMs: 60_000,
  dailyLimit: 100,
});

/** POST /api/discussion/[id]/reply — reply to a discussion */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const discussionId = (await params).id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = replyLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const body: unknown = await request.json();
  const result = createReplySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { body: replyBody } = result.data;

  // Verify discussion exists and get author for notification
  const { data: discussion } = await supabase
    .from("discussion")
    .select("id, author_id, title")
    .eq("id", discussionId)
    .single();

  if (!discussion) {
    return NextResponse.json(
      { error: "Discussion not found" },
      { status: 404 },
    );
  }

  // Insert reply
  const { data: reply, error: insertError } = await supabase
    .from("discussion_reply")
    .insert({
      discussion_id: discussionId,
      author_id: user.id,
      body: replyBody,
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Update discussion reply_count and last_reply_at using service client
  const service = createServiceClient();
  const { count: replyCount } = await service
    .from("discussion_reply")
    .select("*", { count: "exact", head: true })
    .eq("discussion_id", discussionId);

  await service
    .from("discussion")
    .update({
      reply_count: replyCount ?? 0,
      last_reply_at: reply.created_at,
    })
    .eq("id", discussionId);

  // Notify discussion author about the reply (fire-and-forget)
  (async () => {
    try {
      const { data: actor } = await service
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .single();
      const actorName = actor?.display_name ?? "Someone";

      await createNotification({
        userId: discussion.author_id,
        type: "discussion_reply",
        actorId: user.id,
        entityType: "discussion",
        entityId: discussionId,
        message: `${actorName} replied to your discussion "${discussion.title}"`,
      });
    } catch {
      // Non-critical
    }
  })();

  return NextResponse.json({ id: reply.id }, { status: 201 });
}
