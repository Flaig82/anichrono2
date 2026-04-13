"use client";

import { Shield, X } from "lucide-react";
import { ERA_UNLOCKS, type EraUnlock } from "@/lib/era";
import EraProgressBar from "./EraProgressBar";

interface EraGateModalProps {
  open: boolean;
  onClose: () => void;
  currentAura: number;
  action: EraUnlock;
}

/**
 * Shared modal shown when a user tries a contribution action but hasn't
 * reached the required era. Replaces three inline duplicates that previously
 * lived in PosterRow, MasterOrderSection, and CreateChronicleDialog.
 */
export default function EraGateModal({
  open,
  onClose,
  currentAura,
  action,
}: EraGateModalProps) {
  if (!open) return null;

  const unlock = ERA_UNLOCKS[action];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative mx-4 w-full max-w-[420px] rounded-2xl border border-aura-border bg-[#1a1a1e] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="era-gate-title"
      >
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aura-orange/10">
            <Shield size={20} className="text-aura-orange" />
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-aura-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div>
            <h2
              id="era-gate-title"
              className="font-body text-[16px] font-bold text-white"
            >
              Wanderer Era Required
            </h2>
            <p className="mt-1.5 font-body text-[13px] leading-relaxed text-aura-muted2">
              You need{" "}
              <span className="font-bold text-aura-orange">
                {unlock.minAura} Aura
              </span>{" "}
              to {unlock.label.toLowerCase()}. Keep watching and completing
              quests to level up.
            </p>
          </div>

          <EraProgressBar currentAura={currentAura} variant="card" />

          <button
            onClick={onClose}
            className="w-full rounded-lg bg-aura-orange px-4 py-2.5 font-body text-sm font-bold text-white transition-colors hover:bg-aura-orange-hover"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
