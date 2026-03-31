import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RightSidebar from "@/components/layout/RightSidebar";
import HomeFeed from "@/components/layout/HomeFeed";
import SectionLabel from "@/components/shared/SectionLabel";
import FranchiseCard from "@/components/franchise/FranchiseCard";
import PosterRow from "@/components/shared/PosterRow";
import { createClient } from "@/lib/supabase-server";
import { queryCachedMedia } from "@/lib/anilist-cache";
import { getClaimedAnilistIds } from "@/lib/claimed-anime";
import type { PosterItem } from "@/components/shared/PosterRow";
import type { AniListDiscoverMedia } from "@/lib/anilist";
import SearchInput from "./SearchInput";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for anime chronicles and discover new series on AnimeChrono.",
};

interface FranchiseResult {
  slug: string;
  title: string;
  studio: string;
  yearStarted: number;
  status: string;
  genres: string[];
  bannerImageUrl: string | null;
  entryCount: number;
  entryTypes: string[];
}

async function searchFranchises(query: string): Promise<FranchiseResult[]> {
  if (!query) return [];

  const supabase = await createClient();

  const { data: franchises } = await supabase
    .from("franchise")
    .select("id, title, slug, genres, year_started, studio, status, banner_image_url")
    .ilike("title", `%${query}%`)
    .order("title")
    .limit(12);

  if (!franchises || franchises.length === 0) return [];

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

  return franchises.map((f) => ({
    slug: f.slug,
    title: f.title,
    studio: f.studio ?? "",
    yearStarted: f.year_started ?? 0,
    status: f.status ?? "finished",
    genres: f.genres ?? [],
    bannerImageUrl: f.banner_image_url ?? null,
    entryCount: entryMap.get(f.id)?.count ?? 0,
    entryTypes: entryMap.get(f.id)?.types ?? [],
  }));
}

async function searchUnclaimed(query: string): Promise<PosterItem[]> {
  if (!query) return [];

  const supabase = await createClient();

  const [results, claimedIds] = await Promise.all([
    queryCachedMedia(supabase, { search: query }),
    getClaimedAnilistIds(supabase),
  ]);

  return results
    .filter((a: AniListDiscoverMedia) => !claimedIds.has(a.id))
    .slice(0, 12)
    .map((a: AniListDiscoverMedia) => ({
      src: a.coverImageUrl ?? "/images/poster-1.svg",
      alt: a.titleEnglish ?? a.titleRomaji,
      score: a.averageScore,
      anilistId: a.id,
    }));
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = ((params.q as string) ?? "").trim();

  const [chronicles, unclaimed] = q
    ? await Promise.all([searchFranchises(q), searchUnclaimed(q)])
    : [[], []];

  const noResults = q && chronicles.length === 0 && unclaimed.length === 0;

  return (
    <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
      <div className="flex flex-1 flex-col gap-10">
        {/* Search input */}
        <SearchInput defaultValue={q} />

        {/* No query state */}
        {!q && (
          <p className="font-body text-sm text-aura-muted2">
            Type a search query to find chronicles and anime.
          </p>
        )}

        {/* No results */}
        {noResults && (
          <p className="font-body text-sm text-aura-muted2">
            No results found for &ldquo;{q}&rdquo;. Try a different search term.
          </p>
        )}

        {/* Chronicles section */}
        {chronicles.length > 0 && (
          <section className="flex flex-col gap-5">
            <SectionLabel>Chronicles</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {chronicles.map((franchise) => (
                <FranchiseCard key={franchise.slug} {...franchise} />
              ))}
            </div>
          </section>
        )}

        {/* Unclaimed anime section */}
        {unclaimed.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <SectionLabel>Unclaimed Anime</SectionLabel>
              <Link
                href={`/discover?q=${encodeURIComponent(q)}`}
                className="flex items-center gap-1 font-mono text-[11px] tracking-wide text-aura-muted2 transition-colors hover:text-white"
              >
                See all on Discover
                <ArrowRight size={12} />
              </Link>
            </div>
            <PosterRow posters={unclaimed} />
          </section>
        )}
      </div>

      {/* Sticky sidebar */}
      <div className="sticky top-[68px] hidden h-fit lg:block">
        <RightSidebar>
          <HomeFeed />
        </RightSidebar>
      </div>
    </main>
  );
}
