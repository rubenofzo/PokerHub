"use client";

import { useActionState, useState } from "react";
import { planSession, updateSessionDetails, type DetailsState } from "@/app/admin/actions";

export type SessionDetails = { sessionId: number; date: string | null; startTime: string | null; note: string | null };

/**
 * Date, start time (Europe/Amsterdam) and note of an upcoming session, each date and time
 * with a "TBD" box. Without `initial` it plans a new session; with it, it edits that one.
 */
export function PlanSessionForm({ initial }: { initial?: SessionDetails }) {
  const [state, action, pending] = useActionState<DetailsState, FormData>(
    initial ? updateSessionDetails : planSession,
    {},
  );
  const [dateTbd, setDateTbd] = useState(initial ? initial.date === null : false);
  const [timeTbd, setTimeTbd] = useState(initial ? initial.startTime === null : false);
  const input =
    "min-h-11 w-full rounded-lg border border-ivory-line bg-white px-2.5 text-ink tabular focus:border-brass-dark focus:outline-none disabled:opacity-40";
  const label = "flex flex-col gap-1.5 text-sm font-bold text-ink-muted";
  const tbd = "flex min-h-8 items-center gap-2 text-sm font-semibold text-ink";

  return (
    <form action={action} className="flex flex-col gap-4 text-ink">
      {initial && <input type="hidden" name="sessionId" value={initial.sessionId} />}
      <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-start md:gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={label}>
            Date
            <input
              type="date"
              name="date"
              required={!dateTbd}
              disabled={dateTbd}
              defaultValue={initial?.date ?? ""}
              className={input}
            />
          </label>
          <label className={tbd}>
            <input type="checkbox" name="dateTbd" checked={dateTbd} onChange={(e) => setDateTbd(e.target.checked)} className="h-4 w-4 accent-felt" />
            Date TBD
          </label>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label}>
            Start time
            <input
              type="time"
              name="startTime"
              required={!timeTbd}
              disabled={timeTbd}
              defaultValue={initial?.startTime ?? "20:00"}
              className={input}
            />
          </label>
          <label className={tbd}>
            <input type="checkbox" name="timeTbd" checked={timeTbd} onChange={(e) => setTimeTbd(e.target.checked)} className="h-4 w-4 accent-felt" />
            Time TBD
          </label>
        </div>
        <label className={`${label} col-span-2 md:min-w-[240px] md:flex-1`}>
          Note (optional)
          <input name="note" maxLength={500} defaultValue={initial?.note ?? ""} placeholder="e.g. at Tijs's place" className={input} />
        </label>
      </div>
      <p className="text-xs text-ink-muted">Times are Amsterdam time.</p>
      {state.error && <p className="rounded-xl bg-chip/15 px-4 py-3 text-sm font-semibold text-chip-dark">{state.error}</p>}
      {state.saved && !pending && <p className="text-sm font-semibold text-win-dark">Details saved.</p>}
      <div>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-full bg-felt px-7 font-bold text-ivory hover:bg-felt-light disabled:opacity-50"
        >
          {pending ? "Saving…" : initial ? "Save details" : "Plan session"}
        </button>
      </div>
    </form>
  );
}
