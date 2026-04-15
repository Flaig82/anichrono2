"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Compass, Check, X, ExternalLink, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import RouteBadge from "@/components/franchise/RouteBadge";
import { ROUTE_TYPE_LABELS, type RouteType } from "@/types/route";

const REJECT_REASONS = [
  "Duplicate of an existing chronicle",
  "Too few entries or low effort",
  "Missing summary — explain why someone should use this route",
  "Entries match the default order — propose an edit to master instead",
  "Inappropriate or spam content",
  "Other",
] as const;

interface PendingRoute {
  id: string;
  franchise_id: string;
  author_id: string;
  title: string;
  route_type: RouteType;
  entry_ids: string[];
  summary: string | null;
  status: string;
  created_at: string;
  master_entry_count: number;
  franchise: {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
  } | null;
  author: {
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
    era: string;
  } | null;
}

export default function AdminRoutesPage() {
  const { profile } = useAuth();
  const [routes, setRoutes] = useState<PendingRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch("/api/admin/routes");
    if (res.ok) {
      const data = await res.json();
      setRoutes(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!profile?.is_admin) return;
    fetchRoutes();
  }, [profile, fetchRoutes]);

  async function handleApprove(routeId: string) {
    setActionInFlight(routeId);
    const res = await fetch(`/api/admin/route/${routeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    if (res.ok) {
      setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    }
    setActionInFlight(null);
  }

  async function handleReject(routeId: string) {
    if (!rejectReason.trim()) return;
    setActionInFlight(routeId);
    const res = await fetch(`/api/admin/route/${routeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", reject_reason: rejectReason.trim() }),
    });
    if (res.ok) {
      setRoutes((prev) => prev.filter((r) => r.id !== routeId));
      setRejectingId(null);
      setRejectReason("");
    }
    setActionInFlight(null);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="font-brand text-xl font-bold text-white">Routes</h1>
        <p className="font-body text-[13px] text-aura-muted2">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-brand text-xl font-bold tracking-tight text-white">
          Routes for review
        </h1>
        <p className="mt-1 font-body text-[13px] text-aura-muted2">
          Approve to make public, reject to return to author as draft.
          {routes.length > 0 && ` · ${routes.length} pending`}
        </p>
      </div>

      {routes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-aura-border bg-aura-bg2 py-16">
          <Compass size={24} className="text-aura-muted" />
          <p className="font-body text-[14px] font-bold text-white">
            No routes pending review
          </p>
          <p className="font-body text-[12px] text-aura-muted2">
            New submissions will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {routes.map((route) => (
            <div
              key={route.id}
              className="flex flex-col gap-4 rounded-xl border border-aura-border bg-aura-bg2 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <RouteBadge routeType={route.route_type} />
                    <Link
                      href={`/franchise/${route.franchise?.slug}`}
                      className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-aura-muted2 transition-colors hover:text-white"
                    >
                      {route.franchise?.title}
                      <ExternalLink size={10} />
                    </Link>
                  </div>
                  <h3 className="font-body text-[16px] font-bold text-white">
                    {route.title}
                  </h3>
                  {route.summary && (
                    <p className="max-w-[700px] font-body text-[13px] leading-relaxed text-aura-muted2">
                      {route.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3 font-mono text-[10px] text-aura-muted2">
                    <div className="flex items-center gap-1.5">
                      {route.author?.avatar_url ? (
                        <Image
                          src={route.author.avatar_url}
                          alt={route.author.display_name}
                          width={16}
                          height={16}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="h-[16px] w-[16px] rounded-full bg-aura-bg3" />
                      )}
                      <span>
                        by{" "}
                        {route.author?.handle
                          ? `@${route.author.handle}`
                          : route.author?.display_name ?? "unknown"}
                      </span>
                    </div>
                    <span>·</span>
                    <span>
                      {route.entry_ids.length} of {route.master_entry_count} master entries
                      {route.entry_ids.length < route.master_entry_count && (
                        <span className="text-aura-orange">
                          {" "}(−{route.master_entry_count - route.entry_ids.length})
                        </span>
                      )}
                    </span>
                    <span>·</span>
                    <span>{ROUTE_TYPE_LABELS[route.route_type]}</span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    onClick={() => handleApprove(route.id)}
                    disabled={actionInFlight === route.id}
                    className="flex items-center gap-1.5 rounded-lg bg-aura-orange px-4 py-2 font-body text-[12px] font-bold text-white transition-colors hover:bg-aura-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setRejectingId(rejectingId === route.id ? null : route.id);
                      setRejectReason("");
                    }}
                    disabled={actionInFlight === route.id}
                    className="flex items-center gap-1.5 rounded-lg border border-aura-border px-4 py-2 font-body text-[12px] font-bold text-aura-muted2 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronDown size={14} />
                    Reject
                  </button>
                </div>
              </div>

              {/* Reject reason picker — shown when admin clicks Reject */}
              {rejectingId === route.id && (
                <div className="flex flex-col gap-3 border-t border-aura-border pt-4">
                  <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
                    Reject reason (shown to author)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {REJECT_REASONS.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setRejectReason(reason)}
                        className={`rounded-full px-3 py-1.5 font-body text-[11px] transition-colors ${
                          rejectReason === reason
                            ? "bg-red-500/20 text-red-400 border border-red-500/40"
                            : "bg-white/[0.05] text-aura-muted2 border border-transparent hover:bg-white/[0.1] hover:text-white"
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(route.id)}
                      disabled={!rejectReason.trim() || actionInFlight === route.id}
                      className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-4 py-2 font-body text-[12px] font-bold text-red-400 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X size={14} />
                      Confirm reject
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRejectReason(""); }}
                      className="font-body text-[12px] text-aura-muted2 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
