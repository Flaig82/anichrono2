# AURA — Project Context for Claude Code

> This file is the source of truth for the AURA project. Read it fully at the start of every session before writing any code. Update it as decisions are made.

---

## What is AURA?

AURA is a gamified anime engagement platform built on top of the AnimeChrono database (animechrono.com). It transforms passive anime watching into active, social, reputation-building — rewarding engagement quality, not just watch count.

**Positioning:** The community layer AniList never built. Targets AniList's 8M+ stagnating user base.

**The core problem with AniList:** No reward loop for watching, toxic forums, no discovery engine, no curated watch orders. Third-party "AniList Wrapped" tools go viral proving users want meaning from their data.

**Owner/Developer:** Jordan (GitHub: @Flaig82) — product designer with ~20 years experience who also codes React, SwiftUI, some GraphQL.

---

## Locked Product Decisions

### Database & Data Sources
- AnimeChrono's 194 manually curated franchise watch orders = seed data and competitive moat
- AniList GraphQL API = metadata enrichment only (cover images, scores, member counts, relations) — never source of truth
- Jikan (unofficial MAL REST API) = secondary source for episode data, MAL scores, episode titles. No API key required.
- Own user system — AniList is an import source, not auth provider
- Import from AniList (and eventually MAL) to pre-populate watch history on signup
- Never call AniList or Jikan live on page load — sync to Supabase on a schedule via Vercel Cron

### Auth
Email + Google OAuth + Discord OAuth (Discord = anime fans live there, future guild/faction integration)

### Platform
Web only (Next.js) first. SwiftUI native companion app possible later.

### Business Model
Ad-supported. Ads confined to right sidebar and between activity feed sections only. No interstitials, no autoplay video. Future: cosmetic tree themes, profile badge cosmetics, affiliate links (Amazon/streaming).

### Future / Backlog (not v1)
- Soulbound NFT for Aura score (non-transferable on-chain reputation — "your Aura is now verifiable on-chain" is a v2 announcement)
- Public AURA API (Chronicles + Pioneer scores are genuinely differentiated data nobody else has)
- AnimeFillerList.com scraper for filler episode tags
- SwiftUI native app

---

## The Six Aura Types

| Type | Emoji | Color | Formula | Decay? |
|------|-------|-------|---------|--------|
| Pioneer | 🧭 | #3B82F6 (blue) | base(100) × obscurity_multiplier × recency_bonus | Yes — monthly vs AniList member counts |
| Scholar | 📖 | #8B5CF6 (purple) | 20 (submit) + 10/upvote (diminishing after 50) | No |
| Oracle | 🔮 | #EC4899 (pink) | 300/150/75/0 based on prediction accuracy ±0.5/1/2pts | No |
| Sensei | 🧑‍🏫 | #F59E0B (amber) | 15 (add) + 50 (complete) + 10 (2nd-degree chain) | No |
| Veteran | 📜 | #10B981 (green) | 200 + (entry_count × 15) per Chronicle completion | No |
| Archivist | 🗺️ | #F97316 (orange) | 50 (submit) + 150 (approved) + 400 (canon) + 2/follower/mo | Trickle pauses if outdated |

### Pioneer Obscurity Multipliers
- 500k+ AniList members = 0.5x (mainstream)
- 100k–500k = 1.0x (popular)
- 10k–100k = 2.0x (cult)
- Under 10k = 4.0x (obscure)

### Era Thresholds
- 🌱 Initiate: 0–499 total Aura
- 🧭 Wanderer: 500–2,499
- ⚔ Adept: 2,500–7,499
- 👁 Ascendant: 7,500+

Era titles vary by dominant Aura type (e.g. Pioneer-heavy Wanderer gets a different title than Scholar-heavy Wanderer).

---

## The Aura Tree (3D Visualization)

