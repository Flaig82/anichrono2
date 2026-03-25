import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import MasterOrderSection from "@/components/franchise/MasterOrderSection";
import type { EntryData } from "@/types/proposal";

interface EntryRow extends EntryData {
  cover_image_url: string | null;
}

interface EntryGroupData {
  parentSeries: string;
  entries: EntryRow[];
}

async function getFranchise(slug: string) {
  const supabase = await createClient();

  const { data: franchise } = await supabase
    .from("franchise")
    .select(
      "id, title, slug, genres, year_started, studio, status, description, banner_image_url, cover_image_url, anilist_id, obscurity_tier",
    )
    .eq("slug", slug)
    .single();

  return franchise;
}

async function getEntries(franchiseId: string): Promise<EntryRow[]> {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("entry")
    .select(
      "id, franchise_id, title, entry_type, episode_start, episode_end, position, parent_series, anilist_id, is_essential, curator_note, cover_image_url",
    )
    .eq("franchise_id", franchiseId)
    .eq("is_removed", false)
    .order("position", { ascending: true });

  return (entries ?? []) as EntryRow[];
}

function groupEntriesByParentSeries(entries: EntryRow[]): EntryGroupData[] {
  const groups: EntryGroupData[] = [];
  let currentGroup: EntryGroupData | null = null;

  for (const entry of entries) {
    const series = entry.parent_series ?? "Unknown";

    if (!currentGroup || currentGroup.parentSeries !== series) {
      currentGroup = { parentSeries: series, entries: [] };
      groups.push(currentGroup);
    }

    currentGroup.entries.push(entry);
  }

  return groups;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const franchise = await getFranchise(slug);

  if (!franchise) {
    return { title: "Franchise Not Found" };
  }

  const title = `${franchise.title} Watch Order`;
  const description =
    franchise.description ??
    `Complete watch order guide for ${franchise.title} — community-curated on AnimeChrono.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://animechrono.com/franchise/${franchise.slug}`,
      images: franchise.cover_image_url
        ? [{ url: franchise.cover_image_url, alt: franchise.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: franchise.cover_image_url ? [franchise.cover_image_url] : [],
    },
    alternates: {
      canonical: `https://animechrono.com/franchise/${franchise.slug}`,
    },
  };
}

export default async function FranchisePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const franchise = await getFranchise(slug);

  // Alias redirect: if slug matches a parent_series name, redirect to its franchise
  if (!franchise) {
    const supabase = await createClient();
    const slugPattern = slug.replace(/-/g, " ");

    const { data: entry } = await supabase
      .from("entry")
      .select("franchise_id")
      .ilike("parent_series", `${slugPattern}%`)
      .eq("is_removed", false)
      .limit(1)
      .single();

    if (entry) {
      const { data: parentFranchise } = await supabase
        .from("franchise")
        .select("slug")
        .eq("id", entry.franchise_id)
        .single();

      if (parentFranchise) {
        redirect(`/franchise/${parentFranchise.slug}`);
      }
    }

    notFound();
  }

  const entries = await getEntries(franchise.id);
  const entryGroups = groupEntriesByParentSeries(entries);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://animechrono.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Chronicles",
        item: "https://animechrono.com/chronicles",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: franchise.title,
        item: `https://animechrono.com/franchise/${franchise.slug}`,
      },
    ],
  };

  return (
    <main className="px-4 md:px-8 lg:px-[120px] pt-10 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <MasterOrderSection
        franchiseId={franchise.id}
        entries={entries}
        entryGroups={entryGroups}
        franchiseStatus={franchise.status ?? "finished"}
        franchiseCoverImageUrl={franchise.cover_image_url}
        anilistId={franchise.anilist_id ?? null}
        heroTitle={franchise.title}
        heroDescription={franchise.description}
        heroBannerImageUrl={franchise.banner_image_url}
        heroGenres={franchise.genres ?? []}
      />
    </main>
  );
}
