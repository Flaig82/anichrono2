"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Shield, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWatchProgress } from "@/hooks/use-watch-progress";
import type { EntryData } from "@/types/proposal";
import EntryGroup from "./EntryGroup";
import OrderEditor from "./OrderEditor";
import FranchiseTabBar from "./FranchiseTabBar";
import FranchiseActivity from "./FranchiseActivity";
import FranchiseHero from "./FranchiseHero";
import FranchiseReviews from "./FranchiseReviews";
import RightSidebar from "@/components/layout/RightSidebar";
import RelationsSidebar from "./RelationsSidebar";

interface EntryGroupData {
  parentSeries: string;
  entries: Array<
    EntryData & { cover_image_url: string | null }
  >;
}

interface MasterOrderSectionProps {
  franchiseId: string;
  entries: EntryData[];
  entryGroups: EntryGroupData[];
  franchiseStatus: string;
  franchiseCoverImageUrl: string | null;
  anilistId: number | null;
  heroTitle: string;
  heroDescription: string | null;
  heroBannerImageUrl: string | null;
  heroGenres: string[];
}

export default function MasterOrderSection({
  franchiseId,
  entries,
  entryGroups,
  franchiseStatus,
  franchiseCoverImageUrl,
  anilistId,
  heroTitle,
  heroDescription,
  heroBannerImageUrl,
  heroGenres,
}: MasterOrderSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("chronological");
  const [isEditing, setIsEditing] = useState(false);
  const [showEraGate, setShowEraGate] = useState(false);
  const [editorAnilistIds, setEditorAnilistIds] = useState<Set<number>>(new Set());
  const { user, profile } = useAuth();
  const router = useRouter();
  const { watchMap, updateWatch } = useWatchProgress(franchiseId);

  const onWatch = useCallback(
    (entryId: string, value: number) => {
      updateWatch(entryId, value);
    },
    [updateWatch],
  );

  // AniList IDs from the saved/initial entries
  const savedAnilistIds = useMemo(() => {
    const ids = new Set<number>();
    for (const entry of entries) {
      if (entry.anilist_id != null) {
        ids.add(entry.anilist_id);
      }
    }
    if (anilistId != null) {
      ids.add(anilistId);
    }
    return ids;
  }, [entries, anilistId]);

  // AniList IDs added during this editing session (in editor but not in saved)
  const unsavedAnilistIds = useMemo(() => {
    const ids = new Set<number>();
    Array.from(editorAnilistIds).forEach((id) => {
      if (!savedAnilistIds.has(id)) {
        ids.add(id);
      }
    });
    return ids;
  }, [editorAnilistIds, savedAnilistIds]);

  function handleEditClick() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (profile?.era === "initiate") {
      setShowEraGate(true);
      return;
    }
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
  }

  function handleSubmitSuccess() {
    setIsEditing(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
      {/* Main content column */}
      <div className="flex flex-1 flex-col gap-8">
        <FranchiseHero
          franchiseId={franchiseId}
          title={heroTitle}
          description={heroDescription}
          bannerImageUrl={heroBannerImageUrl}
          genres={heroGenres}
        />

        {/* Era gate dialog */}
        {showEraGate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-sm rounded-2xl border border-aura-border bg-[#1a1a1e] p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aura-orange/10">
                  <Shield size={20} className="text-aura-orange" />
                </div>
                <button
                  onClick={() => setShowEraGate(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-aura-muted transition-colors hover:bg-white/5 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <h3 className="mt-4 font-body text-[16px] font-bold text-white">
                Wanderer Era Required
              </h3>
              <p className="mt-2 font-body text-[13px] leading-relaxed text-aura-muted2">
                You need at least <span className="font-bold text-aura-orange">500 Aura</span> to
                propose edits to watch orders. Complete quests and track your
                watch history to earn Aura and reach Wanderer era.
              </p>
              <div className="mt-2 font-body text-[12px] text-aura-muted">
                Current: {profile?.total_aura ?? 0} / 500 Aura
              </div>
              <button
                onClick={() => setShowEraGate(false)}
                className="mt-5 w-full rounded-lg bg-aura-orange py-2 font-body text-[13px] font-bold text-white transition-colors hover:bg-aura-orange-hover"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        <FranchiseTabBar
          onEditClick={handleEditClick}
          isEditing={isEditing}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        {isEditing ? (
          <OrderEditor
            franchiseId={franchiseId}
            initialEntries={entries}
            franchiseCoverImageUrl={franchiseCoverImageUrl}
            onCancel={handleCancelEdit}
            onSubmitSuccess={handleSubmitSuccess}
            onAnilistIdsChange={setEditorAnilistIds}
          />
        ) : activeTab === "reviews" ? (
          <FranchiseReviews franchiseId={franchiseId} />
        ) : activeTab === "chronological" || activeTab === "release" ? (
          <>
            {/* Entry list */}
            <div className="flex flex-col gap-8">
              {entryGroups.map((group) => (
                <EntryGroup
                  key={group.parentSeries}
                  parentSeries={group.parentSeries}
                  coverImageUrl={
                    group.entries.find((e) => e.cover_image_url)
                      ?.cover_image_url ?? franchiseCoverImageUrl
                  }
                  status={franchiseStatus}
                  entryType={group.entries[0]?.entry_type ?? "episodes"}
                  entries={group.entries}
                  watchMap={user ? watchMap : undefined}
                  onWatch={user ? onWatch : undefined}
                />
              ))}
            </div>

            {/* Empty state */}
            {entries.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-xl bg-[#212121] py-16">
                <p className="font-body text-[14px] font-bold text-white">
                  No watch order yet
                </p>
                <p className="font-body text-xs text-aura-muted2">
                  Be the first to contribute entries to this franchise.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-[#212121] py-16">
            <p className="font-body text-[14px] font-bold text-white">
              Coming soon
            </p>
            <p className="font-body text-xs text-aura-muted2">
              This tab is under construction.
            </p>
          </div>
        )}
      </div>

      {/* Sidebar — switches between Feed and Relations based on edit mode */}
      <div className="sticky top-[68px] hidden h-fit lg:block">
        {isEditing ? (
          <RelationsSidebar
            franchiseId={franchiseId}
            savedAnilistIds={savedAnilistIds}
            unsavedAnilistIds={unsavedAnilistIds}
          />
        ) : (
          <RightSidebar>
            <FranchiseActivity
              franchiseId={franchiseId}
              franchiseTitle={heroTitle}
              currentEntries={entries}
            />
          </RightSidebar>
        )}
      </div>
    </div>
  );
}
