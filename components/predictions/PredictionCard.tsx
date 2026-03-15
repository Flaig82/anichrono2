"use client";

import { useState } from "react";
import Image from "next/image";
import { useDitherHover } from "@/hooks/use-dither-hover";

type PredictionStatus = "open" | "locked" | "resolved";
type PredictionResult = "perfect" | "close" | "in_range" | "miss";

interface PredictionCardProps {
  id: number;
  title: string;
  coverImageUrl: string | null;
  currentScore: number | null;
  status: PredictionStatus;
  userPrediction?: number;
  actualScore?: number;
  result?: PredictionResult;
  auraEarned?: number;
}

const RESULT_CONFIG: Record<PredictionResult, { label: string; icon: string; color: string; bgColor: string }> = {
  perfect: { label: "Perfect", icon: "\u2713", color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
  close:   { label: "Close",   icon: "~",      color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  in_range:{ label: "In Range",icon: "\u25CB",  color: "text-blue-400",   bgColor: "bg-blue-500/20" },
  miss:    { label: "Miss",    icon: "\u2717",  color: "text-red-400",    bgColor: "bg-red-500/20" },
};

function formatScore(score: number | null | undefined): string {
  if (score == null) return "--";
  return (score / 10).toFixed(1);
}

export default function PredictionCard({
  id,
  title,
  coverImageUrl,
  currentScore,
  status,
  userPrediction,
  actualScore,
  result,
  auraEarned,
}: PredictionCardProps) {
  const { containerRef, canvasRef } = useDitherHover();
  const [sliderValue, setSliderValue] = useState(7.0);

  const resultConfig = result ? RESULT_CONFIG[result] : null;

  return (
    <div
      ref={containerRef}
      data-prediction-id={id}
      className="relative overflow-hidden rounded-xl bg-[#212121] p-1 transition-all duration-200 hover:scale-[1.02]"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 rounded-xl"
      />

      {/* Inner card */}
      <div
        className="relative flex gap-4 overflow-hidden rounded-lg p-4"
        style={
          status === "open"
            ? {
                backgroundImage:
                  "linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(236,72,153,0.03) 100%)",
              }
            : undefined
        }
      >
        {/* Cover image */}
        <div className="relative h-[140px] w-[100px] shrink-0 overflow-hidden rounded-lg">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="100px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-aura-bg3">
              <span className="font-mono text-[10px] text-aura-muted">No image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          {/* Header */}
          <div className="flex flex-col gap-1.5">
            <h3 className="truncate font-body text-[15px] font-bold tracking-[-0.3px] text-white">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
                AniList Score
              </span>
              <span className="font-mono text-[12px] font-semibold text-aura-muted2">
                {formatScore(currentScore)}
              </span>
            </div>
          </div>

          {/* Status-specific content */}
          {status === "open" && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-oracle">
                  Predict the final score
                </span>
                <span className="font-mono text-[14px] font-semibold text-white">
                  {sliderValue.toFixed(1)}
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={1}
                max={10}
                step={0.1}
                value={sliderValue}
                onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-oracle [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(236,72,153,0.5)]"
                style={{ accentColor: "#EC4899" }}
              />

              <button className="self-start rounded-full border-b border-aura-orange-hover bg-aura-orange px-4 py-2 font-body text-[13px] font-bold tracking-[-0.26px] text-white transition-colors hover:bg-aura-orange-hover">
                Submit Prediction
              </button>
            </div>
          )}

          {status === "locked" && (
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
                  Your prediction
                </span>
                <span className="font-mono text-[14px] font-semibold text-white">
                  {userPrediction?.toFixed(1) ?? "--"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-aura-muted" />
                <span className="font-mono text-[10px] text-aura-muted">
                  Locked — waiting for finale
                </span>
              </div>
            </div>
          )}

          {status === "resolved" && resultConfig && (
            <div className="flex flex-col gap-2.5 pt-2">
              {/* Result badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold ${resultConfig.bgColor} ${resultConfig.color}`}
                >
                  <span>{resultConfig.icon}</span>
                  {resultConfig.label}
                </span>
                {auraEarned != null && auraEarned > 0 && (
                  <span className="font-mono text-[11px] font-semibold text-oracle">
                    +{auraEarned} Oracle
                  </span>
                )}
              </div>

              {/* Score comparison */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-aura-muted">
                    Predicted
                  </span>
                  <span className="font-mono text-[14px] font-semibold text-white">
                    {userPrediction?.toFixed(1) ?? "--"}
                  </span>
                </div>
                <div className="font-mono text-[12px] text-aura-muted">vs</div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-aura-muted">
                    Actual
                  </span>
                  <span className="font-mono text-[14px] font-semibold text-white">
                    {actualScore != null ? (actualScore / 10).toFixed(1) : "--"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