- Built in React Three Fiber + Drei (client-side only, `ssr: false`)
- Geometric/architectural tree on dark background — not organic, structured and precise
- **Trunk** = total Aura score (height/thickness)
- **6 main branches** = one per Aura type, proportional to score
- **Sub-branches** = genre clusters off relevant Aura branch
- **Leaf nodes** = individual completed series — older watches darker/deeper, recent ones glow brighter at tips
- **Chronicle rings** = geometric connectors linking franchise entries
- Interactions: drag to rotate, scroll to zoom, hover for tooltips, three view modes (Full Tree / By Genre / Timeline)
- Initiates see a sapling; Ascendants see sprawling architectural structure
- Every tree looks different — genuine visual fingerprint of the user

---

## Chronicle System — IMPORTANT: Updated Architecture

### The Master Order Concept
Every franchise has ONE master community watch order (not competing Chronicles). This is auto-generated from AniList Relations data on day one, then maintained by the community via proposed edits.

**How AnimeChrono structures it (our model):**
The Naruto page shows the key pattern — episode blocks get SPLIT at points where movies/OVAs are inserted. It's a flat numbered list:
```
1. Episodes 1–5          [type: episodes]
2. Find the Four-Leaf OVA [type: ova]
3. Episodes 6–19         [type: episodes]
4. Ninja Clash Movie     [type: movie]
5. Episodes 20–101       [type: episodes]
...
```

**Auto-generation from AniList Relations:**
AniList gives us the related works (sequels, OVAs, movies, ONAs) but NOT the insertion points. The community's job is to split episode blocks and insert related works at the correct position.

**Community editing model (wiki-style, not Reddit-style):**
```
Auto-generated order from AniList Relations
        ↓
Any Wanderer+ can propose an edit
(reorder, split episode block, add watch note, change flag)
        ↓
Community upvotes/downvotes the proposal
        ↓
Enough net votes = auto-applies
        ↓
Edit history preserved, rollback available
```

### Chronicles = Routes (not competing full lists)
Chronicles are opinionated paths through the master list:
- Newcomer Route — skip ONAs, watch Season 1 and 2 only
- Completionist Route — everything in the master order
- Manga Reader Route — skip anime-original content

**Architecturally:** Chronicles are just arrays of master entry IDs with an optional order override. They do NOT define their own entries. One entries table, Chronicles are filtered/reordered views of it.

### Entry types and color coding
- Episodes → neutral/white (`#EEF0F6`)
- Movie → orange (`#F97316`)
- OVA → blue (`#3B82F6`)
- ONA → purple (`#8B5CF6`)
- Manga → green (`#10B981`)
- Special → amber (`#F59E0B`)

---

## Oracle Predictions — Full Flow

1. Show announced for season → prediction window opens
2. User submits predicted final AniList score (e.g. 8.4) via slider
3. **Episode 6 airs → window LOCKS** (enough episodes to have informed opinion, early enough for contrarian predictions)
4. Season ends, show finishes airing
5. AniList score stabilizes (2–4 weeks after finale)
6. AURA resolves all predictions automatically via Vercel Cron

**Scoring bands:**
- Within ±0.5 → 300 Oracle Aura → "✓ Perfect"
- Within ±1.0 → 150 Oracle Aura → "~ Close"
- Within ±2.0 → 75 Oracle Aura → "○ In Range"
- Outside ±2.0 → 0 Aura → "✗ Miss"

**Leaderboard:** Seasonal. Average accuracy across all predictions, weighted by number of predictions made. Top Oracle earns the Oracle Crown badge — cosmetic title for that season only, resets each season.

**Multi-cour shows:** Predict per-cour. Each cour gets its own prediction window and resolves independently. More engagement touchpoints, reflects how anime fans actually think seasonally.

---

## Quest System

### Four Categories

**Journey Quests** — permanent, era-gated progression. One visible at a time. Lore-flavored Oracle narrator framing.

Sample Initiate quests:
- "Your signal is faint. Begin." → complete profile (25 Aura + tree unlocks)
- "Every journey starts with one." → mark first anime complete (50 Veteran Aura)
- "Reach five." → complete 5 anime (150 Veteran Aura + Wanderer unlocks)

Sample Wanderer quests:
- "Old light travels far." → complete pre-2000 anime (120 Pioneer)
- "Depth over breadth." → complete 8+ entry franchise (250 Veteran + Adept path opens)

