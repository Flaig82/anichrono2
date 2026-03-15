import RightSidebar from "@/components/layout/RightSidebar";
import HomeFeed from "@/components/layout/HomeFeed";
import SectionLabel from "@/components/shared/SectionLabel";
import PosterRow from "@/components/shared/PosterRow";
import DiscoverHero from "@/components/layout/DiscoverHero";
import { createClient } from "@/lib/supabase-server";
import { fetchDiscoverAnime } from "@/lib/anilist";
import type { PosterItem } from "@/components/shared/PosterRow";
import type { AniListDiscoverMedia, DiscoverFilters } from "@/lib/anilist";

async function getClaimedAnilistIds(): Promise<Set<number>> {
  const supabase = createClient();

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
    .slice(0, 6)
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
    // Filtered mode — single results section
    const results = await fetchDiscoverAnime(baseFilters);
    const posters = toPosters(results, claimedIds);

    return (
      <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
        <div className="flex flex-1 flex-col gap-10">
          <DiscoverHero unclaimedCount={posters.length} />

          <section className="flex flex-col gap-5">
            <SectionLabel>
              {posters.length} result{posters.length !== 1 ? "s" : ""}
            </SectionLabel>
            {posters.length > 0 ? (
              <PosterRow posters={posters} />
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

  // Default mode — curated sections by obscurity tier
  const [popularAnime, nicheAnime, hiddenAnime] = await Promise.all([
    fetchDiscoverAnime({ sort: "POPULARITY_DESC", popularityGreater: 50000 }),
    fetchDiscoverAnime({ sort: "SCORE_DESC", popularityGreater: 10000, popularityLesser: 50000 }),
    fetchDiscoverAnime({ sort: "SCORE_DESC", popularityLesser: 10000, popularityGreater: 2000 }),
  ]);

  const popularPosters = toPosters(popularAnime, claimedIds);
  const nichePosters = toPosters(nicheAnime, claimedIds);
  const hiddenPosters = toPosters(hiddenAnime, claimedIds);

  const totalUnclaimed = popularPosters.length + nichePosters.length + hiddenPosters.length;

  return (
    <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
      <div className="flex flex-1 flex-col gap-10">
        <DiscoverHero unclaimedCount={totalUnclaimed} />

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
              <SectionLabel>Cult Favorites — 2x Pioneer Aura</SectionLabel>
              <p className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
                10k–50k AniList members. Obscure enough to earn double Pioneer Aura.
              </p>
            </div>
            <PosterRow posters={nichePosters} />
          </section>
        )}

        {hiddenPosters.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <SectionLabel>Hidden Gems — 4x Pioneer Aura</SectionLabel>
              <p className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
                Under 10k members. Chronicle these and earn maximum Pioneer Aura.
              </p>
            </div>
            <PosterRow posters={hiddenPosters} />
          </section>
        )}
      </div>

      <div className="sticky top-[68px] h-fit">
        <RightSidebar>
          <HomeFeed />
        </RightSidebar>
      </div>
    </main>
  );
}
