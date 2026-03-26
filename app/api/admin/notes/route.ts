import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { createRateLimiter } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const notesLimiter = createRateLimiter("admin-notes", {
  burstLimit: 10,
  dailyLimit: 100,
});

const postSchema = z.object({
  body: z.string().min(1).max(2000),
});

/** GET /api/admin/notes — fetch all admin notes, newest first */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: notes, error } = await service
    .from("admin_notes")
    .select(
      `id, body, is_completed, completed_at, completed_by, created_at, author_id,
      author:author_id (display_name, avatar_url),
      completer:completed_by (display_name)`,
    )
    .order("is_completed", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(notes);
}

/** POST /api/admin/notes — create a new admin note */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = notesLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const service = createServiceClient();
  const { data: note, error } = await service
    .from("admin_notes")
    .insert({ author_id: user.id, body: parsed.data.body })
    .select(
      `id, body, is_completed, completed_at, completed_by, created_at, author_id,
      author:author_id (display_name, avatar_url),
      completer:completed_by (display_name)`,
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(note, { status: 201 });
}
