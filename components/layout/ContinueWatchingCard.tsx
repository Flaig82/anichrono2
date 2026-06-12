"use client";

import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { Play } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ContinueData {
  franchise: {
    title: string;
    slug: string;
    cover_image_url: string | null;
    banner_image_url: string | null;
  } | null;
  played?: number;
  total?: number;
  nextEntry?: { title: string } | null;
}

const fetcher = async (url: string): Promise<ContinueData> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load continue data");
  return res.json();
};

/**
 * "Continue watching" card under the hero. Logged-in only — renders nothing
 * while loading, on error, when the user has no watch activity, or when the
 * franchise is fully watched.
 */
export default function ContinueWatchingCard() {
  const { user, isLoading } = useAuth();
  const { data, error } = useSWR<ContinueData>(
    user ? "/api/user/continue" : null,
    fetcher,
  );

  if (isLoading || !user || error || !data?.franchise) return null;

  const { franchise, nextEntry } = data;
  const played = data.played ?? 0;
  const total = data.total ?? 0;
  if (total === 0 || played === total) return null;

  const thumbSrc = franchise.cover_image_url ?? franchise.banner_image_url;
  const percent = Math.round((played / total) * 100);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-aura-border bg-white/[0.02] p-4">
      {/* Cover thumb */}
      <div className="relative h-20 w-[60px] shrink-0 overflow-hidden rounded-lg bg-aura-bg4">
        {thumbSrc && (
          <Image
            src={thumbSrc}
            alt={franchise.title}
            fill
            className="object-cover"
            quality={60}
            sizes="60px"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted2">
          Continue Watching
        </p>
        <p className="truncate font-body text-[15px] font-bold tracking-[-0.3px] text-white">
          {franchise.title}
        </p>
        <p className="truncate font-body text-[12px] tracking-[-0.12px] text-aura-text/80">
          {nextEntry ? `Next up: ${nextEntry.title} · ` : ""}
          {played} of {total} watched
        </p>
        {/* Thin progress bar */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-aura-orange"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/franchise/${franchise.slug}`}
        className="flex shrink-0 items-center gap-1.5 rounded-full border-b border-aura-orange-hover bg-aura-orange px-4 py-2 font-body text-[13px] font-bold tracking-[-0.26px] text-white transition-colors hover:bg-aura-orange-hover"
      >
        <Play size={14} />
        Continue
      </Link>
    </div>
  );
}
