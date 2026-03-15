interface WatchStats {
  completed: number;
  watching: number;
  dropped: number;
  reviews: number;
}

interface ProfileWatchStatsProps {
  stats: WatchStats;
}

const STAT_ITEMS: { key: keyof WatchStats; label: string }[] = [
  { key: "completed", label: "Completed" },
  { key: "watching", label: "Watching" },
  { key: "dropped", label: "Dropped" },
  { key: "reviews", label: "Reviews" },
];

export default function ProfileWatchStats({ stats }: ProfileWatchStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {STAT_ITEMS.map(({ key, label }) => (
        <div
          key={key}
          className="flex flex-col items-center gap-1 rounded-lg bg-aura-bg3 px-4 py-4"
        >
          <span className="font-brand text-xl font-bold tracking-[-0.2px] text-white">
            {stats[key].toLocaleString()}
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
