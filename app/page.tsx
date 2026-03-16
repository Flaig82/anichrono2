import HeroBanner from "@/components/layout/HeroBanner";
import RightSidebar from "@/components/layout/RightSidebar";
import HomeFeed from "@/components/layout/HomeFeed";
import SectionLabel from "@/components/shared/SectionLabel";
import PosterRow from "@/components/shared/PosterRow";
import ViewMoreButton from "@/components/shared/ViewMoreButton";
import FranchiseCard from "@/components/franchise/FranchiseCard";
import { createClient } from "@/lib/supabase-server";
import { fetchSeasonalTrending, fetchDiscoverAnime } from "@/lib/anilist";
import WeeklyQuests from "@/components/quest/DailyQuests";

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


async function getFranchises(opts: {
  sortBy: "updated_at" | "created_at";
  excludeIds?: string[];
} = { sortBy: "updated_at" }) {
  const supabase = createClient();

  let query = supabase
    .from("franchise")
    .select("id, title, slug, genres, year_started, studio, status, banner_image_url, updated_at, created_at")
    .order(opts.sortBy, { ascending: false })
    .limit(3);

  if (opts.excludeIds?.length) {
    query = query.not("id", "in", `(${opts.excludeIds.join(",")})`);
  }

  const { data: franchises } = await query;

  if (!franchises) return [];

  const franchiseIds = franchises.map((f) => f.id);

  // Fetch the Pyrat user as fallback creator for imported franchises
  const { data: pyratUser } = await supabase
    .from("users")
    .select("display_name, handle, avatar_url")
    .eq("handle", "pyrat")
    .single();

  const pyrat = {
    name: pyratUser?.display_name ?? "Pyrat",
    handle: pyratUser?.handle ?? null,
    avatar: pyratUser?.avatar_url ?? null,
  };

  // Fetch entry counts for these franchises
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

  // Find the most recent proposal author per franchise (if any)
  const { data: proposals } = await supabase
    .from("order_proposal")
    .select("franchise_id, author_id, created_at, users:author_id(display_name, handle, avatar_url)")
    .in("franchise_id", franchiseIds)
    .order("created_at", { ascending: false });

  const lastEditorMap = new Map<string, { name: string; handle: string | null; id: string; avatar: string | null }>();
  for (const p of proposals ?? []) {
    if (!lastEditorMap.has(p.franchise_id)) {
      const user = p.users as unknown as { display_name: string; handle: string | null; avatar_url: string | null } | null;
      if (user) {
        lastEditorMap.set(p.franchise_id, {
          name: user.display_name,
          handle: user.handle,
          id: p.author_id,
          avatar: user.avatar_url,
        });
      }
    }
  }

  return franchises.map((f) => {
    const editor = lastEditorMap.get(f.id);

    return {
      id: f.id,
      slug: f.slug,
      title: f.title,
      studio: f.studio ?? "",
      yearStarted: f.year_started ?? 0,
      status: f.status ?? "finished",
      genres: f.genres ?? [],
      bannerImageUrl: f.banner_image_url ?? null,
      entryCount: entryMap.get(f.id)?.count ?? 0,
      entryTypes: entryMap.get(f.id)?.types ?? [],
      updatedAt: f.updated_at as string,
      updatedByUser: editor ? editor.name : pyrat.name,
      updatedByHandle: editor ? (editor.handle ?? editor.id) : pyrat.handle,
      updatedByAvatar: (editor?.avatar ?? pyrat.avatar) ?? undefined,
      wasEdited: !!editor,
    };
  });
}

