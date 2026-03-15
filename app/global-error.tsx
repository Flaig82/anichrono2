"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0A0C] font-body antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-3">
          <h1 className="text-2xl font-bold text-white">
            Something went wrong
          </h1>
          <p className="text-sm text-[#8A94A8]">{error.message}</p>
          <button
            onClick={reset}
            className="mt-2 rounded-lg bg-[#EB6325] px-4 py-2 text-sm font-bold text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
