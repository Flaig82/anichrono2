import { createClient } from "@supabase/supabase-js";
import { fetchMediaById } from "../lib/anilist";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Pioneer obscurity tiers from CLAUDE.md
function getObscurityTier(memberCount: number): { score: number; tier: string } {
  if (memberCount >= 500_000) return { score: 0.5, tier: "mainstream" };
  if (memberCount >= 100_000) return { score: 1.0, tier: "popular" };
  if (memberCount >= 10_000) return { score: 2.0, tier: "cult" };
  return { score: 4.0, tier: "obscure" };
}

async function sync() {
  const { data: franchises, error } = await supabase
    .from("franchise")
    .select("id, title, anilist_id")
    .not("anilist_id", "is", null);

  if (error || !franchises) {
    console.error("Failed to fetch franchises:", error?.message);
    return;
  }

  console.log(`Syncing ${franchises.length} franchises from AniList...\n`);

  for (const franchise of franchises) {
    const media = await fetchMediaById(franchise.anilist_id);

    if (!media) {
      console.error(`✗ ${franchise.title} — AniList ID ${franchise.anilist_id} not found`);
      continue;
    }

    const { score, tier } = getObscurityTier(media.memberCount ?? 0);

    // Only update image fields when AniList returns a value —
    // never overwrite existing images with null
    const updates: Record<string, unknown> = {
      description: media.description,
      obscurity_score: score,
      obscurity_tier: tier,
    };
    if (media.coverImageUrl) updates.cover_image_url = media.coverImageUrl;
    if (media.bannerImageUrl) updates.banner_image_url = media.bannerImageUrl;

    const { error: updateError } = await supabase
      .from("franchise")
      .update(updates)
      .eq("id", franchise.id);

    if (updateError) {
      console.error(`✗ ${franchise.title} — ${updateError.message}`);
      continue;
    }

    console.log(
      `✓ ${franchise.title} — ${tier} (${(media.memberCount ?? 0).toLocaleString()} members) — images synced`
    );

    // Respect AniList rate limit (90 req/min)
    await new Promise((r) => setTimeout(r, 700));
  }

  console.log("\nDone!");
}

sync().catch(console.error);
