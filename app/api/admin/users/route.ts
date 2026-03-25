import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/admin/users — paginated user list with search/sort */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Auth + admin check
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

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") ?? "";
  const sort = searchParams.get("sort") ?? "created_at";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const perPage = 30;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("users")
    .select(
      "id, display_name, handle, avatar_url, email, era, total_aura, is_admin, created_at",
      { count: "exact" },
    );

  if (search) {
    query = query.or(
      `display_name.ilike.%${search}%,handle.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  const sortColumn = sort === "total_aura" ? "total_aura" : "created_at";
  query = query
    .order(sortColumn, { ascending: false })
    .range(offset, offset + perPage - 1);

  const { data: users, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    users: users ?? [],
    total: count ?? 0,
    page,
    perPage,
    totalPages: Math.ceil((count ?? 0) / perPage),
  });
}
