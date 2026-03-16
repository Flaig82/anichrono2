"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  email: string;
  era: string;
  total_aura: number;
  is_admin: boolean;
  created_at: string;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

const eraColors: Record<string, string> = {
  initiate: "text-aura-muted2",
  wanderer: "text-blue-400",
  adept: "text-purple-400",
  ascendant: "text-aura-orange",
};

function PatternOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-xl opacity-10"
      style={{ backgroundImage: "url(/images/pattern.png)", backgroundRepeat: "repeat" }}
    />
  );
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"created_at" | "total_aura">("created_at");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      search,
      sort,
      page: page.toString(),
    });
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      setData(await res.json());
    }
    setIsLoading(false);
  }, [search, sort, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  async function toggleAdmin(user: AdminUser) {
    setActionInFlight(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_admin: !user.is_admin }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.map((u) => (u.id === updated.id ? updated : u)),
            }
          : prev,
      );
    }
    setActionInFlight(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1
          className="font-brand text-xl font-bold tracking-tight text-white"
          style={{ textShadow: "0 0 12px rgba(235, 99, 37, 0.5)" }}
        >
          User Management
        </h1>
        <p className="mt-1 font-body text-[13px] tracking-[-0.26px] text-aura-muted2">
          {data ? `${data.total} registered users` : "Loading..."}
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-aura-muted"
          />
          <input
            type="text"
            placeholder="Search by name, handle, or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-white/[0.07] bg-aura-bg3 py-2.5 pl-9 pr-3 font-body text-[13px] tracking-[-0.26px] text-white placeholder:text-aura-muted focus:border-aura-orange/40 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
            Sort
          </span>
          {(
            [
              ["created_at", "Newest"],
              ["total_aura", "Top Aura"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setSort(key);
                setPage(1);
              }}
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
      </div>

      {/* User list */}
      <div className="relative overflow-hidden rounded-xl bg-aura-bg3">
        <PatternOverlay />

        {/* Column headers */}
        <div className="relative grid grid-cols-[1fr_160px_80px_80px_60px_100px] gap-2 border-b border-white/[0.06] px-5 py-3">
          {["User", "Email", "Aura", "Era", "Admin", "Joined"].map(
            (col, i) => (
              <span
                key={col}
                className={cn(
                  "font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted",
                  i >= 2 && i <= 4 && "text-center",
                  (i === 1 || i === 5) && "text-right",
                )}
              >
                {col}
              </span>
            ),
          )}
        </div>

        {isLoading ? (
          <div className="relative flex flex-col">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="h-8 w-8 shrink-0 rounded-full bg-white/[0.06]" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-3.5 w-28 rounded bg-white/[0.06]" />
                  <div className="h-3 w-16 rounded bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        ) : data && data.users.length > 0 ? (
          <div className="relative flex flex-col">
            {data.users.map((user, i) => (
              <div key={user.id}>
                <button
                  onClick={() =>
                    setExpandedId(expandedId === user.id ? null : user.id)
                  }
                  className="grid w-full grid-cols-[1fr_160px_80px_80px_60px_100px] gap-2 items-center px-5 py-3 text-left transition-colors hover:bg-white/[0.03]"
                >
                  {/* User */}
                  <div className="flex items-center gap-3 min-w-0">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.display_name}
                        width={32}
                        height={32}
                        className="shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aura-bg4 font-body text-xs font-bold text-aura-muted2">
                        {user.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-body text-[14px] font-bold tracking-[-0.28px] text-white">
                        {user.display_name}
                      </p>
                      {user.handle && (
                        <p className="truncate font-body text-[11px] text-white/50">
                          @{user.handle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <span className="truncate text-right font-body text-[11px] tracking-[-0.12px] text-white/50">
                    {user.email}
                  </span>

                  {/* Aura */}
                  <span className="text-center font-body text-[14px] font-bold tracking-[-0.28px] text-aura-orange">
                    {user.total_aura.toLocaleString()}
                  </span>

                  {/* Era */}
                  <span
                    className={cn(
                      "text-center font-mono text-[10px] uppercase tracking-[0.15em]",
                      eraColors[user.era] ?? "text-aura-muted2",
                    )}
                  >
                    {user.era}
                  </span>

                  {/* Admin */}
                  <div className="flex justify-center">
                    {user.is_admin && (
                      <Shield size={14} className="text-aura-orange" />
                    )}
                  </div>

                  {/* Joined */}
                  <span className="text-right font-body text-[11px] text-white/50">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </button>

                {/* Expanded actions */}
                {expandedId === user.id && (
                  <div className="border-t border-white/[0.06] bg-white/[0.02] px-5 py-3.5 flex items-center gap-3">
                    <button
                      onClick={() => toggleAdmin(user)}
                      disabled={actionInFlight === user.id}
                      className={cn(
                        "rounded-lg px-4 py-2 font-body text-[13px] font-bold tracking-[-0.26px] transition-all disabled:opacity-50",
                        user.is_admin
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-aura-orange/10 text-aura-orange hover:bg-aura-orange/20",
                      )}
                    >
                      {actionInFlight === user.id
                        ? "Saving..."
                        : user.is_admin
                          ? "Remove Admin"
                          : "Make Admin"}
                    </button>
                    {user.handle && (
                      <Link
                        href={`/u/${user.handle}`}
                        className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2 transition-colors hover:text-aura-orange"
                      >
                        View Profile
                      </Link>
                    )}
                  </div>
                )}

                {/* Divider */}
                {i < data.users.length - 1 && (
                  <div className="h-px bg-white/[0.06]" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="relative px-5 py-10 text-center">
            <p className="font-body text-[13px] text-aura-muted">
              No users found.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="font-body text-[12px] text-white/50">
            Page {data.page} of {data.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg bg-[rgba(49,49,49,0.6)] p-2 text-aura-muted2 transition-all hover:bg-[rgba(49,49,49,0.8)] hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() =>
                setPage((p) => Math.min(data.totalPages, p + 1))
              }
              disabled={page >= data.totalPages}
              className="rounded-lg bg-[rgba(49,49,49,0.6)] p-2 text-aura-muted2 transition-all hover:bg-[rgba(49,49,49,0.8)] hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
