"use client";

import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { Users, ThumbsUp, ArrowRight, ChevronRight, AlertTriangle, Compass } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import RouteBadge from "./RouteBadge";
import SectionLabel from "@/components/shared/SectionLabel";
import type { RouteData } from "@/types/route";

interface RouteListProps {
  franchiseId: string;
  franchiseSlug: string;
}

/** Max routes shown inline on the franchise page before "View all" kicks in */
const MAX_PREVIEW = 3;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Compact inline preview of community Chronicles on the franchise page.
 *
 * Design rules (PR B — scaling for 20+ chronicles):
 *   - Canon routes first, then top-voted — always
 *   - Max 3 visible rows (stacked, not a card grid)
 *   - "View all N chronicles →" footer link to the dedicated browser page
 *   - Empty state renders nothing (master order is the hero)
 *   - Rows are dense: badge + title + meta on one line. No summary (that
 *     lives on the detail page and the full browser).
 */
export default function RouteList({
  franchiseId,
  franchiseSlug,
}: RouteListProps) {
  const { user, profile } = useAuth();
  const { data, error, isLoading } = useSWR<RouteData[]>(
    `/api/franchise/${franchiseId}/routes`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const canCreate = !!user && (profile?.total_aura ?? 0) >= 500;

  if (isLoading) return null;

  // Empty state — show CTA to create the first chronicle
  if (error || !data || data.length === 0) {
    return (
      <section className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-aura-border bg-aura-bg2 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aura-orange/10">
          <Compass size={24} className="text-aura-orange" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-body text-[16px] font-bold text-white">
            No chronicles yet
          </h3>
          <p className="max-w-[360px] font-body text-[13px] leading-relaxed text-aura-muted2">
            Be the first to create a curated watch route for this franchise.
            Help newcomers find the best way to experience the series.
          </p>
        </div>
        {canCreate ? (
          <Link
            href={`/franchise/${franchiseSlug}/routes/create`}
            className="flex items-center gap-1.5 rounded-lg bg-aura-orange px-5 py-2.5 font-body text-[14px] font-bold text-white transition-colors hover:bg-aura-orange-hover"
          >
            <Compass size={16} />
            Create the first Chronicle
          </Link>
        ) : user ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-aura-muted">
            Reach Wanderer era (500 Aura) to create chronicles
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="flex items-center gap-1.5 rounded-lg bg-aura-orange px-4 py-2 font-body text-[13px] font-bold text-white transition-colors hover:bg-aura-orange-hover"
            >
              Join & create
            </Link>
            <Link
              href="/login"
              className="font-body text-[12px] font-semibold text-aura-muted2 transition-colors hover:text-white"
            >
              Sign in
            </Link>
          </div>
        )}
      </section>
    );
  }

  const total = data.length;
  const preview = data.slice(0, MAX_PREVIEW);
  const hasMore = total > MAX_PREVIEW;

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <SectionLabel>Chronicles</SectionLabel>
        <Link
          href={`/franchise/${franchiseSlug}/chronicles`}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-aura-muted transition-colors hover:text-white"
        >
          {total} chronicle{total !== 1 ? "s" : ""}
          <ChevronRight size={10} />
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        {preview.map((route) => (
          <RouteRow key={route.id} route={route} />
        ))}
      </div>

      {hasMore && (
        <Link
          href={`/franchise/${franchiseSlug}/chronicles`}
          className="group flex items-center justify-center gap-1.5 rounded-lg border border-aura-border bg-aura-bg2 px-4 py-2.5 font-body text-[13px] font-bold text-aura-muted2 transition-colors hover:bg-aura-bg3 hover:text-white"
        >
          View all {total} chronicles
          <ArrowRight
            size={13}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </section>
  );
}

/**
 * Single dense row inside the compact preview. One line per chronicle:
 * [badge] [title] ... [author] [votes] [followers] [→]
 *
 * Stays minimal to preserve the "master order is the hero" hierarchy.
 */
function RouteRow({ route }: { route: RouteData }) {
  return (
    <Link
      href={`/route/${route.id}`}
      className="group flex items-center gap-3 rounded-lg border border-transparent bg-aura-bg2 px-4 py-3 transition-colors hover:border-aura-border hover:bg-aura-bg3"
    >
      {/* Badge */}
      <RouteBadge routeType={route.route_type} isCanon={route.is_canon} />

      {/* Title */}
      <span className="min-w-0 flex-1 truncate font-body text-[13px] font-bold text-white">
        {route.title}
      </span>

      {/* Author */}
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        {route.author?.avatar_url ? (
          <Image
            src={route.author.avatar_url}
            alt={route.author.display_name}
            width={16}
            height={16}
            className="rounded-full"
          />
        ) : (
          <div className="h-4 w-4 rounded-full bg-aura-bg3" />
        )}
        <span className="font-mono text-[10px] text-aura-muted2">
          {route.author?.handle
            ? `@${route.author.handle}`
            : route.author?.display_name ?? "—"}
        </span>
      </div>

      {/* Stale indicator */}
      {route.staleness?.isStale && (
        <span
          className="hidden shrink-0 items-center gap-0.5 font-mono text-[9px] text-amber-400 sm:flex"
          title={route.staleness.label}
        >
          <AlertTriangle size={10} />
          {route.staleness.newInMaster > 0
            ? `${route.staleness.newInMaster} behind`
            : "stale"}
        </span>
      )}

      {/* Stats */}
      <div className="flex shrink-0 items-center gap-2.5 font-mono text-[10px] text-aura-muted">
        <span className="flex items-center gap-0.5">
          <ThumbsUp size={10} />
          {route.vote_count}
        </span>
        <span className="flex items-center gap-0.5">
          <Users size={10} />
          {route.follower_count}
        </span>
      </div>

      {/* Arrow */}
      <ArrowRight
        size={12}
        className="shrink-0 text-aura-muted transition-transform group-hover:translate-x-0.5 group-hover:text-aura-orange"
      />
    </Link>
  );
}
