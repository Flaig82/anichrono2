---
name: next-task
description: Fetch the open tasks from the project's GitHub board (auto-detected from the git remote — AnimeChrono → project #2, GameChrono → project #3) and present a prioritized, actionable shortlist of what to work on next, plus a few sensible next-direction suggestions grounded in the codebase. Use when the user runs /next-task, asks "what should I work on next", "what's on the board", or wants the next task to pick up.
---

# next-task

Reads the Flaig82 GitHub Project board for **this** repo and tells the user what to do next: the real backlog items, ranked, followed by a short list of sensible directions the skill infers from the code and recent work. Read-only — it never moves cards or writes to the board unless the user explicitly asks.

The boards are sibling-repo specific, so the skill resolves the board from the git remote rather than hardcoding it. One skill file works in both repos.

## Step 1 — Resolve the board (auto-detect, never hardcode)

Map the repo's origin remote to its board:

```
git remote get-url origin
```

| Remote contains | Owner | Project # | Board |
|---|---|---|---|
| `anichrono2` | `Flaig82` | `2` | AnimeChrono To-Do Board |
| `GameChrono` | `Flaig82` | `3` | GameChrono To-do Board |

If the remote matches neither, stop and tell the user which repo you detected and that no board mapping exists — don't guess a number.

## Step 2 — Pre-flight

- `gh auth status` succeeds and the active account has the `project` scope (board access needs it; plain `repo` is not enough). The expected account is **XenoShogun**. If the `project` scope is missing, stop and tell the user to run `gh auth refresh -s project`.

## Step 3 — Fetch the board

```
gh project item-list <N> --owner Flaig82 --format json
```

Each item carries: `title`, `status`, `priority` (P0/P1/P2…), `size` (S/M/L/XL…), `labels[]`, `repository`, and `content` (`{ number, url, title, body, type }`). Draft cards have no `content.number`.

## Step 4 — Rank the open tasks

1. **Drop anything done.** Exclude items whose `status` is `Done`, `Closed`, `Shipped`, or similar. Keep `Backlog`, `Todo`, `Ready`, `In Progress`, `No Status`, etc.
2. **Sort** by: `priority` (P0 → P1 → P2 → none), then `size` (smaller first — quicker wins surface higher), then most-recently-updated if available.
3. **Flag In-Progress items first** as "already started — finish these" before untouched backlog.

## Step 5 — Present the shortlist

Lead with a compact table of the top ~5–8 open tasks. For each: title (linked to `content.url` when present), priority, size, status, and a one-line "why it matters" distilled from the issue body — not a copy-paste of it.

Keep it skimmable. Don't dump full issue bodies; the user can click through.

## Step 6 — Suggest sensible next directions

After the board tasks, add a short **"Beyond the board"** section: 2–4 directions the board doesn't list but that follow naturally from the current state. Ground each one — cite a recent commit (`git log --oneline -15`), an obvious gap (a feature with an API route but no UI, a `TODO`, a half-built phase from CLAUDE.md's build-priority list, a table with no surfacing screen). One line each, each ending with a concrete first step. Mark these clearly as *suggestions, not tracked work*.

If a suggestion is strong enough to belong on the board, offer to create it as an issue/card — but only create it when the user says yes (writing to the board needs explicit go-ahead).

## Argument (optional)

- `/next-task` → full shortlist + suggestions (default).
- `/next-task <keyword>` → filter the board to items whose title/labels/body match the keyword (e.g. `/next-task aura`, `/next-task api`), then rank and present those.

## Guardrails

- Read-only by default. Moving a card's status, assigning, or creating issues happens only on explicit user request.
- Never invent task IDs or URLs — only surface what the board actually returns.
- If the board is empty or every item is done, say so plainly and lean on the "Beyond the board" suggestions instead.
