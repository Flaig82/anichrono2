import { createClient } from "@/lib/supabase-server";
import { signupSchema } from "@/lib/validations/auth";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const signupLimiter = createRateLimiter("signup", {
  burstLimit: 3,
  burstWindowMs: 60_000,
  dailyLimit: 10,
});

export async function POST(request: Request) {
  const limit = signupLimiter.check(getClientIp(request));
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const body: unknown = await request.json();
  const result = signupSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        display_name: result.data.display_name,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
