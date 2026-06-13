"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, Swords, LogOut, Shield, Settings, Search, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import ChronoNetworkSwitcher from "@/components/layout/ChronoNetworkSwitcher";
import SearchTypeahead from "@/components/layout/SearchTypeahead";

const publicNavLinks = [
  { href: "/chronicles", label: "Chronicles", icon: BookOpen },
  { href: "/discover", label: "Discover", icon: Compass },
] as const;

const authNavLinks = [
  { href: "/quests", label: "Quest", icon: Swords },
] as const;

export default function Nav() {
  const pathname = usePathname();
  const { user, profile, isLoading, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd/Ctrl+K to open search (Escape-to-close lives in SearchTypeahead)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <nav className="relative isolate sticky top-0 z-50 px-4 md:px-8 lg:px-[120px] py-3 bg-gradient-to-b from-[rgba(10,10,12,0.9)] to-transparent before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:backdrop-blur-[10px] before:[mask-image:linear-gradient(to_bottom,black,transparent)] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:backdrop-blur-[100px] after:[mask-image:linear-gradient(to_bottom,black_0%,transparent_50%)]">
      <div className="relative z-10 flex items-center justify-between">
      {/* Left: Logo + Nav pills */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Logo + Chrono Network switcher */}
        <ChronoNetworkSwitcher />

        {/* Nav pills */}
        {publicNavLinks.map(({ href, label, icon: Icon }) => {
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
        {user && authNavLinks.map(({ href, label, icon: Icon }) => {
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
            href="/admin"
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

        {/* Search */}
        {searchOpen ? (
          <SearchTypeahead open={searchOpen} onClose={() => setSearchOpen(false)} />
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2.5 rounded-lg bg-[rgba(49,49,49,0.6)] px-3 py-2.5 font-body text-[14px] tracking-[-0.28px] text-aura-muted backdrop-blur-[10px] transition-colors hover:bg-[rgba(49,49,49,0.8)] hover:text-white"
          >
            <Search size={16} />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-aura-muted md:inline">
              ⌘K
            </kbd>
          </button>
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
            <NotificationDropdown />
            <Link
              href="/feedback"
              className="text-aura-muted transition-colors hover:text-white"
              title="Send Feedback"
            >
              <MessageSquare size={16} />
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
      </div>
    </nav>
  );
}
