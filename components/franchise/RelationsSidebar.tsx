"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import useSWR from "swr";
import { Check, CircleDot, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AniListRelation, AniListSearchResult } from "@/lib/anilist";
import { formatToEntryType } from "@/lib/anilist";

const TYPE_FILTERS = [
  { label: "All", value: "all" },
  { label: "Movie", value: "MOVIE" },
  { label: "OVA", value: "OVA" },
  { label: "ONA", value: "ONA" },
  { label: "Special", value: "SPECIAL" },
] as const;

const RELATION_LABELS: Record<string, string> = {
  SEQUEL: "Sequel",
  PREQUEL: "Prequel",
  SIDE_STORY: "Side Story",
  PARENT: "Parent",
  ALTERNATIVE: "Alternative",
  SPIN_OFF: "Spin Off",
};

const FORMAT_LABELS: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  OVA: "OVA",
  ONA: "ONA",
  SPECIAL: "Special",
};

const FORMAT_BADGE_COLORS: Record<string, string> = {
  MOVIE: "bg-entry-movie/20 text-entry-movie",
  OVA: "bg-entry-ova/20 text-entry-ova",
  ONA: "bg-entry-ona/20 text-entry-ona",
  SPECIAL: "bg-entry-special/20 text-entry-special",
  TV: "bg-white/10 text-white",
  TV_SHORT: "bg-white/10 text-white",
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PlacementStatus = "available" | "saved" | "unsaved";

interface RelationsSidebarProps {
  franchiseId: string;
  savedAnilistIds: Set<number>;
  unsavedAnilistIds: Set<number>;
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function RelationsSidebar({
  franchiseId,
  savedAnilistIds,
  unsavedAnilistIds,
}: RelationsSidebarProps) {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isSearching = debouncedQuery.length >= 2;

  // Relations fetch
  const { data: relationsData, isLoading: relationsLoading } = useSWR<{
    relations: AniListRelation[];
  }>(`/api/franchise/${franchiseId}/relations`, fetcher);

  // Search fetch
  const { data: searchData, isLoading: searchLoading } = useSWR<{
    results: AniListSearchResult[];
  }>(
    isSearching ? `/api/franchise/search-anilist?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher,
  );

  const relations = relationsData?.relations ?? [];
  const searchResults = searchData?.results ?? [];

  const filtered =
    filter === "all"
      ? relations
      : relations.filter((r) => r.format === filter);

  function getStatus(anilistId: number): PlacementStatus {
    if (savedAnilistIds.has(anilistId)) return "saved";
    if (unsavedAnilistIds.has(anilistId)) return "unsaved";
    return "available";
  }

  return (
    <aside className="flex w-[330px] shrink-0 flex-col gap-4 rounded-xl border border-aura-border bg-card p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-aura-orange" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          Relations
        </span>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-aura-muted"
        />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search AniList..."
          className="w-full rounded-lg border border-aura-border bg-white/[0.03] py-2 pl-9 pr-8 font-body text-[12px] text-white outline-none placeholder:text-aura-muted transition-colors focus:border-aura-orange/40"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-aura-muted transition-colors hover:text-white"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Search results mode */}
      {isSearching ? (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
            Search Results
          </span>
          {searchLoading ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 size={16} className="animate-spin text-aura-muted" />
              <span className="font-body text-[11px] text-aura-muted">
                Searching...
              </span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <span className="font-body text-[11px] text-aura-muted">
                No results for &ldquo;{debouncedQuery}&rdquo;
              </span>
            </div>
          ) : (
            searchResults.map((result) => (
              <SearchResultCard
                key={result.id}
                result={result}
                status={getStatus(result.id)}
              />
            ))
          )}
        </div>
      ) : (
        <>
          {/* Filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 font-mono text-[10px] font-medium transition-colors",
                  filter === f.value
                    ? "bg-aura-orange/20 text-aura-orange"
                    : "bg-white/5 text-aura-muted2 hover:bg-white/10 hover:text-white",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Relations list */}
          {relationsLoading ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Loader2 size={20} className="animate-spin text-aura-muted" />
              <span className="font-body text-[12px] text-aura-muted">
                Loading relations...
              </span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <span className="font-body text-[12px] text-aura-muted">
                {relations.length === 0
                  ? "No relations found"
                  : "No matches for this filter"}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((relation) => (
                <RelationCard
                  key={relation.id}
                  relation={relation}
                  status={getStatus(relation.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  );
}

// --- Shared drag helper ---

function buildDragData(item: {
  id: number;
  titleEnglish: string | null;
  titleRomaji: string;
  format: string | null;
  coverImageUrl: string | null;
  episodes: number | null;
}) {
  return JSON.stringify({
    anilist_id: item.id,
    title: item.titleEnglish ?? item.titleRomaji,
    entry_type: formatToEntryType(item.format),
    cover_image_url: item.coverImageUrl,
    episodes: item.episodes,
  });
}

// --- Relation Card ---

function RelationCard({
  relation,
  status,
}: {
  relation: AniListRelation;
  status: PlacementStatus;
}) {
  const title = relation.titleEnglish ?? relation.titleRomaji;
  const formatLabel = FORMAT_LABELS[relation.format ?? ""] ?? relation.format;
  const relationLabel =
    RELATION_LABELS[relation.relationType] ?? relation.relationType;
  const isDraggable = status === "available";

  function handleDragStart(e: React.DragEvent) {
    if (!isDraggable) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("application/aura-relation", buildDragData(relation));
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <DraggableCard
      draggable={isDraggable}
      onDragStart={handleDragStart}
      status={status}
      coverImageUrl={relation.coverImageUrl}
      title={title}
      format={formatLabel}
      formatRaw={relation.format}
      subtitle={relationLabel}
    />
  );
}

// --- Search Result Card ---

function SearchResultCard({
  result,
  status,
}: {
  result: AniListSearchResult;
  status: PlacementStatus;
}) {
  const title = result.titleEnglish ?? result.titleRomaji;
  const formatLabel = FORMAT_LABELS[result.format ?? ""] ?? result.format;
  const isDraggable = status === "available";

  function handleDragStart(e: React.DragEvent) {
    if (!isDraggable) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("application/aura-relation", buildDragData(result));
    e.dataTransfer.effectAllowed = "copy";
  }

  const epLabel = result.episodes
    ? `${result.episodes} ep${result.episodes !== 1 ? "s" : ""}`
    : null;

  return (
    <DraggableCard
      draggable={isDraggable}
      onDragStart={handleDragStart}
      status={status}
      coverImageUrl={result.coverImageUrl}
      title={title}
      format={formatLabel}
      formatRaw={result.format}
      subtitle={epLabel}
    />
  );
}

// --- Shared Card Component ---

function DraggableCard({
  draggable,
  onDragStart,
  status,
  coverImageUrl,
  title,
  format,
  formatRaw,
  subtitle,
}: {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  status: PlacementStatus;
  coverImageUrl: string | null;
  title: string;
  format: string | null;
  formatRaw: string | null;
  subtitle: string | null;
}) {
  const badgeColor =
    FORMAT_BADGE_COLORS[formatRaw ?? ""] ?? "bg-white/10 text-white";

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 transition-colors",
        status === "saved" && "cursor-default border-aura-border opacity-40",
        status === "unsaved" &&
          "cursor-default border-aura-orange/30 bg-aura-orange/[0.04]",
        status === "available" &&
          "cursor-grab border-aura-border hover:border-aura-border2 hover:bg-white/[0.02] active:cursor-grabbing",
      )}
    >
      {/* Cover thumbnail */}
      <div className="relative h-[56px] w-[40px] shrink-0 overflow-hidden rounded bg-aura-bg3">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="pointer-events-none object-cover"
            sizes="40px"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-aura-muted/20 to-aura-bg3" />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <p className="truncate font-body text-[12px] font-bold text-white">
          {title}
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase",
              badgeColor,
            )}
          >
            {format}
          </span>
          {subtitle && (
            <span className="font-body text-[10px] text-aura-muted2">
              {subtitle}
            </span>
          )}
        </div>
        {status === "available" && (
          <span className="font-body text-[10px] text-aura-muted">
            drag to add
          </span>
        )}
        {status === "unsaved" && (
          <span className="font-body text-[10px] text-aura-orange">
            added — unsaved
          </span>
        )}
      </div>

      {/* Status indicator */}
      {status === "saved" && (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
          <Check size={12} className="text-emerald-400" />
        </div>
      )}
      {status === "unsaved" && (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-aura-orange/20">
          <CircleDot size={12} className="text-aura-orange" />
        </div>
      )}
    </div>
  );
}
