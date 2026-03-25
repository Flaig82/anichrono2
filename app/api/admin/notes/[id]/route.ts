import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { createRateLimiter } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

const patchNoteLimiter = createRateLimiter("admin-notes-patch", {
  burstLimit: 20,
  dailyLimit: 200,
});

const deleteNoteLimiter = createRateLimiter("admin-notes-delete", {
  burstLimit: 10,
  dailyLimit: 100,
});

/** PATCH /api/admin/notes/[id] — toggle completion status */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  const limit = patchNoteLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const service = createServiceClient();

  // Fetch current state to toggle
  const { data: existing, error: fetchError } = await service
    .from("admin_notes")
    .select("is_completed")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const nowCompleted = !existing.is_completed;

  const { data: updated, error } = await service
    .from("admin_notes")
    .update({
      is_completed: nowCompleted,
      completed_at: nowCompleted ? new Date().toISOString() : null,
      completed_by: nowCompleted ? user.id : null,
    })
    .eq("id", id)
    .select(
      `id, body, is_completed, completed_at, completed_by, created_at, author_id,
      author:author_id (display_name, avatar_url),
      completer:completed_by (display_name)`,
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}

/** DELETE /api/admin/notes/[id] — delete an admin note */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  const limit = deleteNoteLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from("admin_notes")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
