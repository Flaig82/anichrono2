"use client";

export default function Error({
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
      <button
        onClick={reset}
        className="mt-2 rounded-lg bg-aura-orange px-4 py-2 font-body text-sm font-bold text-white hover:bg-aura-orange-hover"
      >
        Try again
      </button>
    </main>
  );
}
