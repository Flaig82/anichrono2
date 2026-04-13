import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import RouteDetailView from "@/components/route/RouteDetailView";
import { computeStaleness } from "@/lib/route-staleness";
import type { RouteData } from "@/types/route";
import type { EntryData } from "@/types/proposal";

export const dynamic = "force-dynamic";

async function getRoute(id: string) {
  const supabase = await createClient();

  const { data: route } = await supabase
    .from("route")
    .select(
      "id, franchise_id, author_id, title, route_type, entry_ids, summary, status, vote_count, follower_count, is_canon, reject_reason, created_at, updated_at, author:users!author_id(display_name, handle, avatar_url, era)",
    )
    .eq("id", id)
    .single();

  if (!route) return null;

  const { data: franchise } = await supabase
    .from("franchise")
    .select("slug, title, banner_image_url")
    .eq("id", route.franchise_id)
    .single();

  if (!franchise) return null;

  const { data: entryRows } = await supabase
    .from("entry")
    .select(
      "id, franchise_id, position, title, entry_type, episode_start, episode_end, parent_series, anilist_id, is_essential, curator_note, cover_image_url",
    )
    .in("id", route.entry_ids)
    .eq("is_removed", false);

  const byId = new Map<string, EntryData>();
  for (const e of (entryRows ?? []) as EntryData[]) {
    byId.set(e.id, e);
  }
  const orderedEntries = route.entry_ids
    .map((id: string) => byId.get(id))
    .filter((e: EntryData | undefined): e is EntryData => !!e);

  // Compute staleness vs master order
  const { data: allMasterEntries } = await supabase
    .from("entry")
    .select("id")
    .eq("franchise_id", route.franchise_id)
    .eq("is_removed", false)
    .order("position", { ascending: true });

  const masterIds = (allMasterEntries ?? []).map((e) => e.id);
  const staleness = computeStaleness(route.entry_ids, masterIds);

  return {
    route: { ...(route as unknown as RouteData), staleness },
    franchise,
    entries: orderedEntries,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getRoute(id);
  if (!data) return { title: "Chronicle Not Found" };

  return {
    title: `${data.route.title} · ${data.franchise.title} Chronicle`,
    description: data.route.summary ?? undefined,
  };
}

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRoute(id);
  if (!data) notFound();

  return (
    <main className="px-4 pb-16 pt-10 md:px-8 lg:px-[120px]">
      <RouteDetailView
        route={{ ...data.route, entries: data.entries }}
        franchise={{
          slug: data.franchise.slug,
          title: data.franchise.title,
          banner_image_url: data.franchise.banner_image_url,
        }}
      />
    </main>
  );
}
