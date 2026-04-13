"use client";

import Link from "next/link";
import { Pencil, ArrowRight, Compass } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import EraProgressBar from "@/components/shared/EraProgressBar";

interface ContributionCardProps {
  /**
   * Called when a Wanderer+ user clicks the primary "Propose an edit" CTA.
   * Parent owns the edit state (MasterOrderSection controls OrderEditor).
   */
  onProposeEdit: () => void;
  /**
   * Franchise slug, used to link to the Chronicle creator page.
   */
  franchiseSlug: string;
}

/**
 * Persistent contribution surface on every franchise page.
 *
 * Three visual states driven off auth + era:
 *   - logged-out: sign-in CTA
 *   - Initiate (<500 Aura): EraProgressBar showing how far until proposing unlocks
 *   - Wanderer+: primary "Propose an edit" button
 *
 * Replaces the old logged-out-only CTA block that used to render below
 * the entries list in MasterOrderSection.
 */
export default function ContributionCard({
  onProposeEdit,
  franchiseSlug,
}: ContributionCardProps) {
  const { user, profile } = useAuth();
  const totalAura = profile?.total_aura ?? 0;
  const canPropose = totalAura >= 500;

  // Logged-out
  if (!user) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-aura-border bg-aura-bg2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-aura-orange/10">
            <Pencil size={16} className="text-aura-orange" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="font-body text-[14px] font-bold text-white">
              Think this order could be improved?
            </h3>
            <p className="font-body text-[12px] leading-snug text-aura-muted2">
              Join AnimeChrono to propose edits, add curator notes, and help
              curate the best watch orders.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:ml-4">
          <Link
            href="/signup"
            className="flex items-center gap-1.5 rounded-lg bg-aura-orange px-4 py-2 font-body text-[13px] font-bold text-white transition-colors hover:bg-aura-orange-hover"
          >
            Join & contribute
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/login"
            className="font-body text-[12px] font-semibold text-aura-muted2 transition-colors hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  // Logged in but below Wanderer — show era progress
  if (!canPropose) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-aura-border bg-aura-bg2 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-aura-orange/10">
            <Pencil size={16} className="text-aura-orange" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="font-body text-[14px] font-bold text-white">
              Contribution unlocks at Wanderer era
            </h3>
            <p className="font-body text-[12px] leading-snug text-aura-muted2">
              Keep watching to reach 500 Aura. Proposing edits and adding notes
              unlocks once you&rsquo;re a Wanderer.
            </p>
          </div>
        </div>
        <EraProgressBar
          currentAura={totalAura}
          variant="inline"
          highlightUnlock="propose"
        />
      </div>
    );
  }

  // Wanderer+ — primary contribution CTAs
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-aura-border bg-aura-bg2 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-aura-orange/10">
          <Pencil size={16} className="text-aura-orange" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h3 className="font-body text-[14px] font-bold text-white">
            Help curate this franchise
          </h3>
          <p className="font-body text-[12px] leading-snug text-aura-muted2">
            Reorder entries, add watch-order notes, or propose a new route for
            first-timers.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-4">
        <button
          type="button"
          onClick={onProposeEdit}
          className="flex items-center gap-1.5 rounded-lg bg-aura-orange px-4 py-2 font-body text-[13px] font-bold text-white transition-colors hover:bg-aura-orange-hover"
        >
          <Pencil size={14} />
          Propose an edit
        </button>
        <Link
          href={`/franchise/${franchiseSlug}/routes/create`}
          className="flex items-center gap-1.5 rounded-lg border border-aura-border bg-white/[0.03] px-4 py-2 font-body text-[13px] font-bold text-white transition-colors hover:bg-white/[0.08]"
        >
          <Compass size={14} />
          Create a Chronicle
        </Link>
      </div>
    </div>
  );
}
