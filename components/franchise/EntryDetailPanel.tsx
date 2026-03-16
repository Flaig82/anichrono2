"use client";

import useSWR from "swr";
import { cn } from "@/lib/utils";
import type { AniListMediaFull } from "@/lib/anilist";

const FORMAT_BADGE_COLORS: Record<string, string> = {
  MOVIE: "bg-entry-movie/20 text-entry-movie",
  OVA: "bg-entry-ova/20 text-entry-ova",
  ONA: "bg-entry-ona/20 text-entry-ona",
  SPECIAL: "bg-entry-special/20 text-entry-special",
  TV: "bg-white/10 text-white",
  TV_SHORT: "bg-white/10 text-white",
};

const FORMAT_LABELS: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  OVA: "OVA",
  ONA: "ONA",
  SPECIAL: "Special",
};

const SEASON_LABELS: Record<string, string> = {
  WINTER: "Winter",
  SPRING: "Spring",
  SUMMER: "Summer",
  FALL: "Fall",
};

function formatMembers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M members`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K members`;
  return `${count} members`;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EntryDetailPanelProps {
  anilistId: number;
}

export default function EntryDetailPanel({ anilistId }: EntryDetailPanelProps) {
  const { data, isLoading, error } = useSWR<AniListMediaFull>(
    `/api/anilist/${anilistId}`,
    fetcher,
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 border-t border-aura-border px-3 pb-3 pt-3">
        <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border-t border-aura-border px-3 pb-3 pt-3">
        <p className="font-body text-[11px] text-aura-muted">
          No details available
        </p>
      </div>
    );
  }

  const formatLabel = FORMAT_LABELS[data.format ?? ""] ?? data.format;
  const badgeColor = FORMAT_BADGE_COLORS[data.format ?? ""] ?? "bg-white/10 text-white";
  const seasonLabel = data.season ? SEASON_LABELS[data.season] ?? data.season : null;
  const seasonYear = seasonLabel && data.seasonYear
    ? `${seasonLabel} ${data.seasonYear}`
    : data.seasonYear
      ? String(data.seasonYear)
      : null;
  const episodeLabel = data.episodes
    ? `${data.episodes} ep${data.episodes !== 1 ? "s" : ""}`
    : null;
  const scoreLabel = data.averageScore != null
    ? `★ ${(data.averageScore / 10).toFixed(1)}`
    : null;

  // Strip HTML tags and basic cleanup for description
  const description = data.description
    ?.replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <div className="flex flex-col gap-2 border-t border-aura-border px-3 pb-3 pt-3">
      {/* Synopsis */}
      {description && (
        <p className="line-clamp-3 font-body text-[11px] leading-relaxed text-aura-muted2">
          {description}
        </p>
      )}

      {/* Metadata chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {formatLabel && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase",
              badgeColor,
            )}
          >
            {formatLabel}
          </span>
        )}
        {seasonYear && (
          <span className="font-body text-[10px] text-aura-muted2">
            {seasonYear}
          </span>
        )}
        {episodeLabel && (
          <span className="font-body text-[10px] text-aura-muted2">
            · {episodeLabel}
          </span>
        )}
        {scoreLabel && (
          <span className="font-body text-[10px] text-aura-orange">
            · {scoreLabel}
          </span>
        )}
      </div>

      {/* Studio + members */}
      {(data.studio || data.memberCount) && (
        <div className="flex items-center gap-1.5">
          {data.studio && (
            <span className="font-body text-[10px] text-aura-muted">
              {data.studio}
            </span>
          )}
          {data.studio && data.memberCount && (
            <span className="text-aura-muted">·</span>
          )}
          {data.memberCount != null && (
            <span className="font-body text-[10px] text-aura-muted">
              {formatMembers(data.memberCount)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
