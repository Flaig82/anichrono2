import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — AnimeChrono",
  description:
    "See what's new on AnimeChrono — recent features, improvements, and fixes.",
};

interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
  tag: "feature" | "improvement" | "fix" | "content";
}

const TAG_STYLES: Record<
  ChangelogEntry["tag"],
  { label: string; color: string }
> = {
  feature: { label: "New", color: "bg-emerald-500/15 text-emerald-400" },
  improvement: {
    label: "Improved",
    color: "bg-blue-500/15 text-blue-400",
  },
  fix: { label: "Fixed", color: "bg-amber-500/15 text-amber-400" },
  content: { label: "Content", color: "bg-purple-500/15 text-purple-400" },
};

const ENTRIES: ChangelogEntry[] = [
  {
    date: "2026-04-15",
    title: "Community Chronicles",
    description:
      "Create curated watch routes for any franchise — Newcomer, Completionist, Chronological, or Manga Reader. Pick entries from the master order, drag to reorder, and submit for community review. Approved chronicles appear on the franchise page for everyone.",
    tag: "feature",
  },
  {
    date: "2026-04-15",
    title: "Draft workflow for chronicles",
    description:
      "Chronicles now save as private drafts first. Review your route, then submit for community review when ready. You can withdraw or delete at any time. Admins provide reject reasons so you know what to fix.",
    tag: "feature",
  },
  {
    date: "2026-04-15",
    title: "Era progress visibility",
    description:
      "A progress bar now shows how close you are to reaching Wanderer era across franchise pages, your profile, and contribution gates. Era promotions and franchise completions trigger celebratory toasts.",
    tag: "feature",
  },
  {
    date: "2026-04-15",
    title: "Contribution surface on franchise pages",
    description:
      "Every franchise page now shows a persistent card inviting you to propose edits, add curator notes, or create a chronicle — with copy that adapts based on your era and login status.",
    tag: "feature",
  },
  {
    date: "2026-04-15",
    title: "Inline curator notes",
    description:
      "Wanderer+ users can propose a watch-order note on any entry directly from the franchise page without opening the full editor.",
    tag: "feature",
  },
  {
    date: "2026-04-15",
    title: "Chronicles tab on franchise pages",
    description:
      "Franchise pages now have a dedicated Chronicles tab showing community-curated watch routes, with a full browser page for filtering by route type and sorting.",
    tag: "feature",
  },
  {
    date: "2026-04-15",
    title: "Vote, follow, and track progress on chronicles",
    description:
      "Upvote or downvote community chronicles, follow routes to bookmark them, and track your progress through each route with per-entry checkboxes.",
    tag: "feature",
  },
  {
    date: "2026-04-15",
    title: "Auto-approval for trusted contributors",
    description:
      "Authors with 3+ approved chronicles and zero rejections now skip the admin review queue — their submissions go live immediately.",
    tag: "feature",
  },
  {
    date: "2026-04-15",
    title: "Quality guardrails",
    description:
      "Duplicate chronicles, routes that match the default order exactly, and single-entry submissions are now automatically blocked at submit time with helpful error messages.",
    tag: "improvement",
  },
  {
    date: "2026-04-15",
    title: "Staleness detection",
    description:
      "Chronicles that reference entries no longer in the master order, or are missing new entries, now show an amber 'behind main' indicator.",
    tag: "improvement",
  },
  {
    date: "2026-04-15",
    title: "Homepage refresh",
    description:
      "Removed dead-end Popular Season and Hidden Gems sections. Added Most Popular franchises (from real analytics) and Popular Chronicles sections. Update cards in the sidebar are now clickable.",
    tag: "improvement",
  },
  {
    date: "2026-04-15",
    title: "Add a franchise flow",
    description:
      "The 'Create a Chronicle' button on the Chronicles index now opens a search-first dialog instead of silently redirecting to Discover.",
    tag: "fix",
  },
  {
    date: "2026-04-15",
    title: "Franchise creator attribution",
    description:
      "Franchise cards now show the actual creator instead of always defaulting to Pyrat. A new created_by column tracks who created each franchise going forward.",
    tag: "fix",
  },
  {
    date: "2026-03-30",
    title: "Notification center",
    description:
      "A bell icon in the nav now shows when someone likes your activity, you complete a quest, or reach a new era. Notifications group repeated likes and can be marked as read individually or all at once.",
    tag: "feature",
  },
  {
    date: "2026-03-30",
    title: "Discussion threads on franchise pages",
    description:
      "Every franchise now has a Discussions tab where you can start threads and reply to others. Replies support likes, and discussion authors get notified when someone responds.",
    tag: "feature",
  },
  {
    date: "2026-03-30",
    title: "Likes on profile activity",
    description:
      "Activity items on user profiles now show like counts and a like button, matching the home feed and franchise sidebar.",
    tag: "improvement",
  },
  {
    date: "2026-03-28",
    title: "Unmatched anime after AniList import",
    description:
      "After importing your AniList watch history, anime that aren't on AnimeChrono yet now appear with cover art and a link to create a watch order for them.",
    tag: "feature",
  },
  {
    date: "2026-03-28",
    title: "Like button reliability",
    description:
      "Fixed an issue where likes on activity feed items could visually revert after clicking. Likes now stick reliably across all feeds.",
    tag: "fix",
  },
  {
    date: "2026-03-23",
    title: "Franchise page CTAs for visitors",
    description:
      "Logged-out users now see a \"Track Your Progress\" button in the hero, the Edit pill in the tab bar, and an inline CTA after the watch order — making it easier to discover what you can do with an account.",
    tag: "feature",
  },
  {
    date: "2026-03-23",
    title: "Mobile sidebar on franchise pages",
    description:
      "Shop links, recent activity, and similar anime now appear below the watch order on mobile instead of being hidden.",
    tag: "improvement",
  },
  {
    date: "2026-03-20",
    title: "Sticky nav blur + gradient fade",
    description:
      "The navigation bar now uses a progressive blur with a smooth gradient fade at the bottom edge for a cleaner scroll experience.",
    tag: "improvement",
  },
  {
    date: "2026-03-19",
    title: "Sharper cover art",
    description:
      "Optimized cover image sizes and caching across all franchise pages for faster loads and crisper artwork.",
    tag: "improvement",
  },
  {
    date: "2026-03-17",
    title: "Unified search",
    description:
      "A new search page lets you find franchises, chronicles, and users from one place.",
    tag: "feature",
  },
  {
    date: "2026-03-17",
    title: "Profanity filter",
    description:
      "Proposals and reviews now run through a profanity filter to keep the community clean.",
    tag: "improvement",
  },
  {
    date: "2026-03-15",
    title: "Old URL redirects",
    description:
      "Links from the old AnimeChrono site format now automatically redirect to the correct franchise page.",
    tag: "fix",
  },
  {
    date: "2026-03-14",
    title: "AI-friendly pages",
    description:
      "Added llms.txt and crawler rules so AI assistants can better understand and recommend AnimeChrono watch orders.",
    tag: "feature",
  },
  {
    date: "2026-03-13",
    title: "Feedback page",
    description:
      "You can now send us feedback or report issues directly from the site.",
    tag: "feature",
  },
  {
    date: "2026-03-12",
    title: "Quest completion checks",
    description:
      "Quests now validate completion semantically — decade-based quests, genre quests, and franchise completion all check real watch data.",
    tag: "improvement",
  },
  {
    date: "2026-03-10",
    title: "Amazon shop links",
    description:
      "Franchise pages now show relevant manga, Blu-ray, and figure links in the sidebar.",
    tag: "feature",
  },
  {
    date: "2026-03-09",
    title: "Mobile editing blocked",
    description:
      "Tapping Edit on mobile now shows a helpful modal instead of opening the editor on a small screen.",
    tag: "improvement",
  },
  {
    date: "2026-03-07",
    title: "Franchise discover page",
    description:
      "Browse all franchises with genre filters, search, and sorting options.",
    tag: "feature",
  },
  {
    date: "2026-03-06",
    title: "Password reset flow",
    description:
      "Forgot your password? You can now reset it via email from the login page.",
    tag: "feature",
  },
  {
    date: "2026-03-04",
    title: "Quest system",
    description:
      "The quest system is live — complete weekly and seasonal quests to earn Aura and unlock titles.",
    tag: "feature",
  },
  {
    date: "2026-03-01",
    title: "AnimeChrono launches",
    description:
      "The platform is live with franchise pages, community watch orders, user profiles, and the Aura reputation system.",
    tag: "feature",
  },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ChangelogPage() {
  return (
    <main className="px-4 md:px-8 lg:px-[120px] pt-10 pb-16 max-w-3xl">
      <h1 className="font-brand text-[28px] md:text-[36px] font-bold text-white">
        Changelog
      </h1>
      <p className="mt-2 font-body text-[14px] text-aura-muted2">
        New features, improvements, and fixes shipped to AnimeChrono.
      </p>

      <div className="mt-10 flex flex-col">
        {ENTRIES.map((entry, i) => {
          const style = TAG_STYLES[entry.tag];
          const prevDate = i > 0 ? ENTRIES[i - 1]!.date : null;
          const showDate = entry.date !== prevDate;

          return (
            <div key={`${entry.date}-${entry.title}`} className="flex gap-6">
              {/* Timeline rail */}
              <div className="flex flex-col items-center">
                <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-aura-muted/40 bg-aura-bg" />
                {i < ENTRIES.length - 1 && (
                  <div className="w-px flex-1 bg-aura-border" />
                )}
              </div>

              {/* Content */}
              <div className="pb-8">
                {showDate && (
                  <span className="font-mono text-[11px] text-aura-muted">
                    {formatDate(entry.date)}
                  </span>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="font-body text-[15px] font-bold text-white">
                    {entry.title}
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${style.color}`}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="mt-1.5 font-body text-[13px] leading-relaxed text-aura-muted2">
                  {entry.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
