"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminFranchise {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  status: string;
  created_at: string;
  entry_count: number;
  proposal_count: number;
}

type SortKey = "entry_count" | "proposal_count" | "created_at";

function PatternOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-xl opacity-10"
      style={{ backgroundImage: "url(/images/pattern.png)", backgroundRepeat: "repeat" }}
    />
  );
}

const statusColors: Record<string, string> = {
  finished: "text-emerald-400",
  releasing: "text-blue-400",
  not_yet_released: "text-aura-muted",
};

export default function AdminFranchisesPage() {
  const [franchises, setFranchises] = useState<AdminFranchise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("entry_count");

  const fetchFranchises = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch(`/api/admin/franchises?sort=${sort}&limit=30`);
    if (res.ok) {
      setFranchises(await res.json());
    }
    setIsLoading(false);
  }, [sort]);

  useEffect(() => {
    fetchFranchises();
  }, [fetchFranchises]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1
          className="font-brand text-xl font-bold tracking-tight text-white"
          style={{ textShadow: "0 0 12px rgba(235, 99, 37, 0.5)" }}
        >
          Franchise Analytics
        </h1>
        <p className="mt-1 font-body text-[13px] tracking-[-0.26px] text-aura-muted2">
          Top 30 franchises by selected metric.
        </p>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-1">
        <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
          Sort
        </span>
        {(
          [
            ["entry_count", "Entries"],
            ["proposal_count", "Proposals"],
            ["created_at", "Newest"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={cn(
              "rounded-lg px-3.5 py-2 font-body text-[12px] font-bold tracking-[-0.24px] transition-all",
              sort === key
                ? "bg-aura-orange text-white"
                : "bg-[rgba(49,49,49,0.6)] text-aura-muted2 hover:bg-[rgba(49,49,49,0.8)] hover:text-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Franchise list */}
      <div className="relative overflow-hidden rounded-xl bg-aura-bg3">
        <PatternOverlay />

        {/* Column headers */}
        <div className="relative grid grid-cols-[1fr_80px_90px_100px_100px] gap-2 border-b border-white/[0.06] px-5 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
            Franchise
          </span>
          <span className="text-center font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
            Entries
          </span>
          <span className="text-center font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
            Proposals
          </span>
          <span className="text-center font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
            Status
          </span>
          <span className="text-right font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
            Added
          </span>
        </div>

        {isLoading ? (
          <div className="relative flex flex-col">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="h-[44px] w-[32px] shrink-0 rounded bg-white/[0.06]" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-3.5 w-36 rounded bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        ) : franchises.length > 0 ? (
          <div className="relative flex flex-col">
            {franchises.map((f, i) => (
              <div key={f.id}>
                <Link
                  href={`/franchise/${f.slug}`}
                  className="grid grid-cols-[1fr_80px_90px_100px_100px] gap-2 items-center px-5 py-3 transition-colors hover:bg-white/[0.03]"
                >
                  {/* Franchise */}
                  <div className="flex items-center gap-3 min-w-0">
                    {f.cover_image_url ? (
                      <Image
                        src={f.cover_image_url}
                        alt={f.title}
                        width={32}
                        height={44}
                        className="shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-[44px] w-[32px] shrink-0 rounded bg-aura-bg4" />
                    )}
                    <span className="truncate font-body text-[14px] font-bold tracking-[-0.28px] text-white">
                      {f.title}
                    </span>
                  </div>

                  {/* Entries */}
                  <span className="text-center font-body text-[14px] font-bold tracking-[-0.28px] text-white">
                    {f.entry_count}
                  </span>

                  {/* Proposals */}
                  <span className="text-center font-body text-[14px] tracking-[-0.28px] text-aura-muted2">
                    {f.proposal_count}
                  </span>

                  {/* Status */}
                  <span
                    className={cn(
                      "text-center font-mono text-[10px] uppercase tracking-[0.15em]",
                      statusColors[f.status] ?? "text-aura-muted2",
                    )}
                  >
                    {f.status?.replace(/_/g, " ") ?? "unknown"}
                  </span>

                  {/* Added */}
                  <span className="text-right font-body text-[11px] text-white/50">
                    {new Date(f.created_at).toLocaleDateString()}
                  </span>
                </Link>

                {i < franchises.length - 1 && (
                  <div className="h-px bg-white/[0.06]" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="relative px-5 py-10 text-center">
            <p className="font-body text-[13px] text-aura-muted">
              No franchises found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
