import Link from "next/link";
import type { Hub, UpcomingSession as Upcoming } from "@/lib/data";
import { formatSessionDate } from "@/lib/schedule";
import { templateFilename } from "@/lib/sheet";
import { playerColorMap } from "@/lib/views";
import { Countdown } from "./Countdown";
import { DeleteSessionButton } from "./DeleteSessionButton";
import { GoingList } from "./GoingList";
import { PlanSessionForm } from "./PlanSessionForm";
import { SessionEditor } from "./SessionEditor";
import { SignUpForm } from "./SignUpForm";
import { CardPanel, FeltPanel, PageTitle, SectionTitle } from "./ui";

/**
 * The page of a session without results: felt hero with date, time, note and countdown, the
 * going list with the sign-up form, and for the admin the results upload (pre-filled with the
 * sign-ups), a CSV template, the details form and delete.
 */
export function UpcomingSession({ session, hub, admin }: { session: Upcoming; hub: Hub; admin: boolean }) {
  const colors = playerColorMap(hub.stats);
  const goingIds = new Set(session.going.map((p) => p.id));
  const suggestions = hub.allPlayers.filter((p) => !goingIds.has(p.id)).map((p) => p.name);
  const n = session.going.length;

  return (
    <main className="flex flex-col gap-4 md:gap-8">
      <Link
        href="/"
        className="-mt-1.5 -mb-2 inline-flex min-h-11 items-center self-start text-[13px] font-semibold text-brass md:my-0 md:min-h-0 md:text-sm"
      >
        ← Dashboard
      </Link>

      <FeltPanel className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="flex min-w-0 flex-col gap-1.5 md:gap-2">
          <span className="text-[10px] font-bold tracking-[0.18em] text-brass uppercase md:text-[13px]">
            Upcoming session
          </span>
          <PageTitle>{formatSessionDate(session.date, { year: true })}</PageTitle>
          <span className="text-[14px] text-mist md:text-lg">
            {session.startTime ? `${session.startTime} Amsterdam time` : "Time TBD"}
            {session.note ? ` · ${session.note}` : ""}
          </span>
        </div>
        {session.startsAt ? (
          <Countdown
            size="hero"
            startsAt={session.startsAt}
            timeKnown={session.startTime !== null}
            className="md:w-[560px] md:flex-none"
          />
        ) : (
          <p className="text-[14px] text-mist md:max-w-xs md:text-right md:text-base">
            The date is still to be decided. The countdown starts once it&rsquo;s set.
          </p>
        )}
      </FeltPanel>

      <div className="flex flex-wrap items-start gap-4 md:gap-6">
        <CardPanel className="flex min-w-0 flex-[1_1_420px] flex-col gap-2 md:gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <SectionTitle>Going</SectionTitle>
            <span className="tabular text-[12.5px] text-ink-muted md:text-sm">
              {n} {n === 1 ? "player" : "players"}
            </span>
          </div>
          <GoingList sessionId={session.id} players={session.going} colors={colors} admin={admin} />
          <div className="border-t border-ivory-line pt-3 md:pt-4">
            <SignUpForm sessionId={session.id} suggestions={suggestions} />
          </div>
        </CardPanel>

        {admin && (
          <CardPanel className="flex min-w-0 flex-[1_1_420px] flex-col gap-3 md:gap-4">
            <SectionTitle>Edit details</SectionTitle>
            <PlanSessionForm
              initial={{ sessionId: session.id, date: session.date, startTime: session.startTime, note: session.note }}
            />
            <div className="flex items-center justify-between gap-3 border-t border-ivory-line pt-3">
              <span className="text-sm text-ink-muted">Not happening after all?</span>
              <DeleteSessionButton sessionId={session.id} label={formatSessionDate(session.date)} />
            </div>
          </CardPanel>
        )}
      </div>

      {admin && (
        <CardPanel className="flex flex-col gap-3 md:gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle>Upload results</SectionTitle>
            <a
              href={`/sessions/${session.id}/template`}
              download={templateFilename(session.id, session.date)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-felt px-4 text-sm font-bold text-felt hover:bg-felt hover:text-ivory"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 4v12" />
                <path d="M6 10l6 6 6-6" />
                <path d="M4 20h16" />
              </svg>
              Download template
            </a>
          </div>
          <p className="text-sm text-ink-muted">
            Fill in the template (one row per player who signed up), drop it below, or type the amounts by hand.
          </p>
          <SessionEditor
            results
            players={hub.allPlayers}
            aliases={hub.aliases}
            initial={{
              sessionId: session.id,
              date: session.date,
              note: session.note,
              rows: session.going.map((p) => ({
                name: p.name,
                moneyInCents: null,
                moneyOutCents: null,
                buyIns: null,
                playerId: p.id,
              })),
            }}
          />
        </CardPanel>
      )}
    </main>
  );
}
