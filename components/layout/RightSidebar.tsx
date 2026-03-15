"use client";

import { type ReactNode } from "react";
import SidebarAuraBreakdown from "./SidebarAuraBreakdown";

interface RightSidebarProps {
  children?: ReactNode;
}

export default function RightSidebar({ children }: RightSidebarProps) {
  return (
    <aside className="flex w-[330px] shrink-0 flex-col gap-6 rounded-xl bg-card p-3.5">
      {/* ── User Aura breakdown ── */}
      <SidebarAuraBreakdown />

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
