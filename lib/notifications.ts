import { createServiceClient } from "@/lib/supabase-service";
import type { NotificationType } from "@/lib/validations/notification";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  message: string;
}

/**
 * Create a notification using the service client (bypasses RLS).
 * Guards against self-notification and duplicate like notifications.
 */
export async function createNotification({
  userId,
  type,
  actorId,
  entityType,
  entityId,
  message,
}: CreateNotificationParams): Promise<void> {
  // Never notify yourself
  if (actorId && actorId === userId) return;

  const supabase = createServiceClient();

  // For like notifications, deduplicate: don't send another if one already
  // exists for the same entity within the last hour
  if (type === "like" && entityType && entityId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("notification")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "like")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .gte("created_at", oneHourAgo)
      .limit(1);

    if (existing && existing.length > 0) return;
  }

  await supabase.from("notification").insert({
    user_id: userId,
    type,
    actor_id: actorId ?? null,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    message,
  });
}
