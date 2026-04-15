"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  Compass,
  FileEdit,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import RouteBadge from "@/components/franchise/RouteBadge";
import RouteProgress from "./RouteProgress";
import SectionLabel from "@/components/shared/SectionLabel";
import { useAuth } from "@/hooks/use-auth";
import { useRouteProgress } from "@/hooks/use-route-progress";
import type { RouteData } from "@/types/route";
import type { EntryData } from "@/types/proposal";
import { cn } from "@/lib/utils";

interface RouteDetailViewProps {
  route: RouteData & { entries: EntryData[] };
  franchise: { slug: string; title: string; banner_image_url: string | null };
}

const ENTRY_TYPE_LABELS: Record<string, string> = {
  episodes: "Episodes",
  movie: "Movie",
  ova: "OVA",
  ona: "ONA",
  manga: "Manga",
  special: "Special",
};

function formatEpisodeInfo(entry: EntryData): string {
  if (entry.entry_type !== "episodes") {
    return ENTRY_TYPE_LABELS[entry.entry_type] ?? entry.entry_type;
  }
  if (entry.episode_start != null && entry.episode_end != null) {
    if (entry.episode_start === entry.episode_end)
      return `Ep ${entry.episode_start}`;
    return `Ep ${entry.episode_start}–${entry.episode_end}`;
  }
  return "Episodes";
}

/**
 * Route detail page — the landing page for a chronicle card click.
 *
 * Shows title + author + summary in the hero, followed by the ordered entry
 * list. Logged-in users get vote buttons, a follow toggle, and a per-entry
 * "mark watched" checkbox that updates their route_progress.
 */
