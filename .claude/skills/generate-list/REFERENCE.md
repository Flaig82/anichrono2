# generate-list — full pipeline & reference

This is the detailed procedure behind [SKILL.md](SKILL.md). It mirrors the two seed scripts; if this doc ever drifts, the scripts' actual behavior wins.

## Per-franchise pipeline (run for each target)

### 1. Resolve the flagship AniList id
- **Named mode:** `node scripts/seed-watch-order.mjs --query "<name>"` → prints up to 10 candidates (anilist id, name, year, format, member count). Pick the franchise's **first/flagship series** (the seed expands the whole franchise from any member by walking the AniList relation graph; the original/earliest entry is the safest root). If nothing sensible matches, report and stop.
- **Count mode:** the picker already gave you a flagship `anilist_id` per franchise — use it directly.

### 2. Dry-run and prune
`node scripts/seed-watch-order.mjs --anilist <id> --dry-run`
Review every seeded entry critically (the seed is in **airing order**).
- **Exclude** via `--exclude <id,id,...>`: recaps/compilation films that just re-cut the TV series, music videos (MUSIC format slips in rarely), picture dramas, promo-only specials, and crossovers/ALTERNATIVE works that aren't really part of this franchise's story.
- **Keep:** the main TV series, sequels/prequels, story OVAs/ONAs, canonical movies, side stories that matter to the watch path.
- If the franchise's common name differs from what the script infers, pass `--title "<Common Name>"`.

### 3. Research the watch order — DO NOT rely on memory alone
Anime is harder than games here: **chronological order ≠ airing order ≠ the recommended watch path**, and the "right" answer is franchise-specific and hotly debated.
- Web-search `"<franchise> watch order"`; consult **at least two independent sources** (the franchise's Fandom wiki + a major outlet — CBR / IGN / r/anime wiki / a well-known guide).
- Decide which convention this franchise wants and **be explicit about it in a curator note**:
  - **Airing order** is the default and usually correct (most franchises were made to be watched as they aired).
  - **Chronological/timeline order** only when the franchise is explicitly built that way and the community endorses it.
  - **Recommended order** for the notorious cases (Fate/stay night routes, the Monogatari ordering debate, Haruhi's Endless Eight / Kyon-vs-broadcast order) — pick the widely accepted path and explain the choice.
- If sources disagree with each other or with you, prefer the official/studio framing, then wiki/community consensus; record the conflict.
- **Record the source URLs** — they go in the run report.

### 4. Seed
`node scripts/seed-watch-order.mjs --anilist <id> --exclude <ids> [--title "..."]`
Prints the created **slug** + the entry list with anilist ids (airing order). Capture the slug. The script aborts safely if any entry is already claimed → treat as "already built", skip, move on. It also warns if the relation graph hit the 60-node cap — if so, verify nothing important was dropped.

### 5. Write the curated plan: `/tmp/<slug>-plan.json`
A JSON **array** that covers **every** seeded entry exactly once (step 4 listed them all with their anilist ids):
```json
[
  {
    "anilist_id": 20,
    "position": 1,
    "curator_note": "Start here — the original TV run. Watch in airing order.",
    "is_essential": true,
    "entry_type": "episodes",
    "parent_series": null
  }
]
```
Field rules:
- `anilist_id` (number, required) — must match a seeded entry. `position` (number, required) — 1-based, unique, in the watch order you researched.
- `entry_type` (optional): `episodes` | `movie` | `ova` | `ona` | `manga` | `special`. The seed already set these from AniList format; only override if wrong.
- `is_essential` (optional, bool). `parent_series` (optional, string|null) — sub-series group header (e.g. `"Monogatari Second Season"`).
- `curator_note` (optional, string).

Curation conventions:
- Recap/compilation movies sit directly after the arc they recap, `is_essential: false`, note "recap of episodes X–Y — skippable / an alternative to the TV arc."
- Side stories / OVAs → usually non-essential, note where they fall in the timeline and whether they're skippable.
- **Minimum 3–6 curator notes**: the starting point, the order convention you chose and why, anything whose placement surprises (a prequel that aired later, an interquel movie), and any skippable/optional entries.
- Notes are reader-facing: short, concrete, no spoilers.

### 6. Apply the order
`node scripts/apply-watch-order.mjs <slug> /tmp/<slug>-plan.json`
It **refuses partial plans** (every non-removed entry must appear exactly once) and rejects duplicate positions / unknown anilist_ids / bad entry_type. On rejection, read the error, fix the plan JSON, and re-run until clean. This is an expected gate, not a failure.

### 7. Verify
`curl -s "$NEXT_PUBLIC_SITE_URL/franchise/<slug>"` (or `https://www.animechrono.com/franchise/<slug>` — production reflects the write immediately) and confirm the order, title, and cover look right. Spot-check that positions match your plan.

### 8. Book-keep
In `SEED-QUEUE.md`, mark the franchise `- [x] <Name> (<slug>)` (add the line if it wasn't already listed — the file doubles as the build log). For a failure, leave it unchecked with an indented note explaining why.

## Error gates — expected, handle gracefully
| Symptom | Meaning | Action |
|---|---|---|
| `Missing <KEY> in .env.local` | creds absent | Stop, tell the user — no writes possible. |
| `Aborting: already claimed — X exists` | franchise/entry already on site | Skip it, mark built in queue, continue. |
| `Seed is empty after filtering` | wrong/over-excluded anilist id | Re-check the flagship id; loosen `--exclude`. |
| `Relation graph exceeded 60 nodes` | huge franchise (long-runner) | Verify the seed list; exclude noise; the cap protects against runaway graphs. |
| `Entry not covered by plan` / `Plan anilist_id … matches no entry` | incomplete or mismatched plan | Fix `/tmp/<slug>-plan.json`, re-run apply-watch-order. |
| `Duplicate position N` / `Invalid entry_type` | malformed plan | Fix and re-run. |

## Hard constraints
- Production DB — every write is live. No staging. (Local dev also hits the prod Supabase, per the repo's setup — there is no separate seed DB.)
- Touch the DB **only** through `seed-watch-order.mjs` and `apply-watch-order.mjs`.
- Never run `npm run build`. Modify no files except `SEED-QUEUE.md` and `/tmp` plans.
- Commit only `SEED-QUEUE.md`; **do not push** (user pushes via the normal branch-per-task workflow).

## Scope note — what this routine does NOT do
The apply step reorders and annotates the seeded entries (one entry per AniList work, matched by `anilist_id`). It does **not** split an episode block (e.g. "Episodes 1–101") into sub-blocks to interleave movies between them — that structural editing is the wiki/proposal UI's job (`MasterOrderSection` → proposals). This routine produces a researched, ordered, annotated list of works, which is the high-value baseline.
