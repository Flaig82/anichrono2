"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { loginSchema } from "@/lib/validations/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(callbackError ? "Authentication failed. Please try again." : "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[400px] space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-brand text-2xl font-bold text-white">
          Welcome back
        </h1>
        <p className="mt-1 font-body text-sm text-aura-muted2">
          Sign in to continue your journey
        </p>
      </div>

      {/* Email form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block font-body text-xs font-bold uppercase tracking-widest text-aura-muted2"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-aura-border2 bg-aura-bg3 px-4 py-3 font-body text-sm text-white placeholder:text-aura-muted outline-none transition-colors focus:border-aura-orange"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block font-body text-xs font-bold uppercase tracking-widest text-aura-muted2"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-aura-border2 bg-aura-bg3 px-4 py-3 font-body text-sm text-white placeholder:text-aura-muted outline-none transition-colors focus:border-aura-orange"
            placeholder="Min. 8 characters"
          />
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="font-body text-xs text-aura-muted2 transition-colors hover:text-aura-orange"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {error && (
          <p className="font-body text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-aura-orange px-4 py-3 font-body text-sm font-bold text-white transition-colors hover:bg-aura-orange-hover disabled:opacity-50"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Footer link */}
      <p className="text-center font-body text-sm text-aura-muted2">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-aura-orange transition-colors hover:text-aura-orange-hover"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-52px)] items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
