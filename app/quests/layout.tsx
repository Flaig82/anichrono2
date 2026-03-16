import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quests",
  description:
    "Complete quests to earn Aura and level up your anime journey. Daily, weekly, journey, and hidden mastery quests.",
};

export default function QuestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
