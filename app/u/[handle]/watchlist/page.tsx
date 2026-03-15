"use client";

import { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RightSidebar from "@/components/layout/RightSidebar";
import HomeFeed from "@/components/layout/HomeFeed";
import WatchlistFilters from "@/components/profile/WatchlistFilters";
import WatchlistGrid from "@/components/profile/WatchlistGrid";
import WatchlistList from "@/components/profile/WatchlistList";
import { useWatchlist } from "@/hooks/use-watchlist";
import { usePublicProfile } from "@/hooks/use-public-profile";
import type { WatchlistStatusFilter, WatchlistSort, WatchlistView } from "@/types/watchlist";

function WatchlistContent() {
  const params = useParams();
  const handle = params.handle as string;
  const { profile } = usePublicProfile(handle);

  const [status, setStatus] = useState<WatchlistStatusFilter>("all");
  const [sort, setSort] = useState<WatchlistSort>("recent");
  const [view, setView] = useState<WatchlistView>("grid");
  const [page, setPage] = useState(1);

  const { items, total, hasMore, isLoading } = useWatchlist(
    handle,
    status,
    sort,
    page,
  );

  return (
    <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
      <div className="flex flex-1 flex-col gap-6">
        {/* Back link + title */}
        <div className="flex flex-col gap-3">
          <Link
            href={`/u/${handle}`}
            className="flex items-center gap-2 font-body text-[13px] text-aura-muted2 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to profile
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="font-brand text-xl font-bold tracking-tight text-white">
              {profile?.display_name ?? handle}&apos;s Watchlist
            </h1>
            <span className="font-mono text-[11px] text-aura-muted">
              {total} {total === 1 ? "franchise" : "franchises"}
            </span>
          </div>
        </div>

        {/* Filters */}
        <WatchlistFilters
          status={status}
          sort={sort}
          view={view}
          onStatusChange={(s) => {
            setStatus(s);
            setPage(1);
          }}
          onSortChange={(s) => {
            setSort(s);
            setPage(1);
          }}
          onViewChange={setView}
        />

        {/* Content */}
        {view === "grid" ? (
          <WatchlistGrid items={items} isLoading={isLoading} />
        ) : (
          <WatchlistList items={items} isLoading={isLoading} />
        )}

        {/* Pagination */}
        {(hasMore || page > 1) && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg bg-aura-bg3 px-4 py-2 font-body text-[13px] font-bold text-white transition-colors hover:bg-aura-bg4 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono text-[11px] text-aura-muted">
              Page {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="rounded-lg bg-aura-bg3 px-4 py-2 font-body text-[13px] font-bold text-white transition-colors hover:bg-aura-bg4 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Sticky sidebar — hidden on mobile */}
      <div className="sticky top-[68px] hidden h-fit lg:block">
        <RightSidebar>
          <HomeFeed />
        </RightSidebar>
      </div>
    </main>
  );
}

export default function WatchlistPage() {
  return (
    <Suspense
      fallback={
        <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
          <div className="flex flex-1 flex-col gap-6">
            <div className="h-8 w-48 animate-pulse rounded bg-aura-bg3" />
            <div className="h-10 animate-pulse rounded-lg bg-aura-bg3" />
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] animate-pulse rounded-lg bg-aura-bg3"
                />
              ))}
            </div>
          </div>
        </main>
      }
    >
      <WatchlistContent />
    </Suspense>
  );
}
