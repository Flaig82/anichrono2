export const revalidate = 300; // 5 minutes — avoids re-querying Supabase on every visit

import HeroBanner from "@/components/layout/HeroBanner";
import RightSidebar from "@/components/layout/RightSidebar";
import HomeFeed from "@/components/layout/HomeFeed";
import SectionLabel from "@/components/shared/SectionLabel";
import ViewMoreButton from "@/components/shared/ViewMoreButton";
import FranchiseCard from "@/components/franchise/FranchiseCard";
import RouteCard from "@/components/route/RouteCard";
import { createClient } from "@/lib/supabase-server";
import WeeklyQuests from "@/components/quest/DailyQuests";
import type { RouteType } from "@/types/route";


async function getFranchises(opts: {
  sortBy: "updated_at" | "created_at";
  excludeIds?: string[];
} = { sortBy: "updated_at" }) {
  const supabase = await createClient();

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
    .order("created_at", { ascending: false })
    .limit(50);

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

interface PopularRoute {
  id: string;
  title: string;
  route_type: RouteType;
  entry_ids: string[];
  summary: string | null;
  vote_count: number;
  follower_count: number;
  is_canon: boolean;
  franchise: { title: string; slug: string; banner_image_url: string | null } | null;
  author: { display_name: string; handle: string | null; avatar_url: string | null } | null;
}

async function getPopularRoutes(): Promise<PopularRoute[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("route")
    .select(
      "id, title, route_type, entry_ids, summary, vote_count, follower_count, is_canon, franchise:franchise_id(title, slug, banner_image_url), author:author_id(display_name, handle, avatar_url)",
    )
    .in("status", ["approved", "canon"])
    .order("vote_count", { ascending: false })
    .limit(6);

  return (data ?? []) as unknown as PopularRoute[];
}

// Top franchise slugs by page views (from Vercel Analytics).
// TODO: automate via Vercel Analytics API or self-tracked view counts.
const MOST_POPULAR_SLUGS = [
  "my-teen-romantic-comedy-snafu",
  "inuyasha",
  "pokemon",
  "one-piece",
  "slam-dunk",
  "prince-of-tennis",
  "naruto",
  "kabaneri-of-the-iron-fortress",
];

async function getMostPopularFranchises(excludeIds: string[] = []) {
  const supabase = await createClient();

  const { data: franchises } = await supabase
    .from("franchise")
    .select("id, title, slug, genres, year_started, studio, status, banner_image_url, updated_at, created_at")
    .in("slug", MOST_POPULAR_SLUGS);

  if (!franchises) return [];

  // Filter out any already shown + re-sort to match the hardcoded order
  const slugOrder = new Map(MOST_POPULAR_SLUGS.map((s, i) => [s, i]));
  const filtered = franchises
    .filter((f) => !excludeIds.includes(f.id))
    .sort((a, b) => (slugOrder.get(a.slug) ?? 99) - (slugOrder.get(b.slug) ?? 99))
    .slice(0, 6);

  const franchiseIds = filtered.map((f) => f.id);

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

  return filtered.map((f) => ({
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
    updatedByUser: pyrat.name,
    updatedByHandle: pyrat.handle,
    updatedByAvatar: pyrat.avatar ?? undefined,
    wasEdited: false,
  }));
}

export default async function Home() {
  const [updatedFranchises, popularRoutes] = await Promise.all([
    getFranchises({ sortBy: "updated_at" }),
    getPopularRoutes(),
  ]);

  const excludeIds = updatedFranchises.map((f) => f.id);
  const [recentlyAdded, mostPopular] = await Promise.all([
    getFranchises({ sortBy: "created_at", excludeIds }),
    getMostPopularFranchises(excludeIds),
  ]);

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

        {/* Most Popular Franchises — sorted by popularity (lowest obscurity score) */}
        {mostPopular.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <SectionLabel>Most Popular</SectionLabel>
              <ViewMoreButton href="/chronicles?sort=popular" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mostPopular.map((franchise) => (
                <FranchiseCard key={franchise.slug} {...franchise} />
              ))}
            </div>
          </section>
        )}

        {/* Popular Chronicles — top-voted community watch routes */}
        {popularRoutes.length > 0 && (
          <section className="flex flex-col gap-5">
            <SectionLabel>Popular Chronicles</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popularRoutes.map((route) => (
                <RouteCard
                  key={route.id}
                  id={route.id}
                  title={route.title}
                  routeType={route.route_type}
                  isCanon={route.is_canon}
                  entryCount={route.entry_ids.length}
                  voteCount={route.vote_count}
                  followerCount={route.follower_count}
                  franchiseTitle={route.franchise?.title ?? "Unknown"}
                  franchiseBannerUrl={route.franchise?.banner_image_url ?? null}
                  authorName={route.author?.display_name ?? "Unknown"}
                  authorHandle={route.author?.handle ?? null}
                  authorAvatar={route.author?.avatar_url ?? null}
                />
              ))}
            </div>
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
