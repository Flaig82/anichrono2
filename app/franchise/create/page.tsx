import { redirect } from "next/navigation";
import { fetchMediaByIdFull, fetchMediaRelations } from "@/lib/anilist";
import { buildInitialEntries } from "@/lib/chronicle-builder";
import { createClient } from "@/lib/supabase-server";
import CreateChroniclePage from "@/components/franchise/CreateChroniclePage";

export default async function FranchiseCreatePage({
  searchParams,
}: {
  searchParams: { anilist?: string };
}) {
  // Auth check — only logged-in users can create franchises
  const supabaseAuth = createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const anilistIdStr = searchParams.anilist;
  if (!anilistIdStr) {
    redirect("/discover");
  }

  const anilistId = parseInt(anilistIdStr, 10);
  if (isNaN(anilistId)) {
    redirect("/discover");
  }

  // Fetch full media data and relations in parallel
  const [media, relations] = await Promise.all([
    fetchMediaByIdFull(anilistId),
    fetchMediaRelations(anilistId),
  ]);

  if (!media) {
    redirect("/discover");
  }

  // Build initial entries from main anime + relations
  const placeholderFranchiseId = "00000000-0000-0000-0000-000000000000";
  const initialEntries = buildInitialEntries(media, relations, placeholderFranchiseId);

  // Check if this anime (or any of its relations) belongs to an existing franchise
  const allAnilistIds = [media.id, ...relations.map((r) => r.id)];
  const matchedFranchise = await findMatchingFranchise(allAnilistIds);

  return (
    <CreateChroniclePage
      media={media}
      relations={relations}
      initialEntries={initialEntries}
      matchedFranchise={matchedFranchise}
    />
  );
}

async function findMatchingFranchise(
  anilistIds: number[],
): Promise<{ slug: string; title: string; coverImageUrl: string | null } | null> {
  const supabase = createClient();

  // Check franchise table first (direct match is stronger signal)
  const { data: franchiseMatches } = await supabase
    .from("franchise")
    .select("slug, title, cover_image_url")
    .in("anilist_id", anilistIds)
    .limit(1);

  const franchiseMatch = franchiseMatches?.[0];
  if (franchiseMatch) {
    return {
      slug: franchiseMatch.slug,
      title: franchiseMatch.title,
      coverImageUrl: franchiseMatch.cover_image_url,
    };
  }

  // Check entry table (anime exists as an entry in some franchise)
  // Use .neq("is_removed", true) to handle NULL values from older seed data
  const { data: entryMatches } = await supabase
    .from("entry")
    .select("franchise_id")
    .in("anilist_id", anilistIds)
    .neq("is_removed", true)
    .limit(1);

  const entryMatch = entryMatches?.[0];
  if (entryMatch) {
    const { data: franchise } = await supabase
      .from("franchise")
      .select("slug, title, cover_image_url")
      .eq("id", entryMatch.franchise_id)
      .maybeSingle();

    if (franchise) {
      return {
        slug: franchise.slug,
        title: franchise.title,
        coverImageUrl: franchise.cover_image_url,
      };
    }
  }

  return null;
}
