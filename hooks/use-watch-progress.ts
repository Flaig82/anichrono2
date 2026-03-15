"use client";

import useSWR, { useSWRConfig } from "swr";
import { useCallback, useRef } from "react";
import { useAuth } from "./use-auth";
import { showQuestToasts } from "@/lib/quest-toast";

interface WatchData {
  episodes_watched: number;
  status: string;
}

const DEBOUNCE_MS = 500;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useWatchProgress(franchiseId: string) {
  const { user, refreshProfile } = useAuth();
  const { mutate: globalMutate } = useSWRConfig();
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { data, error, isLoading, mutate } = useSWR<Record<string, WatchData>>(
    user ? `/api/user/watch?franchise_id=${franchiseId}` : null,
    fetcher,
  );

  const watchMap = new Map<string, WatchData>(
    data ? Object.entries(data) : [],
  );

  const updateWatch = useCallback(
    (entryId: string, value: number) => {
      if (!user) return;

      const status = value > 0 ? "watching" : "watching";

      // Optimistic SWR cache update (instant UI)
      mutate(
        (prev) => ({
          ...prev,
          [entryId]: { episodes_watched: value, status },
        }),
        { revalidate: false },
      );

      // Clear any existing debounce timer for this entry
      const existing = timers.current.get(entryId);
      if (existing) clearTimeout(existing);

      // Schedule the API call
      const timer = setTimeout(async () => {
        timers.current.delete(entryId);
        const res = await fetch("/api/user/watch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entry_id: entryId,
            franchise_id: franchiseId,
            action: "set",
            value,
          }),
        });
        if (res.ok && user) {
          const data = await res.json();
          showQuestToasts(data.completedQuests);
          // Revalidate sidebar aura breakdown + profile
          globalMutate(`user-aura-${user.id}`);
          globalMutate("/api/activity/live");
          refreshProfile();
        }
      }, DEBOUNCE_MS);

      timers.current.set(entryId, timer);
    },
    [user, franchiseId, mutate],
  );

  return { watchMap, updateWatch, isLoading, error };
}
