"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AniListSearchResult } from "@/lib/anilist";

interface TypeaheadResult extends AniListSearchResult {
  onSite: { slug: string; title: string } | null;
}

interface SearchTypeaheadProps {
  open: boolean;
  onClose: () => void;
}

const DEBOUNCE_MS = 300;

/**
 * Nav typeahead: live-search anime, with a "View" jump for franchises already
 * on the site and a "Create" jump for ones that aren't. Enter with nothing
 * highlighted falls back to the full /search page (the old submit behavior).
 */
export default function SearchTypeahead({ open, onClose }: SearchTypeaheadProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TypeaheadResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  // Focus on open; reset on close.
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery("");
      setResults([]);
      setHighlight(-1);
    }
  }, [open]);

  // Debounced search with stale-response guard.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setHighlight(-1);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const id = ++requestId.current;
      try {
        const res = await fetch(`/api/search/typeahead?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (id !== requestId.current) return; // a newer request superseded this one
        setResults(data.results ?? []);
        setHighlight(-1);
      } catch {
        if (id === requestId.current) setResults([]);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  // Outside-click close.
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open, onClose]);

  const goToSearchPage = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    onClose();
  }, [query, router, onClose]);

  const activate = useCallback(
    (result: TypeaheadResult) => {
      router.push(
        result.onSite
          ? `/franchise/${result.onSite.slug}`
          : `/franchise/create?anilist=${result.id}`,
      );
      onClose();
    },
    [router, onClose],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && results[highlight]) activate(results[highlight]);
      else goToSearchPage();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  if (!open) return null;

  const showPanel = query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Input (matches the nav's pill style) */}
      <div className="flex items-center gap-2 rounded-lg bg-[rgba(49,49,49,0.6)] px-3 py-2.5 backdrop-blur-[10px]">
        <Search size={14} className="shrink-0 text-aura-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search anime..."
          className="w-[160px] bg-transparent font-body text-[13px] tracking-[-0.26px] text-white placeholder:text-aura-muted outline-none md:w-[240px]"
        />
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-aura-muted transition-colors hover:text-white"
          aria-label="Close search"
        >
          <X size={14} />
        </button>
      </div>

      {/* Dropdown panel */}
      {showPanel && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-lg border border-aura-border bg-aura-bg2 shadow-2xl">
          {loading && results.length === 0 && (
            <p className="px-3 py-4 text-center font-body text-[13px] text-aura-muted">
              Searching…
            </p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-3 py-4 text-center font-body text-[13px] text-aura-muted">
              No results for &ldquo;{query.trim()}&rdquo;
            </p>
          )}

          {results.length > 0 && (
            <ul className="max-h-[320px] overflow-y-auto p-1.5">
              {results.map((result, i) => (
                <li key={result.id}>
                  <button
                    onClick={() => activate(result)}
                    onMouseEnter={() => setHighlight(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
                      i === highlight ? "bg-white/5" : "hover:bg-white/5",
                    )}
                  >
                    {result.coverImageUrl ? (
                      <div className="relative h-[60px] w-[42px] shrink-0 overflow-hidden rounded">
                        <Image
                          src={result.coverImageUrl}
                          alt={result.titleEnglish ?? result.titleRomaji}
                          fill
                          className="object-cover"
                          sizes="42px"
                          quality={60}
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

                    {/* Action affordance */}
                    {result.onSite ? (
                      <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-aura-orange">
                        View <ArrowRight size={12} />
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-aura-orange/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-aura-orange">
                        <Plus size={12} /> Create
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Footer — full search page */}
          <button
            onClick={goToSearchPage}
            className="flex w-full items-center justify-between border-t border-aura-border px-3 py-2.5 font-body text-[12px] text-aura-muted2 transition-colors hover:bg-white/5 hover:text-white"
          >
            <span className="truncate">View all results for &ldquo;{query.trim()}&rdquo;</span>
            <ArrowRight size={13} className="shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
}
