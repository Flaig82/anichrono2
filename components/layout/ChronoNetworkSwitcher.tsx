"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Logo + Chrono Network switcher. The wordmark stays a plain home link;
 * the chevron beside it opens a dropdown listing the network's sites
 * (GitHub-org-switcher pattern). GameChrono runs the mirror of this
 * component pointing back here. Add future sites to NETWORK_SITES.
 */
const NETWORK_SITES = [
  {
    key: "animechrono",
    nameBold: "Anime",
    nameRest: "chrono",
    markClass: "text-aura-orange-hover",
    tagline: "Community-curated anime watch orders",
    href: "/",
    external: false,
    current: true,
  },
  {
    key: "gamechrono",
    nameBold: "Game",
    nameRest: "chrono",
    markClass: "text-[#67E8F9]",
    tagline: "Community-curated game play orders",
    href: "https://www.gameschrono.com/?utm_source=animechrono&utm_medium=referral&utm_campaign=chrono-network",
    external: true,
    current: false,
  },
] as const;

export default function ChronoNetworkSwitcher() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Logo — still a plain home link */}
      <Link
        href="/"
        className="flex h-9 items-center gap-1.5 rounded-lg py-1.5 pl-2 pr-1 md:pl-5"
      >
        <span className="text-base text-aura-orange-hover font-bold leading-none">
          順
        </span>
        <span className="hidden font-brand text-base uppercase leading-none text-white tracking-[-0.8px] sm:inline">
          <span className="font-bold">Anime</span>
          <span className="font-medium">chrono</span>
        </span>
      </Link>

      {/* Network toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Chrono Network"
        aria-expanded={open}
        className={cn(
          "mr-1 flex h-6 w-6 items-center justify-center rounded-md transition-colors",
          open
            ? "bg-white/[0.08] text-white"
            : "text-aura-muted hover:bg-white/[0.06] hover:text-white"
        )}
      >
        <ChevronDown
          size={14}
          className={cn("transition-transform duration-150", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-2 top-full z-50 mt-2 w-[280px] overflow-hidden rounded-xl border border-aura-border bg-aura-bg2 shadow-2xl md:left-5">
          <div className="border-b border-aura-border px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
              Chrono Network
            </span>
          </div>

          <div className="flex flex-col gap-0.5 p-2">
            {NETWORK_SITES.map((site) => {
              const row = (
                <div
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04]",
                    site.current && "bg-white/[0.02]"
                  )}
                >
                  <span
                    className={cn(
                      "text-base font-bold leading-none",
                      site.markClass
                    )}
                  >
                    順
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block font-brand text-[14px] uppercase leading-none tracking-[-0.7px] text-white">
                      <span className="font-bold">{site.nameBold}</span>
                      <span className="font-medium">{site.nameRest}</span>
                    </span>
                    <span className="mt-1 block font-body text-[11px] leading-snug text-aura-muted2">
                      {site.tagline}
                    </span>
                  </div>
                  {site.current ? (
                    <Check size={14} className="shrink-0 text-aura-orange" />
                  ) : (
                    <ArrowUpRight
                      size={14}
                      className="shrink-0 text-aura-muted transition-transform group-hover:translate-x-0.5 group-hover:text-white"
                    />
                  )}
                </div>
              );

              return site.external ? (
                <a
                  key={site.key}
                  href={site.href}
                  target="_blank"
                  rel="noopener"
                  onClick={() => setOpen(false)}
                >
                  {row}
                </a>
              ) : (
                <Link key={site.key} href={site.href} onClick={() => setOpen(false)}>
                  {row}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
