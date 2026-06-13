---
name: generate-list
description: Build AnimeChrono franchise Watch Orders end-to-end — resolve the anime on AniList, seed the franchise's entries, research the correct watch order (chronological vs airing vs recommended), write curator notes, and publish to the production database. Use when the user runs /generate-list, asks to seed/build/generate a watch order or franchise list, e.g. /generate-list "monogatari" (build one named franchise) or /generate-list 10 (build the 10 best unbuilt trending/popular franchises).
---

# generate-list

Wraps the two seed scripts into one command. It writes to the **production** Supabase DB — created franchises appear on the live site immediately. **Quality over quantity: a wrong watch order is worse than no order.** Anime watch-order disputes (chronological vs airing vs a recommended path — Fate, Monogatari, Haruhi) are notorious, so the research step is load-bearing.

## Modes (parse the argument)

- **`/generate-list "<name>"`** (arg is text) → **named mode**: build that one franchise.
- **`/generate-list <N>`** (arg is an integer) → **count mode**: build the N best *unbuilt* franchises sourced from AniList trending + most-popular data (SEO-driven), one at a time.
- **`/generate-list`** (no arg) → count mode with N=1.

## Always do first — pre-flight (abort on any failure)

1. `pwd` is the repo root and `scripts/seed-watch-order.mjs` exists.
2. `.env.local` exists and contains `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. If missing, stop and tell the user — no DB writes are possible.
   - **AniList needs no API key** (keyless public GraphQL) — there is no Twitch/IGDB equivalent to check here.
   - **Attribution (optional):** set `SEED_CURATOR_HANDLE=<your-handle>` in `.env.local` to control who shows as "Created by" on seeded franchises. Unset → falls back to the site's first admin.

## Named mode

Run the per-franchise pipeline in [REFERENCE.md](REFERENCE.md) once for `<name>`.

## Count mode

1. Pick candidates:
   `node .claude/skills/generate-list/scripts/pick-series.mjs --count <N>`
   It returns the top-N unbuilt franchises (already deduped against the site + SEED-QUEUE.md) as a table + JSON. (Runs ~30–60s — it queries AniList relations per candidate to collapse seasons into franchises.)
2. **Show the user the proposed list and get ONE confirmation before building anything.** (Each franchise = web research + a hand-written plan + a production write.)
3. After confirmation, run the per-franchise pipeline ([REFERENCE.md](REFERENCE.md)) for each pick **sequentially**, reporting progress after each. If one fails, log why and continue with the rest.

## Guardrails (non-negotiable)

- **Always `--dry-run` before seeding** and prune junk (recaps, music videos, unrelated crossovers, picture-drama shorts, promo specials that aren't part of the story).
- **Always research the watch order** with ≥2 independent sources. Anime order is contentious — chronological ≠ airing ≠ the community-recommended path. Never order from memory alone. Record source URLs for the report.
- The seed script aborts if a franchise is already claimed, and apply-watch-order refuses incomplete plans. Treat both as **expected gates**, not errors — fix or skip and move on.
- **Verify each franchise live** before marking it done.
- After building, mark items `- [x] <Name> (<slug>)` in `SEED-QUEUE.md` and commit **only that file** (`git commit -m "Seed queue: <names> built"`). **Do not push** — the user pushes later via the normal branch-per-task workflow.
- Never run `npm run build`. Touch the DB only through the two scripts. Modify no files except `SEED-QUEUE.md` and `/tmp` plans.

## End every run with a report

Franchises built (slugs + entry counts), ordering decisions made (and which order convention you chose — chronological / airing / recommended), research sources used, anything skipped and why.

Full pipeline, plan schema, curation conventions, and troubleshooting: **[REFERENCE.md](REFERENCE.md)**.
