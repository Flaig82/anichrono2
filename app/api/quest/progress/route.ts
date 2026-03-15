import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { questProgressSchema } from "@/lib/validations/quest";
import { progressQuests } from "@/lib/quests";

/** POST /api/quest/progress — manually increment quest progress */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = questProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { quest_id } = parsed.data;

  // Verify quest exists and user has an active (non-completed) user_quest row
  const { data: userQuest } = await supabase
    .from("user_quest")
    .select("id, completed_at, quest:quest_id(condition)")
    .eq("user_id", user.id)
    .eq("quest_id", quest_id)
    .is("completed_at", null)
    .single();

  if (!userQuest) {
    return NextResponse.json(
      { error: "Quest not found or already completed" },
      { status: 404 },
    );
  }

  const condition = (userQuest.quest as unknown as { condition: { type: string } })?.condition;
  if (!condition?.type) {
    return NextResponse.json(
      { error: "Quest has no trackable condition" },
      { status: 400 },
    );
  }

  await progressQuests(supabase, user.id, condition.type as Parameters<typeof progressQuests>[2], 1);

  return NextResponse.json({ success: true });
}
