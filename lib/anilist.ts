const ANILIST_URL = "https://graphql.anilist.co";

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
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: MEDIA_RELATIONS_QUERY, variables: { id } }),
  });

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

  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: SEARCH_MEDIA_QUERY, variables: { search: query } }),
  });

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

  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: DISCOVER_QUERY, variables }),
    next: { revalidate: 3600 },
  });

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
    Page(perPage: 10) {
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
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: SEASONAL_TRENDING_QUERY,
      variables: { season, seasonYear: year },
    }),
    next: { revalidate: 3600 },
  });

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

export async function fetchMediaById(id: number): Promise<AniListMedia | null> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: MEDIA_BY_ID_QUERY, variables: { id } }),
  });

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
