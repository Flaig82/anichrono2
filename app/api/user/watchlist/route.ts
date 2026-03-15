import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { watchlistActionSchema } from "@/lib/validations/watchlist";

/** POST /api/user/watchlist — add, update, or remove franchise from watchlist */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = watchlistActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  switch (data.action) {
    case "add": {
      const { error } = await supabase.from("franchise_watchlist").upsert(
        {
          user_id: user.id,
          franchise_id: data.franchise_id,
          status: data.status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,franchise_id" },
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log activity for the live feed
      await supabase.from("activity").insert({
        user_id: user.id,
        type: "add_to_watchlist",
        franchise_id: data.franchise_id,
        metadata: { status: data.status },
      });

      return NextResponse.json({ status: data.status });
    }

    case "update": {
      const { error } = await supabase
        .from("franchise_watchlist")
        .update({
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("franchise_id", data.franchise_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ status: data.status });
    }

    case "remove": {
      const { error } = await supabase
        .from("franchise_watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("franchise_id", data.franchise_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ status: null });
    }
  }
}
