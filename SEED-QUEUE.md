# Seed Queue — Watch Order build log

Build log + work queue for the `/generate-list` skill. Each line is a franchise to build (or already built). The picker (`pick-series.mjs`) reads the checked items here to avoid re-proposing franchises that are already done.

- `- [ ] <Name>` — queued, not yet built
- `- [x] <Name> (<slug>)` — built and live on the site

Add names manually to queue specific franchises, or let count mode (`/generate-list <N>`) source candidates from AniList trending/popular automatically.

## Queue

<!-- e.g. - [ ] Monogatari -->

## Built

<!-- filled in by the skill, e.g. - [x] Fate (fate) -->
