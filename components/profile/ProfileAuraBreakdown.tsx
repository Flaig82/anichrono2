"use client";

import { AURA_COLORS, AURA_DESCRIPTIONS, AURA_LABELS, AURA_TYPES, type AuraType } from "@/types/aura";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AuraTypeIcon from "@/components/shared/AuraTypeIcon";

interface AuraRow {
  aura_type: AuraType;
  value: number;
}

interface ProfileAuraBreakdownProps {
  auraRows: AuraRow[];
}

export default function ProfileAuraBreakdown({
  auraRows,
}: ProfileAuraBreakdownProps) {
  // Ensure all aura types are represented
  const auraMap = new Map<AuraType, number>();
  for (const row of auraRows) {
    auraMap.set(row.aura_type, row.value);
  }
  const allRows: AuraRow[] = AURA_TYPES.map((type) => ({
    aura_type: type,
    value: auraMap.get(type) ?? 0,
  })).sort((a, b) => b.value - a.value);

  const maxValue = allRows[0]?.value || 1;

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-aura-bg3 p-5">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
        Aura Breakdown
      </span>

      <div className="flex flex-col gap-4">
        {allRows.map((row) => (
          <div key={row.aura_type} className="flex items-center justify-between">
            <div className="flex w-full flex-col gap-2">
              <div className="flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex cursor-default items-center gap-2.5">
                      <AuraTypeIcon type={row.aura_type} size={16} />
                      <span className="font-body text-[13px] tracking-[-0.13px] text-white underline decoration-white/20 decoration-dotted underline-offset-4">
                        {AURA_LABELS[row.aura_type]}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px]">
                    <p className="flex items-center gap-1.5 font-body text-[12px] font-bold text-white">
                      <AuraTypeIcon type={row.aura_type} size={13} />
                      {AURA_LABELS[row.aura_type]}
                    </p>
                    <p className="mt-1 font-body text-[11px] leading-relaxed text-aura-muted2">
                      {AURA_DESCRIPTIONS[row.aura_type]}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-body text-lg font-semibold tracking-[-0.18px] text-white">
                  {row.value.toLocaleString()}
                </span>
              </div>
              <div className="flex h-1.5 items-start overflow-clip rounded-full">
                <div
                  className="h-[3px] shrink-0 rounded transition-all duration-500"
                  style={{
                    width: `${Math.max(8, (row.value / maxValue) * 100)}%`,
                    backgroundColor: AURA_COLORS[row.aura_type],
                  }}
                />
                <div className="h-[3px] min-w-0 flex-1 bg-[#1d1d1d]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
