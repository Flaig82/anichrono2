"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import SectionLabel from "@/components/shared/SectionLabel";
import { useAuth } from "@/hooks/use-auth";

const selectClasses =
  "w-auto rounded-lg bg-black/40 border border-white/[0.07] px-3 py-2 pr-7 font-mono text-[11px] text-white outline-none cursor-pointer hover:border-white/20 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238A94A8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat";

const SORT_OPTIONS = [
  { value: "updated", label: "Recently Updated" },
  { value: "alpha", label: "A–Z" },
  { value: "year", label: "Year" },
  { value: "entries", label: "Most Entries" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Any Status" },
  { value: "releasing", label: "Airing" },
  { value: "finished", label: "Finished" },
];

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy",
  "Horror", "Mecha", "Mystery", "Romance", "Sci-Fi",
  "Slice of Life", "Sports", "Supernatural", "Thriller",
];

interface ChroniclesHeroProps {
  franchiseCount: number;
}

export default function ChroniclesHero({ franchiseCount }: ChroniclesHeroProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  const activeGenres = searchParams.getAll("genre");
  const activeStatus = searchParams.get("status");
  const activeSort = searchParams.get("sort") ?? "updated";

  const hasFilters = activeGenres.length > 0 || activeStatus || searchParams.get("q");

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        params.delete(key);
        if (val === null) continue;
        if (Array.isArray(val)) {
          for (const v of val) params.append(key, v);
        } else {
          params.set(key, val);
        }
      }
      router.push(`/chronicles?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearch = () => {
    updateParams({ q: searchValue.trim() || null });
  };

  const toggleGenre = (genre: string) => {
    const current = [...activeGenres];
    const idx = current.indexOf(genre);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(genre);
    updateParams({ genre: current.length ? current : null });
  };

  const clearFilters = () => {
    setSearchValue("");
    router.push("/chronicles");
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl px-6 py-8 md:px-10 md:py-10 lg:px-16 lg:py-12"
      style={{
        backgroundImage:
          "linear-gradient(270deg, #121212 0%, transparent 100%), linear-gradient(90deg, rgba(249,115,22,0.15), rgba(249,115,22,0.15)), linear-gradient(90deg, #313131, #313131)",
      }}
    >
      {/* Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{ backgroundImage: "url(/images/pattern.png)", backgroundRepeat: "repeat" }}
      />

      <div className="relative flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex max-w-full flex-col gap-3.5 lg:max-w-[641px]">
            <SectionLabel>Chronicles</SectionLabel>
            <h1 className="font-body text-[28px] font-bold leading-none tracking-[-0.56px] text-white md:text-[36px] md:tracking-[-0.72px] lg:text-[48px] lg:tracking-[-0.96px]">
              Community watch
              <br />
              orders, perfected.
            </h1>
            <p className="max-w-[460px] font-body text-sm leading-[1.62] tracking-[-0.14px] text-white">
              {franchiseCount} franchise{franchiseCount !== 1 ? "s" : ""} with curated chronological
              watch orders maintained by the community.
            </p>
          </div>

          {user && (
            <Link
              href="/franchise/create"
              className="mt-8 flex shrink-0 items-center gap-1.5 rounded-full border-b border-aura-orange-hover bg-aura-orange px-5 py-3 font-body text-[15px] font-bold tracking-[-0.3px] text-white transition-colors hover:bg-aura-orange-hover"
            >
              <Plus size={16} />
              Create a Chronicle
            </Link>
          )}
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="flex w-full flex-1 items-center gap-2 rounded-lg border border-white/[0.07] bg-black/40 px-4 py-2.5 backdrop-blur-sm transition-colors focus-within:border-white/20 md:max-w-[480px]">
            <Search size={16} className="shrink-0 text-aura-muted" />
            <input
              type="text"
              placeholder="Search chronicles..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-transparent font-body text-sm text-white outline-none placeholder:text-aura-muted"
            />
            {searchValue && (
              <button
                onClick={() => { setSearchValue(""); updateParams({ q: null }); }}
                className="text-aura-muted transition-colors hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="rounded-lg px-3 py-2.5 font-mono text-[11px] text-aura-muted transition-colors hover:text-white"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={activeSort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className={selectClasses}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={activeStatus ?? ""}
            onChange={(e) => updateParams({ status: e.target.value || null })}
            className={selectClasses}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <div className="h-4 w-px bg-white/[0.1]" />

          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((genre) => {
              const isActive = activeGenres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`rounded-full px-2.5 py-1 font-mono text-[10px] transition-all ${
                    isActive
                      ? "bg-aura-orange text-white"
                      : "bg-white/[0.05] text-aura-muted2 hover:bg-white/[0.1] hover:text-white"
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
