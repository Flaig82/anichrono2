/**
 * One-time script to populate anilist_id + images for franchises
 * that are missing them. Run manually:
 *   npx tsx scripts/backfill-orphan-franchises.ts
 */
import { createClient } from "@supabase/supabase-js";
import { fetchMediaById } from "../lib/anilist";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Hardcoded mappings for franchises with no anilist_id.
// Each maps a franchise slug to the AniList ID of its primary/first series.
const ORPHAN_MAPPINGS: { slug: string; anilistId: number }[] = [
  // "A Certain Scientific Railgun" is the first entry in the watch order
  { slug: "a-certain-magical-scientific", anilistId: 6213 },
  // "Kara no Kyoukai 1: Fukan Fuukei" is the first film
  { slug: "the-garden-of-sinners", anilistId: 2593 },
  // Castlevania is NOT on AniList (western animation) — skip it
];

async function backfill() {
  for (const mapping of ORPHAN_MAPPINGS) {
    const media = await fetchMediaById(mapping.anilistId);

    if (!media) {
      console.error(`✗ ${mapping.slug} — AniList ID ${mapping.anilistId} not found`);
      continue;
    }

    const updates: Record<string, unknown> = {
      anilist_id: mapping.anilistId,
    };
    if (media.coverImageUrl) updates.cover_image_url = media.coverImageUrl;
    if (media.bannerImageUrl) updates.banner_image_url = media.bannerImageUrl;

    const { error } = await supabase
      .from("franchise")
      .update(updates)
      .eq("slug", mapping.slug);

    if (error) {
      console.error(`✗ ${mapping.slug} — ${error.message}`);
    } else {
      console.log(
        `✓ ${mapping.slug} — anilist_id: ${mapping.anilistId}, cover: ${media.coverImageUrl ? "YES" : "null"}, banner: ${media.bannerImageUrl ? "YES" : "null"}`
      );
    }

    await new Promise((r) => setTimeout(r, 700));
  }

  console.log("\nDone! Castlevania is not on AniList (western animation) — it will use the placeholder image.");
}

backfill().catch(console.error);
