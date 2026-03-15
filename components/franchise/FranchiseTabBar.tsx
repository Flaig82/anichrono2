"use client";

import { useState } from "react";
import {
  ListOrdered,
  Clock,
  MessageSquare,
  Eye,
  Compass,
  Pencil,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const tabs = [
  { id: "chronological", label: "Chronological Order", icon: ListOrdered },
  { id: "release", label: "Release Order", icon: Clock },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "predictions", label: "Predictions", icon: Eye },
  { id: "similar", label: "Similar", icon: Compass },
] as const;

type TabId = (typeof tabs)[number]["id"];

interface FranchiseTabBarProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  onEditClick?: () => void;
  isEditing?: boolean;
}

export default function FranchiseTabBar({
  activeTab: controlledTab,
  onTabChange,
  onEditClick,
  isEditing = false,
}: FranchiseTabBarProps) {
  const [internalTab, setInternalTab] = useState<TabId>("chronological");
  const activeTab = controlledTab ?? internalTab;
  const { user } = useAuth();

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

      {/* Edit button — only visible to logged-in users */}
      {user && (
        <button
          onClick={onEditClick}
          className={cn(
            "ml-auto flex items-center gap-2.5 rounded-lg px-5 py-2.5 font-body text-[14px] font-bold tracking-[-0.28px] text-white backdrop-blur-[10px] transition-colors",
            isEditing
              ? "bg-aura-orange"
              : "bg-[rgba(49,49,49,0.6)] hover:bg-[rgba(49,49,49,0.8)]",
          )}
        >
          {isEditing ? <X size={16} /> : <Pencil size={16} />}
          {isEditing ? "Editing" : "Edit"}
        </button>
      )}
    </div>
  );
}
