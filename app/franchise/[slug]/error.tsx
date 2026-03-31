"use client";

import Link from "next/link";

export default function FranchiseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <h1 className="font-brand text-2xl font-bold text-white">
        Something went wrong
      </h1>
      <p className="font-body text-sm text-aura-muted2">{error.message}</p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-aura-orange px-4 py-2 font-body text-sm font-bold text-white hover:bg-aura-orange-hover"
        >
          Try again
        </button>
        <Link
          href="/chronicles"
          className="rounded-lg border border-aura-border px-4 py-2 font-body text-sm font-bold text-white hover:bg-aura-bg3"
        >
          Back to Chronicles
        </Link>
      </div>
    </main>
  );
}
