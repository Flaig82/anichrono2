"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import PosterRow from "@/components/shared/PosterRow";
import type { PosterItem } from "@/components/shared/PosterRow";

interface DiscoverLoadMoreProps {
  searchParams: Record<string, string>;
  initialHasMore: boolean;
}

export default function DiscoverLoadMore({
  searchParams,
  initialHasMore,
}: DiscoverLoadMoreProps) {
  const [pages, setPages] = useState<PosterItem[][]>([]);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(page));
      const res = await fetch(`/api/discover?${params.toString()}`);
      if (!res.ok) return;
      const data: { results: PosterItem[]; hasMore: boolean } = await res.json();
      setPages((prev) => [...prev, data.results]);
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    } finally {
      setLoading(false);
    }
  }, [searchParams, page]);

  return (
    <>
      {pages.map((posters, i) => (
        <div key={i} className="mt-4">
          <PosterRow posters={posters} />
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-aura-border2 bg-aura-bg3 px-6 py-2.5 font-mono text-xs font-medium text-aura-muted2 transition-colors hover:bg-aura-bg4 hover:text-aura-text disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </>
  );
}
