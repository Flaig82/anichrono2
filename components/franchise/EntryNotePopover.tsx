"use client";

import { useState, useEffect, useRef } from "react";
import { X, StickyNote, Loader2 } from "lucide-react";
import type { EntryData } from "@/types/proposal";
import {
  buildSingleNoteProposal,
  entriesEqual,
} from "@/lib/propose-single-edit";

interface EntryNotePopoverProps {
  open: boolean;
  franchiseId: string;
  entry: EntryData;
  allEntries: EntryData[];
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_LENGTH = 500;

/**
 * Lightweight popover for proposing a curator-note change on a single entry.
 *
 * Unlike the full OrderEditor → SubmitProposalDialog flow, this opens from an
 * inline icon on an entry row and only lets the user edit one field. The full
 * entries snapshot is submitted behind the scenes (that's the shape the
 * proposal schema expects); the server-side no-op detector rejects trivially
 * unchanged submissions so the admin queue doesn't flood.
 */
export default function EntryNotePopover({
  open,
  franchiseId,
  entry,
  allEntries,
  onClose,
  onSuccess,
}: EntryNotePopoverProps) {
  const [note, setNote] = useState(entry.curator_note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setNote(entry.curator_note ?? "");
      setError(null);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open, entry]);

  if (!open) return null;

  const trimmed = note.trim();
  const existing = (entry.curator_note ?? "").trim();
  const isUnchanged = trimmed === existing;
  const charsLeft = MAX_LENGTH - note.length;

  async function handleSubmit() {
    if (isUnchanged) {
      setError("No changes to submit.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = buildSingleNoteProposal(
      allEntries,
      entry.id,
      note,
      entry.title,
    );

    // Client-side safety check — server re-validates authoritatively.
    if (entriesEqual(allEntries, payload.proposed_entries)) {
      setError("No changes detected.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/franchise/${franchiseId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to submit note.");
        setSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative mx-4 w-full max-w-[460px] rounded-2xl border border-aura-border bg-[#1a1a1e] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-popover-title"
      >
        <div className="flex items-start justify-between border-b border-aura-border p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-aura-orange/10">
              <StickyNote size={16} className="text-aura-orange" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h2
                id="note-popover-title"
                className="font-body text-[14px] font-bold text-white"
              >
                Propose a note
              </h2>
              <p className="font-body text-[12px] text-aura-muted2">
                {entry.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-aura-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-5">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
              Watch-order note
            </span>
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => {
                if (e.target.value.length <= MAX_LENGTH) setNote(e.target.value);
              }}
              rows={4}
              placeholder="e.g. Skip this if you haven't read the manga — contains post-arc spoilers."
              className="rounded-lg border border-aura-border bg-black/40 px-3 py-2 font-body text-[13px] leading-relaxed text-white outline-none placeholder:text-aura-muted focus:border-aura-orange/40"
            />
            <div className="flex items-center justify-between font-mono text-[10px] text-aura-muted">
              <span>Proposals go through community review.</span>
              <span>{charsLeft} left</span>
            </div>
          </label>

          {error && (
            <p className="font-body text-[12px] text-red-400">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-aura-border p-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-archivist">
            +50 Archivist on approval
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg bg-white/5 px-4 py-2 font-body text-[12px] font-bold text-aura-muted2 transition-colors hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || isUnchanged}
              className="flex items-center gap-1.5 rounded-lg bg-aura-orange px-4 py-2 font-body text-[12px] font-bold text-white transition-colors hover:bg-aura-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              {submitting ? "Submitting..." : "Submit note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
