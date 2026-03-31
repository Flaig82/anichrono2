"use client";

import { ExternalLink } from "lucide-react";
import useSWR from "swr";

interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  sourceUrl: string;
  publishedAt: string;
  category: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function FranchiseNews({
  franchiseId,
}: {
  franchiseId: string;
}) {
  const { data } = useSWR<NewsItem[]>(
    `/api/franchise/${franchiseId}/news`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    },
  );

  // Render nothing while loading or if no news — avoid layout shift
  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-2">
        <div className="h-1.5 w-1.5 rounded-full bg-aura-orange" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          Latest News
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {data.slice(0, 5).map((item) => (
          <a
            key={item.id}
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2.5 rounded-lg p-2 transition-colors hover:bg-white/[0.04]"
          >
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-body text-[12px] font-medium leading-[1.4] text-white/90 transition-colors group-hover:text-white">
                {item.title}
              </p>
              <p className="mt-0.5 font-mono text-[9px] text-aura-muted">
                {timeAgo(item.publishedAt)} · ANN
              </p>
            </div>
            <ExternalLink
              size={10}
              className="mt-1 shrink-0 text-aura-muted opacity-0 transition-opacity group-hover:opacity-100"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
