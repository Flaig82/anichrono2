import { createClient } from "@/lib/supabase-server";
import { markReadSchema } from "@/lib/validations/notification";
import { NextResponse } from "next/server";

/** PATCH /api/notifications/read — mark notifications as read (individual or all) */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const result = markReadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { notification_id, all } = result.data;

  if (all) {
    await supabase
      .from("notification")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
  } else if (notification_id) {
    await supabase
      .from("notification")
      .update({ read: true })
      .eq("id", notification_id)
      .eq("user_id", user.id);
  } else {
    return NextResponse.json(
      { error: "Provide notification_id or all: true" },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
