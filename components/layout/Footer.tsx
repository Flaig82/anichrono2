import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-aura-border px-4 md:px-8 lg:px-[120px] py-10">
      {/* 3-column layout */}
      <div className="flex flex-col gap-8 md:flex-row md:justify-between">
        {/* Left: Logo + tagline */}
        <div className="flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-base text-aura-orange-hover font-bold leading-none">
              順
            </span>
            <span className="font-brand text-base uppercase leading-none text-white tracking-[-0.8px]">
              <span className="font-bold">Anime</span>
              <span className="font-medium">chrono</span>
            </span>
          </Link>
          <p className="font-body text-[12px] text-aura-muted max-w-[240px]">
            Community-curated watch orders for every anime franchise.
          </p>
        </div>

        {/* Center: Site links */}
        <div className="flex flex-col gap-2">
          <span className="font-body text-[11px] font-bold uppercase tracking-[0.15em] text-aura-muted mb-1">
            Browse
          </span>
          <Link
            href="/chronicles"
            className="font-body text-[12px] text-aura-muted2 hover:text-white transition-colors"
          >
            Chronicles
          </Link>
          <Link
            href="/discover"
            className="font-body text-[12px] text-aura-muted2 hover:text-white transition-colors"
          >
            Discover
          </Link>
          <Link
            href="/feedback"
            className="font-body text-[12px] text-aura-muted2 hover:text-white transition-colors"
          >
            Feedback
          </Link>
        </div>

        {/* Right: Legal links */}
        <div className="flex flex-col gap-2">
          <span className="font-body text-[11px] font-bold uppercase tracking-[0.15em] text-aura-muted mb-1">
            Legal
          </span>
          <Link
            href="/disclaimer"
            className="font-body text-[12px] text-aura-muted2 hover:text-white transition-colors"
          >
            Disclaimer
          </Link>
          <Link
            href="/privacy-policy"
            className="font-body text-[12px] text-aura-muted2 hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </div>

      {/* Bottom row: Disclosure + copyright */}
      <div className="mt-8 border-t border-aura-border pt-6 flex flex-col gap-2">
        <p className="font-body text-[11px] text-aura-muted leading-relaxed">
          AnimeChrono is a participant in the Amazon Services LLC Associates
          Program, an affiliate advertising program designed to provide a means
          for sites to earn advertising fees by advertising and linking to
          Amazon.com.
        </p>
        <p className="font-body text-[11px] text-aura-muted">
          &copy; {new Date().getFullYear()} AnimeChrono. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
