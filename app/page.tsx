export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-display text-5xl font-extrabold tracking-tight text-aura-text">
        AURA
      </h1>
      <p className="font-mono text-sm tracking-widest uppercase text-aura-muted2">
        Your anime journey, measured.
      </p>
      <div className="flex gap-3">
        {(
          [
            ["Pioneer", "bg-pioneer"],
            ["Scholar", "bg-scholar"],
            ["Oracle", "bg-oracle"],
            ["Sensei", "bg-sensei"],
            ["Veteran", "bg-veteran"],
            ["Archivist", "bg-archivist"],
          ] as const
        ).map(([label, color]) => (
          <span
            key={label}
            className={`${color} rounded-sm px-2 py-1 font-mono text-xs font-medium text-white`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="mt-8 rounded-lg border border-aura-border bg-aura-bg2 px-6 py-4">
        <p className="font-mono text-xs text-aura-muted">
          Framework ready. Design tokens loaded.
        </p>
      </div>
    </main>
  );
}
