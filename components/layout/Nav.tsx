"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Compass, Eye, Swords, LogOut, Shield, Settings, Search, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const publicNavLinks = [
  { href: "/chronicles", label: "Chronicles", icon: BookOpen },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/predictions", label: "Predictions", icon: Eye },
] as const;

const authNavLinks = [
  { href: "/quests", label: "Quest", icon: Swords },
] as const;

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isLoading, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
      }
      // Cmd/Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery("");
  }

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
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <div className="flex items-center gap-2 rounded-lg bg-[rgba(49,49,49,0.6)] px-3 py-2.5 backdrop-blur-[10px]">
              <Search size={14} className="shrink-0 text-aura-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anime..."
                className="w-[160px] bg-transparent font-body text-[13px] tracking-[-0.26px] text-white placeholder:text-aura-muted outline-none md:w-[240px]"
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="shrink-0 text-aura-muted transition-colors hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          </form>
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
    </nav>
  );
}
