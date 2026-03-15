"use client";

import { AURA_COLORS, AURA_LABELS, AURA_TYPES, type AuraType } from "@/types/aura";

interface AuraRow {
  aura_type: AuraType;
  value: number;
}

function AuraDiamond({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0"
    >
      <rect
        x="8"
        y="1.5"
        width="9.19"
        height="9.19"
        rx="1.5"
        transform="rotate(45 8 1.5)"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}18`}
      />
    </svg>
  );
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
                <div className="flex items-center gap-2.5">
                  <AuraDiamond color={AURA_COLORS[row.aura_type]} />
                  <span className="font-body text-[13px] tracking-[-0.13px] text-white">
                    {AURA_LABELS[row.aura_type]}
                  </span>
                </div>
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
