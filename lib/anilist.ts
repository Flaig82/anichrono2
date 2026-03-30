const ANILIST_URL = "https://graphql.anilist.co";

const ANILIST_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  "User-Agent": "AnimeChrono/1.0 (https://animechrono.com)",
  Accept: "application/json",
};

/**
 * Fetch wrapper for AniList with retry + backoff.
 * AniList sits behind Cloudflare which can 403 on bursts from server IPs.
 */
async function anilistFetch(
  body: string,
  cacheOpts?: NextFetchRequestConfig,
): Promise<Response> {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 500ms, 1500ms
      await new Promise((r) => setTimeout(r, 500 * Math.pow(3, attempt - 1)));
    }
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: ANILIST_HEADERS,
      body,
      ...(cacheOpts ? { next: cacheOpts } : {}),
    });
    if (res.status === 403 || res.status === 429) {
      console.warn(`AniList returned ${res.status}, retry ${attempt + 1}/${maxRetries}`);
      continue;
    }
    return res;
  }
  // Return last attempt even if failed so callers can handle
  return fetch(ANILIST_URL, {
    method: "POST",
    headers: ANILIST_HEADERS,
    body,
    ...(cacheOpts ? { next: cacheOpts } : {}),
  });
}

type NextFetchRequestConfig = { revalidate?: number | false };

interface AniListMediaResult {
  id: number;
  title: {
    english: string | null;
    romaji: string;
  };
  description: string | null;
  coverImage: {
    extraLarge: string | null;
    large: string | null;
  };
  bannerImage: string | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  status: string | null;
}

export interface AniListMedia {
  id: number;
  titleEnglish: string | null;
  titleRomaji: string;
  description: string | null;
  coverImageUrl: string | null;
  bannerImageUrl: string | null;
  averageScore: number | null;
  meanScore: number | null;
  memberCount: number | null;
  status: string | null;
}

const MEDIA_BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        english
        romaji
      }
      description(asHtml: false)
      coverImage {
        extraLarge
        large
      }
      bannerImage
      averageScore
      meanScore
      popularity
      status
    }
  }
`;

// --- Relations types and query ---

export interface AniListRelation {
  id: number;
  titleEnglish: string | null;
  titleRomaji: string;
  coverImageUrl: string | null;
  format: string | null;
  relationType: string;
  episodes: number | null;
  status: string | null;
}

interface AniListRelationEdge {
  relationType: string;
  node: {
    id: number;
    title: { english: string | null; romaji: string };
    coverImage: { large: string | null };
    format: string | null;
    episodes: number | null;
    status: string | null;
  };
}

const MEDIA_RELATIONS_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      relations {
        edges {
          relationType
          node {
            id
            title { english romaji }
            coverImage { large }
            format
            episodes
            status
          }
        }
      }
    }
  }
`;

const RELEVANT_FORMATS = new Set([
  "TV", "TV_SHORT", "MOVIE", "OVA", "ONA", "SPECIAL",
]);

const RELEVANT_RELATION_TYPES = new Set([
  "SEQUEL", "PREQUEL", "SIDE_STORY", "PARENT", "ALTERNATIVE", "SPIN_OFF",
]);

const FORMAT_TO_ENTRY_TYPE: Record<string, string> = {
  TV: "episodes",
  TV_SHORT: "episodes",
  MOVIE: "movie",
  OVA: "ova",
  ONA: "ona",
  SPECIAL: "special",
};

export function formatToEntryType(format: string | null): string {
  return (format && FORMAT_TO_ENTRY_TYPE[format]) ?? "episodes";
}

export async function fetchMediaRelations(id: number): Promise<AniListRelation[]> {
  const res = await anilistFetch(
    JSON.stringify({ query: MEDIA_RELATIONS_QUERY, variables: { id } }),
  );

  if (!res.ok) {
    console.error(`AniList API error: ${res.status} ${res.statusText}`);
    return [];
  }

  const json = await res.json();
  const edges: AniListRelationEdge[] = json.data?.Media?.relations?.edges ?? [];

  return edges
    .filter((edge) =>
      RELEVANT_FORMATS.has(edge.node.format ?? "") &&
      RELEVANT_RELATION_TYPES.has(edge.relationType),
    )
    .map((edge) => ({
      id: edge.node.id,
      titleEnglish: edge.node.title.english,
      titleRomaji: edge.node.title.romaji,
      coverImageUrl: edge.node.coverImage.large,
      format: edge.node.format,
      relationType: edge.relationType,
      episodes: edge.node.episodes,
      status: edge.node.status,
    }));
}

// --- Search ---

