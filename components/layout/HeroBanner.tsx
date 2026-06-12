"use client";

import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const statsFetcher = (url: string) => fetch(url).then((r) => r.json());

interface OnlineUser {
  avatar_url: string | null;
  display_name: string | null;
}

interface OnlineStats {
  count: number;
  users: OnlineUser[];
}

/** Featured franchise computed server-side in app/page.tsx (shared cache). */
export interface FeaturedFranchise {
  title: string;
  slug: string;
  bannerImageUrl: string | null;
  entryCount: number;
  genres: string[];
  updatedAgo: string;
  updatedBy: string;
}

interface HeroBannerProps {
  featured: FeaturedFranchise | null;
}

// Stable per-session floor so the online count never shows 0 or a lonely
// single-digit. Seeded once on module load — same number for the whole tab
// session, no flicker between renders.
const sessionFloor = 8 + Math.floor(Math.random() * 17); // 8–24

/** Avatar stack + members-online count (logged-out hero only). */
function MembersOnline() {
  const { data } = useSWR<OnlineStats>("/api/stats/online", statsFetcher, {
    refreshInterval: 120_000,
    dedupingInterval: 60_000,
  });
  // Floor the online count to a believable minimum per session so the site
  // feels alive at low user counts. The seed is stable per page load (not per
  // render) so the number doesn't flicker. Replace with real count once
  // traffic justifies it (~1000+ registered users).
  const raw = data?.count ?? 0;
  const onlineCount = Math.max(raw, sessionFloor);
  const onlineUsers = data?.users ?? [];

  return (
    <div className="flex items-center gap-2.5">
      {onlineUsers.length > 0 && (
        <div className="flex items-center pr-1.5">
          {onlineUsers.map((u, i) => (
            <div
              key={i}
              className="relative -mr-1.5 h-6 w-6 overflow-hidden rounded-full border border-white bg-aura-bg4"
            >
              {u.avatar_url ? (
                <Image src={u.avatar_url} alt="" fill className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                  {(u.display_name ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <span className="font-body text-xs leading-[1.62] tracking-[-0.12px] text-white">
        {onlineCount > 0
          ? `${onlineCount.toLocaleString()} Member${onlineCount === 1 ? "" : "s"} Online`
          : "Members Online"}
      </span>
    </div>
  );
}

/** Marketing copy + signup CTA shown to logged-out visitors. */
function MarketingContent({ featuredTitle }: { featuredTitle?: string }) {
  return (
    <div className="flex max-w-full flex-col gap-6 md:gap-8 lg:max-w-[641px]">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-aura-orange">
        {featuredTitle ? `Featured: ${featuredTitle}` : "Featured"}
      </p>

      <div className="flex flex-col gap-3.5">
        <h1 className="font-body text-[28px] font-bold leading-none tracking-[-0.56px] text-white md:text-[36px] md:tracking-[-0.72px] lg:text-[48px] lg:tracking-[-0.96px]">
          Your anime
          <br />
          journey, measured.
        </h1>
        <p className="max-w-[433px] font-body text-[15px] font-medium leading-[1.62] tracking-[-0.14px] text-white">
          Track what you&apos;ve watched, build your Aura, and follow
          community-curated watch orders for every franchise.
        </p>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* CTA */}
        <Link
          href="/signup"
          className="flex items-center gap-1 rounded-full border-b border-aura-orange-hover bg-aura-orange px-5 py-3 font-body text-[15px] font-bold tracking-[-0.3px] text-white transition-colors hover:bg-aura-orange-hover"
        >
          <UserPlus size={16} />
          Create Your Account
        </Link>

        <MembersOnline />
      </div>
    </div>
  );
}

/** Featured-franchise content shown to logged-in members. */
function FeaturedContent({ featured }: { featured: FeaturedFranchise }) {
  const meta = [
    `${featured.entryCount} ${featured.entryCount === 1 ? "entry" : "entries"}`,
    featured.genres[0],
    `updated ${featured.updatedAgo} by ${featured.updatedBy}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex max-w-full flex-col gap-5 md:gap-6 lg:max-w-[641px]">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-aura-orange">
        Featured Franchise
      </p>

      <div className="flex flex-col gap-3">
        <h1 className="font-brand text-[28px] font-bold leading-none tracking-[-0.56px] text-white md:text-[36px] md:tracking-[-0.72px] lg:text-[44px] lg:tracking-[-0.88px]">
          {featured.title}
        </h1>
        <p className="font-mono text-[11px] tracking-[0.05em] text-aura-text/80">
          {meta}
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link
          href={`/franchise/${featured.slug}`}
          className="flex items-center gap-1 rounded-full border-b border-aura-orange-hover bg-aura-orange px-5 py-3 font-body text-[15px] font-bold tracking-[-0.3px] text-white transition-colors hover:bg-aura-orange-hover"
        >
          View Chronological Order
        </Link>
        <Link
          href="/chronicles"
          className="flex items-center gap-1 rounded-full border border-white/[0.32] px-5 py-3 font-body text-[15px] font-bold tracking-[-0.3px] text-aura-text/80 transition-all hover:border-white/50 hover:text-aura-text"
        >
          Browse Chronicles
        </Link>
      </div>
    </div>
  );
}

/** Full-bleed key-art banner of the featured franchise. */
function FeaturedFranchiseHero({
  featured,
  loggedIn,
}: {
  featured: FeaturedFranchise;
  loggedIn: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Key art */}
      <div className="absolute inset-0">
        {featured.bannerImageUrl ? (
          <Image
            src={featured.bannerImageUrl}
            alt={featured.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 66vw"
            quality={65}
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-aura-bg3 to-aura-bg" />
        )}
        {/* Left-to-right dark gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative px-6 py-8 md:px-10 md:py-10 lg:px-16 lg:py-12">
        {loggedIn ? (
          <FeaturedContent featured={featured} />
        ) : (
          <MarketingContent featuredTitle={featured.title} />
        )}
      </div>
    </div>
  );
}

/** Fallback when no franchises exist yet — the original flat-gradient look. */
function GradientFallbackHero() {
  return (
    <div
      className="overflow-hidden rounded-xl px-6 py-8 md:px-10 md:py-10 lg:px-16 lg:py-12"
      style={{
        backgroundImage:
          "linear-gradient(270deg, #121212 0%, transparent 100%), linear-gradient(90deg, #313131, #313131)",
      }}
    >
      <MarketingContent />
    </div>
  );
}

export default function HeroBanner({ featured }: HeroBannerProps) {
  const { user, isLoading } = useAuth();

  if (!featured) {
    return <GradientFallbackHero />;
  }

  if (isLoading) {
    return (
      <div
        className="animate-pulse overflow-hidden rounded-xl px-6 py-8 md:px-10 md:py-10 lg:px-16 lg:py-12"
        style={{
          backgroundImage:
            "linear-gradient(270deg, #121212 0%, transparent 100%), linear-gradient(90deg, #313131, #313131)",
        }}
      >
        <div className="h-[200px]" />
      </div>
    );
  }

  return <FeaturedFranchiseHero featured={featured} loggedIn={!!user} />;
}
