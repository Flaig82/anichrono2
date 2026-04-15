"use client";

import Image from "next/image";
import Link from "next/link";
import { Compass, ThumbsUp, Users } from "lucide-react";
import { useDitherHover } from "@/hooks/use-dither-hover";
import RouteBadge from "@/components/franchise/RouteBadge";
import type { RouteType } from "@/types/route";

interface RouteCardProps {
  id: string;
  title: string;
  routeType: RouteType;
  isCanon: boolean;
  entryCount: number;
  voteCount: number;
  followerCount: number;
  franchiseTitle: string;
  franchiseBannerUrl: string | null;
  authorName: string;
  authorHandle: string | null;
  authorAvatar: string | null;
}

const PLACEHOLDER_IMAGES = [
  "/images/image_coming_soon.png",
  "/images/image_coming_soon_2.png",
  "/images/image_coming_soon_3.png",
];

function getPlaceholderImage(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return PLACEHOLDER_IMAGES[Math.abs(hash) % PLACEHOLDER_IMAGES.length]!;
}

/**
 * Card for a community chronicle — matches FranchiseCard's visual style
 * (banner + title + divider + metadata) but shows route-specific data:
 * route type badge, franchise name, author, vote/follower counts.
 */
export default function RouteCard({
  id,
  title,
  routeType,
  isCanon,
  entryCount,
  voteCount,
  followerCount,
  franchiseTitle,
  franchiseBannerUrl,
  authorName,
  authorHandle,
  authorAvatar,
}: RouteCardProps) {
  const { containerRef, canvasRef } = useDitherHover();

  return (
    <Link
      href={`/route/${id}`}
      ref={containerRef as React.RefObject<HTMLElement> as React.RefObject<HTMLAnchorElement>}
      className="relative block overflow-hidden rounded-xl bg-[#212121] p-1 transition-all duration-200 hover:scale-[1.02] hover:bg-[#272727] active:scale-[0.98] active:opacity-90"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 rounded-xl"
      />

      {/* Banner — uses the franchise's banner image */}
      <div className="relative h-[150px] w-full overflow-hidden rounded-lg">
        {franchiseBannerUrl ? (
          <Image
            src={franchiseBannerUrl}
            alt={franchiseTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            quality={60}
          />
        ) : (
          <Image
            src={getPlaceholderImage(id)}
            alt={franchiseTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            quality={60}
          />
        )}

        {/* Route type badge overlay — top left of banner */}
        <div className="absolute left-2 top-2 z-[5]">
          <RouteBadge routeType={routeType} isCanon={isCanon} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3.5 p-6">
        {/* Franchise name — small label above the title */}
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-aura-muted">
          {franchiseTitle}
        </span>

        <h3 className="truncate font-body text-[20px] font-bold leading-none tracking-[-0.4px] text-white">
          {title}
        </h3>

        <div className="h-px bg-[#121212] opacity-[0.48]" />

        <div className="flex gap-3.5">
          <Compass size={16} className="mt-0.5 shrink-0 text-aura-orange" />
          <div className="flex flex-col gap-1">
            <p className="font-body text-sm font-bold leading-none tracking-[-0.28px] text-white">
              {entryCount} entries in route
            </p>
            <div className="flex items-center gap-3">
              {/* Author */}
              <div className="flex items-center gap-1.5">
                {authorAvatar ? (
                  <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={authorAvatar}
                      alt={authorName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-aura-bg4 font-body text-[9px] font-bold text-white">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-body text-[12px] tracking-[-0.12px] text-white/50">
                  by{" "}
                  <span className="text-white">
                    {authorHandle ? `@${authorHandle}` : authorName}
                  </span>
                </span>
              </div>

              {/* Stats */}
              <span className="flex items-center gap-0.5 font-mono text-[10px] text-aura-muted">
                <ThumbsUp size={10} />
                {voteCount}
              </span>
              <span className="flex items-center gap-0.5 font-mono text-[10px] text-aura-muted">
                <Users size={10} />
                {followerCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
