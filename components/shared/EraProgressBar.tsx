"use client";

import { eraForAura, ERA_UNLOCKS, type EraUnlock } from "@/lib/era";
import { ERA_EMOJI } from "@/types/aura";

interface EraProgressBarProps {
  currentAura: number;
  variant?: "inline" | "card" | "hero";
  highlightUnlock?: EraUnlock;
}

const ERA_LABEL: Record<string, string> = {
  initiate: "Initiate",
  wanderer: "Wanderer",
  adept: "Adept",
  ascendant: "Ascendant",
};

/**
 * Reusable progress indicator for Aura → next era. Three visual variants:
 *  - inline: thin bar with small "X / Y" label, for tight spaces
 *  - card: bordered card with unlock copy, for profile and franchise pages
 *  - hero: prominent version for spotlight moments
 *
 * If `highlightUnlock` is passed, we show "unlocks: {label}" copy to
 * tell the user why progress matters.
 */
export default function EraProgressBar({
  currentAura,
  variant = "inline",
  highlightUnlock,
}: EraProgressBarProps) {
  const progress = eraForAura(currentAura);
  const { era, next, progressToNext, auraToNext, nextThreshold } = progress;

  // Max-era user: show static state
  if (!next || nextThreshold == null) {
    if (variant === "inline") {
      return (
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
          <span>{ERA_EMOJI[era]}</span>
          <span>{ERA_LABEL[era]} — max era reached</span>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-aura-border bg-aura-bg2 p-4 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
          {ERA_EMOJI[era]} {ERA_LABEL[era]}
        </div>
        <p className="mt-1 font-body text-[13px] text-aura-muted2">
          You&apos;ve reached the final era. All contribution features unlocked.
        </p>
      </div>
    );
  }

  const unlock = highlightUnlock ? ERA_UNLOCKS[highlightUnlock] : null;
  const pct = Math.round(progressToNext * 100);

  if (variant === "inline") {
    return (
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
          <span>
            {ERA_EMOJI[era]} {ERA_LABEL[era]}
          </span>
          <span>
            {currentAura} / {nextThreshold}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-aura-bg3">
          <div
            className="h-full rounded-full bg-aura-orange transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className="flex w-full flex-col gap-3 rounded-2xl border border-aura-border bg-aura-bg2 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{ERA_EMOJI[era]}</span>
            <span className="font-body text-[14px] font-bold text-white">
              {ERA_LABEL[era]}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
              → {ERA_LABEL[next]}
            </span>
          </div>
          <span className="font-mono text-[12px] text-aura-muted2">
            {currentAura} / {nextThreshold}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-aura-bg3">
          <div
            className="h-full rounded-full bg-aura-orange transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {unlock && (
          <p className="font-body text-[12px] text-aura-muted2">
            <span className="font-mono uppercase tracking-[0.1em] text-aura-muted">
              Unlocks:
            </span>{" "}
            {unlock.label}{" "}
            <span className="text-aura-orange">
              (in {auraToNext} Aura)
            </span>
          </p>
        )}
      </div>
    );
  }

  // card variant
  return (
    <div className="flex w-full flex-col gap-2.5 rounded-xl border border-aura-border bg-aura-bg2 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
          <span>{ERA_EMOJI[era]}</span>
          <span>
            {ERA_LABEL[era]} → {ERA_LABEL[next]}
          </span>
        </div>
        <span className="font-mono text-[11px] text-aura-muted2">
          {currentAura} / {nextThreshold}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-aura-bg3">
        <div
          className="h-full rounded-full bg-aura-orange transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {unlock && (
        <p className="font-body text-[12px] leading-relaxed text-aura-muted2">
          {auraToNext} more Aura unlocks{" "}
          <span className="font-semibold text-white">{unlock.label}</span>
        </p>
      )}
    </div>
  );
}
