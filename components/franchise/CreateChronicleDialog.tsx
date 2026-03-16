"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { EditorEntry } from "@/types/proposal";
import type { AniListMediaFull } from "@/lib/anilist";

interface CreateChronicleDialogProps {
  media: AniListMediaFull;
  entries: EditorEntry[];
  onClose: () => void;
}

const ANILIST_STATUS_MAP: Record<string, string> = {
  FINISHED: "finished",
  RELEASING: "releasing",
  NOT_YET_RELEASED: "not_yet_released",
  CANCELLED: "finished",
  HIATUS: "releasing",
};

export default function CreateChronicleDialog({
  media,
  entries,
  onClose,
}: CreateChronicleDialogProps) {
  const router = useRouter();
  const defaultTitle = media.titleEnglish ?? media.titleRomaji;
  const [title, setTitle] = useState(defaultTitle);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Clean entries for submission
    const cleanedEntries = entries.map((e, i) => ({
      id: e.id,
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

    try {
      const res = await fetch("/api/franchise/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anilist_id: media.id,
          title: title.trim(),
          description: media.description,
          genres: media.genres,
          year_started: media.seasonYear,
          studio: media.studio,
          status: ANILIST_STATUS_MAP[media.status ?? ""] ?? "finished",
          cover_image_url: media.coverImageUrl,
          banner_image_url: media.bannerImageUrl,
          entries: cleanedEntries,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          setError("This anime already has a franchise page.");
        } else if (res.status === 403) {
          setError("You need Wanderer era (500 Aura) to create franchises.");
        } else {
          setError(data.error ?? "Failed to create franchise");
        }
        return;
      }

      const { slug: createdSlug } = await res.json();
      router.push(`/franchise/${createdSlug}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-aura-border bg-[#1a1a1e] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-aura-border p-5">
          <h2 className="font-body text-lg font-bold text-white">
            Create Chronicle
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-aura-muted transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 p-5">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
              Franchise Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-aura-border bg-white/5 px-3 py-2 font-body text-[14px] text-white outline-none placeholder:text-aura-muted focus:border-aura-orange/40"
              maxLength={200}
            />
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-aura-border bg-white/[0.02] p-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
                  Entries
                </span>
                <span className="font-mono text-[12px] text-white">
                  {entries.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
                  Aura Reward
                </span>
                <span className="font-mono text-[12px] text-aura-archivist">
                  +50 Archivist
                </span>
              </div>
            </div>
          </div>

          {error && (
            <p className="font-body text-[13px] text-red-400">{error}</p>
          )}
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
            {submitting ? "Creating..." : "Create Chronicle"}
          </button>
        </div>
      </div>
    </div>
  );
}
