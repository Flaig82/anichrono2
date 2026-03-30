import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/notifications — paginated notifications with actor joins + like grouping */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 50);
  const offset = Number(searchParams.get("offset")) || 0;

  // Fetch notifications with actor data
  const { data: rawNotifications, error } = await supabase
    .from("notification")
    .select(
      "id, type, actor_id, entity_type, entity_id, message, read, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notifications = rawNotifications ?? [];

  // Collect actor IDs for batch lookup
  const actorIds = [
    ...new Set(
      notifications
        .map((n) => n.actor_id)
        .filter((id): id is string => id != null),
    ),
  ];

  let actorMap = new Map<
    string,
    { display_name: string; handle: string | null; avatar_url: string | null }
  >();

  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("users")
      .select("id, display_name, handle, avatar_url")
      .in("id", actorIds);

    if (actors) {
      actorMap = new Map(actors.map((a) => [a.id, a]));
    }
  }

  // Group like notifications by entity — show latest actor + count
  const grouped: Array<Record<string, unknown>> = [];
  const likeGroupKeys = new Set<string>();

  for (const n of notifications) {
    if (n.type === "like" && n.entity_type && n.entity_id) {
      const groupKey = `${n.entity_type}:${n.entity_id}`;
      if (likeGroupKeys.has(groupKey)) continue;
      likeGroupKeys.add(groupKey);

      // Count how many like notifications for this entity
      const sameGroup = notifications.filter(
        (other) =>
          other.type === "like" &&
          other.entity_type === n.entity_type &&
          other.entity_id === n.entity_id,
      );

      grouped.push({
        ...n,
        actor: n.actor_id ? actorMap.get(n.actor_id) ?? null : null,
        grouped_count: sameGroup.length,
      });
    } else {
      grouped.push({
        ...n,
        actor: n.actor_id ? actorMap.get(n.actor_id) ?? null : null,
      });
    }
  }

  return NextResponse.json({
    notifications: grouped,
    has_more: notifications.length === limit + 1,
  });
}
