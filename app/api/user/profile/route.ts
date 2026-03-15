import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { updateProfileSchema } from "@/lib/validations/profile";

/** PATCH /api/user/profile — update own profile */
export async function PATCH(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updates = parsed.data;

  // If handle is being changed, check uniqueness
  if (updates.handle) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("handle", updates.handle)
      .neq("id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This handle is already taken" },
        { status: 409 },
      );
    }
  }

  const { data: updated, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
