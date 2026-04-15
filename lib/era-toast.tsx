"use client";

import { toast } from "sonner";
import { ERA_EMOJI, type Era } from "@/types/aura";

const ERA_LABEL: Record<Era, string> = {
  initiate: "Initiate",
  wanderer: "Wanderer",
  adept: "Adept",
  ascendant: "Ascendant",
};

const ERA_UNLOCK_COPY: Record<Era, string | null> = {
  initiate: null,
  wanderer: "Proposing edits and creating chronicles unlocked.",
  adept: "Higher proposal limits unlocked.",
  ascendant: "All contribution features unlocked.",
};

/**
 * Fired from the client when the watch API reports the user's era has
 * crossed a threshold since the last response.
 */
export function showEraPromotionToast(newEra: Era) {
  const unlockCopy = ERA_UNLOCK_COPY[newEra];

  toast.custom(
    () => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "16px 18px",
          background: "linear-gradient(135deg, #1a1a1e 0%, #2a1810 100%)",
          border: "1px solid rgba(249, 115, 22, 0.4)",
          borderRadius: "12px",
          fontFamily: "var(--font-montserrat), sans-serif",
          minWidth: "280px",
          boxShadow: "0 8px 32px rgba(249, 115, 22, 0.15)",
        }}
      >
        <div
          style={{
            fontSize: "28px",
            filter: "drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))",
          }}
        >
          {ERA_EMOJI[newEra]}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#F97316",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Era Promotion
          </span>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#EEF0F6" }}>
            You reached {ERA_LABEL[newEra]}
          </span>
          {unlockCopy && (
            <span style={{ fontSize: "12px", color: "#8A94A8", marginTop: "2px" }}>
              {unlockCopy}
            </span>
          )}
        </div>
      </div>
    ),
    { duration: 7000 },
  );
}

interface CompletionNudgeArgs {
  franchiseTitle: string;
  franchiseSlug: string;
  currentAura: number;
  era: Era;
}

/**
 * Fired when the user marks the last entry in a franchise complete.
 * This is the highest-intent contribution moment in the product — the user
 * just formed an opinion about a whole show. Nudge them to share it.
 *
 * - Wanderer+: prompt to propose an edit
 * - Initiate: celebrate the completion, show Aura-to-go for contribution
 */
export function showCompletionNudgeToast({
  franchiseTitle,
  franchiseSlug,
  currentAura,
  era,
}: CompletionNudgeArgs) {
  const isWanderer = era !== "initiate";
  const needed = Math.max(0, 500 - currentAura);

  toast.custom(
    (id) => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "16px 18px",
          background: "#1a1a1e",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "12px",
          fontFamily: "var(--font-montserrat), sans-serif",
          minWidth: "320px",
          maxWidth: "380px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#10B981",
              boxShadow: "0 0 8px #10B98160",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#10B981",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Franchise Complete
          </span>
        </div>

        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#EEF0F6" }}>
            You finished {franchiseTitle}
          </div>
          <div style={{ fontSize: "12px", color: "#8A94A8", marginTop: "3px" }}>
            {isWanderer
              ? "Help the next watcher — propose an edit to the watch order."
              : `${needed} more Aura until you can propose edits.`}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          {isWanderer ? (
            <a
              href={`/franchise/${franchiseSlug}`}
              onClick={() => toast.dismiss(id)}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: "#F97316",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 700,
                borderRadius: "8px",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Propose an edit
            </a>
          ) : (
            <a
              href={`/franchise/${franchiseSlug}`}
              onClick={() => toast.dismiss(id)}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: "rgba(255,255,255,0.05)",
                color: "#EEF0F6",
                fontSize: "12px",
                fontWeight: 700,
                borderRadius: "8px",
                textAlign: "center",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              View franchise
            </a>
          )}
          <button
            onClick={() => toast.dismiss(id)}
            style={{
              padding: "8px 12px",
              background: "transparent",
              color: "#8A94A8",
              fontSize: "12px",
              fontWeight: 700,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    ),
    { duration: 10000 },
  );
}
