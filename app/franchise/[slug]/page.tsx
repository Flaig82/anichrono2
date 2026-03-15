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
  const supabase = createClient();

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
  const supabase = createClient();

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

export default async function FranchisePage({
  params,
}: {
  params: { slug: string };
}) {
  const franchise = await getFranchise(params.slug);

  // Alias redirect: if slug matches a parent_series name, redirect to its franchise
  if (!franchise) {
    const supabase = createClient();
    const slugPattern = params.slug.replace(/-/g, " ");

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

  return (
    <main className="px-4 md:px-8 lg:px-[120px] pt-10 pb-16">
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
