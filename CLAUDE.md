@AGENTS.md

# PokerHub

A small dashboard for our poker nights. An admin uploads a spreadsheet per session; every page
then shows running balances, stats and Steam-style achievements. Public pages are read-only;
only the admin (one shared password, `ADMIN_PASSWORD`) can upload, edit or delete sessions.

Next.js 16 (App Router, server components), TypeScript, Tailwind 4, Drizzle on Postgres,
Recharts. Everything is recalculated from the session history on each request (`getHub()` in
`src/lib/data.ts`), so there is no cache to invalidate.

## Page map

| Route | File | Shows |
|---|---|---|
| `/` | `src/app/page.tsx` | KPIs, balance chart, leaderboard, recent sessions, latest achievements, all-stats table |
| `/players` | `src/app/players/page.tsx` | Everyone in leaderboard order (list on phones, cards on desktop) |
| `/players/[slug]` | `src/app/players/[slug]/page.tsx` | One player: KPIs (hero card on phones), stat tiles, achievement showcase, chart, sessions |
| `/sessions/[id]` | `src/app/sessions/[id]/page.tsx` | One session: KPIs, results, achievements unlocked that night |
| `/achievements` | `src/app/achievements/page.tsx` | Every achievement with filter/sort, rarity and winners |
| `/admin`, `/admin/sessions/[id]` | `src/app/admin/` | Sign-in, upload, edit and delete sessions (not part of the phone redesign) |

`src/app/layout.tsx` wraps every page with `SiteHeader` and the phone-only `BottomNav`.

## Where the UI lives

- `src/components/` holds every UI piece; see `src/components/CLAUDE.md` for the list.
- Shared building blocks are in `src/components/ui.tsx` (`CardPanel`, `FeltPanel`,
  `SectionTitle`, `PageTitle`, `KpiCard`, `Money`, `PlayerDot`, `Chevron`, `EmptyState`).
- View models for client components are built in `src/lib/views.ts` (`chartData`,
  `statsRows`, `achievementViews`, `playerAchievementViews`, and `playerColorMap`, the one
  source of player colours so the chart and the dots match).
- Colours are the Card Room tokens in `src/app/globals.css` (`felt`, `ivory`, `brass`,
  `chip`, `win`, ...). Don't add new colours. The uncommon rarity is mint, never blue.

## Breakpoint rule

- Phones are below `md` (768px); desktop is `md` and up. The desktop look is the reference:
  changes for phones must not alter it.
- Write classes mobile-first: bare classes are the phone layout, `md:` restores desktop.
  Use `max-md:` for phone-only styles that a plain `md:` reset can't undo (pseudo-class
  variants such as `odd:` or `[&:nth-child(...)]` win over `md:` on specificity).
- One component per UI element, with responsive classes for both layouts. A second
  `md:hidden` / `hidden md:block` tree is allowed only where the structure really differs
  (the bottom tab bar, table versus list rows, the player hero card), and both trees are
  built from the same shared pieces (`PlayerDot`, `Money`, `Badge`, `AchievementRow`).
- Pages must not scroll sideways at 360px. Wide content (charts' chips, stats table,
  achievement strips) scrolls inside its own `overflow-x-auto no-scrollbar` box.
- The fixed bottom tab bar covers 68px plus the safe area; the layout's bottom padding
  (`pb-[calc(84px+env(safe-area-inset-bottom))]`) keeps it off the content.

## Running and checking

```bash
npm install
cp .env.example .env     # DATABASE_URL and ADMIN_PASSWORD
npm run db:migrate
npm run dev              # http://localhost:3000
```

Before committing: `npm test` (stats and achievement engine), `npm run lint`,
`npm run typecheck`, and `npm run build` (runs migrations first, so it needs DATABASE_URL).
For UI changes, check 390px and 1440px screenshots and that desktop is unchanged.

## Adding an achievement

Add an entry to `src/achievements/definitions.ts` with a unique, stable `id`, `name`,
`description`, `icon` (1–2 characters, an emoji, or `/achievements/x.png` from `/public`),
optional `hidden`, a `check(c)` that returns true once earned, and optional `progress(c)`
returning `[current, target]`. The context fields are documented in
`src/achievements/types.ts`; amounts are in cents. `check` runs for every player after every
session in date order, and the first session where it passes is the unlock date, so new and
edited achievements apply retroactively. Add a test in `src/achievements/engine.test.ts` if
the logic is non-trivial. No UI change is needed: the pages pick it up automatically.
