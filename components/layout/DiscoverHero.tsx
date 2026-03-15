"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import SectionLabel from "@/components/shared/SectionLabel";

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy",
  "Horror", "Mecha", "Music", "Mystery", "Psychological",
  "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller",
];

const FORMATS = [
  { value: "TV", label: "TV" },
  { value: "MOVIE", label: "Movie" },
  { value: "OVA", label: "OVA" },
  { value: "ONA", label: "ONA" },
];

const SEASONS = [
  { value: "WINTER", label: "Winter" },
  { value: "SPRING", label: "Spring" },
  { value: "SUMMER", label: "Summer" },
  { value: "FALL", label: "Fall" },
];

const SORT_OPTIONS = [
  { value: "POPULARITY_DESC", label: "Popular" },
  { value: "SCORE_DESC", label: "Highest Rated" },
  { value: "TRENDING_DESC", label: "Trending" },
  { value: "START_DATE_DESC", label: "Newest" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => currentYear - i);

interface DiscoverHeroProps {
  unclaimedCount: number;
}

export default function DiscoverHero({ unclaimedCount }: DiscoverHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  const activeGenres = searchParams.getAll("genre");
  const activeFormat = searchParams.get("format");
  const activeSeason = searchParams.get("season");
  const activeYear = searchParams.get("year");
  const activeSort = searchParams.get("sort") ?? "POPULARITY_DESC";

  const hasFilters = activeGenres.length > 0 || activeFormat || activeSeason || activeYear || searchParams.get("q");

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

      router.push(`/discover?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearch = () => {
    if (searchValue.trim()) {
      updateParams({ q: searchValue.trim() });
    } else {
      updateParams({ q: null });
    }
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
    router.push("/discover");
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl px-6 py-8 md:px-10 md:py-10 lg:px-16 lg:py-12"
      style={{
        backgroundImage:
          "linear-gradient(270deg, #121212 0%, transparent 100%), linear-gradient(90deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12)), linear-gradient(90deg, #313131, #313131)",
      }}
    >
      {/* Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{ backgroundImage: "url(/images/pattern.png)", backgroundRepeat: "repeat" }}
      />

      <div className="relative flex flex-col gap-6 md:gap-8">
        <div className="flex max-w-full flex-col gap-3.5 lg:max-w-[641px]">
          <SectionLabel>Discover</SectionLabel>
          <h1 className="font-body text-[28px] font-bold leading-none tracking-[-0.56px] text-white md:text-[36px] md:tracking-[-0.72px] lg:text-[48px] lg:tracking-[-0.96px]">
            Anime that needs
            <br />
            your expertise.
          </h1>
          <p className="max-w-[460px] font-body text-sm leading-[1.62] tracking-[-0.14px] text-white">
            {unclaimedCount}+ anime without a community watch order.
            Claim a franchise and earn Archivist Aura.
          </p>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="flex w-full flex-1 items-center gap-2 rounded-lg bg-black/40 px-4 py-2.5 backdrop-blur-sm border border-white/[0.07] focus-within:border-white/20 transition-colors md:max-w-[480px]">
            <Search size={16} className="shrink-0 text-aura-muted" />
            <input
              type="text"
              placeholder="Search anime..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-transparent font-body text-sm text-white placeholder:text-aura-muted outline-none"
            />
            {searchValue && (
              <button
                onClick={() => { setSearchValue(""); updateParams({ q: null }); }}
                className="text-aura-muted hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="rounded-lg px-3 py-2.5 font-mono text-[11px] text-aura-muted hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort */}
          <select
            value={activeSort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="w-auto rounded-lg bg-black/40 border border-white/[0.07] px-3 py-2 pr-7 font-mono text-[11px] text-white outline-none cursor-pointer hover:border-white/20 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238A94A8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Format */}
          <select
            value={activeFormat ?? ""}
            onChange={(e) => updateParams({ format: e.target.value || null })}
            className="w-auto rounded-lg bg-black/40 border border-white/[0.07] px-3 py-2 pr-7 font-mono text-[11px] text-white outline-none cursor-pointer hover:border-white/20 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238A94A8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat"
          >
            <option value="">All Formats</option>
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* Season */}
          <select
            value={activeSeason ?? ""}
            onChange={(e) => updateParams({ season: e.target.value || null })}
            className="w-auto rounded-lg bg-black/40 border border-white/[0.07] px-3 py-2 pr-7 font-mono text-[11px] text-white outline-none cursor-pointer hover:border-white/20 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238A94A8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat"
          >
            <option value="">Any Season</option>
            {SEASONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Year */}
          <select
            value={activeYear ?? ""}
            onChange={(e) => updateParams({ year: e.target.value || null })}
            className="w-auto rounded-lg bg-black/40 border border-white/[0.07] px-3 py-2 pr-7 font-mono text-[11px] text-white outline-none cursor-pointer hover:border-white/20 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238A94A8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat"
          >
            <option value="">Any Year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <div className="h-4 w-px bg-white/[0.1]" />

          {/* Genre chips */}
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
