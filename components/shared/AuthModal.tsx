"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { loginSchema } from "@/lib/validations/auth";
import { useAuth } from "@/hooks/use-auth";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-close when user authenticates
  useEffect(() => {
    if (user) onClose();
  }, [user, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[420px] mx-4 rounded-2xl bg-[#1a1a1e] border border-aura-border shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-aura-muted transition-colors hover:bg-white/5 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col gap-6 p-6">
          {/* Value props */}
          <div className="flex flex-col gap-3 text-center">
            <h2 className="font-brand text-xl font-bold text-white">
              Join AnimeChrono to vote
            </h2>
            <ul className="flex flex-col gap-1.5 text-left">
              <li className="font-body text-[13px] text-aura-muted2">
                <span className="mr-1.5">🔮</span>
                Vote in brackets & earn Oracle Aura
              </li>
              <li className="font-body text-[13px] text-aura-muted2">
                <span className="mr-1.5">📜</span>
                Track your anime journey across every franchise
              </li>
              <li className="font-body text-[13px] text-aura-muted2">
                <span className="mr-1.5">🌳</span>
                Build your unique Aura Tree
              </li>
            </ul>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-aura-border2 bg-aura-bg3 px-4 py-3 font-body text-sm font-bold text-white transition-colors hover:bg-aura-bg4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-aura-border2" />
            <span className="font-body text-xs text-aura-muted">or</span>
            <div className="h-px flex-1 bg-aura-border2" />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="auth-modal-email"
                className="block font-body text-xs font-bold uppercase tracking-widest text-aura-muted2"
              >
                Email
              </label>
              <input
                id="auth-modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-aura-border2 bg-aura-bg3 px-4 py-2.5 font-body text-sm text-white placeholder:text-aura-muted outline-none transition-colors focus:border-aura-orange"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="auth-modal-password"
                className="block font-body text-xs font-bold uppercase tracking-widest text-aura-muted2"
              >
                Password
              </label>
              <input
                id="auth-modal-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-aura-border2 bg-aura-bg3 px-4 py-2.5 font-body text-sm text-white placeholder:text-aura-muted outline-none transition-colors focus:border-aura-orange"
                placeholder="Min. 8 characters"
              />
            </div>

            {error && (
              <p className="font-body text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-aura-orange px-4 py-2.5 font-body text-sm font-bold text-white transition-colors hover:bg-aura-orange-hover disabled:opacity-50"
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
              onClick={onClose}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
