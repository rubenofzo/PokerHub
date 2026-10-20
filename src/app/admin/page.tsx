import type { Metadata } from "next";
import Link from "next/link";
import { DeleteSessionButton } from "@/components/DeleteSessionButton";
import { LoginForm } from "@/components/LoginForm";
import { PlanSessionForm } from "@/components/PlanSessionForm";
import { SessionEditor } from "@/components/SessionEditor";
import { CardPanel, SectionTitle } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { getHub } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { formatEuro } from "@/lib/money";
import { formatSchedule, formatSessionDate } from "@/lib/schedule";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Admin" };

type Props = { searchParams: Promise<{ from?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto w-full max-w-md">
        <CardPanel className="flex flex-col gap-4">
          <SectionTitle>Dealer only</SectionTitle>
          <p className="text-ink-muted">Sign in to plan, upload, edit or delete sessions.</p>
          <LoginForm />
        </CardPanel>
      </main>
    );
  }

  const { allPlayers, aliases, stats, upcoming } = await getHub();
  const sessions = [...stats.sessions].reverse();
  const fromData = (await searchParams).from === "data";
  const tab = (active: boolean) =>
    `inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-center text-sm font-bold md:flex-none md:px-5 ${
      active ? "bg-felt text-ivory" : "text-felt hover:bg-ivory-line"
    }`;

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-5xl">Admin</h1>
        <form action={logout}>
          <button type="submit" className="min-h-11 px-4 font-semibold text-brass hover:text-ivory">
            Sign out
          </button>
        </form>
      </div>

      <CardPanel className="flex flex-col gap-4">
        <SectionTitle>New session</SectionTitle>
        <nav aria-label="New session" className="flex gap-1 rounded-full border border-ivory-line p-1 md:self-start">
          <Link href="/admin" aria-current={!fromData ? "page" : undefined} className={tab(!fromData)}>
            Plan a session
          </Link>
          <Link href="/admin?from=data" aria-current={fromData ? "page" : undefined} className={tab(fromData)}>
            Create session from data
          </Link>
        </nav>
        {fromData ? (
          <>
            <p className="text-sm text-ink-muted">
              For a game that already happened: upload its sheet and it is saved as a played session in one step.
            </p>
            <SessionEditor players={allPlayers} aliases={aliases} />
          </>
        ) : (
          <>
            <p className="text-sm text-ink-muted">
              Set the date and time (or leave them TBD). Everyone can then sign up on the session page, and you upload
              the results there after the game.
            </p>
            <PlanSessionForm />
          </>
        )}
      </CardPanel>

      <CardPanel className="flex flex-col gap-2">
        <SectionTitle>Sessions</SectionTitle>
        {upcoming.length > 0 && (
          <>
            <h3 className="mt-2 text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">Upcoming</h3>
            <ul>
              {upcoming.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-ivory-line py-3">
                  <Link href={`/sessions/${s.id}`} className="flex flex-col">
                    <span className="font-bold text-ink">{formatSchedule(s.date, s.startTime)}</span>
                    <span className="text-sm text-ink-muted">
                      {s.going.length} going{s.note ? ` · ${s.note}` : ""}
                    </span>
                  </Link>
                  <span className="flex items-center gap-2">
                    <Link
                      href={`/sessions/${s.id}`}
                      className="inline-flex min-h-10 items-center rounded-full border-2 border-felt px-4 text-sm font-bold text-felt hover:bg-felt hover:text-ivory"
                    >
                      Open
                    </Link>
                    <DeleteSessionButton sessionId={s.id} label={formatSessionDate(s.date)} />
                  </span>
                </li>
              ))}
            </ul>
            <h3 className="mt-4 text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">Played</h3>
          </>
        )}
        {sessions.length === 0 ? (
          <p className="text-ink-muted">Nothing uploaded yet.</p>
        ) : (
          <ul>
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-ivory-line py-3">
                <Link href={`/sessions/${s.id}`} className="flex flex-col">
                  <span className="font-bold text-ink">{formatDate(s.date)}</span>
                  <span className="text-sm text-ink-muted">
                    {s.results.length} players · {formatEuro(s.potCents)} pot
                  </span>
                </Link>
                <span className="flex items-center gap-2">
                  <Link
                    href={`/admin/sessions/${s.id}`}
                    className="inline-flex min-h-10 items-center rounded-full border-2 border-felt px-4 text-sm font-bold text-felt hover:bg-felt hover:text-ivory"
                  >
                    Edit
                  </Link>
                  <DeleteSessionButton sessionId={s.id} label={formatDate(s.date)} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardPanel>
    </main>
  );
}