**Daily Quests** — 3 per day, midnight UTC refresh, pool of 40+. Ascendant tier pays 1.5x base rate.

**Seasonal Quests** — 12-week quests tied to current season. Completion earns permanent season badge on profile.

**Mastery Quests** — hidden until triggered. No list exists. Notification: "A hidden path revealed itself."
- Ghost: complete anime with <1,000 AniList members → 500 Pioneer + Ghost title
- Time Traveler: complete anime from 5 different decades → 600 split Aura + title
- Polymath: complete anime from every major genre → 800 split Aura + title
- Oracle's Eye: 10 perfect predictions lifetime → 1,000 Oracle + tree cosmetic

---

## Data Model (Supabase Postgres — 10 Tables)

```sql
-- Franchise: the top-level anime series/universe
Franchise {
  id uuid PK
  title text
  slug text UNIQUE
  genres text[]
  year_started integer
  studio text
  anilist_id integer
  mal_id integer
  obscurity_score float  -- calculated from AniList member count
  obscurity_tier text    -- 'mainstream' | 'popular' | 'cult' | 'obscure'
  status text            -- 'finished' | 'releasing' | 'not_yet_released'
  cover_image_url text
  banner_image_url text
  description text
  created_at timestamptz
  updated_at timestamptz
}

-- Entry: individual items in a franchise watch order
Entry {
  id uuid PK
  franchise_id uuid FK -> Franchise
  position integer           -- order in master list
  title text                 -- e.g. "Episodes 1–5" or "Ninja Clash in the Land of Snow"
  entry_type text            -- 'episodes' | 'movie' | 'ova' | 'ona' | 'manga' | 'special'
  episode_start integer      -- nullable, only for episode type
  episode_end integer        -- nullable, only for episode type
  parent_series text         -- e.g. "Naruto", "Naruto Shippuden" for grouping
  anilist_id integer         -- nullable, links to AniList entry
  is_essential boolean       -- default true
  curator_note text          -- nullable, watch timing guidance
  created_at timestamptz
}

-- Chronicle: a curated route through a franchise's master entry list
Chronicle {
  id uuid PK
  franchise_id uuid FK -> Franchise
  author_user_id uuid FK -> User
  title text
  route_type text            -- 'newcomer' | 'completionist' | 'chronological' | 'manga_reader'
  entry_ids uuid[]           -- ordered array of Entry IDs from master list
  summary text               -- max 300 chars
  status text                -- 'draft' | 'in_review' | 'approved' | 'canon'
  vote_count integer
  follower_count integer
  is_canon boolean
  created_at timestamptz
  updated_at timestamptz
}

-- User
User {
  id uuid PK
  email text UNIQUE
  display_name text
  handle text UNIQUE
  avatar_url text
  auth_provider text         -- 'email' | 'google' | 'discord'
  era text                   -- 'initiate' | 'wanderer' | 'adept' | 'ascendant'
  dominant_aura_type text    -- affects era title display
  total_aura integer
  anilist_username text      -- nullable, for import
  mal_username text          -- nullable, for import
  created_at timestamptz
}

-- UserAura: per-type Aura scores
UserAura {
  id uuid PK
  user_id uuid FK -> User
  aura_type text             -- 'pioneer' | 'scholar' | 'oracle' | 'sensei' | 'veteran' | 'archivist'
  value integer
  last_calculated timestamptz
  history_snapshots jsonb[]  -- for decay tracking and graphs
}

-- WatchEntry: user's watch history
WatchEntry {
  id uuid PK
  user_id uuid FK -> User
  franchise_id uuid FK -> Franchise
  entry_id uuid FK -> Entry   -- nullable, episode-level tracking
  status text                 -- 'watching' | 'completed' | 'watchlist' | 'dropped'
  date_completed date
  user_rating float           -- 1-10
  is_rewatch boolean
  is_public boolean
  created_at timestamptz
}

-- ChronicleProgress: user's progress through a Chronicle
ChronicleProgress {
  id uuid PK
  chronicle_id uuid FK -> Chronicle
  user_id uuid FK -> User
  current_position integer
  entries_completed uuid[]
  started_at timestamptz
  completed_at timestamptz
}

-- Review
Review {
  id uuid PK
  user_id uuid FK -> User
  franchise_id uuid FK -> Franchise
  body text
  score float
  upvotes integer
  word_count integer
  created_at timestamptz
}

-- Prediction
Prediction {
  id uuid PK
  user_id uuid FK -> User
  franchise_id uuid FK -> Franchise
  cour integer               -- which cour (1, 2, etc.) for multi-cour shows
  predicted_score float
  actual_score float         -- filled on resolution
  season text                -- e.g. 'winter_2026'
  locked_at timestamptz      -- when Episode 6 aired
  resolved_at timestamptz
  aura_awarded integer
  result text                -- 'perfect' | 'close' | 'in_range' | 'miss'
}

-- Quest / UserQuest
Quest {
  id uuid PK
  category text              -- 'journey' | 'daily' | 'seasonal' | 'mastery'
  era_required text
  title text
  flavour_text text          -- Oracle narrator lore framing
  aura_reward jsonb          -- { type: 'pioneer', amount: 120 }
  condition jsonb            -- machine-readable completion condition
  is_hidden boolean          -- for mastery quests
}

UserQuest {
  id uuid PK
  user_id uuid FK -> User
  quest_id uuid FK -> Quest
  progress integer
  target integer
  completed_at timestamptz
  aura_awarded integer
}
```

