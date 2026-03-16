"use client";

import { useState } from "react";
import {
  ListOrdered,
  MessageSquare,
  Monitor,
  Pencil,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const tabs = [
  { id: "chronological", label: "Chronological Order", icon: ListOrdered },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
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
  const [showMobileModal, setShowMobileModal] = useState(false);
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

      {/* Affiliate disclosure + Edit button */}
      <span className="ml-auto font-body text-[10px] text-aura-muted/60">
        Paid links on this page
      </span>
      {user && (
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              setShowMobileModal(true);
            } else {
              onEditClick?.();
            }
          }}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-5 py-2.5 font-body text-[14px] font-bold tracking-[-0.28px] text-white backdrop-blur-[10px] transition-colors",
            isEditing
              ? "bg-aura-orange"
              : "bg-[rgba(49,49,49,0.6)] hover:bg-[rgba(49,49,49,0.8)]",
          )}
        >
          {isEditing ? <X size={16} /> : <Pencil size={16} />}
          {isEditing ? "Editing" : "Edit"}
        </button>
      )}

      {/* Mobile editing modal */}
      {showMobileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
          onClick={() => setShowMobileModal(false)}
        >
          <div
            className="flex flex-col items-center gap-4 rounded-xl border border-aura-border bg-aura-bg2 px-6 py-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Monitor size={32} className="text-aura-muted2" />
            <h3 className="font-body text-[16px] font-bold text-white">
              Desktop feature
            </h3>
            <p className="max-w-[260px] font-body text-[13px] leading-relaxed text-aura-muted2">
              Editing watch orders is currently available on desktop only. Switch to a larger screen to make changes.
            </p>
            <button
              onClick={() => setShowMobileModal(false)}
              className="mt-2 rounded-lg bg-aura-orange px-5 py-2.5 font-body text-[14px] font-bold text-white transition-colors hover:brightness-110"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
