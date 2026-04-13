"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Radio,
  Film,
  FileText,
  TrendingUp,
  CheckSquare,
  Trash2,
  Check,
  Circle,
  ShoppingBag,
  Compass,
} from "lucide-react";

interface AdminTodo {
  id: string;
  body: string;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  author_id: string;
  author: { display_name: string | null; avatar_url: string | null };
  completer: { display_name: string | null } | null;
}

interface StatsData {
  totalUsers: number;
  newUsersThisWeek: number;
  totalFranchises: number;
  proposalsByStatus: Record<string, number>;
  routesByStatus: { in_review: number; approved: number };
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
  amazonClicks: {
    total: number;
    last30d: number;
    topLinks: { label: string; clicks: number }[];
  };
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
  const [todos, setTodos] = useState<AdminTodo[]>([]);
  const [todoBody, setTodoBody] = useState("");
  const [postingTodo, setPostingTodo] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    const res = await fetch("/api/admin/notes");
    if (res.ok) {
      setTodos(await res.json());
    }
  }, []);

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        setStats(await res.json());
      }
      setIsLoading(false);
    }
    fetchStats();
    fetchTodos();
  }, [fetchTodos]);

  async function addTodo() {
    const trimmed = todoBody.trim();
    if (!trimmed || postingTodo) return;
    setPostingTodo(true);
    const res = await fetch("/api/admin/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });
    if (res.ok) {
      const todo: AdminTodo = await res.json();
      setTodos((prev) => [todo, ...prev]);
      setTodoBody("");
    }
    setPostingTodo(false);
  }

  async function toggleTodo(id: string) {
    if (togglingId) return;
    setTogglingId(id);
    const res = await fetch(`/api/admin/notes/${id}`, { method: "PATCH" });
    if (res.ok) {
      const updated: AdminTodo = await res.json();
      setTodos((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        // Insert into correct position: incomplete first, then completed
        const incomplete = filtered.filter((t) => !t.is_completed);
        const completed = filtered.filter((t) => t.is_completed);
        if (updated.is_completed) {
          return [...incomplete, updated, ...completed];
        }
        return [updated, ...incomplete, ...completed];
      });
    }
    setTogglingId(null);
  }

  async function deleteTodo(id: string) {
    const res = await fetch(`/api/admin/notes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    }
  }

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
  const pendingRoutes = stats.routesByStatus?.in_review ?? 0;
  const approvedRoutes = stats.routesByStatus?.approved ?? 0;

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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
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
        <StatCard
          icon={<Compass size={16} />}
          label="Pending Routes"
          value={pendingRoutes}
          sub={`${approvedRoutes} live`}
          highlight={pendingRoutes > 0}
        />
        <StatCard
          icon={<ShoppingBag size={16} />}
          label="Amazon Clicks"
          value={stats.amazonClicks.last30d}
          sub={`${stats.amazonClicks.total} all time`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                      href={`/u/${u.handle ?? u.id}`}
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

        {/* To-Do */}
        <div className="relative overflow-hidden rounded-xl bg-aura-bg3 p-5">
          <PatternOverlay />
          <div className="relative">
            <div className="flex items-center gap-2 mb-5">
              <CheckSquare size={14} className="text-aura-orange" />
              <h2
                className="font-brand text-sm font-bold tracking-tight text-white"
                style={{ textShadow: "0 0 12px rgba(235, 99, 37, 0.5)" }}
              >
                To-Do
              </h2>
            </div>

            {/* Add task */}
            <div className="mb-5">
              <textarea
                value={todoBody}
                onChange={(e) => setTodoBody(e.target.value)}
                placeholder="Add a task..."
                maxLength={2000}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addTodo();
                  }
                }}
                className="w-full resize-none rounded-lg border border-aura-border bg-aura-bg2 px-3 py-2 font-body text-[13px] tracking-[-0.26px] text-white placeholder:text-aura-muted focus:border-aura-orange/50 focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-[10px] text-aura-muted">
                  {todoBody.length}/2000
                </span>
                <button
                  onClick={addTodo}
                  disabled={!todoBody.trim() || postingTodo}
                  className="rounded-lg bg-aura-orange px-4 py-1.5 font-body text-[12px] font-bold tracking-[-0.12px] text-white transition-opacity disabled:opacity-40"
                >
                  {postingTodo ? "Adding..." : "Add Task"}
                </button>
              </div>
            </div>

            {/* Task list */}
            <div className="flex flex-col">
              {todos.map((t, i) => (
                <div key={t.id}>
                  <div className="flex items-start gap-3 py-3">
                    <button
                      onClick={() => toggleTodo(t.id)}
                      disabled={togglingId === t.id}
                      className="mt-0.5 shrink-0 transition-colors disabled:opacity-50"
                      title={t.is_completed ? "Mark incomplete" : "Mark complete"}
                    >
                      {t.is_completed ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-aura-orange">
                          <Check size={12} className="text-white" />
                        </div>
                      ) : (
                        <Circle size={20} className="text-aura-muted transition-colors hover:text-aura-orange" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`whitespace-pre-wrap font-body text-[13px] leading-relaxed tracking-[-0.26px] ${
                          t.is_completed
                            ? "text-aura-muted line-through"
                            : "text-white"
                        }`}
                      >
                        {t.body}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono text-[10px] text-aura-muted">
                          {t.author?.display_name ?? "Unknown"} &middot; {formatRelativeTime(t.created_at)}
                        </span>
                        {t.is_completed && t.completer && (
                          <span className="font-mono text-[10px] text-aura-muted">
                            &middot; Done by {t.completer.display_name ?? "Unknown"} {t.completed_at ? formatRelativeTime(t.completed_at) : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTodo(t.id)}
                      className="mt-1 shrink-0 rounded p-1 text-aura-muted transition-colors hover:bg-white/5 hover:text-red-400"
                      title="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {i < todos.length - 1 && (
                    <div className="h-px bg-white/[0.06]" />
                  )}
                </div>
              ))}
              {todos.length === 0 && (
                <p className="py-6 text-center font-body text-[12px] text-aura-muted">
                  No tasks yet. Add one above.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Amazon Clicks Breakdown */}
      {stats.amazonClicks.topLinks.length > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-aura-bg3 p-5">
          <PatternOverlay />
          <div className="relative flex items-center gap-2 mb-5">
            <ShoppingBag size={14} className="text-aura-orange" />
            <h2
              className="font-brand text-sm font-bold tracking-tight text-white"
              style={{ textShadow: "0 0 12px rgba(235, 99, 37, 0.5)" }}
            >
              Top Amazon Links
            </h2>
            <span className="font-mono text-[10px] text-aura-muted">Last 30 days</span>
          </div>
          <div className="relative flex flex-col">
            {stats.amazonClicks.topLinks.map((link, i) => (
              <div key={link.label}>
                <div className="flex items-center justify-between py-2.5">
                  <span className="font-body text-[13px] tracking-[-0.26px] text-white">
                    {link.label}
                  </span>
                  <span className="font-mono text-[13px] font-bold tabular-nums text-aura-orange">
                    {link.clicks}
                  </span>
                </div>
                {i < stats.amazonClicks.topLinks.length - 1 && (
                  <div className="h-px bg-white/[0.06]" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
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
