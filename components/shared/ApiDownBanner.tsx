"use client";

export default function ApiDownBanner() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-aura-border bg-aura-bg2 px-6 py-12 text-center">
      <span className="text-4xl">( ; _ ; )</span>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-lg font-bold text-aura-text">
          AniList API is on a filler arc...
        </h3>
        <p className="max-w-md font-body text-sm text-aura-muted2">
          Our data source is temporarily down. Existing chronicles and watch orders
          are unaffected — only discover recommendations are paused.
          Check back soon!
        </p>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-aura-muted">
        Meanwhile, browse our chronicles below
      </p>
    </div>
  );
}
