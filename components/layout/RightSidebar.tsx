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
    </aside>
  );
}
