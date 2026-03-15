import useSWR from "swr";
import type { LiveActivityItem, ContentUpdateItem } from "@/types/activity";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** Live user actions — polls every 30s */
export function useLiveActivity() {
  return useSWR<LiveActivityItem[]>("/api/activity/live", fetcher, {
    refreshInterval: 15_000,
  });
}

/** Content updates (applied proposals + new franchises) — polls every 2min */
export function useContentUpdates() {
  return useSWR<ContentUpdateItem[]>("/api/activity/updates", fetcher, {
    refreshInterval: 120_000,
  });
}
