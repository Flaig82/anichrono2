import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { createFranchiseSchema } from "@/lib/validations/franchise";
import { awardAura } from "@/lib/aura";
import { generateSlug } from "@/lib/utils";
import { createRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const franchiseCreateLimiter = createRateLimiter("franchise-create", {
  burstLimit: 5,
  burstWindowMs: 60_000,
  dailyLimit: 10,
});

function getObscurityTier(memberCount: number): { score: number; tier: string } {
  if (memberCount >= 500_000) return { score: 0.5, tier: "mainstream" };
  if (memberCount >= 100_000) return { score: 1.0, tier: "popular" };
  if (memberCount >= 10_000) return { score: 2.0, tier: "cult" };
  return { score: 4.0, tier: "obscure" };
}

/** POST /api/franchise/create — create a new franchise with entries */
export async function POST(request: Request) {
  const supabase = createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = franchiseCreateLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  // Era check — must be Wanderer+ (500+ Aura)
  const { data: profile } = await supabase
    .from("users")
    .select("era, total_aura")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.total_aura ?? 0) < 500) {
    return NextResponse.json(
      { error: "Reach Wanderer era (500 Aura) to create franchises" },
      { status: 403 },
    );
  }

  // Validate body
  const body: unknown = await request.json();
  const result = createFranchiseSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const data = result.data;
  const service = createServiceClient();

  // Check anilist_id isn't already claimed
  const { data: existing } = await service
    .from("franchise")
    .select("id")
    .eq("anilist_id", data.anilist_id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "This anime already has a franchise page" },
      { status: 409 },
    );
  }

  // Auto-generate slug from title, ensure uniqueness
  const baseSlug = generateSlug(data.title);
  let slug = baseSlug;
  let suffix = 2;
  while (true) {
    const { data: slugCheck } = await service
      .from("franchise")
      .select("id")
      .eq("slug", slug)
      .single();
    if (!slugCheck) break;
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  // Calculate obscurity from AniList popularity (passed as memberCount context)
  // We use the AniList popularity which was fetched on the client to determine tier
  // The popularity isn't in our schema — we'll recalculate from the sync job later
  // For now, default to "popular" tier
  const { score, tier } = getObscurityTier(0); // Will be updated by sync cron

  // Insert franchise
  const { data: franchise, error: franchiseError } = await service
    .from("franchise")
    .insert({
      title: data.title,
      slug,
      genres: data.genres,
      year_started: data.year_started,
      studio: data.studio,
      anilist_id: data.anilist_id,
      status: data.status,
      cover_image_url: data.cover_image_url,
      banner_image_url: data.banner_image_url,
      description: data.description,
      obscurity_score: score,
      obscurity_tier: tier,
    })
    .select("id, slug")
    .single();

  if (franchiseError || !franchise) {
    return NextResponse.json(
      { error: franchiseError?.message ?? "Failed to create franchise" },
      { status: 500 },
    );
  }

  // Insert entries
  const entryRows = data.entries.map((entry) => ({
    franchise_id: franchise.id,
    position: entry.position,
    title: entry.title,
    entry_type: entry.entry_type,
    episode_start: entry.episode_start,
    episode_end: entry.episode_end,
    parent_series: entry.parent_series,
    anilist_id: entry.anilist_id,
    is_essential: entry.is_essential,
    curator_note: entry.curator_note,
    cover_image_url: entry.cover_image_url || null,
  }));

  const { error: entriesError } = await service
    .from("entry")
    .insert(entryRows);

  if (entriesError) {
    // Clean up franchise if entries fail
    await service.from("franchise").delete().eq("id", franchise.id);
    return NextResponse.json(
      { error: entriesError.message },
      { status: 500 },
    );
  }

  // Award Archivist Aura (50 pts for submission)
  await awardAura(service, user.id, "archivist", 50);

  return NextResponse.json({ slug: franchise.slug }, { status: 201 });
}
