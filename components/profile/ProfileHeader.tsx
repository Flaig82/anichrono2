"use client";

import Image from "next/image";
import Link from "next/link";
import { Settings } from "lucide-react";
import { ERA_EMOJI, type Era } from "@/types/aura";
import type { PublicProfile } from "@/types/user";

interface ProfileHeaderProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
}: ProfileHeaderProps) {
  const eraLabel = profile.era.charAt(0).toUpperCase() + profile.era.slice(1);
  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-start justify-between gap-6">
      {/* Left: avatar + info */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-aura-bg4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-aura-bg4 font-body text-2xl font-bold text-white">
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="font-brand text-2xl font-bold tracking-tight text-white">
              {profile.display_name}
            </h1>
            {isOwnProfile && (
              <Link
                href="/settings"
                className="text-aura-muted transition-colors hover:text-white"
                title="Settings"
              >
                <Settings size={18} />
              </Link>
            )}
          </div>

          {profile.handle && (
            <span className="font-mono text-[13px] tracking-[-0.13px] text-aura-muted2">
              @{profile.handle}
            </span>
          )}

          <div className="flex items-center gap-3">
            {/* Era badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-bg3 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-aura-text">
              {ERA_EMOJI[profile.era as Era]} {eraLabel}
            </span>
            <span className="font-mono text-[10px] tracking-[0.1em] text-aura-muted">
              Joined {joinDate}
            </span>
          </div>

          {profile.bio && (
            <p className="mt-1 max-w-[420px] font-body text-[13px] leading-relaxed tracking-[-0.13px] text-aura-muted2">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Right: total aura */}
      <div className="flex flex-col items-end gap-1 text-right">
        <span className="font-brand text-[40px] font-bold leading-none tracking-[-0.8px] text-white">
          {profile.total_aura.toLocaleString()}
        </span>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          Total Aura
        </span>
      </div>
    </div>
  );
}