export interface AniListSearchResult {
  id: number;
  titleEnglish: string | null;
  titleRomaji: string;
  coverImageUrl: string | null;
  format: string | null;
  episodes: number | null;
  status: string | null;
}

const SEARCH_MEDIA_QUERY = `
  query ($search: String) {
    Page(perPage: 10) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        id
        title { english romaji }
        coverImage { large }
        format
        episodes
        status
      }
    }
  }
`;

export async function searchMedia(query: string): Promise<AniListSearchResult[]> {
  if (!query.trim()) return [];

  const res = await anilistFetch(
    JSON.stringify({ query: SEARCH_MEDIA_QUERY, variables: { search: query } }),
  );

  if (!res.ok) {
    console.error(`AniList API error: ${res.status} ${res.statusText}`);
    return [];
  }

  const json = await res.json();
  const media = json.data?.Page?.media ?? [];

  return media
    .filter((m: { format: string | null }) => RELEVANT_FORMATS.has(m.format ?? ""))
    .map((m: { id: number; title: { english: string | null; romaji: string }; coverImage: { large: string | null }; format: string | null; episodes: number | null; status: string | null }) => ({
      id: m.id,
      titleEnglish: m.title.english,
      titleRomaji: m.title.romaji,
      coverImageUrl: m.coverImage.large,
      format: m.format,
      episodes: m.episodes,
      status: m.status,
    }));
}

// --- Discover: popular + niche anime ---

export interface AniListDiscoverMedia {
  id: number;
  titleEnglish: string | null;
  titleRomaji: string;
  coverImageUrl: string | null;
  averageScore: number | null;
  popularity: number | null;
  genres: string[];
  seasonYear: number | null;
  format: string | null;
}

const DISCOVER_QUERY = `
  query ($page: Int, $sort: [MediaSort], $popularityGreater: Int, $popularityLesser: Int, $genre_in: [String], $season: MediaSeason, $seasonYear: Int, $format_in: [MediaFormat], $search: String) {
    Page(page: $page, perPage: 18) {
      media(type: ANIME, sort: $sort, format_in: $format_in, popularity_greater: $popularityGreater, popularity_lesser: $popularityLesser, genre_in: $genre_in, season: $season, seasonYear: $seasonYear, search: $search, countryOfOrigin: JP) {
        id
        title { english romaji }
        coverImage { large }
        averageScore
        popularity
        genres
        seasonYear
        format
      }
    }
  }
`;

interface DiscoverRawMedia {
  id: number;
  title: { english: string | null; romaji: string };
  coverImage: { large: string | null };
  averageScore: number | null;
  popularity: number | null;
  genres: string[];
  seasonYear: number | null;
  format: string | null;
}

export interface DiscoverFilters {
  sort?: string;
  popularityGreater?: number;
  popularityLesser?: number;
  page?: number;
  genres?: string[];
  season?: string;
  seasonYear?: number;
  formats?: string[];
  search?: string;
}

export async function fetchDiscoverAnime(opts: DiscoverFilters): Promise<AniListDiscoverMedia[]> {
  const variables: Record<string, unknown> = {
    sort: opts.search ? "SEARCH_MATCH" : (opts.sort ?? "POPULARITY_DESC"),
    page: opts.page ?? 1,
  };
  if (opts.popularityGreater) variables.popularityGreater = opts.popularityGreater;
  if (opts.popularityLesser) variables.popularityLesser = opts.popularityLesser;
  if (opts.genres?.length) variables.genre_in = opts.genres;
  if (opts.season) variables.season = opts.season;
  if (opts.seasonYear) variables.seasonYear = opts.seasonYear;
  if (opts.formats?.length) variables.format_in = opts.formats;
  else variables.format_in = ["TV", "TV_SHORT", "MOVIE", "OVA", "ONA"];
  if (opts.search) variables.search = opts.search;

  const res = await anilistFetch(
    JSON.stringify({ query: DISCOVER_QUERY, variables }),
    { revalidate: 3600 },
  );

  if (!res.ok) {
    console.error(`AniList API error: ${res.status} ${res.statusText}`);
    return [];
  }

  const json = await res.json();
  const media: DiscoverRawMedia[] = json.data?.Page?.media ?? [];

  return media.map((m) => ({
    id: m.id,
    titleEnglish: m.title.english,
    titleRomaji: m.title.romaji,
    coverImageUrl: m.coverImage.large,
    averageScore: m.averageScore,
    popularity: m.popularity,
    genres: m.genres,
    seasonYear: m.seasonYear,
    format: m.format,
  }));
}

// --- Seasonal trending ---

