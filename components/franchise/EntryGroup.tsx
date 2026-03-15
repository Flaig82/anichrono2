import Image from "next/image";
import EntryRow from "./EntryRow";

interface EntryData {
  id: string;
  title: string;
  entry_type: string;
  episode_start: number | null;
  episode_end: number | null;
  position: number;
}

interface WatchData {
  episodes_watched: number;
  status: string;
}

interface EntryGroupProps {
  parentSeries: string;
  coverImageUrl: string | null;
  status: string;
  entryType: string;
  entries: EntryData[];
  watchMap?: Map<string, WatchData>;
  onWatch?: (entryId: string, value: number) => void;
}

const STATUS_LABELS: Record<string, string> = {
  finished: "Finished Airing",
  releasing: "Currently Airing",
  not_yet_released: "Not Yet Released",
};

const TYPE_LABELS: Record<string, string> = {
  episodes: "TV Series",
  movie: "Movie",
  ova: "OVA",
  ona: "ONA",
  special: "Special",
};

export default function EntryGroup({
  parentSeries,
  coverImageUrl,
  status,
  entryType,
  entries,
  watchMap,
  onWatch,
}: EntryGroupProps) {
  // Determine the primary type label from entries
  const fallbackType = entries[0]?.entry_type;
  const primaryType =
    TYPE_LABELS[entryType] ??
    (fallbackType ? TYPE_LABELS[fallbackType] : undefined) ??
    "TV Series";
  const statusLabel = STATUS_LABELS[status] ?? status;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-7">
      {/* Left column: Cover art + series info */}
      <div className="flex shrink-0 flex-row items-center gap-4 sm:w-[100px] sm:flex-col sm:items-start sm:gap-2">
        <div className="relative h-[80px] w-[57px] overflow-hidden rounded-lg bg-aura-bg3 sm:h-[141px] sm:w-[100px]">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={parentSeries}
              fill
              className="object-cover"
              sizes="100px"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-aura-muted/20 to-aura-bg3" />
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="font-body text-xs font-bold leading-tight text-white">
            {parentSeries}
          </p>
          <p className="font-body text-[10px] text-aura-muted2">
            {primaryType} · {statusLabel}
          </p>
        </div>
      </div>

      {/* Right column: Entry rows */}
      <div className="flex flex-1 flex-col gap-2">
        {entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entryId={entry.id}
            title={entry.title}
            entryType={entry.entry_type}
            episodeStart={entry.episode_start}
            episodeEnd={entry.episode_end}
            position={entry.position}
            initialWatched={watchMap?.get(entry.id)?.episodes_watched ?? 0}
            onWatch={onWatch}
          />
        ))}
      </div>
    </div>
  );
}
