"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Download, Loader2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ImportSummary {
  entries_imported: number;
  entries_skipped: number;
  franchises_updated: number;
  aura_awarded: number;
  completed_quests: { title: string; aura_amount: number }[];
  unmatched_media_ids: number[];
}

interface UnmatchedMediaItem {
  id: number;
  titleEnglish: string | null;
  titleRomaji: string;
  coverImageUrl: string | null;
  format: string | null;
}

export default function SettingsForm() {
  const { profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [anilistUsername, setAnilistUsername] = useState(
    profile?.anilist_username ?? "",
  );
  const [malUsername, setMalUsername] = useState(profile?.mal_username ?? "");
  const [isWatchlistPublic, setIsWatchlistPublic] = useState(
    profile?.is_watchlist_public ?? true,
  );

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [unmatchedMedia, setUnmatchedMedia] = useState<UnmatchedMediaItem[]>([]);
  const [loadingUnmatched, setLoadingUnmatched] = useState(false);

  if (!profile) return null;

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Upload failed");
        return;
      }
      refreshProfile();
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          handle: handle || undefined,
          bio,
          anilist_username: anilistUsername || null,
          mal_username: malUsername || null,
          is_watchlist_public: isWatchlistPublic,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg =
          typeof data.error === "string"
            ? data.error
            : "Failed to save changes";
        setError(msg);
        return;
      }

      refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    setUnmatchedMedia([]);

    try {
      const res = await fetch("/api/import/anilist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        setImportError(data.error ?? "Import failed");
        return;
      }

      const result = data as ImportSummary;
      setImportResult(result);
      refreshProfile();

      // Fetch metadata for unmatched anime
      if (result.unmatched_media_ids?.length > 0) {
        setLoadingUnmatched(true);
        try {
          const batchRes = await fetch(
            `/api/anilist/batch?ids=${result.unmatched_media_ids.join(",")}`,
          );
          if (batchRes.ok) {
            const batchData = await batchRes.json();
            setUnmatchedMedia(batchData.media ?? []);
          }
        } catch {
          // Non-critical — unmatched list just won't show
        } finally {
          setLoadingUnmatched(false);
        }
      }
    } catch {
      setImportError("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-8">
      {/* ── Profile Section ── */}
      <div className="flex flex-col gap-5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          Profile
        </span>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-aura-bg4"
            disabled={uploading}
          >
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-body text-2xl font-bold text-white">
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <Camera size={20} className="text-white" />
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <span className="font-body text-[12px] text-aura-muted2">
            Click to upload. Max 2MB, JPG/PNG/WebP.
          </span>
        </div>

        {/* Display name */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] font-semibold tracking-[0.05em] text-aura-muted2">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            className="rounded-lg border border-aura-border2 bg-aura-bg3 px-3 py-2.5 font-body text-[14px] text-white outline-none transition-colors focus:border-aura-orange"
          />
        </div>

        {/* Handle */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] font-semibold tracking-[0.05em] text-aura-muted2">
            Handle
          </label>
          <div className="flex items-center gap-0 rounded-lg border border-aura-border2 bg-aura-bg3 transition-colors focus-within:border-aura-orange">
            <span className="pl-3 font-mono text-[14px] text-aura-muted">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              maxLength={20}
              className="flex-1 bg-transparent px-1 py-2.5 font-body text-[14px] text-white outline-none"
            />
          </div>
          <span className="font-mono text-[10px] text-aura-muted">
            Letters, numbers, hyphens, underscores. 3-20 chars.
          </span>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] font-semibold tracking-[0.05em] text-aura-muted2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            rows={3}
            className="resize-none rounded-lg border border-aura-border2 bg-aura-bg3 px-3 py-2.5 font-body text-[14px] text-white outline-none transition-colors focus:border-aura-orange"
          />
          <span className="text-right font-mono text-[10px] text-aura-muted">
            {bio.length}/300
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-aura-border" />

      {/* ── Linked Accounts ── */}
      <div className="flex flex-col gap-5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          Linked Accounts
        </span>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] font-semibold tracking-[0.05em] text-aura-muted2">
              AniList Username
            </label>
            <input
              type="text"
              value={anilistUsername}
              onChange={(e) => setAnilistUsername(e.target.value)}
              placeholder="Your AniList username"
              className="rounded-lg border border-aura-border2 bg-aura-bg3 px-3 py-2.5 font-body text-[14px] text-white placeholder:text-aura-muted outline-none transition-colors focus:border-aura-orange"
            />

            {/* Import button */}
            <div className="flex flex-col gap-2 rounded-lg border border-aura-border bg-aura-bg2 p-4">
              <p className="font-body text-[12px] text-aura-muted2">
                Import your completed and in-progress anime. Existing progress won&apos;t be overwritten.
              </p>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || !anilistUsername.trim()}
                className="flex items-center justify-center gap-2 rounded-lg border border-aura-border2 bg-aura-bg3 px-4 py-2.5 font-body text-[13px] font-bold text-white transition-colors hover:bg-aura-bg4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                {importing ? "Importing..." : "Import Watch History from AniList"}
              </button>

              {importError && (
                <p className="font-body text-[12px] text-red-400">{importError}</p>
              )}

              {importResult && (
                <div className="flex flex-col gap-1 rounded-lg bg-aura-bg3 p-3">
                  <p className="font-body text-[12px] font-bold text-green-400">
                    Import complete
                  </p>
                  <p className="font-mono text-[11px] text-aura-muted2">
                    {importResult.entries_imported} entries imported, {importResult.franchises_updated} franchises updated
                  </p>
                  {importResult.aura_awarded > 0 && (
                    <p className="font-mono text-[11px] text-aura-orange">
                      +{importResult.aura_awarded} Watch Aura
                    </p>
                  )}
                  {importResult.completed_quests.length > 0 && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      {importResult.completed_quests.map((q, i) => (
                        <p key={i} className="font-mono text-[11px] text-aura-orange">
                          Quest completed: {q.title} (+{q.aura_amount})
                        </p>
                      ))}
                    </div>
                  )}
                  {importResult.entries_skipped > 0 && !loadingUnmatched && unmatchedMedia.length === 0 && (
                    <p className="font-mono text-[10px] text-aura-muted">
                      {importResult.entries_skipped} AniList entries had no matching AURA entry
                    </p>
                  )}
                  {loadingUnmatched && (
                    <div className="flex items-center gap-2 pt-1">
                      <Loader2 size={12} className="animate-spin text-aura-muted" />
                      <p className="font-mono text-[10px] text-aura-muted">Loading unmatched anime...</p>
                    </div>
                  )}
                  {unmatchedMedia.length > 0 && (
                    <div className="mt-1 flex flex-col gap-2">
                      <p className="font-body text-[12px] font-bold text-white">
                        {importResult.entries_skipped} anime from your list aren&apos;t on AnimeChrono yet
                        {importResult.entries_skipped > 50 && (
                          <span className="font-normal text-aura-muted"> (showing top 50)</span>
                        )}
                      </p>
                      <p className="font-body text-[11px] text-aura-muted2">
                        Help the community by adding watch orders for anime you know
                      </p>
                      <div className="max-h-64 overflow-y-auto rounded-lg border border-aura-border bg-aura-bg2">
                        {unmatchedMedia.map((item) => (
                          <Link
                            key={item.id}
                            href={`/franchise/create?anilist=${item.id}`}
                            className="group flex items-center gap-3 border-b border-aura-border px-3 py-2 transition-colors last:border-b-0 hover:bg-aura-bg4"
                          >
                            {item.coverImageUrl ? (
                              <Image
                                src={item.coverImageUrl}
                                alt={item.titleEnglish ?? item.titleRomaji}
                                width={32}
                                height={44}
                                className="shrink-0 rounded object-cover"
                              />
                            ) : (
                              <div className="h-[44px] w-[32px] shrink-0 rounded bg-aura-bg4" />
                            )}
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate font-body text-[12px] font-bold text-white">
                                {item.titleEnglish ?? item.titleRomaji}
                              </span>
                              {item.titleEnglish && item.titleRomaji !== item.titleEnglish && (
                                <span className="truncate font-body text-[10px] text-aura-muted">
                                  {item.titleRomaji}
                                </span>
                              )}
                            </div>
                            <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-aura-muted opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-aura-orange">
                              <Plus size={10} />
                              Create
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] font-semibold tracking-[0.05em] text-aura-muted2">
              MyAnimeList Username
            </label>
            <input
              type="text"
              value={malUsername}
              onChange={(e) => setMalUsername(e.target.value)}
              placeholder="Your MAL username"
              className="rounded-lg border border-aura-border2 bg-aura-bg3 px-3 py-2.5 font-body text-[14px] text-white placeholder:text-aura-muted outline-none transition-colors focus:border-aura-orange"
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-aura-border" />

      {/* ── Privacy ── */}
      <div className="flex flex-col gap-5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          Privacy
        </span>

        <label className="flex cursor-pointer items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-body text-[14px] font-bold text-white">
              Public Watchlist
            </span>
            <span className="font-body text-[12px] text-aura-muted2">
              Allow other users to see your watchlist
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isWatchlistPublic}
            onClick={() => setIsWatchlistPublic(!isWatchlistPublic)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              isWatchlistPublic ? "bg-aura-orange" : "bg-aura-bg4"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                isWatchlistPublic ? "translate-x-5" : ""
              }`}
            />
          </button>
        </label>
      </div>

      {/* Divider */}
      <div className="h-px bg-aura-border" />

      {/* Error / Success */}
      {error && (
        <p className="font-body text-[13px] text-red-400">{error}</p>
      )}
      {success && (
        <p className="font-body text-[13px] text-green-400">Changes saved!</p>
      )}

      {/* Save */}
      <button
        type="submit"
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-lg bg-aura-orange px-6 py-3 font-body text-[14px] font-bold text-white transition-colors hover:bg-aura-orange-hover disabled:opacity-50"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
