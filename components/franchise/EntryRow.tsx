"use client";

import { useState, useCallback, useEffect } from "react";
import { CheckCircle2, Stone } from "lucide-react";
import { cn } from "@/lib/utils";

const ENTRY_TYPE_COLORS: Record<string, string> = {
  episodes: "text-entry-episodes",
  movie: "text-entry-movie",
  ova: "text-entry-ova",
  ona: "text-entry-ona",
  manga: "text-entry-manga",
  special: "text-entry-special",
};

const ENTRY_TYPE_LABELS: Record<string, string> = {
  episodes: "Episodes",
  movie: "Movie",
  ova: "OVA",
  ona: "ONA",
  manga: "Manga",
  special: "Special",
};

interface EntryRowProps {
  entryId: string;
  title: string;
  entryType: string;
  episodeStart: number | null;
  episodeEnd: number | null;
  position: number;
  initialWatched: number;
  onWatch?: (entryId: string, value: number) => void;
}

function getEpisodeCount(
  episodeStart: number | null,
  episodeEnd: number | null,
): number {
  if (episodeStart != null && episodeEnd != null) {
    return episodeEnd - episodeStart + 1;
  }
  return 1;
}

function formatEpisodeInfo(
  entryType: string,
  episodeStart: number | null,
  episodeEnd: number | null,
): string {
  if (entryType !== "episodes") {
    return ENTRY_TYPE_LABELS[entryType] ?? entryType;
  }
  if (episodeStart != null && episodeEnd != null) {
    if (episodeStart === episodeEnd) return `Episode ${episodeStart}`;
    return `Ep ${episodeStart}–${episodeEnd}`;
  }
  if (episodeStart != null) return `Episode ${episodeStart}`;
  return "Episodes";
}

/** SVG progress ring — fills proportionally based on watched/total */
function ProgressRing({
  progress,
  size = 20,
  strokeWidth = 2,
  isComplete,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  isComplete: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  if (isComplete) {
    return <CheckCircle2 size={size} className="text-aura-orange" />;
  }

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-white/[0.12]"
      />
      {/* Progress arc */}
      {progress > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-aura-orange transition-all duration-300"
        />
      )}
    </svg>
  );
}

export default function EntryRow({
  entryId,
  title,
  entryType,
  episodeStart,
  episodeEnd,
  position,
  initialWatched,
  onWatch,
}: EntryRowProps) {
  const isEpisodeBlock =
    entryType === "episodes" &&
    episodeStart != null &&
    episodeEnd != null &&
    episodeEnd > episodeStart;

  const totalEpisodes = isEpisodeBlock
    ? getEpisodeCount(episodeStart, episodeEnd)
    : 1;

  const [watched, setWatched] = useState(initialWatched);
  const [auraFlash, setAuraFlash] = useState(false);

  // Sync local state when SWR data arrives after mount
  useEffect(() => {
    setWatched(initialWatched);
  }, [initialWatched]);

  const isComplete = watched >= totalEpisodes;
  const progress = totalEpisodes > 0 ? watched / totalEpisodes : 0;
  const typeColor = ENTRY_TYPE_COLORS[entryType] ?? "text-aura-muted2";
  const episodeInfo = formatEpisodeInfo(entryType, episodeStart, episodeEnd);
  const auraPerUnit = 1;
  const earnedAura = auraPerUnit * watched;

  const flashAura = useCallback(() => {
    setAuraFlash(true);
    setTimeout(() => setAuraFlash(false), 400);
  }, []);

  function setAndSync(newValue: number) {
    setWatched(newValue);
    if (newValue !== watched) {
      if (newValue > watched) flashAura();
      onWatch?.(entryId, newValue);
    }
  }

  function handleClick() {
    if (isEpisodeBlock) {
      setAndSync(isComplete ? 0 : watched + 1);
    } else {
      setAndSync(isComplete ? 0 : 1);
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (!isEpisodeBlock) return;
    e.preventDefault();
    setAndSync(isComplete ? 0 : totalEpisodes);
  }

  function handleDecrement() {
    if (watched > 0) setAndSync(watched - 1);
  }

  function handleIncrement() {
    if (!isComplete) setAndSync(watched + 1);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl p-3 transition-colors sm:gap-3 sm:p-[14px]",
        isComplete ? "bg-[#1a2a1a]" : "bg-[#212121]",
      )}
    >
      {/* Progress ring / checkbox — consistent left side for all rows */}
      <button
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="shrink-0 transition-transform hover:scale-110"
        title={
          isEpisodeBlock
            ? isComplete
              ? "Reset progress"
              : "Click to increment · Right-click to complete all"
            : isComplete
              ? "Mark unwatched"
              : "Mark watched"
        }
      >
        <ProgressRing
          progress={progress}
          isComplete={isComplete}
        />
      </button>

      {/* Position number */}
      <span className="w-6 shrink-0 text-center font-body text-xs text-aura-muted">
        {position}
      </span>

      {/* Title */}
      <span
        className={cn(
          "flex-1 font-body text-[14px] font-bold tracking-[-0.28px]",
          isComplete ? "text-white/50" : "text-white",
        )}
      >
        {title}
      </span>

      {/* Episode info + stepper for blocks, plain label for singles */}
      {isEpisodeBlock ? (
        <div className="flex shrink-0 items-center">
          <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.06] px-1 py-0.5">
            <button
              onClick={handleDecrement}
              disabled={watched === 0}
              className="flex h-5 w-5 items-center justify-center rounded text-aura-muted transition-colors hover:text-white disabled:opacity-30"
            >
              <span className="text-sm leading-none">−</span>
            </button>
            <span className="min-w-[40px] text-center font-body text-xs font-bold tabular-nums text-white">
              {watched}<span className="text-aura-muted">/{totalEpisodes}</span>
            </span>
            <button
              onClick={handleIncrement}
              disabled={isComplete}
              className="flex h-5 w-5 items-center justify-center rounded text-aura-muted transition-colors hover:text-white disabled:opacity-30"
            >
              <span className="text-sm leading-none">+</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden shrink-0 items-center justify-end sm:flex sm:w-[150px]">
          <span className={`font-body text-xs font-light ${typeColor}`}>
            {episodeInfo}
          </span>
        </div>
      )}

      {/* Base aura indicator */}
      <div
        className={cn(
          "hidden w-[60px] shrink-0 items-center justify-end gap-1 transition-all duration-300 sm:flex",
          earnedAura > 0 || isComplete ? "opacity-100" : "opacity-[0.48]",
          auraFlash && "scale-125",
        )}
      >
        <Stone
          size={14}
          className={cn(
            "text-aura-foundation transition-all duration-300",
            auraFlash &&
              "text-aura-orange drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]",
          )}
        />
        <span
          className={cn(
            "font-body text-xs font-bold tabular-nums text-aura-foundation transition-all duration-300",
            auraFlash && "text-white",
          )}
        >
          +{isEpisodeBlock ? earnedAura : isComplete ? auraPerUnit : 0}
        </span>
      </div>
    </div>
  );
}
