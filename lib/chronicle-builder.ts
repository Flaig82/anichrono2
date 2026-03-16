import type { AniListMediaFull, AniListRelation } from "@/lib/anilist";
import { formatToEntryType } from "@/lib/anilist";
import type { EditorEntry } from "@/types/proposal";
import type { EntryType } from "@/types/franchise";

const RELATION_SORT_ORDER: Record<string, number> = {
  PREQUEL: 0,
  PARENT: 1,
  SEQUEL: 2,
  SIDE_STORY: 3,
  SPIN_OFF: 4,
  ALTERNATIVE: 5,
};

/**
 * Build an initial entry list from a main anime and its AniList relations.
 * Order: main series first, then sequels by season year, then side stories/movies.
 */
export function buildInitialEntries(
  main: AniListMediaFull,
  relations: AniListRelation[],
  franchiseId: string,
): EditorEntry[] {
  const entries: EditorEntry[] = [];
  const mainTitle = main.titleEnglish ?? main.titleRomaji;

  // Main series as first entry
  const mainEntryType = formatToEntryType(main.format) as EntryType;
  entries.push({
    id: crypto.randomUUID(),
    franchise_id: franchiseId,
    position: 1,
    title:
      mainEntryType === "episodes" && main.episodes
        ? `Episodes 1–${main.episodes}`
        : mainTitle,
    entry_type: mainEntryType,
    episode_start: mainEntryType === "episodes" ? 1 : null,
    episode_end: mainEntryType === "episodes" ? (main.episodes ?? null) : null,
    parent_series: mainTitle,
    anilist_id: main.id,
    is_essential: true,
    curator_note: null,
    cover_image_url: main.coverImageUrl,
  });

  // Sort relations: sequels first (by season year), then side stories, movies last
  const sorted = [...relations]
    .filter((r) => r.id !== main.id)
    .sort((a, b) => {
      const orderA = RELATION_SORT_ORDER[a.relationType] ?? 99;
      const orderB = RELATION_SORT_ORDER[b.relationType] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      // Within same relation type, sort by AniList ID (rough chronological proxy)
      return a.id - b.id;
    });

  // Deduplicate by AniList ID (some relations appear multiple times)
  const seen = new Set<number>([main.id]);

  for (const rel of sorted) {
    if (seen.has(rel.id)) continue;
    seen.add(rel.id);

    const relTitle = rel.titleEnglish ?? rel.titleRomaji;
    const entryType = formatToEntryType(rel.format) as EntryType;

    entries.push({
      id: crypto.randomUUID(),
      franchise_id: franchiseId,
      position: entries.length + 1,
      title:
        entryType === "episodes" && rel.episodes
          ? `Episodes 1–${rel.episodes}`
          : relTitle,
      entry_type: entryType,
      episode_start: entryType === "episodes" ? 1 : null,
      episode_end: entryType === "episodes" ? (rel.episodes ?? null) : null,
      parent_series: relTitle,
      anilist_id: rel.id,
      is_essential: true,
      curator_note: null,
      cover_image_url: rel.coverImageUrl,
    });
  }

  return entries;
}
