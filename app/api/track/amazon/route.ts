import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** POST /api/track/amazon — record an Amazon affiliate click */
export async function POST(request: Request) {
  const body: unknown = await request.json();

  if (!body || typeof body !== "object" || !("label" in body) || typeof (body as { label: unknown }).label !== "string") {
    return NextResponse.json({ error: "Missing label" }, { status: 400 });
  }

  const label = (body as { label: string }).label.slice(0, 200);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("amazon_clicks").insert({
    label,
    user_id: user?.id ?? null,
  });

  return NextResponse.json({ ok: true });
}
