"use client";

import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { UserPlus } from "lucide-react";
import SectionLabel from "@/components/shared/SectionLabel";
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

function LoggedOutHero() {
  const { data } = useSWR<OnlineStats>("/api/stats/online", statsFetcher, {
    refreshInterval: 60_000,
  });
  const onlineCount = data?.count ?? 0;
  const onlineUsers = data?.users ?? [];

  return (
    <div
      className="overflow-hidden rounded-xl px-6 py-8 md:px-10 md:py-10 lg:px-16 lg:py-12"
      style={{
        backgroundImage:
          "linear-gradient(270deg, #121212 0%, transparent 100%), linear-gradient(90deg, #313131, #313131)",
      }}
    >
      <div className="flex max-w-full flex-col gap-6 md:gap-8 lg:max-w-[641px]">
        <SectionLabel>Featured</SectionLabel>

        <div className="flex flex-col gap-3.5">
          <h1 className="font-body text-[28px] font-bold leading-none tracking-[-0.56px] text-white md:text-[36px] md:tracking-[-0.72px] lg:text-[48px] lg:tracking-[-0.96px]">
            Your anime
            <br />
            journey, measured.
          </h1>
          <p className="max-w-[433px] font-body text-sm leading-[1.62] tracking-[-0.14px] text-white">
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

          {/* Avatar stack + members */}
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
        </div>
      </div>
    </div>
  );
}

function LoggedInHero() {
  const profile = useAuth((s) => s.profile);
  const displayName = profile?.display_name ?? "there";
  const { data } = useSWR<OnlineStats>("/api/stats/online", statsFetcher, {
    refreshInterval: 60_000,
  });
  const onlineCount = data?.count ?? 0;
  const onlineUsers = data?.users ?? [];

  return (
    <div
      className="overflow-hidden rounded-xl px-6 py-8 md:px-10 md:py-10 lg:px-16 lg:py-12"
      style={{
        backgroundImage:
          "linear-gradient(270deg, #121212 0%, transparent 100%), linear-gradient(90deg, rgba(74,186,255,0.25), rgba(74,186,255,0.25)), linear-gradient(90deg, #313131, #313131)",
      }}
    >
      <div className="flex max-w-full flex-col gap-6 md:gap-8 lg:max-w-[641px]">
        <SectionLabel>Featured</SectionLabel>

        <div className="flex flex-col gap-3.5">
          <h1 className="font-body text-[28px] font-bold leading-none tracking-[-0.56px] text-white md:text-[36px] md:tracking-[-0.72px] lg:text-[48px] lg:tracking-[-0.96px]">
            Winter 2026 is live.
          </h1>
          <p className="max-w-[433px] font-body text-sm leading-[1.62] tracking-[-0.14px] text-white">
            12 shows airing. Oracle predictions lock at Episode 6.
            <br />
            Welcome back, {displayName}.
          </p>
        </div>

        {/* Avatar stack + members online */}
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
      </div>
    </div>
  );
}

export default function HeroBanner() {
  const { user, isLoading } = useAuth();

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

  return user ? <LoggedInHero /> : <LoggedOutHero />;
}
