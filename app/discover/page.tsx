import type { Metadata } from "next";
import RightSidebar from "@/components/layout/RightSidebar";

export const revalidate = 600; // 10 minutes

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
import ApiDownBanner from "@/components/shared/ApiDownBanner";
import FranchiseCard from "@/components/franchise/FranchiseCard";
import { createClient } from "@/lib/supabase-server";
import { getCachedTrending, getCachedDiscoverList, queryCachedMedia } from "@/lib/anilist-cache";
import { getClaimedAnilistIds } from "@/lib/claimed-anime";
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

async function FallbackChronicles() {
  const supabase = await createClient();

  const { data: franchises } = await supabase
    .from("franchise")
    .select("id, title, slug, genres, year_started, studio, status, banner_image_url, cover_image_url, updated_at")
    .order("updated_at", { ascending: false })
    .limit(6);

  if (!franchises?.length) return null;

  const franchiseIds = franchises.map((f) => f.id);

  const { data: entries } = await supabase
    .from("entry")
    .select("franchise_id, entry_type")
    .in("franchise_id", franchiseIds)
    .eq("is_removed", false);

  const entryMap = new Map<string, { count: number; types: string[] }>();
  for (const entry of entries ?? []) {
    const existing = entryMap.get(entry.franchise_id);
    if (existing) {
      existing.count++;
      existing.types.push(entry.entry_type);
    } else {
      entryMap.set(entry.franchise_id, { count: 1, types: [entry.entry_type] });
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <SectionLabel>Browse Chronicles</SectionLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {franchises.map((f) => (
          <FranchiseCard
            key={f.slug}
            slug={f.slug}
            title={f.title}
            studio={f.studio ?? ""}
            yearStarted={f.year_started ?? 0}
            status={f.status ?? "finished"}
            genres={f.genres ?? []}
            bannerImageUrl={f.banner_image_url ?? null}
            coverImageUrl={f.cover_image_url ?? null}
            entryCount={entryMap.get(f.id)?.count ?? 0}
            entryTypes={entryMap.get(f.id)?.types ?? []}
          />
        ))}
      </div>
    </section>
  );
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const claimedIds = await getClaimedAnilistIds(supabase);

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
    // Filtered mode — query cache with filters
    const results = await queryCachedMedia(supabase, baseFilters);
    const posters = toPosters(results, claimedIds);
    const hasMore = false; // Cache has limited data, no pagination

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

  // Default mode — curated sections from Supabase cache
  const { season, year, label } = getCurrentSeason();

  const [trendingAnime, popularAnime, nicheAnime, hiddenAnime] = await Promise.all([
    getCachedTrending(supabase, season, year),
    getCachedDiscoverList(supabase, "popular"),
    getCachedDiscoverList(supabase, "niche"),
    getCachedDiscoverList(supabase, "hidden"),
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

        {totalUnclaimed === 0 && (
          <>
            <ApiDownBanner />
            <FallbackChronicles />
          </>
        )}

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