---

## Tech Stack (Locked)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14 (App Router) | |
| Language | TypeScript | Strict mode |
| Database | Supabase Postgres | |
| Auth | Supabase Auth | Email + Google + Discord |
| Storage | Supabase Storage | Cover/banner images |
| API | Next.js Route Handlers | REST, not tRPC |
| UI Components | shadcn/ui + Tailwind CSS | |
| 3D | React Three Fiber + Drei | `ssr: false` on Aura Tree |
| State | Zustand | |
| Data Fetching | SWR | |
| Animation | Framer Motion | Era transitions, page loads |
| Dither Effect | Custom Canvas/Bayer | See `/lib/dither.ts` — use sparingly |
| Validation | Zod | All API inputs |
| Hosting | Vercel | |
| Scheduled Jobs | Vercel Cron | AniList sync, Oracle resolution, Pioneer decay |
| External APIs | AniList GraphQL + Jikan REST | Enrichment only, never live on page load |

### API Routes
`/api/auth`, `/api/user`, `/api/franchise`, `/api/chronicle`, `/api/review`, `/api/prediction`, `/api/quest`, `/api/aura`, `/api/import`

### Security
- Row Level Security on ALL Supabase tables
- Vercel Edge Middleware rate limiting
- Chronicle submission capped at 3/week per user at API level
- Zod validation on all inputs
- Pioneer score recalculation via Vercel Cron (not on-demand)

### Environments
- Local: Supabase CLI + Next.js dev
- Preview: Vercel PR deploys + Supabase staging branch
- Production: Vercel main + Supabase prod

---

## Design System

### Colors (CSS Variables)
```css
--bg: #0A0A0C;          /* page background */
--bg2: #111115;         /* card background */
--bg3: #18181E;         /* elevated card */
--bg4: #1F1F28;         /* hover state */
--border: rgba(255,255,255,0.07);
--border2: rgba(255,255,255,0.13);
--text: #EEF0F6;
--muted: #5A6070;
--muted2: #8A94A8;
--orange: #F97316;      /* primary accent */
--orange-l: rgba(249,115,22,0.12);
--pioneer: #3B82F6;
--scholar: #8B5CF6;
--oracle: #EC4899;
--sensei: #F59E0B;
--veteran: #10B981;
--archivist: #F97316;   /* same as orange */
```

### Typography
- **Display/Headings:** Syne (weights 700, 800) — `font-family: 'Syne', sans-serif`
- **Labels/Mono/Data:** JetBrains Mono (weights 400, 500, 600) — `font-family: 'JetBrains Mono', monospace`
- **Body:** Syne 400

