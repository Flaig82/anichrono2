"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { AniListSearchResult } from "@/lib/anilist";
import EraProgressBar from "@/components/shared/EraProgressBar";

interface AddFranchiseDialogProps {
  open: boolean;
  onClose: () => void;
}

const DEBOUNCE_MS = 300;

/**
 * Search-first flow for "Add a franchise" on the Chronicles page.
 *
 * Replaces the old dead-end link to /franchise/create that silently redirected
 * to /discover when no ?anilist= param was present. Now:
 *   user clicks "Add a franchise"
 *   → type to search AniList
 *   → pick an anime
 *   → navigate to /franchise/create?anilist=X
 *
 * Sub-Wanderer users see an EraProgressBar instead of the search (same gate
 * as the backing /api/franchise/create route).
 */
export default function AddFranchiseDialog({
  open,
  onClose,
}: AddFranchiseDialogProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AniListSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentAura = profile?.total_aura ?? 0;
  const canCreate = currentAura >= 500;

  useEffect(() => {
    if (open && canCreate) {
      // Defer focus until dialog has mounted
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open, canCreate]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/franchise/search-anilist?q=${encodeURIComponent(query)}`,
        );
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  function handleSelect(anilistId: number) {
    router.push(`/franchise/create?anilist=${anilistId}`);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative mx-4 w-full max-w-[520px] rounded-2xl border border-aura-border bg-[#1a1a1e] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-franchise-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-aura-border p-5">
          <h2
            id="add-franchise-title"
            className="font-body text-lg font-bold text-white"
          >
            Add a franchise
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-aura-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {!canCreate ? (
          <div className="flex flex-col gap-4 p-5">
            <p className="font-body text-[13px] leading-relaxed text-aura-muted2">
              You need to reach{" "}
              <span className="font-bold text-aura-orange">Wanderer era</span>{" "}
              (500 Aura) to add a new franchise. Keep watching and completing
              quests to level up.
            </p>
            <EraProgressBar
              currentAura={currentAura}
              variant="card"
              highlightUnlock="franchise"
            />
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-aura-orange px-4 py-2.5 font-body text-sm font-bold text-white transition-colors hover:bg-aura-orange-hover"
            >
              Got it
            </button>
          </div>
        ) : (
          <>
            <div className="p-5 pb-3">
              <p className="mb-3 font-body text-[13px] text-aura-muted2">
                Search AniList for an anime that&apos;s not yet in AnimeChrono.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-aura-border bg-black/40 px-3 py-2.5 focus-within:border-aura-orange/40">
                <Search size={16} className="shrink-0 text-aura-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search anime titles..."
                  className="flex-1 bg-transparent font-body text-sm text-white outline-none placeholder:text-aura-muted"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-aura-muted transition-colors hover:text-white"
                    aria-label="Clear"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto px-5 pb-5">
              {loading && (
                <p className="py-4 text-center font-body text-[13px] text-aura-muted">
                  Searching...
                </p>
              )}
              {!loading && query.length >= 2 && results.length === 0 && (
                <p className="py-4 text-center font-body text-[13px] text-aura-muted">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}
              {!loading && query.length < 2 && (
                <p className="py-4 text-center font-body text-[12px] text-aura-muted">
                  Type at least 2 characters to search
                </p>
              )}
              <ul className="flex flex-col gap-1.5">
                {results.map((result) => (
                  <li key={result.id}>
                    <button
                      onClick={() => handleSelect(result.id)}
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5"
                    >
                      {result.coverImageUrl ? (
                        <div className="relative h-[60px] w-[42px] shrink-0 overflow-hidden rounded">
                          <Image
                            src={result.coverImageUrl}
                            alt={result.titleEnglish ?? result.titleRomaji}
                            fill
                            className="object-cover"
                            sizes="42px"
                          />
                        </div>
                      ) : (
                        <div className="h-[60px] w-[42px] shrink-0 rounded bg-aura-bg3" />
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-body text-[13px] font-semibold text-white">
                          {result.titleEnglish ?? result.titleRomaji}
                        </span>
                        {result.titleEnglish &&
                          result.titleEnglish !== result.titleRomaji && (
                            <span className="truncate font-body text-[11px] text-aura-muted2">
                              {result.titleRomaji}
                            </span>
                          )}
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-aura-muted">
                          {result.format ?? "?"}
                          {result.episodes ? ` · ${result.episodes} eps` : ""}
                        </span>
                      </div>
                      <Plus size={16} className="shrink-0 text-aura-orange" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
