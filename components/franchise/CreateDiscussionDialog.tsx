"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface CreateDiscussionDialogProps {
  franchiseId: string;
  onClose: () => void;
  onCreated: (discussionId: string) => void;
}

export default function CreateDiscussionDialog({
  franchiseId,
  onClose,
  onCreated,
}: CreateDiscussionDialogProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/franchise/${franchiseId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create discussion");
        return;
      }

      const data = await res.json();
      onCreated(data.id);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-aura-border bg-aura-bg2 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-body text-[16px] font-bold text-white">
            Start a Discussion
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-aura-muted transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to discuss?"
              maxLength={200}
              className="w-full rounded-lg border border-aura-border bg-aura-bg px-4 py-2.5 font-body text-[13px] text-white placeholder:text-aura-muted outline-none transition-colors focus:border-aura-orange/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts..."
              maxLength={5000}
              rows={5}
              className="w-full resize-none rounded-lg border border-aura-border bg-aura-bg px-4 py-3 font-body text-[13px] text-white placeholder:text-aura-muted outline-none transition-colors focus:border-aura-orange/50"
            />
            <span className="text-right font-mono text-[10px] text-aura-muted">
              {body.length}/5,000
            </span>
          </div>

          {error && (
            <p className="font-body text-[11px] text-red-400">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 font-body text-[13px] font-semibold text-aura-muted2 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !body.trim() || submitting}
              className="rounded-lg bg-aura-orange px-5 py-2 font-body text-[13px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
            >
              {submitting ? "Posting..." : "Post Discussion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
