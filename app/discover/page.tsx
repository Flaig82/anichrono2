import type { Metadata } from "next";
import RightSidebar from "@/components/layout/RightSidebar";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Discover new anime to watch. Browse by genre, season, popularity, and more on AnimeChrono.",
};

import HomeFeed from "@/components/layout/HomeFeed";
import SectionLabel from "@/components/shared/SectionLabel";
import PosterRow from "@/components/shared/PosterRow";
import DiscoverHero from "@/components/layout/DiscoverHero";
import DiscoverLoadMore from "@/components/layout/DiscoverLoadMore";
import { createClient } from "@/lib/supabase-server";
import { fetchDiscoverAnime, fetchSeasonalTrending } from "@/lib/anilist";
import type { PosterItem } from "@/components/shared/PosterRow";
import type { AniListDiscoverMedia, DiscoverFilters } from "@/lib/anilist";

type Season = "WINTER" | "SPRING" | "SUMMER" | "FALL";

function getCurrentSeason(): { season: Season; year: number; label: string } {
  const month = new Date().getMonth() + 1;
  let season: Season;
  let label: string;
  if (month <= 3) { season = "WINTER"; label = "Winter"; }
  else if (month <= 6) { season = "SPRING"; label = "Spring"; }
  else if (month <= 9) { season = "SUMMER"; label = "Summer"; }
  else { season = "FALL"; label = "Fall"; }
  return { season, year: new Date().getFullYear(), label };
}

async function getClaimedAnilistIds(): Promise<Set<number>> {
  const supabase = await createClient();

  const [{ data: franchises }, { data: entries }] = await Promise.all([
    supabase.from("franchise").select("anilist_id").not("anilist_id", "is", null),
    supabase.from("entry").select("anilist_id").not("anilist_id", "is", null),
  ]);

  const ids = new Set<number>();
  for (const f of franchises ?? []) if (f.anilist_id) ids.add(f.anilist_id);
  for (const e of entries ?? []) if (e.anilist_id) ids.add(e.anilist_id);
  return ids;
}

function toPosters(anime: AniListDiscoverMedia[], claimedIds: Set<number>): PosterItem[] {
  return anime
    .filter((a) => !claimedIds.has(a.id))
    .slice(0, 12)
    .map((a) => ({
      src: a.coverImageUrl ?? "/images/poster-1.svg",
      alt: a.titleEnglish ?? a.titleRomaji,
      score: a.averageScore,
      anilistId: a.id,
    }));
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const claimedIds = await getClaimedAnilistIds();

  const hasFilters = params.q || params.genre || params.format || params.season || params.year;

  // Build shared filter base from URL params
  const baseFilters: DiscoverFilters = {
    sort: (params.sort as string) ?? undefined,
    search: (params.q as string) ?? undefined,
    genres: params.genre
      ? Array.isArray(params.genre) ? params.genre : [params.genre]
      : undefined,
    season: (params.season as string) ?? undefined,
    seasonYear: params.year ? Number(params.year) : undefined,
    formats: params.format
      ? [params.format as string]
      : undefined,
  };

  if (hasFilters) {
    // Filtered mode — single results section with load more
    const results = await fetchDiscoverAnime(baseFilters);
    const posters = toPosters(results, claimedIds);
    const hasMore = results.length >= 18;

    // Build string params for client-side load more
    const loadMoreParams: Record<string, string> = {};
    if (params.sort) loadMoreParams.sort = params.sort as string;
    if (params.q) loadMoreParams.q = params.q as string;
    if (params.genre) loadMoreParams.genre = (Array.isArray(params.genre) ? params.genre[0] : params.genre) as string;
    if (params.format) loadMoreParams.format = params.format as string;
    if (params.season) loadMoreParams.season = params.season as string;
    if (params.year) loadMoreParams.year = params.year as string;

    return (
      <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
        <div className="flex flex-1 flex-col gap-10">
          <DiscoverHero unclaimedCount={posters.length} />

          <section className="flex flex-col gap-5">
            <SectionLabel>
              {posters.length} result{posters.length !== 1 ? "s" : ""}
            </SectionLabel>
            {posters.length > 0 ? (
              <>
                <PosterRow posters={posters} />
                <DiscoverLoadMore
                  searchParams={loadMoreParams}
                  initialHasMore={hasMore}
                />
              </>
            ) : (
              <p className="font-body text-sm text-aura-muted2">
                No unclaimed anime match your filters. Try broadening your search.
              </p>
            )}
          </section>
        </div>

        <div className="sticky top-[68px] hidden h-fit lg:block">
          <RightSidebar>
            <HomeFeed />
          </RightSidebar>
        </div>
      </main>
    );
  }

  // Default mode — curated sections by obscurity tier + trending
  const { season, year, label } = getCurrentSeason();

  const [trendingAnime, popularAnime, nicheAnime, hiddenAnime] = await Promise.all([
    fetchSeasonalTrending(season, year),
    fetchDiscoverAnime({ sort: "POPULARITY_DESC", popularityGreater: 50000 }),
    fetchDiscoverAnime({ sort: "SCORE_DESC", popularityGreater: 10000, popularityLesser: 50000 }),
    fetchDiscoverAnime({ sort: "SCORE_DESC", popularityLesser: 10000, popularityGreater: 2000 }),
  ]);

  // Convert trending to poster items, filtering out claimed
  const trendingPosters: PosterItem[] = trendingAnime
    .filter((a) => !claimedIds.has(a.id))
    .slice(0, 12)
    .map((a) => ({
      src: a.coverImageUrl ?? "/images/poster-1.svg",
      alt: a.titleEnglish ?? a.titleRomaji,
      score: a.averageScore,
      anilistId: a.id,
    }));

  const popularPosters = toPosters(popularAnime, claimedIds);
  const nichePosters = toPosters(nicheAnime, claimedIds);
  const hiddenPosters = toPosters(hiddenAnime, claimedIds);

  const totalUnclaimed = trendingPosters.length + popularPosters.length + nichePosters.length + hiddenPosters.length;

  return (
    <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
      <div className="flex flex-1 flex-col gap-10">
        <DiscoverHero unclaimedCount={totalUnclaimed} />

        {trendingPosters.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <SectionLabel>Trending {label} {year} — No Chronicle</SectionLabel>
              <p className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
                Currently airing shows the community hasn&apos;t chronicled yet.
              </p>
            </div>
            <PosterRow posters={trendingPosters} />
          </section>
        )}

        {popularPosters.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <SectionLabel>Popular — No Chronicle Yet</SectionLabel>
              <p className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
                Well-known anime that the community hasn&apos;t built a watch order for yet.
              </p>
            </div>
            <PosterRow posters={popularPosters} />
          </section>
        )}

        {nichePosters.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <SectionLabel>Cult Favorites</SectionLabel>
              <p className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
                10k–50k AniList members. Great anime the community hasn&apos;t chronicled yet.
              </p>
            </div>
            <PosterRow posters={nichePosters} />
          </section>
        )}

        {hiddenPosters.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <SectionLabel>Hidden Gems</SectionLabel>
              <p className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
                Under 10k members. Chronicle these hidden gems for the community.
              </p>
            </div>
            <PosterRow posters={hiddenPosters} />
          </section>
        )}
      </div>

      <div className="sticky top-[68px] hidden h-fit lg:block">
        <RightSidebar>
          <HomeFeed />
        </RightSidebar>
      </div>
    </main>
  );
}
