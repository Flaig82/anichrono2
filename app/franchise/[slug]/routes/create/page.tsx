import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import RouteCreator from "@/components/route/RouteCreator";
import type { EntryData } from "@/types/proposal";

export const dynamic = "force-dynamic";

/**
 * Route creator page for a specific franchise. Auth + era gated at the DB
 * (requireEra inside /api/route/create) — this page does a coarse pre-check
 * to avoid rendering the UI for ineligible users.
 */
export default async function CreateRoutePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/franchise/${slug}/routes/create`);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("total_aura")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.total_aura ?? 0) < 500) {
    // Initiates can't create routes — bounce back to the franchise page where
    // the ContributionCard will show them the era-progress bar.
    redirect(`/franchise/${slug}`);
  }

  const { data: franchise } = await supabase
    .from("franchise")
    .select("id, title, slug")
    .eq("slug", slug)
    .single();

  if (!franchise) notFound();

  const { data: entries } = await supabase
    .from("entry")
    .select(
      "id, franchise_id, position, title, entry_type, episode_start, episode_end, parent_series, anilist_id, is_essential, curator_note, cover_image_url",
    )
    .eq("franchise_id", franchise.id)
    .eq("is_removed", false)
    .order("position", { ascending: true });

  return (
    <main className="px-4 pb-16 pt-10 md:px-8 lg:px-[120px]">
      <RouteCreator
        franchiseId={franchise.id}
        franchiseSlug={franchise.slug}
        franchiseTitle={franchise.title}
        entries={(entries ?? []) as EntryData[]}
      />
    </main>
  );
}
