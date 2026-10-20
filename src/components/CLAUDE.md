# Components

Mobile-first: bare classes are the phone layout (below 768px), `md:` restores desktop. One
component per UI element; see the root `CLAUDE.md` for the breakpoint rule.

| Component | File | Purpose | Used on |
|---|---|---|---|
| `CardPanel`, `FeltPanel` | `ui.tsx` | Ivory card and dark felt panel; `CardPanel list` drops vertical padding on phones for edge-to-edge rows | All pages, admin |
| `SectionTitle`, `PageTitle` | `ui.tsx` | Section (h2) and page (h1) headings, smaller on phones | All pages |
| `KpiCard` | `ui.tsx` | Key number on an ivory card, compact on phones; `grouped` makes it one cell of a shared 2×2 card on phones | `/`, `/players/[slug]` (desktop), `/sessions/[id]` |
| `Money` | `ui.tsx` | Signed amount coloured for card or felt; `display` sets it in the serif | Everywhere amounts are shown |
| `PlayerDot` | `ui.tsx` | Circle in the player's colour (from `playerColorMap`), with a ring so light colours show on ivory (`on="felt"` for dark panels) | Leaderboard, `/players`, player hero, session results, achievement winners and detail |
| `Chevron`, `EmptyState`, `TIER_TEXT` | `ui.tsx` | Row chevron; empty-state panel; rarity label colours on phones | Phone list rows; empty pages; `AchievementRow` |
| `ProgressBar` | `ui.tsx` | Progress towards a locked achievement | `AchievementRow`, `AchievementDetail` |
| `DialogClose` | `ui.tsx` | Round close button for the ivory dialogs | `AchievementDetail`, `AchievementShowcase` dialog |
| `SiteHeader` | `SiteHeader.tsx` | Logo, meta line (with "next game" on desktop when one is planned), nav and the highlighted button: "New session", or "Next session" (to the planned session, with "New session" as a plain link) while one is planned; on phones a slim row with a round plus button and no nav links | Layout (every page) |
| `BottomNav` | `BottomNav.tsx` | Phone-only fixed tab bar (Home, Players, Achievements, plus a "Next" tab to the planned session between Home and Players while one exists), active tab in brass | Layout (every page) |
| `Badge` | `Badge.tsx` | Achievement badge with a ring per rarity tier (uncommon is mint); sizes `sm`/`md` and responsive `row`/`showcase`/`detail` | Everywhere achievements are shown |
| `AchievementRow` | `AchievementRow.tsx` | One achievement row: badge, title and description, winners (`group`) or unlock date (`player`), fixed-width rarity column; opens the detail | `/achievements`, player "view all" dialog |
| `AchievementDetailProvider`, `AchievementDetailTrigger` | `AchievementDetail.tsx` | Holds the achievement detail `<dialog>` (bottom sheet on phones, centred modal on desktop) and buttons that open it; also defines `AchievementView` (hidden, locked ones arrive redacted from `views.ts`) | `/achievements`, `/` latest achievements, player showcase and dialog, `/sessions/[id]` (phones) |
| `AchievementList` | `AchievementList.tsx` | Filter (All/Unlocked/Locked) and sort (Rarest/Most common) controls plus the list of `AchievementRow`s | `/achievements` |
| `AchievementShowcase` | `AchievementShowcase.tsx` | In a `FeltPanel`: the player's earned badges (swipeable row on phones, top five on desktop) and the "view all" dialog (full screen on phones) | `/players/[slug]` |
| `BalanceChart` | `BalanceChart.tsx` | Recharts line chart of cumulative balance with toggle chips (one swipeable row on phones) | `/`, `/players/[slug]` |
| `StatsTable` | `StatsTable.tsx` | Sortable all-stats table; on phones it scrolls sideways under a sticky player column | `/` |
| `SessionEditor` | `SessionEditor.tsx` | Upload/edit form with preview; `results` makes it the upload for an upcoming session (file input, rows pre-filled from the sign-ups, date may start empty) | `/admin` (from data), `/admin/sessions/[id]`, upcoming `/sessions/[id]` (admin) |
| `LoginForm` | `LoginForm.tsx` | Admin sign-in | `/admin` |
| `DeleteSessionButton` | `DeleteSessionButton.tsx` | Confirmed session delete | `/admin`, upcoming `/sessions/[id]` (admin) |
| `Countdown` | `Countdown.tsx` | Client clock to a UTC instant from the server: days/hours/min/sec in the serif (`hero` or `card`), then "Dealing now" / "Today" / "Waiting for results"; rendered on the server at the request time (`serverNow`), so hydration matches and nothing shifts | `NextSessionCard`, `UpcomingSession` |
| `NextSessionCard` | `NextSessionCard.tsx` | Felt card linking to the next session: date and time, note, countdown, "N players going" with `PlayerDot`s | `/` |
| `UpcomingSession` | `UpcomingSession.tsx` | The upcoming-session page: felt hero with countdown, going list and sign-up form; for the admin the details form, delete, template download and results upload | `/sessions/[id]` |
| `GoingList` | `GoingList.tsx` | Signed-up players with `PlayerDot`; the "×" to remove someone shows only to the admin | `UpcomingSession` |
| `SignUpForm` | `SignUpForm.tsx` | Public name field with known players in a `<datalist>`, honeypot, pending and result line | `UpcomingSession` |
| `PlanSessionForm` | `PlanSessionForm.tsx` | Date, start time (Amsterdam), "Date TBD" / "Time TBD" boxes and note; plans a session, or with `initial` edits one | `/admin`, `UpcomingSession` (admin) |
| `NoGamesYet` | `NoGamesYet.tsx` | Player page for someone with sign-ups but no results: name and the sessions they're going to | `/players/[slug]` |