### Key Design Principles
- Dark near-black background (`#0A0A0C`) — warm dark, not cold
- Orange (`#F97316`) as the single primary accent — used for CTAs, active states, the AURA wordmark
- JetBrains Mono for ALL labels, metadata, stats, timestamps — never use it for body copy
- Subtle noise texture overlay on body (SVG feTurbulence, ~3% opacity)
- Cards use `border: 1px solid rgba(255,255,255,0.07)` — no heavy shadows
- Section labels: JetBrains Mono, 10px, letter-spacing 0.15em, uppercase, `--muted` color
- Anime key art as the primary visual element — UI gets out of the way of the art

### The Dither Effect
A 4×4 Bayer ordered dither hover effect built with Canvas. Use **sparingly — maximum one dither interaction per screen**.

Good uses:
- Nav active state background fill
- Pioneer badge on hover
- Chronicle entry completion state

Never use on:
- Browse grid cards (too many at once)
- Standard buttons (too frequent)

Implementation is in `/lib/dither.ts` (to be created). Reference: `/public/demos/dither-effect.html`.

### Nav Structure
```
ANIMECHRONO    Chronicles  Discover  Predictions  Quests         ◈ 24,514  Pyrat [avatar]
```
- ANIMECHRONO wordmark left, bold
- Nav links as pill buttons with icon + label, active state in orange
- Right: total Aura score + avatar + display name
- Height: 52px, `backdrop-filter: blur(20px)`, sticky

### Page Layout Pattern
Most pages: two-column — main content left, sticky right sidebar (300px) with user Aura breakdown + THE FEED.

### Anime Character Art Treatment
Characters can "break out" of their containers — positioned absolutely so they bleed above the hero banner boundary. Established on the homepage with the Luffy cutout. Use for featured/hero moments only.

---

## Current Design State (as of this session)

### Screens Designed in Figma (solid direction locked)
1. **Homepage** — hero with character cutout, Daily Quests strip, Popular This Season poster row, Updated Chronicles 3-col grid, right sidebar with Aura breakdown + THE FEED
2. **Anime/Franchise Page** — full-bleed atmospheric hero with Pioneer badge, status bar, tabbed content (Chronicles, Episodes, Reviews, Oracle, Similar), sticky right column

### Screens Prototyped in HTML (reference files)
- `/public/demos/aura-prototype.html` — full 6-screen navigable prototype (Profile, Chronicles, Discover, Predictions, Quests, Activity Feed)
- `/public/demos/aura-anime-page.html` — anime franchise page with all tabs
- `/public/demos/dither-effect.html` — dither hover effect demos

### Screens Not Yet Designed (build order priority)
1. Profile page with Aura Tree (most unique screen, highest priority)
2. Chronicles browser
3. Quest screen
4. Chronicle editor (new — split/insert/note UI for master order editing)
5. Route Chronicle creator (entry selection UI)

---

## Copy / Messaging

### Logged Out Hero
```
Headline: Your anime journey, measured.
Subhead: Track what you've watched, build your Aura, and follow
community-curated watch orders for every franchise.
CTAs: Create Your Account  |  Learn More →
```

### Logged In Hero (use real user data)
```
Headline: 3 quests waiting, [name].
Subhead: You're 340 Aura away from Adept era.
Your daily quests reset in 14h 32m.
CTAs: View Quests  |  Continue Chronicle →
```

### Era flavor — Mastery Quest unlock notification
`"A hidden path revealed itself."`

---

## Build Priority Order (v1 MVP)

### Phase 1 — Foundation
- [ ] Next.js 14 project setup with TypeScript strict
- [ ] Tailwind config with full design token set
- [ ] shadcn/ui install and theme override
- [ ] Supabase project + all 10 tables with RLS
- [ ] Supabase Auth (email + Google + Discord)
- [ ] Base layout components: `RootLayout`, `Nav`, `RightSidebar`
- [ ] Design token primitives: `Card`, `Tag`, `Button`, `SectionLabel`, `AuraBar`, `MonoText`

