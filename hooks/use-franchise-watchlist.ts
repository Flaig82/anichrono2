"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { useAuth } from "./use-auth";
import type { FranchiseWatchStatus } from "@/types/watchlist";

interface WatchlistStatusResponse {
  status: FranchiseWatchStatus | null;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch watchlist status");
    return r.json();
  });

export function useFranchiseWatchlist(franchiseId: string) {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<WatchlistStatusResponse>(
    user ? `/api/user/watchlist/status?franchise_id=${franchiseId}` : null,
    fetcher,
  );

  const status = data?.status ?? null;

  const addToWatchlist = useCallback(
    async (initialStatus: FranchiseWatchStatus = "plan_to_watch") => {
      // Optimistic update
      mutate({ status: initialStatus }, { revalidate: false });

      const res = await fetch("/api/user/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          franchise_id: franchiseId,
          status: initialStatus,
        }),
      });

      if (!res.ok) {
        // Revert on failure
        mutate();
      }
    },
    [franchiseId, mutate],
  );

  const updateStatus = useCallback(
    async (newStatus: FranchiseWatchStatus) => {
      mutate({ status: newStatus }, { revalidate: false });

      const res = await fetch("/api/user/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          franchise_id: franchiseId,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        mutate();
      }
    },
    [franchiseId, mutate],
  );

  const removeFromWatchlist = useCallback(async () => {
    mutate({ status: null }, { revalidate: false });

    const res = await fetch("/api/user/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remove",
        franchise_id: franchiseId,
      }),
    });

    if (!res.ok) {
      mutate();
    }
  }, [franchiseId, mutate]);

  return {
    status,
    isLoading,
    error,
    addToWatchlist,
    updateStatus,
    removeFromWatchlist,
  };
}
