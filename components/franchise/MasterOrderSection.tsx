"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import SimilarAnime from "./SimilarAnime";
import FranchiseNews from "./FranchiseNews";
import DiscussionList from "./DiscussionList";
import AuthModal from "@/components/shared/AuthModal";
import EraGateModal from "@/components/shared/EraGateModal";
import ContributionCard from "./ContributionCard";
import EntryNotePopover from "./EntryNotePopover";
import RouteList from "./RouteList";

interface EntryGroupData {
  parentSeries: string;
  entries: Array<
    EntryData & { cover_image_url: string | null }
  >;
}

interface MasterOrderSectionProps {
  franchiseId: string;
  franchiseSlug: string;
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
  franchiseSlug,
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalContext, setAuthModalContext] = useState<"edit" | "track" | "default">("default");
  const [editorAnilistIds, setEditorAnilistIds] = useState<Set<number>>(new Set());
  const [noteEntryId, setNoteEntryId] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const router = useRouter();
  const { watchMap, updateWatch } = useWatchProgress(franchiseId);

  const canPropose = !!user && (profile?.total_aura ?? 0) >= 500;
  const noteEntry = useMemo(
    () => (noteEntryId ? entries.find((e) => e.id === noteEntryId) ?? null : null),
    [noteEntryId, entries],
  );

  const handleNoteClick = useCallback(
    (entryId: string) => {
      if (!user) {
        setAuthModalContext("edit");
        setShowAuthModal(true);
        return;
      }
      if (!canPropose) {
        setShowEraGate(true);
        return;
      }
      setNoteEntryId(entryId);
    },
    [user, canPropose],
  );

  const onWatch = useCallback(
    (entryId: string, value: number) => {
      if (!user) {
        setAuthModalContext("track");
        setShowAuthModal(true);
        return;
      }
      updateWatch(entryId, value);
    },
    [user, updateWatch],
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
      setAuthModalContext("edit");
      setShowAuthModal(true);
      return;
    }
    if ((profile?.total_aura ?? 0) < 500) {
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
          coverImageUrl={franchiseCoverImageUrl}
          genres={heroGenres}
        />

        {/* Auth modal for logged-out users */}
        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} context={authModalContext} />
        )}

        {/* Era gate dialog */}
        <EraGateModal
          open={showEraGate}
          onClose={() => setShowEraGate(false)}
          currentAura={profile?.total_aura ?? 0}
          action="propose"
        />

        {/* Persistent contribution CTA — states for logged-out / Initiate / Wanderer+ */}
        {!isEditing && entries.length > 0 && (
          <ContributionCard
            onProposeEdit={handleEditClick}
            franchiseSlug={franchiseSlug}
          />
        )}

        {/* Single-entry note popover (Wanderer+ inline contribution) */}
        {noteEntry && (
          <EntryNotePopover
            open={!!noteEntry}
            franchiseId={franchiseId}
            entry={noteEntry}
            allEntries={entries}
            onClose={() => setNoteEntryId(null)}
            onSuccess={() => router.refresh()}
          />
        )}

        <FranchiseTabBar
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
        ) : activeTab === "chronicles" ? (
          <RouteList franchiseId={franchiseId} franchiseSlug={franchiseSlug} />
        ) : activeTab === "reviews" ? (
          <FranchiseReviews franchiseId={franchiseId} />
        ) : activeTab === "discussions" ? (
          <DiscussionList franchiseId={franchiseId} />
        ) : activeTab === "chronological" ? (
          <>
            {/* Entry list */}
            <div className="flex flex-col gap-8">
              {entryGroups.map((group) => (
                <EntryGroup
                  key={group.parentSeries}
                  parentSeries={group.parentSeries}
                  franchiseTitle={heroTitle}
                  coverImageUrl={
                    group.entries.find((e) => e.cover_image_url)
                      ?.cover_image_url ?? franchiseCoverImageUrl
                  }
                  status={franchiseStatus}
                  entryType={group.entries[0]?.entry_type ?? "episodes"}
                  entries={group.entries}
                  watchMap={watchMap}
                  onWatch={onWatch}
                  onNoteClick={canPropose ? handleNoteClick : undefined}
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

        {/* Mobile sidebar content — Shop, Activity, Similar (no Aura breakdown) */}
        {!isEditing && (
          <div className="flex flex-col gap-6 rounded-xl bg-card p-3.5 lg:hidden">
            <FranchiseActivity
              franchiseId={franchiseId}
              franchiseTitle={heroTitle}
              currentEntries={entries}
            />
            <FranchiseNews franchiseId={franchiseId} />
            <SimilarAnime franchiseId={franchiseId} />
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
            <FranchiseNews franchiseId={franchiseId} />
            <SimilarAnime franchiseId={franchiseId} />
          </RightSidebar>
        )}
      </div>
    </div>
  );
}