### Phase 2 — Data Pipeline
- [ ] AniList GraphQL client (`/lib/anilist.ts`)
- [ ] Jikan REST client (`/lib/jikan.ts`)
- [ ] Franchise seed script (194 AnimeChrono entries)
- [ ] Vercel Cron: nightly AniList sync for airing shows
- [ ] Pioneer obscurity score calculation job

### Phase 3 — Core Screens
- [ ] Homepage (`/app/page.tsx`)
- [ ] Franchise page (`/app/franchise/[slug]/page.tsx`)
- [ ] Profile page (`/app/u/[handle]/page.tsx`) — includes Aura Tree
- [ ] Chronicles browser (`/app/chronicles/page.tsx`)
- [ ] Discover/Search (`/app/discover/page.tsx`)

### Phase 4 — Engagement Features
- [ ] Quest system + daily reset cron
- [ ] Oracle predictions + Episode 6 lock cron
- [ ] Oracle resolution cron (score stabilization check)
- [ ] Chronicle editor (master order split/insert UI)
- [ ] Aura calculation engine

### Phase 5 — Community
- [ ] Review system with Scholar Aura
- [ ] Chronicle route creator
- [ ] Community voting on master order edits
- [ ] Activity feed
- [ ] User import from AniList

---

## Important Context for Code Generation

- Always use TypeScript with strict types — no `any`
- Tailwind only for styling — no inline styles, no CSS modules except for Three.js canvas
- shadcn/ui components as base — extend don't replace
- All data fetching via SWR on client, server components for initial page load
- Supabase client: use `@supabase/ssr` for server components, `@supabase/supabase-js` for client
- API routes always validate with Zod before touching database
- RLS is the security layer — never skip it thinking middleware is enough
- Pioneer scores are NEVER calculated on-demand — always read from `UserAura` table, recalculated by cron
- Aura Tree (`/components/aura-tree.tsx`) must be dynamically imported with `{ ssr: false }`
- Dither effect (`/lib/dither.ts`) is a canvas utility — use as custom hook in React components
- JetBrains Mono is loaded via Google Fonts in `layout.tsx` — reference via `font-mono` Tailwind class after configuring in `tailwind.config.ts`
- Syne is loaded via Google Fonts — configure as `font-display` in Tailwind

---

## File Structure Convention

```
/app
  /api              — Route handlers
  /franchise/[slug] — Anime franchise page
  /u/[handle]       — User profile
  /chronicles       — Browse chronicles
  /discover         — Search
  /quests           — Quest screen
  /predictions      — Oracle predictions
  layout.tsx        — Root layout with Nav
  page.tsx          — Homepage

/components
  /ui               — shadcn primitives
  /layout           — Nav, Sidebar, Footer
  /franchise        — FranchiseHero, EntryList, ChronicleCard, PioneerBadge
  /profile          — AuraTree, AuraBreakdown, ProfileHeader
  /quest            — QuestCard, EraProgress, QuestTabs
  /predictions      — PredictionSlider, OracleLeaderboard
  /shared           — Card, Tag, Button, AuraBar, SectionLabel, MonoText, DitherCanvas

/lib
  anilist.ts        — AniList GraphQL client
  jikan.ts          — Jikan REST client
  supabase.ts       — Supabase client (server + client exports)
  aura.ts           — Aura calculation functions
  pioneer.ts        — Pioneer score + obscurity multiplier logic
  dither.ts         — Bayer dither canvas effect
  utils.ts          — General utilities

/types
  database.ts       — Supabase generated types
  aura.ts           — Aura type enums and interfaces
  franchise.ts      — Franchise, Entry, Chronicle interfaces

/scripts
  seed-franchises.ts — Seed 194 AnimeChrono entries
  sync-anilist.ts    — AniList sync script (run by cron)

/public
  /demos            — HTML prototype reference files
```

---

*Last updated: Session covering full product design, visual direction locked, Chronicle architecture updated to master order + routes model, anime page designed, dither effect prototyped.*
