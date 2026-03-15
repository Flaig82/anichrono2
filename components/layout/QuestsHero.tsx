"use client";

import { useRouter, useSearchParams } from "next/navigation";
import SectionLabel from "@/components/shared/SectionLabel";
import { useAuth } from "@/hooks/use-auth";
import { ERA_THRESHOLDS, ERA_EMOJI } from "@/types/aura";
import type { Era } from "@/types/aura";

const QUEST_TABS = [
  { key: "journey", label: "Journey" },
  { key: "weekly", label: "Weekly" },
  { key: "seasonal", label: "Seasonal" },
  { key: "mastery", label: "Mastery" },
] as const;

type QuestTab = (typeof QUEST_TABS)[number]["key"];

function getNextEra(currentEra: Era): Era | null {
  const order: Era[] = ["initiate", "wanderer", "adept", "ascendant"];
  const idx = order.indexOf(currentEra);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1] ?? null;
}

function getEraLabel(era: Era): string {
  return era.charAt(0).toUpperCase() + era.slice(1);
}

export default function QuestsHero() {
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get("tab") as QuestTab) ?? "journey";

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "journey") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.push(`/quests${qs ? `?${qs}` : ""}`);
  };

  const currentEra = profile?.era ?? "initiate";
  const nextEra = getNextEra(currentEra);
  const totalAura = profile?.total_aura ?? 0;
  const currentThreshold = ERA_THRESHOLDS[currentEra];
  const nextThreshold = nextEra ? ERA_THRESHOLDS[nextEra] : null;

  // Progress toward next era as a percentage
  const progressPercent = nextThreshold
    ? Math.min(
        100,
        Math.max(
          0,
          ((totalAura - currentThreshold.min) /
            (nextThreshold.min - currentThreshold.min)) *
            100,
        ),
      )
    : 100;

  const auraToNext = nextThreshold
    ? Math.max(0, nextThreshold.min - totalAura)
    : 0;

  return (
    <div
      className="relative overflow-hidden rounded-xl px-6 py-8 md:px-10 md:py-10 lg:px-16 lg:py-12"
      style={{
        backgroundImage:
          "linear-gradient(270deg, #121212 0%, transparent 100%), linear-gradient(90deg, rgba(245,158,11,0.15), rgba(245,158,11,0.15)), linear-gradient(90deg, #313131, #313131)",
      }}
    >
      {/* Pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url(/images/pattern.png)",
          backgroundRepeat: "repeat",
        }}
      />

      <div className="relative flex flex-col gap-6 md:gap-8">
        {/* Title + description */}
        <div className="flex max-w-full flex-col gap-3.5 lg:max-w-[641px]">
          <SectionLabel>Quests</SectionLabel>
          <h1 className="font-body text-[28px] font-bold leading-none tracking-[-0.56px] text-white md:text-[36px] md:tracking-[-0.72px] lg:text-[48px] lg:tracking-[-0.96px]">
            Earn Aura. Unlock
            <br />
            your era.
          </h1>
          <p className="max-w-[500px] font-body text-sm leading-[1.62] tracking-[-0.14px] text-white">
            Complete quests to earn Aura across six types. Journey quests guide
            your progression, weekly quests refresh every Monday, seasonal
            quests track the current anime season, and mastery quests reveal
            themselves when you least expect it.
          </p>
        </div>

        {/* Era progress — only for logged-in users */}
        {profile && (
          <div className="flex max-w-full flex-col gap-2.5 md:max-w-[480px]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-aura-muted2">
                {ERA_EMOJI[currentEra]} {getEraLabel(currentEra)}
              </span>
              {nextEra ? (
                <span className="font-mono text-[11px] tracking-[0.15em] text-aura-muted">
                  {auraToNext.toLocaleString()} Aura to{" "}
                  {ERA_EMOJI[nextEra]} {getEraLabel(nextEra)}
                </span>
              ) : (
                <span className="font-mono text-[11px] tracking-[0.15em] text-aura-sensei">
                  Max era reached
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-aura-sensei transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <span className="font-mono text-[10px] text-aura-muted">
              {totalAura.toLocaleString()} total Aura
            </span>
          </div>
        )}

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-2">
          {QUEST_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`rounded-full px-4 py-1.5 font-mono text-[12px] font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-aura-orange text-white"
                  : "bg-white/[0.05] text-aura-muted2 hover:bg-white/[0.1]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
