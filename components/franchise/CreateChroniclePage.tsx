"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Info, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { AniListMediaFull, AniListRelation } from "@/lib/anilist";
import type { EditorEntry } from "@/types/proposal";
import OrderEditor from "./OrderEditor";
import RelationsSidebar from "./RelationsSidebar";
import CreateChronicleDialog from "./CreateChronicleDialog";
import AuthModal from "@/components/shared/AuthModal";

interface CreateChroniclePageProps {
  media: AniListMediaFull;
  relations: AniListRelation[];
  initialEntries: EditorEntry[];
  matchedFranchise?: {
    slug: string;
    title: string;
    coverImageUrl: string | null;
  } | null;
}

export default function CreateChroniclePage({
  media,
  relations,
  initialEntries,
  matchedFranchise,
}: CreateChroniclePageProps) {
  const { user, profile } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEraGate, setShowEraGate] = useState(false);
  const [editorEntries, setEditorEntries] = useState<EditorEntry[] | null>(null);
  const [editorAnilistIds, setEditorAnilistIds] = useState<Set<number>>(new Set());

  const title = media.titleEnglish ?? media.titleRomaji;

  // Use a placeholder franchise ID for editor (entries don't have a real franchise yet)
  const placeholderFranchiseId = "00000000-0000-0000-0000-000000000000";

  // AniList IDs from initial entries (treated as "saved" for sidebar status)
  const savedAnilistIds = useMemo(() => {
    const ids = new Set<number>();
    for (const entry of initialEntries) {
      if (entry.anilist_id != null) ids.add(entry.anilist_id);
    }
    ids.add(media.id);
    return ids;
  }, [initialEntries, media.id]);

  const unsavedAnilistIds = useMemo(() => {
    const ids = new Set<number>();
    Array.from(editorAnilistIds).forEach((id) => {
      if (!savedAnilistIds.has(id)) ids.add(id);
    });
    return ids;
  }, [editorAnilistIds, savedAnilistIds]);

  const handleSubmit = useCallback(
    (entries: EditorEntry[]) => {
      if (!user) {
        setShowAuthModal(true);
        return;
      }
      if (!profile || (profile.total_aura ?? 0) < 500) {
        setShowEraGate(true);
        return;
      }
      setEditorEntries(entries);
      setShowCreateDialog(true);
    },
    [user, profile],
  );

  const scoreDisplay = media.averageScore
    ? (media.averageScore / 10).toFixed(1)
    : null;

  return (
    <main className="px-4 md:px-8 lg:px-[120px] pt-10 pb-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
        {/* Main content column */}
        <div className="flex flex-1 flex-col gap-8">
          {/* Hero section */}
          <div className="relative">
            <div className="relative h-[200px] w-full md:h-[260px] lg:h-[320px]">
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                {media.bannerImageUrl ? (
                  <Image
                    src={media.bannerImageUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-aura-bg3 to-aura-bg" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
              </div>

              <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-8 lg:p-16">
                <div className="flex max-w-full flex-col gap-3 md:gap-4 lg:max-w-[768px]">
                  {/* Breadcrumb */}
                  <nav className="hidden items-center gap-1.5 font-brand text-[14px] font-bold sm:flex">
                    <Link
                      href="/discover"
                      className="text-white/[0.48] transition-colors hover:text-white/70"
                    >
                      DISCOVER
                    </Link>
                    <ChevronRight size={14} className="text-white/[0.48]" />
                    <span className="text-aura-orange">CREATE CHRONICLE</span>
                  </nav>

                  {/* Title + metadata */}
                  <h1 className="font-body text-[22px] font-bold leading-tight tracking-[-0.44px] text-white md:text-[28px] md:tracking-[-0.56px] lg:text-[36px] lg:tracking-[-0.72px]">
                    {title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3">
                    {media.studio && (
                      <span className="font-mono text-[11px] font-semibold text-white/60">
                        {media.studio}
                      </span>
                    )}
                    {media.seasonYear && (
                      <span className="font-mono text-[11px] text-white/40">
                        {media.seasonYear}
                      </span>
                    )}
                    {scoreDisplay && (
                      <span className="font-mono text-[11px] font-bold text-aura-orange">
                        {scoreDisplay}
                      </span>
                    )}
                    {media.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre}
                        className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] font-medium text-white/70"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Existing franchise banner */}
          {matchedFranchise && (
            <div className="relative overflow-hidden rounded-xl border border-blue-500/20">
              <div className="absolute inset-0">
                {matchedFranchise.coverImageUrl ? (
                  <Image
                    src={matchedFranchise.coverImageUrl}
                    alt={matchedFranchise.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-blue-900/40 to-aura-bg" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50" />
              </div>
              <div className="relative flex items-center gap-3 p-4 md:p-5">
                <Info size={16} className="shrink-0 text-blue-400" />
                <span className="flex-1 font-body text-[13px] text-white/80">
                  This anime may belong to the{" "}
                  <strong className="text-white">{matchedFranchise.title}</strong>{" "}
                  franchise.
                </span>
                <Link
                  href={`/franchise/${matchedFranchise.slug}`}
                  className="shrink-0 rounded-lg bg-blue-500/20 px-4 py-2 font-mono text-[11px] font-semibold text-blue-300 transition-colors hover:bg-blue-500/30 hover:text-white"
                >
                  View Franchise →
                </Link>
              </div>
            </div>
          )}

          {/* Info bar */}
          <div className="flex items-center gap-3 rounded-xl border border-aura-orange/20 bg-aura-orange/5 p-3">
            <div className="h-1.5 w-1.5 rounded-full bg-aura-orange" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-orange">
              New Chronicle
            </span>
            <span className="font-body text-[11px] text-aura-muted2">
              Arrange the watch order below, then click &quot;Create Chronicle&quot; to publish.
            </span>
          </div>

          {/* Order Editor */}
          <OrderEditor
            franchiseId={placeholderFranchiseId}
            initialEntries={initialEntries}
            franchiseCoverImageUrl={media.coverImageUrl}
            onCancel={() => window.history.back()}
            onSubmitSuccess={() => {}}
            onAnilistIdsChange={setEditorAnilistIds}
            onSubmit={handleSubmit}
            submitLabel="Create Chronicle"
            cancelLabel="Back"
            alwaysEnabled
          />
        </div>

        {/* Sidebar */}
        <div className="sticky top-[68px] hidden h-fit lg:block">
          <RelationsSidebar
            franchiseId={`anilist-${media.id}`}
            savedAnilistIds={savedAnilistIds}
            unsavedAnilistIds={unsavedAnilistIds}
            initialRelations={relations}
          />
        </div>
      </div>

      {/* Create dialog */}
      {showCreateDialog && editorEntries && (
        <CreateChronicleDialog
          media={media}
          entries={editorEntries}
          onClose={() => setShowCreateDialog(false)}
        />
      )}

      {/* Auth modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* Era gate modal */}
      {showEraGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-aura-border bg-[#1a1a1e] p-6 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aura-orange/10">
              <Shield size={20} className="text-aura-orange" />
            </div>
            <h3 className="mt-4 font-body text-[16px] font-bold text-white">
              Wanderer Era Required
            </h3>
            <p className="mt-2 font-body text-[13px] leading-relaxed text-aura-muted2">
              You need at least{" "}
              <span className="font-bold text-aura-orange">500 Aura</span> to
              create watch orders. Complete quests and track your watch history
              to earn Aura and reach Wanderer era.
            </p>
            <div className="mt-2 font-mono text-[12px] text-aura-muted">
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
    </main>
  );
}
