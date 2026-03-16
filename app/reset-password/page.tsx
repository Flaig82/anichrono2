"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { resetPasswordSchema } from "@/lib/validations/auth";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: result.data.password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push("/");
      router.refresh();
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
            Set new password
          </h1>
          <p className="mt-1 font-body text-sm text-aura-muted2">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block font-body text-xs font-bold uppercase tracking-widest text-aura-muted2"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-aura-border2 bg-aura-bg3 px-4 py-3 font-body text-sm text-white placeholder:text-aura-muted outline-none transition-colors focus:border-aura-orange"
              placeholder="Min. 8 characters"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-password"
              className="block font-body text-xs font-bold uppercase tracking-widest text-aura-muted2"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-aura-border2 bg-aura-bg3 px-4 py-3 font-body text-sm text-white placeholder:text-aura-muted outline-none transition-colors focus:border-aura-orange"
              placeholder="Re-enter your password"
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
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
