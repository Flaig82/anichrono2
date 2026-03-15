import RightSidebar from "@/components/layout/RightSidebar";
import HomeFeed from "@/components/layout/HomeFeed";
import SectionLabel from "@/components/shared/SectionLabel";
import QuestsHero from "@/components/layout/QuestsHero";
import QuestCard from "@/components/quest/QuestCard";
import type { AuraType } from "@/types/aura";

/* ── Quest data type ── */

interface QuestData {
  id: string;
  title: string;
  flavourText?: string;
  description: string;
  auraType: AuraType;
  auraAmount: number;
  progress: number;
  target: number;
  completed: boolean;
  revealed: boolean;
  category: "journey" | "weekly" | "seasonal" | "mastery";
}

/* ── Placeholder quest data ── */

const JOURNEY_QUESTS: QuestData[] = [
  {
    id: "j-1",
    title: "Complete your profile",
    flavourText: "Your signal is faint. Begin.",
    description:
      "Fill out your display name, handle, and avatar to initialize your Aura tree.",
    auraType: "aura",
    auraAmount: 25,
    progress: 1,
    target: 1,
    completed: true,
    revealed: true,
    category: "journey",
  },
  {
    id: "j-2",
    title: "Mark your first anime as complete",
    flavourText: "Every journey starts with one.",
    description:
      "Add any anime to your watch history and mark it as completed.",
    auraType: "aura",
    auraAmount: 50,
    progress: 1,
    target: 1,
    completed: true,
    revealed: true,
    category: "journey",
  },
  {
    id: "j-3",
    title: "Complete 5 anime",
    flavourText: "Reach five.",
    description:
      "Mark 5 different anime as completed in your watch history to unlock the Wanderer era.",
    auraType: "aura",
    auraAmount: 150,
    progress: 3,
    target: 5,
    completed: false,
    revealed: true,
    category: "journey",
  },
  {
    id: "j-4",
    title: "Complete a pre-2000 anime",
    flavourText: "Old light travels far.",
    description:
      "Finish an anime that started airing before the year 2000. The classics shaped everything that followed.",
    auraType: "pioneer",
    auraAmount: 120,
    progress: 0,
    target: 1,
    completed: false,
    revealed: true,
    category: "journey",
  },
  {
    id: "j-5",
    title: "Complete an 8+ entry franchise",
    flavourText: "Depth over breadth.",
    description:
      "Finish every entry in a franchise with 8 or more items in its master order.",
    auraType: "aura",
    auraAmount: 250,
    progress: 0,
    target: 1,
    completed: false,
    revealed: true,
    category: "journey",
  },
];

const WEEKLY_QUESTS: QuestData[] = [
  {
    id: "wq-1",
    title: "Complete 2 episodes from any Chronicle",
    description:
      "Make progress on any active Chronicle this week. Steady viewing earns steady Aura.",
    auraType: "aura",
    auraAmount: 40,
    progress: 1,
    target: 2,
    completed: false,
    revealed: true,
    category: "weekly",
  },
  {
    id: "wq-2",
    title: "Write a review for any completed anime",
    description:
      "Share your thoughts on a show you've finished. Minimum 50 words.",
    auraType: "scholar",
    auraAmount: 35,
    progress: 0,
    target: 1,
    completed: false,
    revealed: true,
    category: "weekly",
  },
  {
    id: "wq-3",
    title: "Vote on a Chronicle proposal",
    description:
      "Help the community decide which watch orders are worthy of approval.",
    auraType: "archivist",
    auraAmount: 20,
    progress: 1,
    target: 1,
    completed: true,
    revealed: true,
    category: "weekly",
  },
  {
    id: "wq-4",
    title: "Rate a completed show",
    description: "Leave a score on something in your completed list.",
    auraType: "scholar",
    auraAmount: 15,
    progress: 1,
    target: 1,
    completed: true,
    revealed: true,
    category: "weekly",
  },
  {
    id: "wq-5",
    title: "Add a show from the current season to your watchlist",
    description: "Keep up with what's airing this season.",
    auraType: "pioneer",
    auraAmount: 15,
    progress: 0,
    target: 1,
    completed: false,
    revealed: true,
    category: "weekly",
  },
];

