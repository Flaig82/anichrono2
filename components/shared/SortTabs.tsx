"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface SortOption {
  value: string;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: "alpha", label: "A–Z" },
  { value: "popular", label: "Popular" },
  { value: "year", label: "Newest" },
  { value: "entries", label: "Most Entries" },
  { value: "updated", label: "Updated" },
];

export default function SortTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSort = searchParams.get("sort") ?? "alpha";

  const setSort = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "alpha") {
        params.delete("sort");
      } else {
        params.set("sort", value);
      }
      router.push(`/chronicles?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex items-center gap-1">
      {SORT_OPTIONS.map((option) => {
        const isActive = activeSort === option.value;
        return (
          <button
            key={option.value}
            onClick={() => setSort(option.value)}
            className={`rounded-lg px-3 py-1.5 font-mono text-[11px] tracking-wide transition-all ${
              isActive
                ? "bg-aura-orange/15 text-aura-orange"
                : "text-aura-muted2 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
