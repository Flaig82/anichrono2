# Seed Queue — Watch Order build log

Build log + work queue for the `/generate-list` skill. Each line is a franchise to build (or already built). The picker (`pick-series.mjs`) reads the checked items here to avoid re-proposing franchises that are already done.

- `- [ ] <Name>` — queued, not yet built
- `- [x] <Name> (<slug>)` — built and live on the site

Add names manually to queue specific franchises, or let count mode (`/generate-list <N>`) source candidates from AniList trending/popular automatically.

## Queue

<!-- e.g. - [ ] Monogatari -->
- [ ] Classroom of the Elite
  - SKIPPED: anilist 180745 ("4th Season: Second Year, First Semester") is already
    claimed as a standalone orphan franchise (slug
    classroom-of-the-elite-4th-season-second-year-first-semester). Building S1–S3
    would fragment the franchise into two competing pages. Resolve manually first
    (remove/merge that orphan page), then re-run /generate-list "Classroom of the Elite".

## Built

<!-- filled in by the skill, e.g. - [x] Fate (fate) -->
- [x] Frieren: Beyond Journey's End (frieren-beyond-journey-s-end)
- [x] SPY x FAMILY (spy-x-family)
- [x] Death Parade (death-parade)
- [x] Mushoku Tensei: Jobless Reincarnation (mushoku-tensei-jobless-reincarnation)
