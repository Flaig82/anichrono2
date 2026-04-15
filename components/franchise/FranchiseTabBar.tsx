"use client";

import { useState } from "react";
import {
  ListOrdered,
  Compass,
  MessageSquare,
  MessagesSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "chronological", label: "Chronological Order", icon: ListOrdered },
  { id: "chronicles", label: "Chronicles", icon: Compass },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "discussions", label: "Discussions", icon: MessagesSquare },
] as const;

type TabId = (typeof tabs)[number]["id"];

interface FranchiseTabBarProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  isEditing?: boolean;
}

export default function FranchiseTabBar({
  activeTab: controlledTab,
  onTabChange,
  isEditing = false,
}: FranchiseTabBarProps) {
  const [internalTab, setInternalTab] = useState<TabId>("chronological");
  const activeTab = controlledTab ?? internalTab;

  function handleTabClick(tabId: TabId) {
    if (isEditing) return;
    setInternalTab(tabId);
    onTabChange?.(tabId);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => handleTabClick(id)}
          disabled={isEditing}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-body text-[14px] font-bold tracking-[-0.28px] text-white backdrop-blur-[10px] transition-colors md:px-5",
            activeTab === id
              ? "bg-aura-orange"
              : "bg-[rgba(49,49,49,0.6)] hover:bg-[rgba(49,49,49,0.8)]",
            isEditing && "opacity-50 cursor-not-allowed",
          )}
        >
          <Icon size={16} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}

      {/* Affiliate disclosure */}
      <span className="ml-auto font-body text-[10px] text-aura-muted/60">
        Paid links on this page
      </span>
    </div>
  );
}
