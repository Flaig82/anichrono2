"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface DiscussionReplyFormProps {
  discussionId: string;
  onReplySubmitted: () => void;
}

export default function DiscussionReplyForm({
  discussionId,
  onReplySubmitted,
}: DiscussionReplyFormProps) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/discussion/${discussionId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to post reply");
        return;
      }

      setBody("");
      onReplySubmitted();
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a reply..."
          maxLength={3000}
          rows={3}
          className="w-full resize-none rounded-lg border border-aura-border bg-aura-bg2 px-4 py-3 pr-12 font-body text-[13px] text-white placeholder:text-aura-muted outline-none transition-colors focus:border-aura-orange/50"
        />
        <button
          type="submit"
          disabled={!body.trim() || submitting}
          className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-aura-orange text-white transition-all hover:brightness-110 disabled:opacity-30 disabled:hover:brightness-100"
        >
          <Send size={13} />
        </button>
      </div>
      {error && (
        <p className="font-body text-[11px] text-red-400">{error}</p>
      )}
    </form>
  );
}
