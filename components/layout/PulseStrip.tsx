"use client";

import useSWR from "swr";
import { useAuth } from "@/hooks/use-auth";

const statsFetcher = (url: string) => fetch(url).then((r) => r.json());

interface OnlineStats {
  count: number;
  users: { avatar_url: string | null; display_name: string | null }[];
}

// Stable per-session floor so the online count never shows 0 or a lonely
// single-digit. Seeded once on module load — same number for the whole tab
// session, no flicker between renders.
const sessionFloor = 8 + Math.floor(Math.random() * 17); // 8–24

interface PulseStripProps {
  updatedThisWeek: number;
}

/**
 * Slim one-line status bar above the hero. Logged-in only — renders nothing
 * while auth is loading or when signed out.
 */
export default function PulseStrip({ updatedThisWeek }: PulseStripProps) {
  const { user, isLoading } = useAuth();
  const profile = useAuth((s) => s.profile);
  const { data } = useSWR<OnlineStats>("/api/stats/online", statsFetcher, {
    refreshInterval: 120_000,
    dedupingInterval: 60_000,
  });

  if (isLoading || !user) return null;

  const displayName = profile?.display_name ?? "there";
  // Floor the online count to a believable minimum per session so the site
  // feels alive at low user counts (same pattern as the logged-out hero).
  const onlineCount = Math.max(data?.count ?? 0, sessionFloor);

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-aura-border bg-white/[0.02] px-4 py-2">
      <p className="min-w-0 truncate font-body text-[13px] tracking-[-0.13px] text-aura-text">
        Welcome back, <span className="font-bold text-white">{displayName}</span>
        <span className="text-aura-muted2">
          {" "}· {updatedThisWeek} franchise{updatedThisWeek === 1 ? "" : "s"} updated this week
        </span>
      </p>
      <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] tracking-[0.15em] text-aura-orange">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aura-orange" />
        {onlineCount.toLocaleString()} ONLINE
      </span>
    </div>
  );
}
