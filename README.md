# PokerHub

A small dashboard for our poker nights: upload a spreadsheet per session and get running
balances, stats and Steam-style achievements for everyone. Every page is public and
read-only; only the admin (one shared password) can upload, edit or delete sessions.

Built with Next.js 16 (App Router), TypeScript, Tailwind 4, Drizzle ORM on Postgres, and
Recharts. Hosted on Vercel with a Neon Postgres database.

## Running locally

You need Node 20+ and a Postgres database (a local one, or a free Neon branch).

```bash
npm install
cp .env.example .env        # set DATABASE_URL and ADMIN_PASSWORD
npm run db:migrate          # creates the tables
npm run dev
```

Open http://localhost:3000, go to **Upload session**, sign in with `ADMIN_PASSWORD` and
upload a sheet.

Checks: `npm test` (stats and achievement engine), `npm run lint`, `npm run typecheck`.

## Deploying to Vercel

1. Import this repository as a new Vercel project.
2. In the project, open **Storage → Marketplace → Neon** and create a free database. This
   sets `DATABASE_URL` for you.
3. Add `ADMIN_PASSWORD` under **Settings → Environment Variables**.
4. Run the migrations once against that database from your machine:
   `DATABASE_URL="<the Neon connection string>" npm run db:migrate`
   (run it again whenever a new file appears in `drizzle/`).
5. Deploy, then add the subdomain (`poker.` on your domain) under **Settings →
   Domains**.

## Session sheets

Upload an `.xlsx` or `.csv` with a header row:

| Name   | Money in | Money out | Buy-ins (optional) |
| ------ | -------- | --------- | ------------------ |
| Sander | 16.65    | 4.35      | 3                  |

- Amounts may use a comma or a dot as decimal separator (`22,05` or `22.05`).
- A date in the filename (`2026-10-16 poker.xlsx` or `16-10-2026.csv`) fills in the
  session date; otherwise pick it in the form.
- Without a Buy-ins column, buy-ins are estimated as money in ÷ €5, rounded.
- Names are matched case-insensitively. Unknown names become new players, or you can map
  them to an existing player in the preview; that spelling is then remembered.
- If total money in and out differ, the difference is split evenly over everyone at the
  table (leftover cents go to the first players alphabetically), so every session sums to
  zero. The raw amounts are stored as entered; the split is applied when stats are
  calculated, and shown in the Spread column on the session page.

The two sessions from before PokerHub are in `data/backfill/` ready to upload. The first
one's date is unknown, so pick it in the form when uploading.

## Adding an achievement

Achievements live in [`src/achievements/definitions.ts`](src/achievements/definitions.ts).
Add an entry to the list:

```ts
{
  id: "high-five",                  // unique and stable; don't rename once in use
  name: "High Five",
  description: "Win 5 sessions in total.",
  icon: "5",                        // 1–2 characters, an emoji, or "/achievements/x.png" from /public
  hidden: false,                    // true shows ??? until someone earns it
  check: (c) => c.history.filter((r) => r.netCents > 0).length >= 5,
  progress: (c) => [c.history.filter((r) => r.netCents > 0).length, 5], // optional
},
```

`check` runs for every player after every session, in date order; the first session
where it returns true becomes the unlock date. Everything is recalculated from the session
history on each page load, so a new or edited achievement applies retroactively. The
fields available on `c` are documented in
[`src/achievements/types.ts`](src/achievements/types.ts) (this session's result, all-time
net, streaks, rank, biggest winner/loser of the night, and so on). Amounts are in cents.

Rarity is the share of players (with at least one session) who have earned it:
Common above 50%, Uncommon 25–50%, Rare 10–25%, Ultra rare 10% or less.

## Project layout

- `src/lib/stats.ts` – the stats engine (pure functions, tested in `stats.test.ts`)
- `src/achievements/` – achievement definitions and the engine that replays history
- `src/lib/sheet.ts` – spreadsheet/CSV parsing
- `src/app/` – pages: dashboard, `players/[slug]`, `sessions/[id]`, `achievements`, `admin`
- `src/db/schema.ts` – tables: players, player_aliases, sessions, results