export default function RouteDetailView({
  route,
  franchise,
}: RouteDetailViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { completedSet, toggleEntry } = useRouteProgress(route.id);

  // Local optimistic state for vote + follow so the UI doesn't wait on
  // revalidation. Server is authoritative on refresh.
  const [voteCount, setVoteCount] = useState(route.vote_count);
  const [userVote, setUserVote] = useState<number | null>(
    route.user_vote ?? null,
  );
  const [followerCount, setFollowerCount] = useState(route.follower_count);
  const [isFollowed, setIsFollowed] = useState(route.is_followed ?? false);
  const [status, setStatus] = useState(route.status);
  const [authorActionInFlight, setAuthorActionInFlight] =
    useState<"submit" | "withdraw" | "delete" | null>(null);
  const [authorError, setAuthorError] = useState<string | null>(null);

  async function handleVote(value: -1 | 1) {
    if (!user) return;
    const previous = userVote;
    // Optimistic
    if (previous === value) {
      setUserVote(null);
      setVoteCount((c) => c - value);
    } else {
      setUserVote(value);
      setVoteCount((c) => c - (previous ?? 0) + value);
    }

    const method = previous === value ? "DELETE" : "POST";
    const res = await fetch(`/api/route/${route.id}/vote`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify({ value }) : undefined,
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.vote_count === "number") setVoteCount(data.vote_count);
    } else {
      // Rollback
      setUserVote(previous);
      setVoteCount(route.vote_count);
    }
  }

  async function handleFollow() {
    if (!user) return;
    const wasFollowed = isFollowed;
    setIsFollowed(!wasFollowed);
    setFollowerCount((c) => c + (wasFollowed ? -1 : 1));

    const res = await fetch(`/api/route/${route.id}/follow`, {
      method: wasFollowed ? "DELETE" : "POST",
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.follower_count === "number")
        setFollowerCount(data.follower_count);
    } else {
      setIsFollowed(wasFollowed);
      setFollowerCount((c) => c + (wasFollowed ? 1 : -1));
    }
  }

  const isOwnRoute = user?.id === route.author_id;
  const isPublic = status === "approved" || status === "canon";
  const canVote = !!user && !isOwnRoute && isPublic;
  const canTrackProgress = !!user && isPublic;
  const completedCount = Array.from(completedSet).filter((id) =>
    route.entry_ids.includes(id),
  ).length;

  async function handleAuthorAction(action: "submit" | "withdraw" | "delete") {
    setAuthorActionInFlight(action);
    setAuthorError(null);

    try {
      if (action === "delete") {
        const res = await fetch(`/api/route/${route.id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setAuthorError(data.error ?? "Failed to delete.");
          setAuthorActionInFlight(null);
          return;
        }
        router.push(`/franchise/${franchise.slug}`);
        return;
      }

      const path =
        action === "submit"
          ? `/api/route/${route.id}/submit`
          : `/api/route/${route.id}/withdraw`;

      const res = await fetch(path, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAuthorError(data.error ?? "Action failed.");
        setAuthorActionInFlight(null);
        return;
      }
      const data = await res.json();
      if (data.status) setStatus(data.status);
    } catch {
      setAuthorError("Network error. Please try again.");
    } finally {
      setAuthorActionInFlight(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Back link */}
      <Link
        href={`/franchise/${franchise.slug}`}
        className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-aura-muted transition-colors hover:text-white"
      >
        <ArrowLeft size={12} />
        Back to {franchise.title}
      </Link>

      {/* Author-only status banner — shown when viewing own draft / in_review */}
      {isOwnRoute && !isPublic && (
        <div className="flex flex-col gap-3 rounded-xl border border-aura-orange/30 bg-aura-orange/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-aura-orange/10">
              <FileEdit size={16} className="text-aura-orange" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="font-body text-[14px] font-bold text-white">
                {status === "draft"
                  ? "Draft · only you can see this"
                  : "In community review"}
              </h3>
              <p className="font-body text-[12px] leading-snug text-aura-muted2">
                {status === "draft"
                  ? "Save whenever. When you're ready, submit for community review."
                  : "Admins are reviewing this chronicle. You can withdraw to keep editing."}
              </p>
              {status === "draft" && route.reject_reason && (
                <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-red-400">
                    Returned by reviewer
                  </p>
                  <p className="mt-0.5 font-body text-[12px] leading-snug text-red-300">
                    {route.reject_reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-4">
            {status === "draft" ? (
              <button
                type="button"
                onClick={() => handleAuthorAction("submit")}
                disabled={authorActionInFlight !== null}
                className="flex items-center gap-1.5 rounded-lg bg-aura-orange px-4 py-2 font-body text-[13px] font-bold text-white transition-colors hover:bg-aura-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={13} />
                {authorActionInFlight === "submit"
                  ? "Submitting..."
                  : "Submit for review"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleAuthorAction("withdraw")}
                disabled={authorActionInFlight !== null}
                className="flex items-center gap-1.5 rounded-lg border border-aura-border bg-white/[0.03] px-4 py-2 font-body text-[13px] font-bold text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Undo2 size={13} />
                {authorActionInFlight === "withdraw"
                  ? "Withdrawing..."
                  : "Withdraw"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    "Delete this chronicle? This can't be undone.",
                  )
                ) {
                  handleAuthorAction("delete");
                }
              }}
              disabled={authorActionInFlight !== null}
              className="flex items-center gap-1.5 rounded-lg border border-aura-border bg-transparent px-4 py-2 font-body text-[13px] font-bold text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>
      )}

      {authorError && (
        <p className="font-body text-[13px] text-red-400">{authorError}</p>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-aura-border">
        {franchise.banner_image_url && (
          <div className="absolute inset-0">
            <Image
              src={franchise.banner_image_url}
              alt={franchise.title}
              fill
              className="object-cover opacity-30"
              sizes="(max-width: 1024px) 100vw, 800px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/70 to-[#0a0a0c]/40" />
          </div>
        )}
        <div className="relative flex flex-col gap-4 p-6 md:p-10">
          <div className="flex items-center gap-2">
            <RouteBadge routeType={route.route_type} isCanon={route.is_canon} />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
              {franchise.title}
            </span>
            {route.staleness?.isStale && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-400">
                <AlertTriangle size={10} />
                {route.staleness.label}
              </span>
            )}
          </div>
          <h1 className="font-body text-[28px] font-bold leading-none tracking-[-0.56px] text-white md:text-[40px]">
            {route.title}
          </h1>
          {route.summary && (
            <p className="max-w-[640px] font-body text-[14px] leading-relaxed text-aura-muted2 md:text-[15px]">
              {route.summary}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-4">
            {route.author && (
              <Link
                href={
                  route.author.handle
                    ? `/u/${route.author.handle}`
                    : "#"
                }
                className="flex items-center gap-2 text-white transition-colors hover:text-aura-orange"
              >
                {route.author.avatar_url ? (
                  <Image
                    src={route.author.avatar_url}
                    alt={route.author.display_name}
                    width={22}
                    height={22}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-[22px] w-[22px] rounded-full bg-aura-bg3" />
                )}
                <span className="font-body text-[13px] font-semibold">
                  by{" "}
                  {route.author.handle
                    ? `@${route.author.handle}`
                    : route.author.display_name}
                </span>
              </Link>
            )}

            <div className="flex items-center gap-3 font-mono text-[11px] text-aura-muted2">
              <span className="flex items-center gap-1">
                <Compass size={12} />
                {route.entry_ids.length} entries
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                {followerCount} following
              </span>
            </div>
          </div>

          {/* Action bar — only shown once the chronicle is public */}
          {isPublic && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-aura-border bg-aura-bg2/60 p-1 backdrop-blur-sm">
              <button
                onClick={() => handleVote(1)}
                disabled={!canVote}
                className={cn(
                  "flex items-center gap-1 rounded-md px-3 py-1.5 font-mono text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  userVote === 1
                    ? "bg-aura-orange text-white"
                    : "text-aura-muted2 hover:text-white",
                )}
                title={
                  !user
                    ? "Sign in to vote"
                    : isOwnRoute
                      ? "Cannot vote on your own route"
                      : "Upvote"
                }
              >
                <ThumbsUp size={12} />
                {voteCount}
              </button>
              <button
                onClick={() => handleVote(-1)}
                disabled={!canVote}
                className={cn(
                  "flex items-center gap-1 rounded-md px-3 py-1.5 font-mono text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  userVote === -1
                    ? "bg-red-500/20 text-red-400"
                    : "text-aura-muted2 hover:text-white",
                )}
                title={
                  !user
                    ? "Sign in to vote"
                    : isOwnRoute
                      ? "Cannot vote on your own route"
                      : "Downvote"
                }
              >
                <ThumbsDown size={12} />
              </button>
            </div>

            {user && (
              <button
                onClick={handleFollow}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-2 font-body text-[13px] font-bold transition-colors",
                  isFollowed
                    ? "border border-aura-border bg-aura-bg2/60 text-white hover:bg-aura-bg3 backdrop-blur-sm"
                    : "bg-aura-orange text-white hover:bg-aura-orange-hover",
                )}
              >
                {isFollowed ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {isFollowed ? "Following" : "Follow route"}
              </button>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Progress + entries */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-4">
          {canTrackProgress ? (
            <RouteProgress
              completed={completedCount}
              total={route.entries.length}
              variant="card"
            />
          ) : !isPublic ? (
            <div className="rounded-xl border border-aura-border bg-aura-bg2 p-4">
              <p className="font-body text-[12px] text-aura-muted2">
                Progress tracking becomes available once this chronicle is
                approved.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-aura-border bg-aura-bg2 p-4">
              <p className="font-body text-[12px] text-aura-muted2">
                <Link
                  href="/signup"
                  className="font-bold text-aura-orange hover:underline"
                >
                  Sign up
                </Link>{" "}
                to track your progress through this route.
              </p>
            </div>
          )}
        </div>

        <section className="flex flex-col gap-3">
          <SectionLabel>Ordered entries</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {route.entries.map((entry, idx) => {
              const isWatched = completedSet.has(entry.id);
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-2 rounded-xl p-3 transition-colors sm:gap-3 sm:p-[14px]",
                    isWatched ? "bg-[#1a2a1a]" : "bg-[#212121]",
                  )}
                >
                  <button
                    onClick={() => canTrackProgress && toggleEntry(entry.id)}
                    disabled={!canTrackProgress}
                    className="shrink-0 transition-transform hover:scale-110 disabled:cursor-not-allowed"
                    title={
                      !user
                        ? "Sign in to track progress"
                        : !isPublic
                          ? "Progress unlocks after approval"
                          : isWatched
                            ? "Mark unwatched"
                            : "Mark watched"
                    }
                  >
                    {isWatched ? (
                      <CheckCircle2
                        size={20}
                        className="text-aura-orange"
                      />
                    ) : (
                      <Circle size={20} className="text-aura-muted" />
                    )}
                  </button>
                  <span className="w-6 shrink-0 text-center font-mono text-[11px] font-bold text-aura-orange">
                    {idx + 1}
                  </span>
                  <span
                    className={cn(
                      "flex-1 font-body text-[14px] font-bold tracking-[-0.28px]",
                      isWatched ? "text-white/50" : "text-white",
                    )}
                  >
                    {entry.title}
                  </span>
                  <span className="font-body text-xs font-light text-aura-muted2">
                    {formatEpisodeInfo(entry)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
