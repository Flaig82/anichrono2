import useSWR from "swr";
import type { WatchlistItem, WatchlistStatusFilter, WatchlistSort } from "@/types/watchlist";

interface WatchlistResponse {
  items: WatchlistItem[];
  total: number;
  page: number;
  hasMore: boolean;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to load watchlist");
    return r.json();
  });

export function useWatchlist(
  handle: string | null,
  status: WatchlistStatusFilter = "all",
  sort: WatchlistSort = "recent",
  page: number = 1,
) {
  const params = new URLSearchParams({ status, sort, page: String(page) });
  const { data, error, isLoading } = useSWR<WatchlistResponse>(
    handle ? `/api/user/${handle}/watchlist?${params}` : null,
    fetcher,
  );

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    hasMore: data?.hasMore ?? false,
    isLoading,
    error,
  };
}