export interface AniListSeasonalMedia {
  id: number;
  titleEnglish: string | null;
  titleRomaji: string;
  coverImageUrl: string | null;
  averageScore: number | null;
  popularity: number | null;
  episodes: number | null;
  format: string | null;
  genres: string[];
  /** AniList IDs of all prequels/parents — used to match back to a franchise */
  relatedIds: number[];
}

const SEASONAL_TRENDING_QUERY = `
  query ($season: MediaSeason, $seasonYear: Int) {
    Page(perPage: 12) {
      media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC, format_in: [TV, TV_SHORT]) {
        id
        title { english romaji }
        coverImage { large }
        averageScore
        popularity
        episodes
        format
        genres
        relations {
          edges {
            relationType
            node { id }
          }
        }
      }
    }
  }
`;

interface SeasonalRawMedia {
  id: number;
  title: { english: string | null; romaji: string };
  coverImage: { large: string | null };
  averageScore: number | null;
  popularity: number | null;
  episodes: number | null;
  format: string | null;
  genres: string[];
  relations: {
    edges: { relationType: string; node: { id: number } }[];
  };
}

export async function fetchSeasonalTrending(
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL",
  year: number,
): Promise<AniListSeasonalMedia[]> {
  const res = await anilistFetch(
    JSON.stringify({
      query: SEASONAL_TRENDING_QUERY,
      variables: { season, seasonYear: year },
    }),
    { revalidate: 3600 },
  );

  if (!res.ok) {
    console.error(`AniList API error: ${res.status} ${res.statusText}`);
    return [];
  }

  const json = await res.json();
  const media: SeasonalRawMedia[] = json.data?.Page?.media ?? [];

  return media.map((m) => {
    const relatedIds = m.relations.edges
      .filter((e) => ["PREQUEL", "PARENT"].includes(e.relationType))
      .map((e) => e.node.id);

    return {
      id: m.id,
      titleEnglish: m.title.english,
      titleRomaji: m.title.romaji,
      coverImageUrl: m.coverImage.large,
      averageScore: m.averageScore,
      popularity: m.popularity,
      episodes: m.episodes,
      format: m.format,
      genres: m.genres ?? [],
      relatedIds,
    };
  });
}

// --- Full media fetch (for franchise creation) ---

export interface AniListMediaFull extends AniListMedia {
  genres: string[];
  studio: string | null;
  seasonYear: number | null;
  season: string | null;
  episodes: number | null;
  format: string | null;
}

const MEDIA_BY_ID_FULL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        english
        romaji
      }
      description(asHtml: false)
      coverImage {
        extraLarge
        large
      }
      bannerImage
      averageScore
      meanScore
      popularity
      status
      genres
      studios(isMain: true) {
        nodes {
          name
          isAnimationStudio
        }
      }
      seasonYear
      season
      episodes
      format
    }
  }
`;

export async function fetchMediaByIdFull(id: number): Promise<AniListMediaFull | null> {
  const res = await anilistFetch(
    JSON.stringify({ query: MEDIA_BY_ID_FULL_QUERY, variables: { id } }),
  );

  if (!res.ok) {
    console.error(`AniList API error: ${res.status} ${res.statusText}`);
    return null;
  }

  const json = await res.json();
  const media = json.data?.Media ?? null;
  if (!media) return null;

  const mainStudio = media.studios?.nodes?.find(
    (s: { isAnimationStudio: boolean }) => s.isAnimationStudio,
  ) ?? media.studios?.nodes?.[0] ?? null;

  return {
    id: media.id,
    titleEnglish: media.title.english,
    titleRomaji: media.title.romaji,
    description: media.description,
    coverImageUrl: media.coverImage.extraLarge ?? media.coverImage.large,
    bannerImageUrl: media.bannerImage,
    averageScore: media.averageScore,
    meanScore: media.meanScore,
    memberCount: media.popularity,
    status: media.status,
    genres: media.genres ?? [],
    studio: mainStudio?.name ?? null,
    seasonYear: media.seasonYear,
    season: media.season,
    episodes: media.episodes,
    format: media.format,
  };
}

// --- Recommendations ---

export interface AniListRecommendation {
  id: number;
  titleEnglish: string | null;
  titleRomaji: string;
  coverImageUrl: string | null;
  rating: number;
}

const RECOMMENDATIONS_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      recommendations(perPage: 8, sort: RATING_DESC) {
        nodes {
          rating
          mediaRecommendation {
            id
            title { english romaji }
            coverImage { large }
          }
        }
      }
    }
  }
`;

