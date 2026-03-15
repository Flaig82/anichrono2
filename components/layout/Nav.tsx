"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, Eye, Swords, LogOut, Shield, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navLinks = [
  { href: "/chronicles", label: "Chronicles", icon: BookOpen },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/predictions", label: "Predictions", icon: Eye },
  { href: "/quests", label: "Quest", icon: Swords },
] as const;

export default function Nav() {
  const pathname = usePathname();
  const { user, profile, isLoading, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 lg:px-[120px] py-3">
      {/* Left: Logo + Nav pills */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex h-9 items-center gap-1.5 rounded-lg px-2 py-1.5 md:px-5"
        >
          <span className="text-base text-aura-orange-hover font-bold leading-none">
            順
          </span>
          <span className="hidden font-brand text-base uppercase leading-none text-white tracking-[-0.8px] sm:inline">
            <span className="font-bold">Anime</span>
            <span className="font-medium">chrono</span>
          </span>
        </Link>

        {/* Nav pills */}
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-body text-[14px] font-bold tracking-[-0.28px] text-white backdrop-blur-[10px] transition-colors md:px-5",
                isActive
                  ? "bg-aura-orange"
                  : "bg-[rgba(49,49,49,0.6)] hover:bg-[rgba(49,49,49,0.8)]"
              )}
            >
              <Icon size={16} />
              <span className="hidden md:inline">{label}</span>
            </Link>
          );
        })}

        {/* Admin link — only visible to admins */}
        {profile?.is_admin && (
          <Link
            href="/admin/proposals"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-body text-[14px] font-bold tracking-[-0.28px] text-white backdrop-blur-[10px] transition-colors md:px-5",
              pathname.startsWith("/admin")
                ? "bg-aura-orange"
                : "bg-[rgba(49,49,49,0.6)] hover:bg-[rgba(49,49,49,0.8)]"
            )}
          >
            <Shield size={16} />
            <span className="hidden md:inline">Admin</span>
          </Link>
        )}
      </div>

      {/* Right: Auth state */}
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 backdrop-blur-[10px] md:px-5">
        {isLoading ? (
          /* Empty placeholder to prevent layout shift */
          <div className="h-5 w-7 md:w-[120px]" />
        ) : user && profile ? (
          /* Logged in */
          <div className="flex items-center gap-3">
            <span className="hidden font-body text-[14px] font-bold tracking-[-0.28px] text-aura-orange sm:inline">
              {profile.total_aura.toLocaleString()}
            </span>
            <div className="hidden h-4 w-px bg-[#313131] sm:block" />
            <Link
              href={profile.handle ? `/u/${profile.handle}` : "/settings"}
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  width={28}
                  height={28}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-aura-bg4 font-body text-xs font-bold text-white">
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden font-body text-[14px] font-bold tracking-[-0.28px] text-white md:inline">
                {profile.display_name}
              </span>
            </Link>
            <Link
              href="/settings"
              className="text-aura-muted transition-colors hover:text-white"
              title="Settings"
            >
              <Settings size={16} />
            </Link>
            <button
              onClick={logout}
              className="ml-1 text-aura-muted transition-colors hover:text-white"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          /* Logged out */
          <>
            <Link
              href="/login"
              className="font-body text-[14px] font-bold tracking-[-0.28px] text-white hover:text-white/80 transition-colors"
            >
              Login
            </Link>
            <div className="h-4 w-px bg-[#313131]" />
            <Link
              href="/signup"
              className="font-body text-[14px] font-bold tracking-[-0.28px] text-white hover:text-white/80 transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