export default async function Home() {
  const supabase = createClient();
  const { season, year, label } = getCurrentSeason();
  const [updatedFranchises, seasonalAnime, hiddenGems] = await Promise.all([
    getFranchises({ sortBy: "updated_at" }),
    fetchSeasonalTrending(season, year),
    fetchDiscoverAnime({ sort: "SCORE_DESC", popularityLesser: 10000, popularityGreater: 2000 }),
  ]);

  const excludeIds = updatedFranchises.map((f) => f.id);
  const recentlyAdded = await getFranchises({ sortBy: "created_at", excludeIds });

  // Collect all AniList IDs (the show itself + its prequels/parents)
  // to match against our franchise and entry tables
  const allAnilistIds = seasonalAnime.flatMap((a) => [a.id, ...a.relatedIds]);

  const [{ data: matchedFranchises }, { data: matchedEntries }] = await Promise.all([
    supabase
      .from("franchise")
      .select("anilist_id, slug")
      .in("anilist_id", allAnilistIds),
    supabase
      .from("entry")
      .select("anilist_id, franchise_id, franchise:franchise_id(slug)")
      .in("anilist_id", allAnilistIds),
  ]);

  // Build a map: AniList ID → franchise slug
  const anilistToSlug = new Map<number, string>();
  for (const f of matchedFranchises ?? []) {
    if (f.anilist_id && f.slug) anilistToSlug.set(f.anilist_id, f.slug);
  }
  for (const e of matchedEntries ?? []) {
    if (e.anilist_id && !anilistToSlug.has(e.anilist_id)) {
      const franchise = e.franchise as unknown as { slug: string } | null;
      if (franchise?.slug) anilistToSlug.set(e.anilist_id, franchise.slug);
    }
  }

  // Resolve each seasonal anime to a franchise slug
  const seasonPosters = seasonalAnime.map((a) => {
    // Check direct match first, then check prequels/parents
    let slug = anilistToSlug.get(a.id);
    if (!slug) {
      for (const relId of a.relatedIds) {
        slug = anilistToSlug.get(relId);
        if (slug) break;
      }
    }

    return {
      src: a.coverImageUrl ?? "/images/poster-1.svg",
      alt: a.titleEnglish ?? a.titleRomaji,
      score: a.averageScore,
      href: slug ? `/franchise/${slug}` : undefined,
      anilistId: slug ? undefined : a.id,
    };
  });

  const hiddenGemPosters = hiddenGems.slice(0, 12).map((a) => ({
    src: a.coverImageUrl ?? "/images/poster-1.svg",
    alt: a.titleEnglish ?? a.titleRomaji,
    score: a.averageScore,
    anilistId: a.id,
  }));

  return (
    <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
      {/* Main content */}
      <div className="flex flex-1 flex-col gap-10">
        {/* Hero */}
        <HeroBanner />

        {/* Weekly Quests — logged-in users only */}
        <WeeklyQuests />

        {/* Recently Updated Chronicles */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <SectionLabel>Updated Chronicles</SectionLabel>
            <ViewMoreButton href="/discover" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {updatedFranchises.map((franchise) => (
              <FranchiseCard key={franchise.slug} {...franchise} />
            ))}
          </div>
        </section>

        {/* Recently Added Chronicles */}
        {recentlyAdded.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <SectionLabel>Recently Added Chronicles</SectionLabel>
              <ViewMoreButton href="/discover" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentlyAdded.map((franchise) => (
                <FranchiseCard key={franchise.slug} {...franchise} />
              ))}
            </div>
          </section>
        )}

        {/* Popular this season */}
        <section className="flex flex-col gap-5">
          <SectionLabel>Popular {label} {year} season</SectionLabel>
          <PosterRow posters={seasonPosters} />
        </section>

        {/* Hidden Gems */}
        {hiddenGemPosters.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <SectionLabel>Hidden Gems</SectionLabel>
                <p className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
                  Under 10k members. Chronicle these hidden gems for the community.
                </p>
              </div>
              <ViewMoreButton href="/discover" />
            </div>
            <PosterRow posters={hiddenGemPosters} />
          </section>
        )}
      </div>

      {/* Sticky sidebar — hidden on mobile */}
      <div className="sticky top-[68px] hidden h-fit lg:block">
        <RightSidebar>
          <HomeFeed />
        </RightSidebar>
      </div>
    </main>
  );
}
