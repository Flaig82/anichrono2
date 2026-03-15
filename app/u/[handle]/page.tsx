"use client";

import { useParams } from "next/navigation";
import RightSidebar from "@/components/layout/RightSidebar";
import HomeFeed from "@/components/layout/HomeFeed";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileAuraBreakdown from "@/components/profile/ProfileAuraBreakdown";
import ProfileWatchStats from "@/components/profile/ProfileWatchStats";
import ProfileActivity from "@/components/profile/ProfileActivity";
import WatchlistPreview from "@/components/profile/WatchlistPreview";
import { usePublicProfile } from "@/hooks/use-public-profile";
import { useAuth } from "@/hooks/use-auth";

function ProfileSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 animate-pulse rounded-full bg-aura-bg3" />
          <div className="flex flex-col gap-2">
            <div className="h-6 w-40 animate-pulse rounded bg-aura-bg3" />
            <div className="h-4 w-24 animate-pulse rounded bg-aura-bg3" />
            <div className="h-5 w-32 animate-pulse rounded bg-aura-bg3" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="h-10 w-24 animate-pulse rounded bg-aura-bg3" />
          <div className="h-3 w-16 animate-pulse rounded bg-aura-bg3" />
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-aura-bg3" />
        ))}
      </div>
      {/* Aura skeleton */}
      <div className="h-48 animate-pulse rounded-lg bg-aura-bg3" />
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const handle = params.handle as string;
  const { user } = useAuth();
  const { profile, aura, stats, activity, isLoading, error } =
    usePublicProfile(handle);

  const isOwnProfile = !!(user && profile && user.id === profile.id);

  return (
    <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
      {/* Main content */}
      <div className="flex flex-1 flex-col gap-8">
        {isLoading ? (
          <ProfileSkeleton />
        ) : error || !profile ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <h1 className="font-brand text-2xl font-bold text-white">
              User not found
            </h1>
            <p className="font-body text-[13px] text-aura-muted2">
              No user with the handle @{handle} exists.
            </p>
          </div>
        ) : (
          <>
            <ProfileHeader
              profile={profile}
              isOwnProfile={isOwnProfile}
            />
            <ProfileWatchStats stats={stats} />
            <ProfileAuraBreakdown auraRows={aura} />
            <WatchlistPreview
              handle={handle}
              isOwnProfile={isOwnProfile}
              isWatchlistPublic={profile.is_watchlist_public}
            />
            <ProfileActivity profile={profile} activity={activity} />
          </>
        )}
      </div>

      {/* Sticky sidebar — hidden on mobile */}
      <div className="sticky top-[68px] hidden h-fit lg:block">
        <RightSidebar>
          <HomeFeed />
        </RightSidebar>
      </div>
    </main>
  );
}
