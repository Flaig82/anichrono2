"use client";

interface RouteProgressProps {
  completed: number;
  total: number;
  variant?: "inline" | "card";
}

/**
 * Visual progress indicator for a user working through a route.
 * Inline = thin bar with "X / Y" label; card = prominent block with percent.
 */
export default function RouteProgress({
  completed,
  total,
  variant = "inline",
}: RouteProgressProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isDone = completed >= total && total > 0;

  if (variant === "card") {
    return (
      <div className="flex flex-col gap-2.5 rounded-xl border border-aura-border bg-aura-bg2 p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
            Route progress
          </span>
          <span className="font-mono text-[13px] font-bold text-white">
            {completed} / {total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-aura-bg3">
          <div
            className="h-full rounded-full bg-aura-orange transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="font-body text-[12px] text-aura-muted2">
          {isDone
            ? "Route complete — nice."
            : `${pct}% of the way through this chronicle.`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
        <span>Progress</span>
        <span>
          {completed} / {total}
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
