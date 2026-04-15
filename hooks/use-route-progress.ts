"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { useAuth } from "./use-auth";

interface RouteProgressData {
  id?: string;
  route_id?: string;
  user_id?: string;
  current_position?: number;
  entries_completed?: string[];
  started_at?: string;
  completed_at?: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useRouteProgress(routeId: string) {
  const { user } = useAuth();

  const { data, mutate } = useSWR<RouteProgressData>(
    user ? `/api/route/${routeId}/progress` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const completedSet = new Set<string>(data?.entries_completed ?? []);

  const toggleEntry = useCallback(
    async (entryId: string) => {
      if (!user) return;

      // Optimistic update
      const nextSet = new Set(completedSet);
      if (nextSet.has(entryId)) {
        nextSet.delete(entryId);
      } else {
        nextSet.add(entryId);
      }
      const nextArr = Array.from(nextSet);
      mutate(
        (prev) => ({
          ...prev,
          entries_completed: nextArr,
          current_position: nextArr.length,
        }),
        { revalidate: false },
      );

      // Persist
      const res = await fetch(`/api/route/${routeId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_entry", entry_id: entryId }),
      });

      if (res.ok) {
        const json = await res.json();
        mutate(
          (prev) => ({
            ...prev,
            entries_completed: json.entries_completed,
            current_position: json.current_position,
            completed_at: json.completed ? new Date().toISOString() : null,
          }),
          { revalidate: false },
        );
      } else {
        // Rollback on failure
        mutate();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, routeId, mutate, data?.entries_completed],
  );

  return {
    completedSet,
    currentPosition: data?.current_position ?? 0,
    completedAt: data?.completed_at ?? null,
    toggleEntry,
  };
}
