"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Reorder } from "framer-motion";
import { ArrowLeft, X, Send, Loader2, Info, Compass } from "lucide-react";
import RouteEntryRow from "./RouteEntryRow";
import SectionLabel from "@/components/shared/SectionLabel";
import {
  ROUTE_TYPES,
  ROUTE_TYPE_LABELS,
  ROUTE_TYPE_DESCRIPTIONS,
  type RouteType,
} from "@/types/route";
import type { EntryData } from "@/types/proposal";
import { cn } from "@/lib/utils";

interface RouteCreatorProps {
  franchiseId: string;
  franchiseSlug: string;
  franchiseTitle: string;
  entries: EntryData[];
}

const SUMMARY_MAX = 300;
const TITLE_MAX = 100;
const MIN_ENTRIES = 2;

interface EntryGroup {
  parentSeries: string;
  coverImageUrl: string | null;
  entries: EntryData[];
}

const TYPE_LABELS: Record<string, string> = {
  episodes: "TV Series",
  movie: "Movie",
  ova: "OVA",
  ona: "ONA",
  special: "Special",
};

function groupByParentSeries(entries: EntryData[]): EntryGroup[] {
  const groups: EntryGroup[] = [];
  let current: EntryGroup | null = null;

  for (const entry of entries) {
    const series = entry.parent_series ?? "Unknown";
    if (!current || current.parentSeries !== series) {
      current = {
        parentSeries: series,
        coverImageUrl: entry.cover_image_url,
        entries: [],
      };
      groups.push(current);
    }
    current.entries.push(entry);
    if (entry.cover_image_url && !current.coverImageUrl) {
      current.coverImageUrl = entry.cover_image_url;
    }
  }
  return groups;
}

/**
 * Route creator — two-column layout.
 *
 * LEFT (sticky): Your route — selected entries in a Framer Motion Reorder
 * list for drag-to-reorder. Stays in place as the user scrolls the master
 * list on the right, so adding/removing entries doesn't cause vertical jumps.
 *
 * RIGHT (scrollable): All master entries grouped by parent_series with cover
 * art, matching the OrderEditor's visual patterns. Click checkboxes to
 * include/exclude entries from the route.
 *
 * Settings (title, type, summary) and toolbar live above both columns.
 */
