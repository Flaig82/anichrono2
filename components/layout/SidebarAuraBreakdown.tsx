"use client";

import useSWR from "swr";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
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

export default function SidebarAuraBreakdown() {
  const { user, profile } = useAuth();

  const { data: auraRows } = useSWR<AuraRow[]>(
    user ? `user-aura-${user.id}` : null,
    async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_aura")
        .select("aura_type, value")
        .eq("user_id", user!.id)
        .order("value", { ascending: false });
      return (data ?? []) as AuraRow[];
    },
  );

  if (!user || !profile) return null;

  // Build a map from fetched rows, then ensure all 3 types are represented
  const auraMap = new Map<AuraType, number>();
  for (const row of auraRows ?? []) {
    auraMap.set(row.aura_type, row.value);
  }
  const allRows: AuraRow[] = AURA_TYPES.map((type) => ({
    aura_type: type,
    value: auraMap.get(type) ?? 0,
  })).sort((a, b) => b.value - a.value);

  const maxValue = allRows[0]?.value || 1;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url(/images/pattern.png)",
          backgroundRepeat: "repeat",
        }}
      />

      <div className="relative flex flex-col gap-1">
        {/* User header */}
        <div className="flex items-center gap-2 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-aura-bg4">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-aura-bg4 font-body text-[10px] font-bold text-white">
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="font-body text-base font-bold tracking-[-0.32px] text-white">
              {profile.display_name}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1 text-right text-white">
            <span className="font-brand text-[32px] font-bold leading-none tracking-[-0.64px]">
              {profile.total_aura.toLocaleString()}
            </span>
            <span className="font-body text-xs font-bold tracking-[-0.12px]">
              &uarr; +340 this season
            </span>
          </div>
        </div>

        {/* Aura type rows */}
        {allRows.map((row) => (
          <div
            key={row.aura_type}
            className="overflow-clip rounded-lg px-4 py-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex w-[160px] flex-col gap-2.5">
                <div className="flex h-4 items-center gap-2.5">
                  <AuraDiamond color={AURA_COLORS[row.aura_type]} />
                  <span className="flex-1 font-body text-xs tracking-[-0.12px] text-white">
                    {AURA_LABELS[row.aura_type]}
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
              <span className="font-body text-xl font-semibold tracking-[-0.2px] text-white">
                {row.value.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
