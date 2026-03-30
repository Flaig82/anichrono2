import useSWR from "swr";

interface NotificationItem {
  id: string;
  type: string;
  actor_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
  actor?: {
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
  } | null;
  /** Grouped count for like notifications (e.g. "X and 4 others") */
  grouped_count?: number;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  has_more: boolean;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to load");
    return r.json();
  });

export function useNotifications(enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    enabled ? "/api/notifications" : null,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true },
  );

  return {
    notifications: data?.notifications ?? [],
    hasMore: data?.has_more ?? false,
    isLoading,
    error,
    mutate,
  };
}

export function useUnreadCount(enabled: boolean) {
  const { data, mutate } = useSWR<{ count: number }>(
    enabled ? "/api/notifications/unread-count" : null,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: true },
  );

  return {
    unreadCount: data?.count ?? 0,
    mutateCount: mutate,
  };
}

export async function markNotificationsRead(notificationId?: string) {
  const body: Record<string, unknown> = notificationId
    ? { notification_id: notificationId }
    : { all: true };

  await fetch("/api/notifications/read", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type { NotificationItem };
