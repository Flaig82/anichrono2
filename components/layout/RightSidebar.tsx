"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import SidebarAuraBreakdown from "./SidebarAuraBreakdown";

interface RightSidebarProps {
  children?: ReactNode;
}

export default function RightSidebar({ children }: RightSidebarProps) {
  return (
    <aside className="flex w-[330px] shrink-0 flex-col gap-6 rounded-xl bg-card p-3.5">
      {/* ── User Aura breakdown ── */}
      <SidebarAuraBreakdown />

      {/* ── AnimeChrono Plus promo ── */}
      <div className="relative mb-4 overflow-visible">
        <div className="relative flex flex-col items-center gap-2.5 overflow-hidden rounded-lg px-6 pb-[38px] pt-6">
          {/* Background: gradient base + image at 15% */}
          <div
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(18,18,18,0.1) 0%, rgba(92,171,213,0.5) 100%), linear-gradient(90deg, #121212 0%, #121212 100%)",
            }}
          />
          <Image
            src="/images/anichronoplus.png"
            alt=""
            aria-hidden
            fill
            className="pointer-events-none rounded-lg object-cover opacity-[0.15]"
            sizes="302px"
          />

          {/* Logo + Tagline */}
          <div className="relative flex flex-col items-center gap-1">
            <div className="flex h-9 items-center justify-center gap-1.5 rounded-lg px-5 py-1.5">
              <span className="text-base leading-none text-aura-orange-hover">順</span>
              <span className="font-brand text-base leading-[0] text-white tracking-[-0.8px]">
                <span className="font-bold leading-normal">Anime</span>
                <span className="font-medium leading-normal">chrono</span>
              </span>
            </div>
            <p className="w-[252px] text-center font-body text-lg font-extrabold text-white tracking-[-0.36px]">
              Your #1 Chronological Source
            </p>
          </div>
        </div>

        {/* Gold pill — overlapping */}
        <div className="absolute -bottom-[15px] left-1/2 flex -translate-x-1/2 items-center justify-center gap-1 overflow-clip rounded-[99px] border-b-[1.333px] border-[#DAB661] bg-[#FFEFC4] px-5 py-2">
          <span className="font-body text-base font-extrabold text-[#121212] tracking-[-0.32px] whitespace-nowrap">
            AnimeChrono Plus!
          </span>
          <ArrowRight size={16} className="text-[#121212]" />
        </div>
      </div>

      {/* ── Page-specific content ── */}
      {children}

      {/* ── Ad banner placeholder ── */}
      <div className="flex h-[600px] w-[300px] items-center justify-center rounded-lg border border-dashed border-white/[0.1] bg-aura-bg3/50">
        <span className="font-body text-[11px] text-aura-muted">
          Ad Space — 300×600
        </span>
      </div>
    </aside>
  );
}
