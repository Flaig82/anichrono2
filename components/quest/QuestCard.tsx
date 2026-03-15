"use client";

import { Check, ChevronRight, Lock, HelpCircle } from "lucide-react";
import { useDitherHover } from "@/hooks/use-dither-hover";
import type { AuraType } from "@/types/aura";

/* ── Aura type gradient backgrounds (matches DailyQuests pattern) ── */

const AURA_GRADIENTS: Record<string, string> = {
  aura:
    "radial-gradient(ellipse at bottom center, rgba(37,235,126,0.20) 0%, rgba(49,49,49,0) 70%)",
  scholar:
    "radial-gradient(ellipse at bottom center, rgba(139,92,246,0.20) 0%, rgba(49,49,49,0) 70%)",
  archivist:
    "radial-gradient(ellipse at bottom center, rgba(249,115,22,0.20) 0%, rgba(49,49,49,0) 70%)",
};

const AURA_DOT_COLORS: Record<string, string> = {
  aura: "bg-foundation",
  scholar: "bg-scholar",
  archivist: "bg-archivist",
};

const AURA_BAR_COLORS: Record<string, string> = {
  aura: "bg-foundation",
  scholar: "bg-scholar",
  archivist: "bg-archivist",
};

const AURA_LABELS: Record<string, string> = {
  aura: "Watch",
  scholar: "Scholar",
  archivist: "Archivist",
};

/* ── Types ── */

type QuestCategory = "journey" | "weekly" | "seasonal" | "mastery";

interface QuestCardProps {
  title: string;
  flavourText?: string;
  description: string;
  auraType: AuraType;
  auraAmount: number;
  progress: number;
  target: number;
  completed: boolean;
  category: QuestCategory;
  revealed?: boolean;
}

/* ── Component ── */

export default function QuestCard({
  title,
  flavourText,
  description,
  auraType,
  auraAmount,
  progress,
  target,
  completed,
  category,
  revealed = true,
}: QuestCardProps) {
  const { containerRef, canvasRef } = useDitherHover();

  const isActive = !completed && revealed && progress > 0;
  const isLocked = !completed && revealed && progress === 0 && category === "journey";
  const isUnrevealed = !revealed;
  const isMastery = category === "mastery";

  const auraLabel = AURA_LABELS[auraType] ?? "Aura";
  const progressPercent = target > 0 ? Math.min(100, (progress / target) * 100) : 0;

  // Unrevealed mastery quests
  if (isUnrevealed) {
    return (
      <div className="flex items-center gap-6 rounded-xl border border-dashed border-white/[0.1] px-6 py-5">
        <HelpCircle size={20} className="shrink-0 text-aura-muted" />
        <div className="flex flex-1 flex-col gap-1">
          <p className="font-body text-[15px] font-bold tracking-[-0.3px] text-aura-muted">
            ???
          </p>
          <p className="font-body text-[12px] italic tracking-[-0.12px] text-aura-muted">
            A hidden path revealed itself.
          </p>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-aura-muted">
          Hidden
        </span>
      </div>
    );
  }

  return (
    <div
      ref={!completed && !isLocked ? containerRef : undefined}
      className={`relative flex flex-col items-stretch overflow-hidden rounded-xl transition-all duration-200 hover:scale-[1.02] sm:flex-row ${
        completed
          ? "border border-[#313131]"
          : isMastery
            ? "border border-dashed border-white/[0.15]"
            : ""
      }`}
      style={
        completed || isLocked
          ? undefined
          : { backgroundImage: AURA_GRADIENTS[auraType] ?? "" }
      }
    >
      {/* Dither hover + pattern overlay — active/clickable quests only */}
      {!completed && !isLocked && (
        <>
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 z-10 rounded-xl"
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "url(/images/pattern.png)",
              backgroundRepeat: "repeat",
            }}
          />
        </>
      )}

      {/* Left: quest content */}
      <div
        className={`relative flex flex-1 flex-col gap-2 p-4 sm:p-6 ${
          completed ? "opacity-50" : ""
        }`}
      >
        {/* Flavour text (oracle narrator) */}
        {flavourText && (
          <p className="font-body text-[12px] italic leading-snug tracking-[-0.12px] text-aura-muted2">
            &ldquo;{flavourText}&rdquo;
          </p>
        )}

        {/* Title */}
        <p className="font-body text-[15px] font-bold leading-snug tracking-[-0.3px] text-white">
          {title}
        </p>

        {/* Description */}
        <p className="font-body text-[12px] leading-relaxed tracking-[-0.12px] text-white/70">
          {description}
        </p>

        {/* Progress bar — active quests only */}
        {isActive && target > 1 && (
          <div className="mt-1 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  AURA_BAR_COLORS[auraType] ?? "bg-white/30"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-[10px] text-aura-muted2">
              {progress} / {target}
            </span>
          </div>
        )}
      </div>

      {/* Right: reward info */}
      <div
        className={`relative flex shrink-0 flex-row items-center justify-between gap-2 border-t border-white/[0.05] px-4 py-3 sm:w-[180px] sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:p-6 ${
          completed ? "opacity-50" : ""
        }`}
      >
        {/* Aura dot + reward */}
        <div className="flex items-center gap-2.5">
          <span
            className={`h-3.5 w-3.5 shrink-0 rounded-full ${
              AURA_DOT_COLORS[auraType] ?? "bg-aura-muted"
            }`}
          />
          <p className="font-body text-sm font-bold tracking-[-0.28px] text-white">
            +{auraAmount} {auraLabel}
          </p>
        </div>

        {/* Status indicator */}
        {completed ? (
          <div className="flex items-center gap-1.5">
            <Check size={14} className="text-aura-muted2" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted2">
              Earned
            </span>
          </div>
        ) : isLocked ? (
          <div className="flex items-center gap-1.5">
            <Lock size={14} className="text-aura-muted" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
              Locked
            </span>
          </div>
        ) : (
          <ChevronRight size={16} className="text-aura-muted2" />
        )}
      </div>
    </div>
  );
}
