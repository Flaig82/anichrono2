"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Check, ScrollText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useDitherHover } from "@/hooks/use-dither-hover";
import SectionLabel from "@/components/shared/SectionLabel";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* ── Aura type gradient backgrounds ── */

const AURA_GRADIENTS: Record<string, string> = {
  pioneer:
    "radial-gradient(ellipse at bottom center, rgba(59,130,246,0.20) 0%, rgba(49,49,49,0) 70%)",
  scholar:
    "radial-gradient(ellipse at bottom center, rgba(37,235,126,0.20) 0%, rgba(49,49,49,0) 70%)",
  oracle:
    "radial-gradient(ellipse at bottom center, rgba(236,72,153,0.20) 0%, rgba(49,49,49,0) 70%)",
  sensei:
    "radial-gradient(ellipse at bottom center, rgba(245,158,11,0.20) 0%, rgba(49,49,49,0) 70%)",
  veteran:
    "radial-gradient(ellipse at bottom center, rgba(16,185,129,0.20) 0%, rgba(49,49,49,0) 70%)",
  archivist:
    "radial-gradient(ellipse at bottom center, rgba(249,115,22,0.20) 0%, rgba(49,49,49,0) 70%)",
};

const AURA_DOT_COLORS: Record<string, string> = {
  pioneer: "bg-aura-pioneer",
  scholar: "bg-emerald-400",
  oracle: "bg-aura-oracle",
  sensei: "bg-aura-sensei",
  veteran: "bg-aura-veteran",
  archivist: "bg-aura-archivist",
};

/* ── Types ── */

interface WeeklyQuest {
  id: string;
  title: string;
  description: string;
  auraType: string;
  auraAmount: number;
  completed: boolean;
}

/* ── Placeholder quests (until quest system is wired to DB) ── */

const PLACEHOLDER_QUESTS: WeeklyQuest[] = [
  {
    id: "wq-1",
    title: "Complete 2 episodes from any Chronicle",
    description:
      "Make progress on any active Chronicle this week.",
    auraType: "veteran",
    auraAmount: 40,
    completed: false,
  },
  {
    id: "wq-2",
    title: "Vote on a Chronicle proposal",
    description:
      "Help the community decide which watch orders are worthy of approval.",
    auraType: "archivist",
    auraAmount: 20,
    completed: false,
  },
  {
    id: "wq-3",
    title: "Rate a completed show",
    description: "Leave a score on something in your completed list.",
    auraType: "scholar",
    auraAmount: 15,
    completed: true,
  },
];

/* ── Countdown hook (resets Monday 00:00 UTC) ── */

function useResetCountdown() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function calc() {
      const now = new Date();
      // Find next Monday 00:00 UTC
      const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon
      const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
      const nextMonday = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday)
      );
      const diff = nextMonday.getTime() - now.getTime();
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      if (d > 0) {
        setTimeLeft(`${d}d ${h}h`);
      } else {
        const m = Math.floor((diff % 3600000) / 60000);
        setTimeLeft(`${h}h ${m.toString().padStart(2, "0")}m`);
      }
    }
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

/* ── Quest card ── */

function QuestCard({ quest }: { quest: WeeklyQuest }) {
  const auraLabel =
    quest.auraType.charAt(0).toUpperCase() + quest.auraType.slice(1);
  const { containerRef, canvasRef } = useDitherHover();

  return (
    <div
      ref={!quest.completed ? containerRef : undefined}
      className={`relative flex flex-1 flex-col gap-3.5 overflow-hidden rounded-xl p-6 transition-all duration-200 hover:scale-[1.02] ${
        quest.completed
          ? "border border-[#313131]"
          : ""
      }`}
      style={
        quest.completed
          ? undefined
          : { backgroundImage: AURA_GRADIENTS[quest.auraType] ?? "" }
      }
    >
      {/* Dither hover + pattern overlay — active quests only */}
      {!quest.completed && (
        <>
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 z-10 rounded-xl"
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{ backgroundImage: "url(/images/pattern.png)", backgroundRepeat: "repeat" }}
          />
        </>
      )}

      {/* Icon */}
      <ScrollText size={16} className={quest.completed ? "text-aura-muted" : "text-aura-muted2"} />

      {/* Content */}
      <div
        className={`flex flex-1 flex-col gap-1 ${
          quest.completed ? "opacity-50" : ""
        }`}
      >
        <p className="font-body text-[15px] font-bold leading-snug tracking-[-0.3px] text-white">
          {quest.title}
        </p>
        <p className="font-body text-[12px] font-light tracking-[-0.12px] text-white">
          {quest.description}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#121212] opacity-[0.48]" />

      {/* Reward row */}
      <div className="flex items-center gap-3.5">
        <span
          className={`h-4 w-4 shrink-0 rounded-full ${
            AURA_DOT_COLORS[quest.auraType] ?? "bg-aura-muted"
          } ${quest.completed ? "opacity-50" : ""}`}
        />
        <p
          className={`flex-1 font-body text-sm font-bold tracking-[-0.28px] text-white ${
            quest.completed ? "opacity-50" : ""
          }`}
        >
          +{quest.auraAmount} {auraLabel} Aura{quest.completed ? " earned" : ""}
        </p>
        {quest.completed ? (
          <Check size={16} className="text-aura-muted2" />
        ) : (
          <ChevronRight size={16} className="text-aura-muted2" />
        )}
      </div>
    </div>
  );
}

/* ── Main component ── */

export default function WeeklyQuests() {
  const { user, isLoading } = useAuth();
  const resetIn = useResetCountdown();

  // Only render for logged-in users
  if (isLoading || !user) return null;

  return (
    <section className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <SectionLabel>Weekly Quests</SectionLabel>
          <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-white/50">
            resets in {resetIn}
          </span>
        </div>
        <Link
          href="/quests"
          className="inline-flex items-center gap-2 rounded-full border border-white/[0.32] px-5 py-2 font-body text-[13px] font-bold text-aura-text/80 transition-all hover:border-white/50 hover:text-aura-text"
        >
          View All Quests
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Quest cards */}
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
        {PLACEHOLDER_QUESTS.map((quest) => (
          <QuestCard key={quest.id} quest={quest} />
        ))}
      </div>
    </section>
  );
}
