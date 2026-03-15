import Image from "next/image";
import Link from "next/link";
import { Bookmark, ChevronRight } from "lucide-react";

interface FranchiseHeroProps {
  title: string;
  description: string | null;
  bannerImageUrl: string | null;
  genres: string[];
}

export default function FranchiseHero({
  title,
  description,
  bannerImageUrl,
  genres,
}: FranchiseHeroProps) {
  const primaryGenre = genres[0] ?? "Anime";

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Banner image */}
      <div className="relative h-[200px] w-full md:h-[260px] lg:h-[320px]">
        {bannerImageUrl ? (
          <Image
            src={bannerImageUrl}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-aura-bg3 to-aura-bg" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-8 lg:p-16">
          <div className="flex max-w-full flex-col gap-3 md:gap-4 lg:max-w-[768px]">
            {/* Breadcrumb */}
            <nav className="hidden items-center gap-1.5 font-brand text-[14px] font-bold sm:flex">
              <Link
                href="/discover"
                className="text-white/[0.48] transition-colors hover:text-white/70"
              >
                DISCOVER
              </Link>
              <ChevronRight size={14} className="text-white/[0.48]" />
              <Link
                href={`/discover?genre=${encodeURIComponent(primaryGenre)}`}
                className="text-white/[0.48] transition-colors hover:text-white/70"
              >
                {primaryGenre.toUpperCase()}
              </Link>
              <ChevronRight size={14} className="text-white/[0.48]" />
              <span className="text-white">{title.toUpperCase()}</span>
            </nav>

            {/* Title */}
            <h1 className="font-body text-[22px] font-bold leading-tight tracking-[-0.44px] text-white md:text-[28px] md:tracking-[-0.56px] lg:text-[36px] lg:tracking-[-0.72px]">
              {title}
            </h1>

            {/* Description (subtitle) */}
            {description && (
              <p className="line-clamp-2 font-body text-[14px] leading-relaxed text-white/70">
                {description}
              </p>
            )}

            {/* CTA */}
            <div className="mt-1">
              <button className="flex items-center gap-2 rounded-full bg-aura-orange px-6 py-2.5 font-body text-[14px] font-bold tracking-[-0.28px] text-white transition-colors hover:bg-aura-orange-hover">
                <Bookmark size={16} />
                Add to Watchlist
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
