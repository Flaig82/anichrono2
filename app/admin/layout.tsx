"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Film,
  MessageSquare,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/proposals", label: "Proposals", icon: FileText },
  { href: "/admin/routes", label: "Routes", icon: Compass },
  { href: "/admin/franchises", label: "Franchises", icon: Film },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading } = useAuth();

  // Redirect non-admins
  useEffect(() => {
    if (isLoading) return;
    if (!profile) {
      const timeout = setTimeout(() => {
        const current = useAuth.getState().profile;
        if (!current?.is_admin) {
          router.replace("/");
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
    if (!profile.is_admin) {
      router.replace("/");
    }
  }, [isLoading, profile, router]);

  if (isLoading || !profile?.is_admin) {
    return null;
  }

  return (
    <main className="px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:px-[120px]">
      {/* Tab navigation */}
      <nav className="mb-8 flex items-center gap-1">
        {adminNav.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 font-body text-[13px] font-bold tracking-[-0.26px] transition-all",
                isActive
                  ? "bg-aura-orange text-white"
                  : "bg-[rgba(49,49,49,0.6)] text-aura-muted2 hover:bg-[rgba(49,49,49,0.8)] hover:text-white",
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      {children}
    </main>
  );
}
