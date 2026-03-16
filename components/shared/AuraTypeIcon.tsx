"use client";

import { Compass, Brain, Stone, type LucideIcon } from "lucide-react";
import type { AuraType } from "@/types/aura";
import { AURA_COLORS } from "@/types/aura";

const ICONS: Record<AuraType, LucideIcon> = {
  aura: Compass,
  scholar: Brain,
  archivist: Stone,
};

interface AuraTypeIconProps {
  type: AuraType;
  size?: number;
  className?: string;
}

export default function AuraTypeIcon({ type, size = 14, className }: AuraTypeIconProps) {
  const Icon = ICONS[type];
  return <Icon size={size} className={className} style={{ color: AURA_COLORS[type] }} />;
}