export async function fetchRecommendations(id: number): Promise<AniListRecommendation[]> {
  const res = await anilistFetch(
    JSON.stringify({ query: RECOMMENDATIONS_QUERY, variables: { id } }),
    { revalidate: 86400 },
  );

  if (!res.ok) {
    console.error(`AniList API error: ${res.status} ${res.statusText}`);
    return [];
  }

  const json = await res.json();
  const nodes = json.data?.Media?.recommendations?.nodes ?? [];

  return nodes
    .filter((n: { mediaRecommendation: unknown }) => n.mediaRecommendation != null)
    .map((n: { rating: number; mediaRecommendation: { id: number; title: { english: string | null; romaji: string }; coverImage: { large: string | null } } }) => ({
      id: n.mediaRecommendation.id,
      titleEnglish: n.mediaRecommendation.title.english,
      titleRomaji: n.mediaRecommendation.title.romaji,
      coverImageUrl: n.mediaRecommendation.coverImage.large,
      rating: n.rating,
    }));
}

// --- Batch media fetch (for unmatched import items) ---

export interface AniListMediaBatchItem {
  id: number;
  titleEnglish: string | null;
  titleRomaji: string;
  coverImageUrl: string | null;
  format: string | null;
}

const MEDIA_BATCH_QUERY = `
  query ($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        title { english romaji }
        coverImage { large }
        format
      }
    }
  }
`;

export async function fetchMediaBatch(ids: number[]): Promise<AniListMediaBatchItem[]> {
  if (ids.length === 0) return [];

  const res = await anilistFetch(
    JSON.stringify({ query: MEDIA_BATCH_QUERY, variables: { ids: ids.slice(0, 50) } }),
  );

  if (!res.ok) {
    console.error(`AniList API error: ${res.status} ${res.statusText}`);
    return [];
  }

  const json = await res.json();
  const media = json.data?.Page?.media ?? [];

  return media.map((m: { id: number; title: { english: string | null; romaji: string }; coverImage: { large: string | null }; format: string | null }) => ({
    id: m.id,
    titleEnglish: m.title.english,
    titleRomaji: m.title.romaji,
    coverImageUrl: m.coverImage.large,
    format: m.format,
  }));
}

// --- User anime list (for import) ---

export interface AniListUserEntry {
  mediaId: number;
  status: "CURRENT" | "COMPLETED" | "PAUSED" | "DROPPED" | "PLANNING" | "REPEATING";
  progress: number;
  score: number | null;
  completedAt: { year: number | null; month: number | null; day: number | null } | null;
}

const USER_ANIME_LIST_QUERY = `
  query ($userName: String) {
    MediaListCollection(userName: $userName, type: ANIME) {
      lists {
        entries {
          mediaId
          status
          progress
          score(format: POINT_10_DECIMAL)
          completedAt { year month day }
        }
      }
    }
  }
`;

/**
 * Fetch a user's full anime list from AniList by username.
 * Flattens all lists into a single array and filters out PLANNING entries.
 * Returns null if the user is not found or the list is private.
 */
export async function fetchUserAnimeList(
  userName: string,
): Promise<AniListUserEntry[] | null> {
  const res = await anilistFetch(
    JSON.stringify({
      query: USER_ANIME_LIST_QUERY,
      variables: { userName },
    }),
  );

  if (!res.ok) {
    console.error(`AniList API error: ${res.status} ${res.statusText}`);
    return null;
  }

  const json = await res.json();
  if (json.errors) {
    console.error("AniList query errors:", json.errors);
    return null;
  }

  const lists = json.data?.MediaListCollection?.lists;
  if (!lists) return null;

  const entries: AniListUserEntry[] = [];
  for (const list of lists) {
    for (const entry of list.entries ?? []) {
      if (entry.status === "PLANNING") continue;
      entries.push({
        mediaId: entry.mediaId,
        status: entry.status,
        progress: entry.progress ?? 0,
        score: entry.score || null,
        completedAt: entry.completedAt ?? null,
      });
    }
  }

  return entries;
}

export async function fetchMediaById(id: number): Promise<AniListMedia | null> {
  const res = await anilistFetch(
    JSON.stringify({ query: MEDIA_BY_ID_QUERY, variables: { id } }),
  );

  if (!res.ok) {
    console.error(`AniList API error: ${res.status} ${res.statusText}`);
    return null;
  }

  const json = await res.json();
  const media: AniListMediaResult | null = json.data?.Media ?? null;
  if (!media) return null;

  return {
    id: media.id,
    titleEnglish: media.title.english,
    titleRomaji: media.title.romaji,
    description: media.description,
    coverImageUrl: media.coverImage.extraLarge ?? media.coverImage.large,
    bannerImageUrl: media.bannerImage,
    averageScore: media.averageScore,
    meanScore: media.meanScore,
    memberCount: media.popularity,
    status: media.status,
  };
}
