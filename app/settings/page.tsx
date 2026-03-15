"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import SettingsForm from "@/components/profile/SettingsForm";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsPage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <main className="flex justify-center px-4 pt-6 pb-16 md:px-8 md:pt-10">
        <div className="flex w-full max-w-[600px] flex-col gap-8">
          <div className="h-8 w-32 animate-pulse rounded bg-aura-bg3" />
          <div className="flex flex-col gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-aura-bg3" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user || !profile) return null;

  const backHref = profile.handle ? `/u/${profile.handle}` : "/";

  return (
    <main className="flex justify-center px-4 pt-6 pb-16 md:px-8 md:pt-10">
      <div className="flex w-full max-w-[600px] flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href={backHref}
            className="flex items-center gap-2 font-body text-[13px] text-aura-muted2 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to profile
          </Link>
          <h1 className="font-brand text-2xl font-bold tracking-tight text-white">
            Settings
          </h1>
        </div>

        {/* Form */}
        <SettingsForm />
      </div>
    </main>
  );
}
