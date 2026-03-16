"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Radio,
  Film,
  FileText,
  TrendingUp,
} from "lucide-react";

interface StatsData {
  totalUsers: number;
  newUsersThisWeek: number;
  totalFranchises: number;
  proposalsByStatus: Record<string, number>;
  activeUsers: number;
  topUsers: {
    id: string;
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
    era: string;
    total_aura: number;
  }[];
  recentActivity: {
    id: string;
    user_id: string;
    type: string;
    created_at: string;
    metadata: Record<string, unknown>;
    user: { display_name: string | null; handle: string | null; avatar_url: string | null };
    franchise: { title: string; slug: string } | null;
    entry: { title: string } | null;
  }[];
}

const eraColors: Record<string, string> = {
  initiate: "text-aura-muted2",
  wanderer: "text-blue-400",
  adept: "text-purple-400",
  ascendant: "text-aura-orange",
};

const activityLabels: Record<string, string> = {
  complete_entry: "watched",
  start_watching: "started watching",
  review: "reviewed",
  rate: "rated",
  drop: "dropped",
  add_to_watchlist: "added to watchlist",
};

function PatternOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-xl opacity-10"
      style={{ backgroundImage: "url(/images/pattern.png)", backgroundRepeat: "repeat" }}
    />
  );
}

function AvatarFallback({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-aura-bg4 font-body text-xs font-bold text-aura-muted2"
      style={{ width: size, height: size }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        setStats(await res.json());
      }
      setIsLoading(false);
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[120px] animate-pulse rounded-xl bg-aura-bg3" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-[400px] animate-pulse rounded-xl bg-aura-bg3" />
          <div className="h-[400px] animate-pulse rounded-xl bg-aura-bg3" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-xl bg-aura-bg3 p-8 text-center">
        <p className="font-body text-sm text-aura-muted2">
          Failed to load dashboard stats.
        </p>
      </div>
    );
  }

  const pendingProposals = stats.proposalsByStatus["pending_approval"] ?? 0;
  const totalProposals = Object.values(stats.proposalsByStatus).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div>
        <h1
          className="font-brand text-xl font-bold tracking-tight text-white"
          style={{ textShadow: "0 0 12px rgba(235, 99, 37, 0.5)" }}
        >
          Dashboard
        </h1>
        <p className="mt-1 font-body text-[13px] tracking-[-0.26px] text-aura-muted2">
          Platform overview and activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Users size={16} />}
          label="Total Users"
          value={stats.totalUsers}
          sub={`+${stats.newUsersThisWeek} this week`}
        />
        <StatCard
          icon={<Radio size={16} />}
          label="Active Now"
          value={stats.activeUsers}
          sub="Last 15 min"
          pulse
        />
        <StatCard
          icon={<Film size={16} />}
          label="Franchises"
          value={stats.totalFranchises}
        />
        <StatCard
          icon={<FileText size={16} />}
          label="Pending Proposals"
          value={pendingProposals}
          sub={`${totalProposals} total`}
          href="/admin/proposals"
          highlight={pendingProposals > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Users */}
        <div className="relative overflow-hidden rounded-xl bg-aura-bg3 p-5">
          <PatternOverlay />
          <div className="relative flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-aura-orange" />
              <h2
                className="font-brand text-sm font-bold tracking-tight text-white"
                style={{ textShadow: "0 0 12px rgba(235, 99, 37, 0.5)" }}
              >
                Top Users by Aura
              </h2>
            </div>
            <Link
              href="/admin/users?sort=total_aura"
              className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2 transition-colors hover:text-aura-orange"
            >
              View all
            </Link>
          </div>
          <div className="relative flex flex-col">
            {stats.topUsers.map((u, i) => (
              <div key={u.id}>
                <div className="flex items-center gap-4 py-3">
                  <span className="w-5 text-right font-mono text-[11px] text-aura-muted">
                    {i + 1}
                  </span>
                  {u.avatar_url ? (
                    <Image
                      src={u.avatar_url}
                      alt={u.display_name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback name={u.display_name} size={32} />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={u.handle ? `/u/${u.handle}` : "#"}
                      className="block truncate font-body text-[14px] font-bold tracking-[-0.28px] text-white transition-colors hover:text-aura-orange"
                    >
                      {u.display_name}
                    </Link>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.15em] ${eraColors[u.era] ?? "text-aura-muted2"}`}
                    >
                      {u.era}
                    </span>
                  </div>
                  <span className="font-body text-[15px] font-bold tracking-[-0.3px] text-aura-orange">
                    {u.total_aura.toLocaleString()}
                  </span>
                </div>
                {i < stats.topUsers.length - 1 && (
                  <div className="h-px bg-white/[0.06]" />
                )}
              </div>
            ))}
            {stats.topUsers.length === 0 && (
              <p className="py-6 text-center font-body text-[12px] text-aura-muted">
                No users yet.
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="relative overflow-hidden rounded-xl bg-aura-bg3 p-5">
          <PatternOverlay />
          <div className="relative flex items-center gap-2 mb-5">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-aura-orange-hover" />
            <h2
              className="font-brand text-sm font-bold tracking-tight text-white"
              style={{ textShadow: "0 0 12px rgba(235, 99, 37, 0.5)" }}
            >
              Recent Activity
            </h2>
          </div>
          <div className="relative flex flex-col">
            {stats.recentActivity.map((a, i) => (
              <div key={a.id}>
                <div className="flex items-start gap-4 py-3">
                  {a.user?.avatar_url ? (
                    <Image
                      src={a.user.avatar_url}
                      alt={a.user.display_name ?? ""}
                      width={32}
                      height={32}
                      className="mt-0.5 rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback name={a.user?.display_name ?? "?"} size={32} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[14px] tracking-[-0.28px] text-white">
                      <span className="font-bold">
                        {a.user?.display_name ?? "Unknown"}
                      </span>{" "}
                      <span className="text-aura-muted2">
                        {activityLabels[a.type] ?? a.type}
                      </span>
                    </p>
                    {a.franchise && (
                      <Link
                        href={`/franchise/${a.franchise.slug}`}
                        className="mt-0.5 block truncate font-body text-[12px] tracking-[-0.12px] text-white/80 transition-colors hover:text-aura-orange"
                      >
                        {a.entry?.title ?? a.franchise.title}
                      </Link>
                    )}
                    <span className="mt-1 block font-body text-[11px] text-white/50">
                      {formatRelativeTime(a.created_at)}
                    </span>
                  </div>
                </div>
                {i < stats.recentActivity.length - 1 && (
                  <div className="h-px bg-white/[0.06]" />
                )}
              </div>
            ))}
            {stats.recentActivity.length === 0 && (
              <p className="py-6 text-center font-body text-[12px] text-aura-muted">
                No activity yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
  highlight,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  href?: string;
  highlight?: boolean;
  pulse?: boolean;
}) {
  const inner = (
    <div className="relative overflow-hidden rounded-xl bg-aura-bg3 p-5 transition-all duration-200 hover:scale-[1.02]">
      <PatternOverlay />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className={highlight ? "text-aura-orange" : "text-aura-muted2"}>{icon}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
            {label}
          </span>
          {pulse && (
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-aura-orange-hover" />
          )}
        </div>
        <p className={`font-body text-[28px] font-bold tracking-[-0.56px] ${highlight ? "text-aura-orange" : "text-white"}`}>
          {value.toLocaleString()}
        </p>
        {sub && (
          <p className="mt-1 font-body text-[11px] tracking-[-0.12px] text-white/50">
            {sub}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
