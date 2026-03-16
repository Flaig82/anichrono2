import { createClient } from "@/lib/supabase-server";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const forgotPasswordLimiter = createRateLimiter("forgot-password", {
  burstLimit: 3,
  burstWindowMs: 60_000,
  dailyLimit: 10,
});

export async function POST(request: Request) {
  const limit = forgotPasswordLimiter.check(getClientIp(request));
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const body: unknown = await request.json();
  const result = forgotPasswordSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const origin = new URL(request.url).origin;
  const supabase = createClient();

  // Always return success to avoid leaking whether an email exists
  await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${origin}/api/auth/callback?next=/reset-password`,
  });

  return NextResponse.json({ success: true });
}
