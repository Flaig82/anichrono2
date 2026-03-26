import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const feedbackSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

const feedbackLimiter = createRateLimiter("feedback", {
  burstLimit: 2,
  burstWindowMs: 60_000,
  dailyLimit: 5,
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = feedbackLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("feedback").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
  });

  if (error) {
    console.error("Feedback insert error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
