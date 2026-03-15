"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RightSidebar from "@/components/layout/RightSidebar";
import HomeFeed from "@/components/layout/HomeFeed";
import SectionLabel from "@/components/shared/SectionLabel";
import QuestsHero from "@/components/layout/QuestsHero";
import QuestCard from "@/components/quest/QuestCard";
import { useQuests } from "@/hooks/use-quests";
import type { QuestCategory } from "@/types/quest";

/* ── Tab config ── */

const VALID_TABS: QuestCategory[] = ["journey", "weekly", "seasonal", "mastery"];

const TAB_DESCRIPTIONS: Record<QuestCategory, string> = {
  journey:
    "Permanent progression quests that guide you through each era. One active at a time -- complete it to reveal the next.",
  weekly:
    "A mix of weekly goals and quick tasks that refresh every Monday at midnight UTC. Ascendant-era users earn 1.5x the base Aura rate.",
  seasonal:
    "12-week quests tied to the Winter 2026 anime season. Completing all earns a permanent season badge.",
  mastery:
    "Hidden quests that reveal themselves when triggered. No list exists -- they find you.",
};

/* ── Inner component (uses useSearchParams) ── */

function QuestsContent() {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: QuestCategory =
    rawTab && VALID_TABS.includes(rawTab as QuestCategory)
      ? (rawTab as QuestCategory)
      : "journey";

  const { quests, isLoading } = useQuests(tab);
  const tabDescription = TAB_DESCRIPTIONS[tab];
  const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1);

  return (
    <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
      {/* Main content */}
      <div className="flex flex-1 flex-col gap-10">
        <QuestsHero />

        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <SectionLabel>{tabLabel} Quests</SectionLabel>
            <p className="max-w-[560px] font-body text-[13px] leading-relaxed tracking-[-0.13px] text-aura-muted2">
              {tabDescription}
            </p>
          </div>

          {/* Quest list */}
          <div className="flex flex-col gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[120px] animate-pulse rounded-xl bg-aura-bg3"
                />
              ))
            ) : quests.length === 0 ? (
              <p className="py-8 text-center font-body text-sm text-aura-muted2">
                No quests available yet.
              </p>
            ) : (
              quests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  title={quest.title}
                  flavourText={quest.flavour_text ?? undefined}
                  description={quest.description}
                  auraType={quest.aura_type}
                  auraAmount={quest.aura_amount}
                  progress={quest.progress}
                  target={quest.target}
                  completed={quest.completed}
                  category={quest.category}
                  revealed={quest.revealed}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Sticky sidebar — hidden on mobile */}
      <div className="sticky top-[68px] hidden h-fit lg:block">
        <RightSidebar>
          <HomeFeed />
        </RightSidebar>
      </div>
    </main>
  );
}

/* ── Page (Suspense wrapper for useSearchParams) ── */

export default function QuestsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
          <div className="flex flex-1 flex-col gap-10">
            <div className="h-[200px] animate-pulse rounded-xl bg-aura-bg3" />
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[120px] animate-pulse rounded-xl bg-aura-bg3"
                />
              ))}
            </div>
          </div>
        </main>
      }
    >
      <QuestsContent />
    </Suspense>
  );
}
