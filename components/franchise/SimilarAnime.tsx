"use client";

import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { Loader2 } from "lucide-react";

interface Recommendation {
  id: number;
  titleEnglish: string | null;
  titleRomaji: string;
  coverImageUrl: string | null;
  rating: number;
  slug: string;
  localTitle: string;
  localCoverUrl: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SimilarAnime({
  franchiseId,
}: {
  franchiseId: string;
}) {
  const { data, isLoading } = useSWR<{ recommendations: Recommendation[] }>(
    `/api/franchise/${franchiseId}/recommendations`,
    fetcher,
  );

  const recs = data?.recommendations ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <SectionHeader />
        <div className="flex items-center justify-center py-6">
          <Loader2 size={14} className="animate-spin text-aura-muted" />
        </div>
      </div>
    );
  }

  if (recs.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader />
      <div className="flex flex-col gap-2">
        {recs.slice(0, 6).map((rec) => {
          const title = rec.localTitle;
          const cover = rec.localCoverUrl ?? rec.coverImageUrl;

          return (
            <Link key={rec.id} href={`/franchise/${rec.slug}`}>
              <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.04]">
                <div className="relative h-[48px] w-[34px] shrink-0 overflow-hidden rounded bg-aura-bg3">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="34px"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-aura-muted/20 to-aura-bg3" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-[12px] font-bold text-white">
                    {title}
                  </p>
                  <p className="font-mono text-[9px] text-aura-muted">
                    View Chronicle
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="h-1.5 w-1.5 rounded-full bg-aura-orange" />
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
        Similar Anime
      </span>
    </div>
  );
}
