import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { getUserQuests } from "@/lib/quests";
import { QUEST_CATEGORIES, type QuestCategory } from "@/types/quest";

/** GET /api/quest?category=weekly — fetch quests with user progress */
export async function GET(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawCategory = url.searchParams.get("category");
  const category =
    rawCategory && (QUEST_CATEGORIES as readonly string[]).includes(rawCategory)
      ? (rawCategory as QuestCategory)
      : undefined;

  const quests = await getUserQuests(supabase, user.id, category);

  return NextResponse.json(quests);
}
