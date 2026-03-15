"use client";

import Image from "next/image";
import Link from "next/link";
import { ListOrdered } from "lucide-react";
import { useDitherHover } from "@/hooks/use-dither-hover";

interface FranchiseCardProps {
  slug: string;
  title: string;
  studio: string;
  yearStarted: number;
  status: string;
  genres: string[];
  bannerImageUrl: string | null;
  entryCount: number;
  entryTypes: string[];
  updatedAt?: string;
  updatedByUser?: string;
  updatedByAvatar?: string;
  wasEdited?: boolean;
}

export default function FranchiseCard({
  slug,
  title,
  bannerImageUrl,
  entryCount,
  updatedByUser,
  updatedByAvatar,
  wasEdited,
}: FranchiseCardProps) {
  const { containerRef, canvasRef } = useDitherHover();

  return (
    <Link href={`/franchise/${slug}`}>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-[#212121] p-1 transition-all duration-200 hover:scale-[1.02] hover:bg-[#272727]"
      >
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-10 rounded-xl"
        />

        {/* Banner */}
        <div className="relative h-[150px] w-full overflow-hidden rounded-lg">
          {bannerImageUrl ? (
            <Image
              src={bannerImageUrl}
              alt={title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-aura-muted/30 to-aura-bg3" />
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3.5 p-6">
          <h3 className="truncate font-body text-[20px] font-bold leading-none tracking-[-0.4px] text-white">
            {title}
          </h3>

          <div className="h-px bg-[#121212] opacity-[0.48]" />

          <div className="flex gap-3.5">
            <ListOrdered size={16} className="mt-0.5 shrink-0 text-aura-orange" />
            <div className="flex flex-col gap-1">
              <p className="font-body text-sm font-bold leading-none tracking-[-0.28px] text-white">
                {entryCount} entries in watch order
              </p>
              <div className="flex items-center gap-2">
                {updatedByAvatar ? (
                  <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={updatedByAvatar}
                      alt={updatedByUser ?? ""}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-aura-bg4 font-body text-[9px] font-bold text-white">
                    {(updatedByUser ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-body text-[12px] tracking-[-0.12px] text-white">
                  {wasEdited ? "Updated" : "Created"} by {updatedByUser ?? "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
