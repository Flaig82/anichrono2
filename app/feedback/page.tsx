"use client";

import { useState } from "react";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="px-4 md:px-8 lg:px-[120px] pt-10 pb-16 max-w-3xl">
        <h1 className="font-brand text-[28px] md:text-[36px] font-bold text-white">
          Feedback
        </h1>
        <div className="mt-6 rounded-lg border border-aura-border bg-aura-bg2 p-6">
          <p className="font-body text-[16px] text-white">
            Thanks for your feedback!
          </p>
          <p className="mt-2 font-body text-[14px] text-aura-muted2">
            We appreciate you taking the time to reach out. We&apos;ll review
            your message soon.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 md:px-8 lg:px-[120px] pt-10 pb-16 max-w-3xl">
      <h1 className="font-brand text-[28px] md:text-[36px] font-bold text-white">
        Feedback
      </h1>
      <p className="mt-2 font-body text-[14px] text-aura-muted2">
        Have a suggestion, found a bug, or just want to say hello? Let us know.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block font-mono text-[11px] uppercase tracking-[0.15em] text-aura-muted mb-1.5"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-aura-border bg-aura-bg2 px-3 py-2 font-body text-[14px] text-white placeholder:text-aura-muted focus:border-aura-orange focus:outline-none focus:ring-1 focus:ring-aura-orange"
            placeholder="Your name"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block font-mono text-[11px] uppercase tracking-[0.15em] text-aura-muted mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-aura-border bg-aura-bg2 px-3 py-2 font-body text-[14px] text-white placeholder:text-aura-muted focus:border-aura-orange focus:outline-none focus:ring-1 focus:ring-aura-orange"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block font-mono text-[11px] uppercase tracking-[0.15em] text-aura-muted mb-1.5"
          >
            Message
          </label>
          <textarea
            id="message"
            required
            minLength={10}
            maxLength={5000}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-md border border-aura-border bg-aura-bg2 px-3 py-2 font-body text-[14px] text-white placeholder:text-aura-muted focus:border-aura-orange focus:outline-none focus:ring-1 focus:ring-aura-orange resize-y"
            placeholder="What's on your mind? (min 10 characters)"
          />
        </div>

        {error && (
          <p className="font-body text-[13px] text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-aura-orange px-5 py-2 font-body text-[14px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Sending..." : "Send Feedback"}
        </button>
      </form>
    </main>
  );
}
