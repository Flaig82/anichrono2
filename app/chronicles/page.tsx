import type { Metadata } from "next";
import RightSidebar from "@/components/layout/RightSidebar";

export const revalidate = 1800; // 30 minutes

export const metadata: Metadata = {
  title: "Chronicles",
  description:
    "Browse community-curated watch orders for every anime franchise. Find the best way to experience your favorite series.",
};

import HomeFeed from "@/components/layout/HomeFeed";
import SectionLabel from "@/components/shared/SectionLabel";
import SortTabs from "@/components/shared/SortTabs";
import FranchiseCard from "@/components/franchise/FranchiseCard";
import ChroniclesHero from "@/components/layout/ChroniclesHero";
import { createClient } from "@/lib/supabase-server";

interface FranchiseItem {
  slug: string;
  title: string;
  studio: string;
  yearStarted: number;
  status: string;
  genres: string[];
  bannerImageUrl: string | null;
  entryCount: number;
  entryTypes: string[];
  updatedAt: string;
  updatedByUser: string;
  updatedByHandle: string | null;
  updatedByAvatar: string | undefined;
  wasEdited: boolean;
  obscurityScore: number | null;
}

async function getAllFranchises(): Promise<FranchiseItem[]> {
  const supabase = await createClient();

  const { data: franchises } = await supabase
    .from("franchise")
    .select("id, title, slug, genres, year_started, studio, status, banner_image_url, obscurity_score, updated_at, created_at, created_by, creator:created_by(display_name, handle, avatar_url)")
    .order("updated_at", { ascending: false })
    .limit(500);

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

  const [{ data: entries }, { data: proposals }] = await Promise.all([
    supabase
      .from("entry")
      .select("franchise_id, entry_type")
      .in("franchise_id", franchiseIds)
      .eq("is_removed", false)
      .limit(10000),
    supabase
      .from("order_proposal")
      .select("franchise_id, author_id, created_at, users:author_id(display_name, handle, avatar_url)")
      .in("franchise_id", franchiseIds)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

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
    const creator = f.creator as unknown as { display_name: string; handle: string | null; avatar_url: string | null } | null;

    const authorName = editor?.name ?? creator?.display_name ?? pyrat.name;
    const authorHandle = editor?.handle ?? editor?.id ?? creator?.handle ?? pyrat.handle;
    const authorAvatar = editor?.avatar ?? creator?.avatar_url ?? pyrat.avatar;

    return {
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
      updatedByUser: authorName,
      updatedByHandle: authorHandle,
      updatedByAvatar: authorAvatar ?? undefined,
      wasEdited: !!editor,
      obscurityScore: f.obscurity_score ?? null,
    };
  });
}

function filterAndSort(
  franchises: FranchiseItem[],
  params: Record<string, string | string[] | undefined>,
): FranchiseItem[] {
  let result = [...franchises];

  // Search
  const q = (params.q as string)?.toLowerCase();
  if (q) {
    result = result.filter((f) => f.title.toLowerCase().includes(q));
  }

  // Status
  const status = params.status as string | undefined;
  if (status) {
    result = result.filter((f) => f.status === status);
  }

  // Decade
  const decade = params.decade as string | undefined;
  if (decade === "pre") {
    result = result.filter((f) => f.yearStarted > 0 && f.yearStarted < 1970);
  } else if (decade) {
    const decadeStart = Number(decade);
    result = result.filter(
      (f) => f.yearStarted >= decadeStart && f.yearStarted < decadeStart + 10,
    );
  }

  // Genres (all selected genres must match)
  const genres = params.genre
    ? Array.isArray(params.genre) ? params.genre : [params.genre]
    : [];
  if (genres.length > 0) {
    result = result.filter((f) =>
      genres.every((g) => f.genres.includes(g)),
    );
  }

  // Sort
  const sort = (params.sort as string) ?? "alpha";
  switch (sort) {
    case "alpha":
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "popular":
      // Lower obscurity score = more popular (0.5 mainstream → 4.0 obscure)
      // Null scores go last, ties broken alphabetically
      result.sort((a, b) => {
        const aScore = a.obscurityScore ?? 99;
        const bScore = b.obscurityScore ?? 99;
        if (aScore !== bScore) return aScore - bScore;
        return a.title.localeCompare(b.title);
      });
      break;
    case "year":
      result.sort((a, b) => b.yearStarted - a.yearStarted);
      break;
    case "entries":
      result.sort((a, b) => b.entryCount - a.entryCount);
      break;
    case "updated":
      // Already sorted by updated_at from the query
      break;
    default:
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }

  return result;
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ChroniclesPage({ searchParams }: PageProps) {
  const [allFranchises, params] = await Promise.all([
    getAllFranchises(),
    searchParams,
  ]);

  const franchises = filterAndSort(allFranchises, params);

  return (
    <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
      {/* Main content */}
      <div className="flex flex-1 flex-col gap-10">
        <ChroniclesHero franchiseCount={allFranchises.length} />

        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionLabel>
              {franchises.length === allFranchises.length
                ? "All Chronicles"
                : `${franchises.length} result${franchises.length !== 1 ? "s" : ""}`}
            </SectionLabel>
            <SortTabs />
          </div>
          {franchises.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {franchises.map((franchise) => (
                <FranchiseCard key={franchise.slug} {...franchise} />
              ))}
            </div>
          ) : (
            <p className="font-body text-sm text-aura-muted2">
              No chronicles match your filters. Try broadening your search.
            </p>
          )}
        </section>
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