const SEASONAL_QUESTS: QuestData[] = [
  {
    id: "sq-1",
    title: "Winter Warrior",
    description:
      "Complete 3 anime that are currently airing in the Winter 2026 season.",
    auraType: "aura",
    auraAmount: 200,
    progress: 1,
    target: 3,
    completed: false,
    revealed: true,
    category: "seasonal",
  },
  {
    id: "sq-2",
    title: "Oracle's Trial",
    description:
      "Submit 5 score predictions for currently airing shows this season.",
    auraType: "oracle",
    auraAmount: 150,
    progress: 2,
    target: 5,
    completed: false,
    revealed: true,
    category: "seasonal",
  },
  {
    id: "sq-3",
    title: "Community Pillar",
    description:
      "Submit 2 Chronicle proposals to help improve the community watch orders.",
    auraType: "archivist",
    auraAmount: 100,
    progress: 0,
    target: 2,
    completed: false,
    revealed: true,
    category: "seasonal",
  },
  {
    id: "sq-4",
    title: "Season Review",
    description:
      "Write 3 reviews for anime airing in the Winter 2026 season.",
    auraType: "scholar",
    auraAmount: 120,
    progress: 1,
    target: 3,
    completed: false,
    revealed: true,
    category: "seasonal",
  },
];

const MASTERY_QUESTS: QuestData[] = [
  {
    id: "mq-1",
    title: "Ghost",
    flavourText: "Some signals are heard only by those who listen.",
    description:
      "Complete an anime with fewer than 1,000 members on AniList. Unlocks the Ghost title.",
    auraType: "pioneer",
    auraAmount: 500,
    progress: 0,
    target: 1,
    completed: false,
    revealed: true,
    category: "mastery",
  },
  {
    id: "mq-2",
    title: "Time Traveler",
    flavourText: "Every decade has a voice. Listen to them all.",
    description:
      "Complete anime from 5 different decades. Unlocks the Time Traveler title.",
    auraType: "pioneer",
    auraAmount: 600,
    progress: 2,
    target: 5,
    completed: false,
    revealed: true,
    category: "mastery",
  },
  {
    id: "mq-3",
    title: "???",
    description: "",
    auraType: "pioneer",
    auraAmount: 0,
    progress: 0,
    target: 0,
    completed: false,
    revealed: false,
    category: "mastery",
  },
  {
    id: "mq-4",
    title: "???",
    description: "",
    auraType: "oracle",
    auraAmount: 0,
    progress: 0,
    target: 0,
    completed: false,
    revealed: false,
    category: "mastery",
  },
];

/* ── Tab config ── */

const TAB_QUESTS: Record<string, QuestData[]> = {
  journey: JOURNEY_QUESTS,
  weekly: WEEKLY_QUESTS,
  seasonal: SEASONAL_QUESTS,
  mastery: MASTERY_QUESTS,
};

const TAB_DESCRIPTIONS: Record<string, string> = {
  journey:
    "Permanent progression quests that guide you through each era. One active at a time -- complete it to reveal the next.",
  weekly:
    "A mix of weekly goals and quick tasks that refresh every Monday at midnight UTC. Ascendant-era users earn 1.5x the base Aura rate.",
  seasonal:
    "12-week quests tied to the Winter 2026 anime season. Completing all earns a permanent season badge.",
  mastery:
    "Hidden quests that reveal themselves when triggered. No list exists -- they find you.",
};

/* ── Page ── */

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function QuestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawTab = params.tab;
  const tab =
    typeof rawTab === "string" && rawTab in TAB_QUESTS ? rawTab : "journey";

  const quests = TAB_QUESTS[tab] ?? JOURNEY_QUESTS;
  const tabDescription = TAB_DESCRIPTIONS[tab] ?? TAB_DESCRIPTIONS.journey;
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
            {quests.map((quest) => (
              <QuestCard
                key={quest.id}
                title={quest.title}
                flavourText={quest.flavourText}
                description={quest.description}
                auraType={quest.auraType}
                auraAmount={quest.auraAmount}
                progress={quest.progress}
                target={quest.target}
                completed={quest.completed}
                category={quest.category}
                revealed={quest.revealed}
              />
            ))}
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
