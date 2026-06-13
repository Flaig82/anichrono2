"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraftEntry {
  id: string;
  position: number;
  title: string;
  entry_type: string;
  curator_note: string | null;
  is_essential: boolean;
}

interface DraftFranchise {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  banner_image_url: string | null;
  review_status: "draft" | "rejected";
  created_at: string;
  year_started: number | null;
  studio: string | null;
  genres: string[];
  entries: DraftEntry[];
}

const entryTypeColor: Record<string, string> = {
  episodes: "text-entry-episodes",
  movie: "text-entry-movie",
  ova: "text-entry-ova",
  ona: "text-entry-ona",
  manga: "text-entry-manga",
  special: "text-entry-special",
};

function PatternOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-xl opacity-10"
      style={{ backgroundImage: "url(/images/pattern.png)", backgroundRepeat: "repeat" }}
    />
  );
}

export default function AdminReviewPage() {
  const [franchises, setFranchises] = useState<DraftFranchise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch("/api/admin/franchise/drafts");
    if (res.ok) {
      setFranchises(await res.json());
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const act = useCallback(
    async (id: string, action: "approve" | "deny") => {
      setBusyId(id);
      setError(null);
      const res = await fetch(`/api/admin/franchise/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Action failed");
        setBusyId(null);
        return;
      }
      if (action === "approve") {
        // Now live — drops out of the queue.
        setFranchises((prev) => prev.filter((f) => f.id !== id));
      } else {
        setFranchises((prev) =>
          prev.map((f) => (f.id === id ? { ...f, review_status: "rejected" } : f)),
        );
      }
      setBusyId(null);
    },
    [],
  );

  const pending = franchises.filter((f) => f.review_status === "draft");
  const rejected = franchises.filter((f) => f.review_status === "rejected");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1
          className="font-brand text-xl font-bold tracking-tight text-white"
          style={{ textShadow: "0 0 12px rgba(235, 99, 37, 0.5)" }}
        >
          Draft Review
        </h1>
        <p className="mt-1 font-body text-[13px] tracking-[-0.26px] text-aura-muted2">
          Auto-generated and staged franchises awaiting approval. Set live to publish, or deny to hide.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-body text-[13px] text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-aura-bg3" />
          ))}
        </div>
      ) : pending.length === 0 && rejected.length === 0 ? (
        <div className="rounded-xl bg-aura-bg3 px-6 py-10 text-center font-body text-[14px] text-aura-muted2">
          No franchises awaiting review. The queue is clear. ✨
        </div>
      ) : (
        <>
          {/* Pending */}
          <Section
            label={`Pending · ${pending.length}`}
            franchises={pending}
            busyId={busyId}
            onAct={act}
          />

          {/* Rejected (audit / re-approve) */}
          {rejected.length > 0 && (
            <Section
              label={`Rejected · ${rejected.length}`}
              franchises={rejected}
              busyId={busyId}
              onAct={act}
            />
          )}
        </>
      )}
    </div>
  );
}

function Section({
  label,
  franchises,
  busyId,
  onAct,
}: {
  label: string;
  franchises: DraftFranchise[];
  busyId: string | null;
  onAct: (id: string, action: "approve" | "deny") => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
        {label}
      </span>
      {franchises.map((f) => (
        <FranchiseCard key={f.id} franchise={f} busy={busyId === f.id} onAct={onAct} />
      ))}
    </div>
  );
}

function FranchiseCard({
  franchise: f,
  busy,
  onAct,
}: {
  franchise: DraftFranchise;
  busy: boolean;
  onAct: (id: string, action: "approve" | "deny") => void;
}) {
  const meta = [f.year_started || null, f.studio || null, f.genres[0] || null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="relative overflow-hidden rounded-xl bg-aura-bg3">
      <PatternOverlay />
      <div className="relative flex flex-col gap-4 p-5">
        {/* Top row: cover + title + actions */}
        <div className="flex items-start gap-4">
          {f.cover_image_url ? (
            <Image
              src={f.cover_image_url}
              alt={f.title}
              width={48}
              height={66}
              className="shrink-0 rounded object-cover"
              quality={60}
            />
          ) : (
            <div className="h-[66px] w-[48px] shrink-0 rounded bg-aura-bg4" />
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-body text-[16px] font-bold tracking-[-0.32px] text-white">
                {f.title}
              </h2>
              {f.review_status === "rejected" && (
                <span className="shrink-0 rounded bg-red-500/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-red-300">
                  Rejected
                </span>
              )}
            </div>
            {meta && (
              <p className="font-mono text-[11px] tracking-[0.03em] text-aura-muted2">
                {meta} · {f.entries.length} {f.entries.length === 1 ? "entry" : "entries"}
              </p>
            )}
            <Link
              href={`/franchise/${f.slug}`}
              className="mt-0.5 inline-flex w-fit items-center gap-1 font-mono text-[11px] text-aura-muted2 transition-colors hover:text-white"
            >
              <ExternalLink size={11} /> /franchise/{f.slug}
            </Link>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              disabled={busy}
              onClick={() => onAct(f.id, "approve")}
              className="flex items-center gap-1.5 rounded-full bg-aura-orange px-4 py-2 font-body text-[13px] font-bold tracking-[-0.26px] text-white transition-colors hover:bg-aura-orange-hover disabled:opacity-50"
            >
              <Check size={14} /> Set Live
            </button>
            {f.review_status === "draft" && (
              <button
                disabled={busy}
                onClick={() => onAct(f.id, "deny")}
                className="flex items-center gap-1.5 rounded-full border border-white/[0.13] px-4 py-2 font-body text-[13px] font-bold tracking-[-0.26px] text-aura-muted2 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
              >
                <X size={14} /> Deny
              </button>
            )}
          </div>
        </div>

        {/* Entry list */}
        <div className="flex flex-col gap-1 rounded-lg bg-black/20 p-3">
          {f.entries.map((e) => (
            <div key={e.id} className="flex items-baseline gap-2 py-0.5">
              <span className="w-5 shrink-0 text-right font-mono text-[11px] text-aura-muted">
                {e.position}
              </span>
              <span
                className={cn(
                  "shrink-0 font-mono text-[10px] uppercase tracking-[0.1em]",
                  entryTypeColor[e.entry_type] ?? "text-aura-muted2",
                )}
              >
                {e.entry_type}
              </span>
              <span className="min-w-0 flex-1 truncate font-body text-[13px] text-aura-text">
                {e.title}
                {!e.is_essential && (
                  <span className="ml-1.5 font-mono text-[10px] text-aura-muted">optional</span>
                )}
                {e.curator_note && (
                  <span className="ml-2 font-body text-[12px] text-aura-muted2">
                    — {e.curator_note}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
