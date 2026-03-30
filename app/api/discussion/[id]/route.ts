import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/discussion/[id] — full discussion thread with replies + like data */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const discussionId = (await params).id;

  // Fetch discussion
  const { data: discussion, error } = await supabase
    .from("discussion")
    .select(
      "id, franchise_id, author_id, title, body, reply_count, last_reply_at, is_pinned, created_at",
    )
    .eq("id", discussionId)
    .single();

  if (error || !discussion) {
    return NextResponse.json(
      { error: "Discussion not found" },
      { status: 404 },
    );
  }

  // Fetch replies
  const { data: replies } = await supabase
    .from("discussion_reply")
    .select("id, discussion_id, author_id, body, created_at")
    .eq("discussion_id", discussionId)
    .order("created_at", { ascending: true });

  const allReplies = replies ?? [];

  // Collect all author IDs (discussion + replies)
  const authorIds = [
    ...new Set([
      discussion.author_id,
      ...allReplies.map((r) => r.author_id),
    ]),
  ];

  const { data: authors } = await supabase
    .from("users")
    .select("id, display_name, handle, avatar_url")
    .in("id", authorIds);

  const authorMap = new Map(
    (authors ?? []).map((a) => [a.id, a]),
  );

  // Fetch like data for replies
  const replyIds = allReplies.map((r) => r.id);
  const countByReply = new Map<string, number>();
  const viewerLikedSet = new Set<string>();

  if (replyIds.length > 0) {
    const { data: likeCounts } = await supabase
      .from("activity_like")
      .select("item_id")
      .eq("item_type", "discussion_reply")
      .in("item_id", replyIds);

    for (const row of likeCounts ?? []) {
      countByReply.set(
        row.item_id,
        (countByReply.get(row.item_id) ?? 0) + 1,
      );
    }

    const {
      data: { user: viewer },
    } = await supabase.auth.getUser();

    if (viewer) {
      const { data: viewerLikes } = await supabase
        .from("activity_like")
        .select("item_id")
        .eq("item_type", "discussion_reply")
        .eq("user_id", viewer.id)
        .in("item_id", replyIds);

      for (const row of viewerLikes ?? []) {
        viewerLikedSet.add(row.item_id);
      }
    }
  }

  const enrichedReplies = allReplies.map((r) => ({
    ...r,
    author: authorMap.get(r.author_id) ?? null,
    like_count: countByReply.get(r.id) ?? 0,
    user_liked: viewerLikedSet.has(r.id),
  }));

  return NextResponse.json({
    discussion: {
      ...discussion,
      author: authorMap.get(discussion.author_id) ?? null,
    },
    replies: enrichedReplies,
  });
}
