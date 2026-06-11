import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * House ad for the sister site. GameChrono runs the mirror of this card
 * pointing back at AnimeChrono — the two sites cross-promote each other.
 * Cyan is GameChrono's brand accent (vs AnimeChrono's orange), so the card
 * reads as a sibling brand, not a native UI element.
 *
 * Variants: "banner" (footer, horizontal) and "compact" (right sidebar,
 * stacked).
 */
const GAMECHRONO_URL =
  "https://www.gameschrono.com/?utm_source=animechrono&utm_medium=referral&utm_campaign=sister-site";

export default function SisterSiteCard({
  variant = "banner",
}: {
  variant?: "banner" | "compact";
}) {
  const compact = variant === "compact";

  return (
    <a
      href={GAMECHRONO_URL}
      target="_blank"
      rel="noopener"
      className={cn(
        "group rounded-xl border border-[#22D3EE]/20 bg-[#22D3EE]/[0.05] transition-colors hover:border-[#22D3EE]/45 hover:bg-[#22D3EE]/[0.09]",
        compact
          ? "flex flex-col gap-2 px-4 py-3.5"
          : "flex items-center justify-between gap-4 px-5 py-4",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
          From the same team
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-base font-bold leading-none text-[#67E8F9]">
            順
          </span>
          <span className="font-brand text-base uppercase leading-none tracking-[-0.8px] text-white">
            <span className="font-bold">Game</span>
            <span className="font-medium">chrono</span>
          </span>
        </span>
        <span className="font-body text-[12px] text-aura-muted2">
          Community-curated play orders for every game franchise.
        </span>
      </div>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1 font-body text-[12px] font-bold text-[#67E8F9] transition-transform group-hover:translate-x-0.5",
          compact && "self-end",
        )}
      >
        Visit
        <ArrowUpRight size={14} />
      </span>
    </a>
  );
}
