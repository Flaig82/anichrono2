"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: result.data.email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-52px)] items-center justify-center px-4">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-brand text-2xl font-bold text-white">
            Reset your password
          </h1>
          <p className="mt-1 font-body text-sm text-aura-muted2">
            {isSubmitted
              ? "Check your email for a reset link"
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {isSubmitted ? (
          <div className="rounded-lg border border-aura-border2 bg-aura-bg3 p-4 text-center">
            <p className="font-body text-sm text-aura-muted2">
              If an account exists with that email, you&apos;ll receive a
              password reset link shortly.
            </p>
          </div>
        ) : (
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

            {error && (
              <p className="font-body text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-aura-orange px-4 py-3 font-body text-sm font-bold text-white transition-colors hover:bg-aura-orange-hover disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        {/* Footer link */}
        <p className="text-center font-body text-sm text-aura-muted2">
          <Link
            href="/login"
            className="text-aura-orange transition-colors hover:text-aura-orange-hover"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
