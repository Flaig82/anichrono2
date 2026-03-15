"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { EntryData, EditorEntry } from "@/types/proposal";
import ProposalDiffView from "./ProposalDiffView";

interface SubmitProposalDialogProps {
  franchiseId: string;
  currentEntries: EntryData[];
  proposedEntries: EditorEntry[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitProposalDialog({
  franchiseId,
  currentEntries,
  proposedEntries,
  onClose,
  onSuccess,
}: SubmitProposalDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prepare entries for submission: strip editor flags, assign final positions
  const cleanedEntries: EntryData[] = proposedEntries.map((e, i) => ({
    id: e.id,
    franchise_id: e.franchise_id,
    position: i + 1,
    title: e.title,
    entry_type: e.entry_type,
    episode_start: e.episode_start,
    episode_end: e.episode_end,
    parent_series: e.parent_series,
    anilist_id: e.anilist_id,
    is_essential: e.is_essential,
    curator_note: e.curator_note,
    cover_image_url: e.cover_image_url,
  }));

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/franchise/${franchiseId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          proposed_entries: cleanedEntries,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to submit proposal");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl border border-aura-border bg-[#1a1a1e] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-aura-border p-5">
          <h2 className="font-body text-lg font-bold text-white">
            Submit Proposal
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-aura-muted transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[11px] font-bold uppercase tracking-[0.15em] text-aura-muted">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Insert Movie 3 between episodes 50-51"
                className="rounded-lg border border-aura-border bg-white/5 px-3 py-2 font-body text-[14px] text-white outline-none placeholder:text-aura-muted focus:border-aura-orange/40"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[11px] font-bold uppercase tracking-[0.15em] text-aura-muted">
                Description{" "}
                <span className="normal-case tracking-normal text-aura-muted/60">
                  (optional)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain why this change improves the watch order..."
                rows={3}
                className="resize-none rounded-lg border border-aura-border bg-white/5 px-3 py-2 font-body text-[13px] text-white outline-none placeholder:text-aura-muted focus:border-aura-orange/40"
                maxLength={1000}
              />
            </div>

            {/* Diff preview */}
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[11px] font-bold uppercase tracking-[0.15em] text-aura-muted">
                Changes Preview
              </label>
              <div className="rounded-lg border border-aura-border bg-white/[0.02] p-3">
                <ProposalDiffView
                  currentEntries={currentEntries}
                  proposedEntries={cleanedEntries}
                />
              </div>
            </div>

            {error && (
              <p className="font-body text-[13px] text-red-400">{error}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-aura-border p-5">
          <button
            onClick={onClose}
            className="rounded-lg bg-white/5 px-4 py-2 font-body text-[13px] font-bold text-aura-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            className="rounded-lg bg-aura-orange px-5 py-2 font-body text-[13px] font-bold text-white transition-colors hover:bg-aura-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