export default function RouteCreator({
  franchiseId,
  franchiseSlug,
  franchiseTitle,
  entries,
}: RouteCreatorProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [routeType, setRouteType] = useState<RouteType>("newcomer");
  const [summary, setSummary] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const entryById = useMemo(() => {
    const map = new Map<string, EntryData>();
    for (const e of entries) map.set(e.id, e);
    return map;
  }, [entries]);

  const orderedSelection = useMemo(
    () =>
      selectedIds
        .map((id) => entryById.get(id))
        .filter((e): e is EntryData => !!e),
    [selectedIds, entryById],
  );

  const groups = useMemo(() => groupByParentSeries(entries), [entries]);

  const toggleEntry = useCallback((entryId: string) => {
    setSelectedIds((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId],
    );
  }, []);

  const handleReorder = useCallback((newOrder: string[]) => {
    setSelectedIds(newOrder);
  }, []);

  const canSubmit =
    title.trim().length >= 3 &&
    title.trim().length <= TITLE_MAX &&
    selectedIds.length >= MIN_ENTRIES &&
    !submitting;

  async function handleSaveDraft() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/route/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchise_id: franchiseId,
          title: title.trim(),
          route_type: routeType,
          entry_ids: selectedIds,
          summary: summary.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save draft.");
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      if (data.id) {
        router.push(`/route/${data.id}`);
      } else {
        router.push(`/franchise/${franchiseSlug}`);
      }
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href={`/franchise/${franchiseSlug}`}
        className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-aura-muted transition-colors hover:text-white"
      >
        <ArrowLeft size={12} />
        Back to {franchiseTitle}
      </Link>

      {/* Toolbar — matches OrderEditorToolbar style */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-aura-orange/20 bg-aura-orange/5 p-3">
        <div className="flex items-center gap-2">
          <span className="font-body text-[11px] font-bold uppercase tracking-[0.15em] text-aura-orange">
            Creating Chronicle
          </span>
          <span className="font-body text-[11px] text-aura-muted">
            {selectedIds.length} entries selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/franchise/${franchiseSlug}`}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 font-body text-[12px] font-bold text-aura-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
            Cancel
          </Link>

          <button
            onClick={handleSaveDraft}
            disabled={!canSubmit}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-1.5 font-body text-[12px] font-bold transition-colors",
              canSubmit
                ? "bg-aura-orange text-white hover:bg-aura-orange-hover"
                : "cursor-not-allowed bg-white/5 text-aura-muted",
            )}
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {submitting ? "Saving..." : "Save Draft"}
          </button>
        </div>
      </div>

      {error && (
        <p className="font-body text-[13px] text-red-400">{error}</p>
      )}

      {/* Settings panel */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-aura-border bg-aura-bg2 p-5 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              if (e.target.value.length <= TITLE_MAX) setTitle(e.target.value);
            }}
            placeholder="e.g. First-time viewer essentials"
            className="rounded-lg border border-aura-border bg-black/40 px-3 py-2 font-body text-[13px] text-white outline-none placeholder:text-aura-muted focus:border-aura-orange/40"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
            Route Type
          </label>
          <select
            value={routeType}
            onChange={(e) => setRouteType(e.target.value as RouteType)}
            className="rounded-lg border border-aura-border bg-black/40 px-3 py-2 font-body text-[13px] text-white outline-none cursor-pointer"
          >
            {ROUTE_TYPES.map((type) => (
              <option key={type} value={type}>
                {ROUTE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <p className="font-body text-[10px] text-aura-muted">
            {ROUTE_TYPE_DESCRIPTIONS[routeType]}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
            Summary (optional)
          </label>
          <textarea
            value={summary}
            onChange={(e) => {
              if (e.target.value.length <= SUMMARY_MAX) setSummary(e.target.value);
            }}
            rows={2}
            placeholder="Why this route?"
            className="rounded-lg border border-aura-border bg-black/40 px-3 py-2 font-body text-[12px] text-white outline-none placeholder:text-aura-muted focus:border-aura-orange/40"
          />
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-start gap-2 rounded-lg border border-aura-border bg-aura-bg2 p-3">
        <Info size={14} className="mt-0.5 shrink-0 text-aura-muted2" />
        <p className="font-body text-[11px] leading-snug text-aura-muted2">
          Saves as a <span className="text-white">private draft</span>.
          Review and submit for community review from the draft page.
          Approved chronicles earn{" "}
          <span className="text-aura-archivist">+50 Archivist</span>.
        </p>
      </div>

      {/* ================================================================
       * Two-column layout: Route (left, sticky) + Master (right, scrollable)
       * Adding/removing entries from the master list on the right builds
       * the route on the left without vertical jumping.
       * ================================================================ */}
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-8">
        {/* LEFT COLUMN — Your route (sticky on desktop) */}
        <div className="w-full lg:sticky lg:top-[68px] lg:w-[380px] lg:shrink-0 lg:self-start">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionLabel>Your route · drag to reorder</SectionLabel>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted transition-colors hover:text-white"
                >
                  Clear all
                </button>
              )}
            </div>

            {selectedIds.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-aura-border bg-aura-bg2 py-12 text-center">
                <Compass size={24} className="text-aura-muted" />
                <p className="font-body text-[13px] font-bold text-white">
                  No entries selected
                </p>
                <p className="max-w-[240px] font-body text-[11px] text-aura-muted2">
                  Click entries from the master list on the right to build your
                  chronicle.
                </p>
              </div>
            ) : (
              <>
                <Reorder.Group
                  axis="y"
                  values={selectedIds}
                  onReorder={handleReorder}
                  className="flex flex-col gap-1.5"
                >
                  {orderedSelection.map((entry, idx) => (
                    <Reorder.Item key={entry.id} value={entry.id}>
                      <RouteEntryRow
                        entry={entry}
                        selected
                        position={idx + 1}
                        onToggle={() => toggleEntry(entry.id)}
                        showDragHandle
                      />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
                {selectedIds.length < MIN_ENTRIES && (
                  <p className="font-mono text-[10px] text-aura-muted">
                    Select at least {MIN_ENTRIES} entries to save.
                  </p>
                )}
              </>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN — All master entries */}
        <section className="flex min-w-0 flex-1 flex-col gap-6">
          <SectionLabel>
            All master entries · {entries.length}
          </SectionLabel>

          {groups.map((group) => (
            <div
              key={group.parentSeries}
              className="flex flex-col gap-4 sm:flex-row sm:gap-7"
            >
              {/* Group header — cover + series name */}
              <div className="flex shrink-0 flex-row items-center gap-4 sm:w-[80px] sm:flex-col sm:items-start sm:gap-2">
                <div className="relative h-[60px] w-[42px] overflow-hidden rounded-lg bg-aura-bg3 sm:h-[113px] sm:w-[80px]">
                  {group.coverImageUrl ? (
                    <Image
                      src={group.coverImageUrl}
                      alt={group.parentSeries}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 42px, 80px"
                      quality={60}
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-aura-muted/20 to-aura-bg3" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="font-body text-xs font-bold leading-tight text-white">
                    {group.parentSeries}
                  </p>
                  <p className="font-body text-[10px] text-aura-muted2">
                    {TYPE_LABELS[group.entries[0]?.entry_type ?? "episodes"] ??
                      "TV Series"}
                  </p>
                </div>
              </div>

              {/* Entry rows */}
              <div className="flex flex-1 flex-col gap-1.5">
                {group.entries.map((entry) => (
                  <RouteEntryRow
                    key={entry.id}
                    entry={entry}
                    selected={selectedSet.has(entry.id)}
                    position={entry.position}
                    onToggle={() => toggleEntry(entry.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
