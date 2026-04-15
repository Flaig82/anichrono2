"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ThumbsUp,
  Users,
  Compass,
} from "lucide-react";
import RouteBadge from "@/components/franchise/RouteBadge";
import { useAuth } from "@/hooks/use-auth";
import {
  ROUTE_TYPES,
  ROUTE_TYPE_SHORT,
  type RouteData,
  type RouteType,
} from "@/types/route";
import { cn } from "@/lib/utils";

type SortMode = "top" | "newest" | "followers" | "canon";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "top", label: "Top voted" },
  { value: "newest", label: "Newest" },
  { value: "followers", label: "Most followed" },
  { value: "canon", label: "Canon first" },
];

/**
 * Full chronicles browser for a franchise — linked from the compact
 * RouteList preview on the franchise page via "View all N chronicles →".
 *
 * Features:
 *   - Route-type filter tabs (All, Newcomer, Completionist, Chronological, Manga Reader)
 *   - Sort (Top voted, Newest, Most followed, Canon first)
 *   - Richer cards with summary + entry count + stats
 *   - "Create a Chronicle" CTA for Wanderer+ users
 */
export default function FranchiseChroniclesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user, profile } = useAuth();

  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [franchise, setFranchise] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<RouteType | "all">("all");
  const [sort, setSort] = useState<SortMode>("canon");

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    // Fetch franchise first to get the id
    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();
    const { data: f } = await supabase
      .from("franchise")
      .select("id, title")
      .eq("slug", slug)
      .single();

    if (!f) {
      setIsLoading(false);
      return;
    }
    setFranchise(f);

    const rRes = await fetch(`/api/franchise/${f.id}/routes`);
    if (rRes.ok) {
      const data = await rRes.json();
      setRoutes(data);
    }
    setIsLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    let result =
      typeFilter === "all"
        ? routes
        : routes.filter((r) => r.route_type === typeFilter);

    switch (sort) {
      case "top":
        result = [...result].sort((a, b) => b.vote_count - a.vote_count);
        break;
      case "newest":
        result = [...result].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        );
        break;
      case "followers":
        result = [...result].sort(
          (a, b) => b.follower_count - a.follower_count,
        );
        break;
      case "canon":
        result = [...result].sort((a, b) => {
          if (a.is_canon !== b.is_canon) return a.is_canon ? -1 : 1;
          return b.vote_count - a.vote_count;
        });
        break;
    }
    return result;
  }, [routes, typeFilter, sort]);

  // Count per type for tab badges
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: routes.length };
    for (const r of routes) {
      counts[r.route_type] = (counts[r.route_type] ?? 0) + 1;
    }
    return counts;
  }, [routes]);

  const canCreate = !!user && (profile?.total_aura ?? 0) >= 500;

  if (isLoading) {
    return (
      <main className="px-4 pb-16 pt-10 md:px-8 lg:px-[120px]">
        <div className="flex flex-col gap-4">
          <div className="h-5 w-48 animate-pulse rounded bg-aura-bg3" />
          <div className="h-8 w-96 animate-pulse rounded bg-aura-bg3" />
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-aura-bg3"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!franchise) {
    return (
      <main className="flex items-center justify-center px-4 py-20">
        <p className="font-body text-[14px] text-aura-muted2">
          Franchise not found.
        </p>
      </main>
    );
  }

  return (
    <main className="px-4 pb-16 pt-10 md:px-8 lg:px-[120px]">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link
            href={`/franchise/${slug}`}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-aura-muted transition-colors hover:text-white"
          >
            <ArrowLeft size={12} />
            Back to {franchise.title}
          </Link>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-body text-[28px] font-bold leading-none tracking-[-0.56px] text-white md:text-[36px]">
                Chronicles
              </h1>
              <p className="mt-1 font-body text-[14px] text-aura-muted2">
                {routes.length} community-curated watch route
                {routes.length !== 1 ? "s" : ""} for {franchise.title}
              </p>
            </div>

            {canCreate && (
              <Link
                href={`/franchise/${slug}/routes/create`}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-aura-orange px-4 py-2.5 font-body text-[13px] font-bold text-white transition-colors hover:bg-aura-orange-hover"
              >
                <Compass size={14} />
                Create a Chronicle
              </Link>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTypeFilter("all")}
              className={cn(
                "rounded-full px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors",
                typeFilter === "all"
                  ? "bg-aura-orange text-white"
                  : "bg-white/[0.05] text-aura-muted2 hover:bg-white/[0.1] hover:text-white",
              )}
            >
              All {typeCounts.all ?? 0}
            </button>
            {ROUTE_TYPES.map((type) => {
              const count = typeCounts[type] ?? 0;
              if (count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "rounded-full px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors",
                    typeFilter === type
                      ? "bg-aura-orange text-white"
                      : "bg-white/[0.05] text-aura-muted2 hover:bg-white/[0.1] hover:text-white",
                  )}
                >
                  {ROUTE_TYPE_SHORT[type]} {count}
                </button>
              );
            })}

            {/* Sort */}
            <div className="ml-auto flex items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-aura-muted">
                Sort:
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="rounded-lg border border-aura-border bg-black/40 px-2 py-1 font-mono text-[10px] text-white outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Route cards */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-aura-border bg-aura-bg2 py-16">
            <Compass size={24} className="text-aura-muted" />
            <p className="font-body text-[14px] font-bold text-white">
              No chronicles match this filter
            </p>
            <p className="font-body text-[12px] text-aura-muted2">
              Try a different route type or clear the filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((route) => (
              <Link
                key={route.id}
                href={`/route/${route.id}`}
                className="group flex flex-col gap-3 rounded-xl border border-aura-border bg-aura-bg2 p-5 transition-colors hover:bg-aura-bg3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <RouteBadge
                        routeType={route.route_type}
                        isCanon={route.is_canon}
                      />
                      <span className="font-mono text-[10px] text-aura-muted">
                        {route.entry_ids.length} entries
                      </span>
                    </div>
                    <h3 className="line-clamp-2 font-body text-[15px] font-bold leading-snug text-white">
                      {route.title}
                    </h3>
                  </div>
                  <ArrowRight
                    size={14}
                    className="mt-1 shrink-0 text-aura-muted transition-transform group-hover:translate-x-0.5 group-hover:text-aura-orange"
                  />
                </div>

                {route.summary && (
                  <p className="line-clamp-2 font-body text-[12px] leading-relaxed text-aura-muted2">
                    {route.summary}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {route.author?.avatar_url ? (
                      <Image
                        src={route.author.avatar_url}
                        alt={route.author.display_name}
                        width={18}
                        height={18}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-[18px] w-[18px] rounded-full bg-aura-bg3" />
                    )}
                    <span className="font-mono text-[10px] text-aura-muted2">
                      {route.author?.handle
                        ? `@${route.author.handle}`
                        : route.author?.display_name ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[10px] text-aura-muted">
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={11} />
                      {route.vote_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {route.follower_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
