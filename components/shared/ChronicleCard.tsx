"use client";

import Image from "next/image";
import { ListOrdered } from "lucide-react";
import { useDitherHover } from "@/hooks/use-dither-hover";

interface ChronicleCardProps {
  bannerSrc: string;
  title: string;
  season: string;
  updatedBy: string;
  avatarSrc: string;
}

export default function ChronicleCard({
  bannerSrc,
  title,
  season,
  updatedBy,
  avatarSrc,
}: ChronicleCardProps) {
  const { containerRef, canvasRef } = useDitherHover();

  return (
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
        <Image src={bannerSrc} alt={title} fill className="object-cover" />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3.5 p-6">
        <h3 className="font-body text-[20px] font-bold leading-none tracking-[-0.4px] text-white">
          {title}
        </h3>

        <div className="h-px bg-[#121212] opacity-[0.48]" />

        <div className="flex gap-3.5">
          <ListOrdered size={16} className="mt-0.5 shrink-0 text-aura-orange" />
          <div className="flex flex-col gap-1">
            <p className="font-body text-sm font-bold leading-none tracking-[-0.28px] text-white">
              {season}
            </p>
            <div className="flex items-center gap-2">
              <div className="relative h-5 w-5 overflow-hidden rounded-full">
                <Image src={avatarSrc} alt={updatedBy} fill className="object-cover" />
              </div>
              <span className="font-body text-xs tracking-[-0.12px] text-white">
                Updated by {updatedBy}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
