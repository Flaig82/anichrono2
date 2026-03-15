"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useDitherHover } from "@/hooks/use-dither-hover";

interface PosterCardProps {
  src: string;
  alt: string;
  score?: number | null;
  href?: string;
  anilistId?: number;
}

function PosterCard({ src, alt, score, href, anilistId }: PosterCardProps) {
  const { containerRef, canvasRef } = useDitherHover();

  const hasChroniclе = !!href;

  const card = (
    <div
      ref={containerRef}
      className="group relative aspect-[3/4] w-full min-w-0 shrink-0 overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.03]"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 rounded-xl"
      />
      <Image src={src} alt={alt} fill className="object-cover" />

      {/* Unclaimed badge */}
      {!hasChroniclе && (
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
        {!hasChroniclе && (
          <p className="mt-1 font-mono text-[9px] text-aura-archivist opacity-0 transition-opacity group-hover:opacity-100">
            +50 Archivist Aura
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }

  // Unclaimed — link to create flow with AniList ID
  if (anilistId) {
    return <Link href={`/franchise/create?anilist=${anilistId}`}>{card}</Link>;
  }

  return card;
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
      {posters.slice(0, 6).map((poster, i) => (
        <PosterCard key={i} {...poster} />
      ))}
    </div>
  );
}
