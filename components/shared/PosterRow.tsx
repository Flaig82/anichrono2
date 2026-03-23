"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Shield } from "lucide-react";
import { useDitherHover } from "@/hooks/use-dither-hover";
import { useAuth } from "@/hooks/use-auth";
import AuthModal from "@/components/shared/AuthModal";

interface PosterCardProps {
  src: string;
  alt: string;
  score?: number | null;
  href?: string;
  anilistId?: number;
}

function PosterCard({ src, alt, score, href, anilistId }: PosterCardProps) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { containerRef, canvasRef } = useDitherHover();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEraGate, setShowEraGate] = useState(false);

  const hasChronicle = !!href;

  function handleUnclaimedClick() {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!profile || (profile.total_aura ?? 0) < 500) {
      setShowEraGate(true);
      return;
    }
    if (anilistId) {
      router.push(`/franchise/create?anilist=${anilistId}`);
    }
  }

  const card = (
    <div
      ref={containerRef}
      className="group relative aspect-[3/4] w-full min-w-0 shrink-0 overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.03]"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 rounded-xl"
      />
      <Image src={src} alt={alt} fill className="object-cover" quality={60} sizes="(max-width: 640px) 33vw, 150px" />

      {/* Unclaimed badge */}
      {!hasChronicle && (
        <div className="absolute left-2 top-2 z-[5] flex items-center gap-1 rounded-full bg-aura-archivist/90 px-2 py-0.5 shadow-sm">
          <Plus size={10} className="text-white" strokeWidth={3} />
          <span className="font-mono text-[9px] font-semibold text-white">
            No chronicle
          </span>
        </div>
      )}

      {/* Bottom gradient + title */}
      <div className="absolute inset-x-0 bottom-0 z-[5] flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10">
        {score != null && (
          <span className="mb-1 font-mono text-[10px] font-semibold text-aura-orange">
            {(score / 10).toFixed(1)}
          </span>
        )}
        <p className="line-clamp-2 font-body text-[12px] font-bold leading-tight tracking-[-0.24px] text-white">
          {alt}
        </p>
        {!hasChronicle && (
          <p className="mt-1 font-mono text-[9px] text-aura-archivist opacity-0 transition-opacity group-hover:opacity-100">
            +50 Archivist Aura
          </p>
        )}
      </div>
    </div>
  );

  // Claimed franchise — direct link
  if (href) {
    return <Link href={href}>{card}</Link>;
  }

  // Unclaimed — always clickable, gate with modals
  return (
    <>
      <button type="button" className="w-full text-left" onClick={handleUnclaimedClick}>
        {card}
      </button>
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
      {showEraGate && (
        <EraGateModal
          currentAura={profile?.total_aura ?? 0}
          onClose={() => setShowEraGate(false)}
        />
      )}
    </>
  );
}

function EraGateModal({
  currentAura,
  onClose,
}: {
  currentAura: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[380px] mx-4 rounded-2xl bg-[#1a1a1e] border border-aura-border shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aura-orange/10">
            <Shield size={24} className="text-aura-orange" />
          </div>
          <div>
            <h2 className="font-brand text-lg font-bold text-white">
              Wanderer Era Required
            </h2>
            <p className="mt-1 font-body text-[13px] text-aura-muted2">
              You need 500 Aura to create a chronicle. Keep watching and
              completing quests to level up.
            </p>
          </div>
          <div className="w-full rounded-lg bg-aura-bg3 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
                Progress
              </span>
              <span className="font-mono text-[11px] text-aura-muted2">
                {currentAura} / 500
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-aura-bg4">
              <div
                className="h-full rounded-full bg-aura-orange transition-all"
                style={{ width: `${Math.min((currentAura / 500) * 100, 100)}%` }}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-aura-orange px-4 py-2.5 font-body text-sm font-bold text-white transition-colors hover:bg-aura-orange-hover"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export interface PosterItem {
  src: string;
  alt: string;
  score?: number | null;
  href?: string;
  anilistId?: number;
}

export default function PosterRow({ posters }: { posters: PosterItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 md:gap-4">
      {posters.map((poster, i) => (
        <PosterCard key={i} {...poster} />
      ))}
    </div>
  );
}
