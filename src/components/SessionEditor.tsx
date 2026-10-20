"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { saveSession } from "@/app/admin/actions";
import { formatEuro, formatSigned, parseAmountToCents } from "@/lib/money";
import { normalizeName } from "@/lib/names";
import { dateFromFilename, parseCsv, parseSheetRows } from "@/lib/sheet";
import { inferBuyIns, spreadImbalance } from "@/lib/stats";

type PlayerOption = { id: number; name: string };
type Alias = { alias: string; playerId: number };

type Match = number | "new" | "auto";
type EditorRow = { key: number; name: string; moneyIn: string; moneyOut: string; buyIns: string; match: Match };

/** Both amounts empty: a sign-up who didn't play. Such rows are left out when saving. */
const isBlankRow = (r: EditorRow) => r.moneyIn.trim() === "" && r.moneyOut.trim() === "";

export type EditorInitial = {
  sessionId: number;
  /** Null for an upcoming session whose date is still TBD: the field starts empty. */
  date: string | null;
  note: string | null;
  /** Amounts are null for a row pre-filled from a sign-up (the input starts empty). */
  rows: { name: string; moneyInCents: number | null; moneyOutCents: number | null; buyIns: number | null; playerId: number }[];
};

let nextKey = 1;
const centsToInput = (c: number | null) => (c === null ? "" : (c / 100).toFixed(2));
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Upload or edit form with a live preview. Without `initial` it creates a session from a
 * sheet. With `initial` it edits that session; `results` marks it as the upload for an
 * upcoming session (file input shown, rows pre-filled from the sign-ups).
 */
export function SessionEditor({
  players,
  aliases,
  initial,
  results = false,
}: {
  players: PlayerOption[];
  aliases: Alias[];
  initial?: EditorInitial;
  results?: boolean;
}) {
  const router = useRouter();
  const withFile = !initial || results;
  const [date, setDate] = useState(initial ? (initial.date ?? "") : today());
  const [note, setNote] = useState(initial?.note ?? "");
  const [filename, setFilename] = useState<string | null>(null);
  const [rows, setRows] = useState<EditorRow[]>(
    initial?.rows.map((r) => ({
      key: nextKey++,
      name: r.name,
      moneyIn: centsToInput(r.moneyInCents),
      moneyOut: centsToInput(r.moneyOutCents),
      buyIns: r.buyIns === null ? "" : String(r.buyIns),
      match: r.playerId,
    })) ?? [],
  );
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const lookup = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of players) map.set(normalizeName(p.name), p.id);
    for (const a of aliases) if (!map.has(a.alias)) map.set(a.alias, a.playerId);
    return map;
  }, [players, aliases]);
  const playerName = useMemo(() => new Map(players.map((p) => [p.id, p.name])), [players]);

  /** Which existing player a row will be saved as, or null for a new player. */
  const resolve = (row: EditorRow): number | null => {
    if (typeof row.match === "number") return row.match;
    if (row.match === "new") return null;
    return lookup.get(normalizeName(row.name)) ?? null;
  };

  const preview = useMemo(() => {
    const parsed = rows.filter((r) => !isBlankRow(r)).map((r) => ({
      row: r,
      in: parseAmountToCents(r.moneyIn === "" ? "0" : r.moneyIn),
      out: parseAmountToCents(r.moneyOut === "" ? "0" : r.moneyOut),
      displayName: (() => {
        const id = typeof r.match === "number" ? r.match : r.match === "auto" ? lookup.get(normalizeName(r.name)) : undefined;
        return id ? (playerName.get(id) ?? r.name) : r.name.trim();
      })(),
    }));
    const valid = parsed.every((p) => p.in !== null && p.out !== null && p.in >= 0 && p.out >= 0);
    const totalIn = parsed.reduce((s, p) => s + (p.in ?? 0), 0);
    const totalOut = parsed.reduce((s, p) => s + (p.out ?? 0), 0);
    const imbalance = totalIn - totalOut;
    const order = [...parsed]
      .sort((a, b) => a.displayName.localeCompare(b.displayName, "nl", { sensitivity: "base" }))
      .map((p) => p.row.key);
    const shares = spreadImbalance(imbalance, order);
    const parsedByKey = new Map(parsed.map((p) => [p.row.key, p]));
    return { parsed, parsedByKey, valid, totalIn, totalOut, imbalance, shares, blank: rows.length - parsed.length };
  }, [rows, lookup, playerName]);

  const duplicates = useMemo(() => {
    const seen = new Map<string, number>();
    for (const r of rows) {
      if (isBlankRow(r)) continue;
      const id = resolve(r);
      const key = id !== null ? `id:${id}` : `new:${normalizeName(r.name)}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, lookup]);

  async function onFile(file: File) {
    setError(null);
    setFilename(file.name);
    const fromName = dateFromFilename(file.name);
    // The filename only fills an empty date; it never overrides a session's own date.
    if (fromName && (!initial || !date)) setDate(fromName);
    try {
      let cells: unknown[][];
      if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
        cells = parseCsv(await file.text());
      } else {
        const { readSheet } = await import("read-excel-file/universal");
        cells = (await readSheet(await file.arrayBuffer())) as unknown[][];
      }
      const result = parseSheetRows(cells);
      setFileErrors(result.errors);
      setRows(
        result.rows.map((r) => ({
          key: nextKey++,
          name: r.name,
          moneyIn: centsToInput(r.moneyInCents),
          moneyOut: centsToInput(r.moneyOutCents),
          buyIns: r.buyIns === null ? "" : String(r.buyIns),
          match: "auto",
        })),
      );
    } catch (err) {
      console.error(err);
      setFileErrors(["Couldn't read that file. Use an .xlsx or .csv file."]);
    }
  }

  const update = (key: number, patch: Partial<EditorRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function onSave() {
    setError(null);
    if (!date) return setError("Pick the session date first.");
    if (preview.parsed.length === 0) return setError("Fill in the amounts of at least one player.");
    if (!preview.valid) return setError("Fix the amounts marked in red first.");
    if (preview.parsed.some((p) => !p.row.name.trim())) return setError("Every row needs a name.");
    if (duplicates.size) return setError("A player appears twice. Merge those rows first.");
    const buyInsValid = preview.parsed.every((p) => p.row.buyIns === "" || /^\d+$/.test(p.row.buyIns.trim()));
    if (!buyInsValid) return setError("Buy-ins must be whole numbers (or empty to estimate).");

    startTransition(async () => {
      const result = await saveSession({
        sessionId: initial?.sessionId ?? null,
        date,
        note: note.trim() || null,
        sourceFilename: filename,
        rows: preview.parsed.map((p) => ({
          name: p.row.name,
          moneyInCents: p.in!,
          moneyOutCents: p.out!,
          buyIns: p.row.buyIns.trim() === "" ? null : Number(p.row.buyIns),
          playerId: resolve(p.row),
        })),
      });
      if (result.ok) {
        router.push(`/sessions/${result.sessionId}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const input =
    "min-h-10 w-full rounded-lg border border-ivory-line bg-white px-2.5 text-ink tabular focus:border-brass-dark focus:outline-none";

  return (
    <div className="flex flex-col gap-5 text-ink">
      <div className="flex flex-wrap items-end gap-4">
        {withFile && (
          <label className="flex min-w-[240px] flex-1 flex-col gap-1.5 text-sm font-bold text-ink-muted">
            Spreadsheet (.xlsx or .csv)
            <input
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              className="min-h-11 rounded-lg border border-dashed border-brass-dark bg-white px-3 py-2 text-sm font-normal text-ink file:mr-3 file:rounded-full file:border-0 file:bg-felt file:px-4 file:py-1.5 file:font-bold file:text-ivory"
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-bold text-ink-muted">
          Session date
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        </label>
        <label className="flex min-w-[200px] flex-1 flex-col gap-1.5 text-sm font-bold text-ink-muted">
          Note (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. at Tijs's place" className={input} />
        </label>
      </div>

      {withFile && (
        <p className="text-sm text-ink-muted">
          Columns: <b>Name</b>, <b>Money in</b>, <b>Money out</b>, and optionally <b>Buy-ins</b>. A date like
          2026-10-16 in the filename fills in the date. Without a Buy-ins column, buy-ins are estimated as money in ÷ €5.
        </p>
      )}

      {fileErrors.length > 0 && (
        <ul className="rounded-xl bg-chip/15 px-4 py-3 text-sm text-chip-dark">
          {fileErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {rows.length > 0 && (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[820px] text-[15px]">
            <thead>
              <tr className="text-left text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
                <th scope="col" className="py-2 pr-2">Name in sheet</th>
                <th scope="col" className="py-2 pr-2">Saved as</th>
                <th scope="col" className="w-28 py-2 pr-2">In €</th>
                <th scope="col" className="w-28 py-2 pr-2">Out €</th>
                <th scope="col" className="w-24 py-2 pr-2">Buy-ins</th>
                <th scope="col" className="py-2 pr-2 text-right">Net</th>
                <th scope="col" className="py-2"><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                // Blank rows (no amounts yet) show as empty and count for nothing.
                const p = preview.parsedByKey.get(row.key);
                const inC = p ? p.in : 0;
                const outC = p ? p.out : 0;
                const resolved = resolve(row);
                const dupKey = resolved !== null ? `id:${resolved}` : `new:${normalizeName(row.name)}`;
                const share = preview.shares.get(row.key) ?? 0;
                const net = p && inC !== null && outC !== null ? outC - inC + share : null;
                return (
                  <tr key={row.key} className={`border-t border-ivory-line ${duplicates.has(dupKey) ? "bg-chip/10" : ""}`}>
                    <td className="py-2 pr-2">
                      <input
                        aria-label="Name"
                        value={row.name}
                        onChange={(e) => update(row.key, { name: e.target.value, match: "auto" })}
                        className={input}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        aria-label={`Save ${row.name} as`}
                        value={row.match === "auto" ? (resolved ?? "new") : row.match}
                        onChange={(e) => update(row.key, { match: e.target.value === "new" ? "new" : Number(e.target.value) })}
                        className={`${input} ${resolved === null ? "border-brass-dark font-bold" : ""}`}
                      >
                        <option value="new">New player: {row.name.trim() || "…"}</option>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        aria-label="Money in"
                        inputMode="decimal"
                        value={row.moneyIn}
                        onChange={(e) => update(row.key, { moneyIn: e.target.value })}
                        className={`${input} ${inC === null || inC < 0 ? "border-chip-dark bg-chip/10" : ""}`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        aria-label="Money out"
                        inputMode="decimal"
                        value={row.moneyOut}
                        onChange={(e) => update(row.key, { moneyOut: e.target.value })}
                        className={`${input} ${outC === null || outC < 0 ? "border-chip-dark bg-chip/10" : ""}`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        aria-label="Buy-ins"
                        inputMode="numeric"
                        value={row.buyIns}
                        placeholder={inC !== null ? String(inferBuyIns(inC)) : ""}
                        onChange={(e) => update(row.key, { buyIns: e.target.value })}
                        className={input}
                      />
                    </td>
                    <td className="tabular py-2 pr-2 text-right font-bold">
                      {net === null ? "–" : (
                        <span className={net > 0 ? "text-win-dark" : net < 0 ? "text-chip-dark" : "text-ink-muted"}>
                          {formatSigned(net)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        aria-label={`Remove ${row.name}`}
                        onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                        className="h-10 w-10 rounded-full text-xl text-ink-muted hover:bg-ivory-line"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink/20 font-bold">
                <td className="py-3" colSpan={2}>
                  Total
                </td>
                <td className="tabular py-3">{formatEuro(preview.totalIn)}</td>
                <td className="tabular py-3">{formatEuro(preview.totalOut)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            setRows((rs) => [...rs, { key: nextKey++, name: "", moneyIn: "", moneyOut: "", buyIns: "", match: "auto" }])
          }
          className="min-h-11 rounded-full border-2 border-felt px-5 font-bold text-felt hover:bg-felt hover:text-ivory"
        >
          Add player
        </button>
      </div>

      {rows.length > 0 && preview.valid && preview.imbalance !== 0 && (
        <p className="rounded-xl bg-brass/25 px-4 py-3 text-sm">
          Money in and out differ by <b>{formatEuro(Math.abs(preview.imbalance))}</b> (
          {preview.imbalance > 0 ? "more went in than came out" : "more came out than went in"}). It will be split
          evenly over the {preview.parsed.length} players, which is already included in the Net column.
        </p>
      )}

      {preview.blank > 0 && (
        <p className="rounded-xl bg-ivory-line/60 px-4 py-3 text-sm text-ink-muted">
          {preview.blank} {preview.blank === 1 ? "player" : "players"} without amounts{" "}
          {preview.blank === 1 ? "is" : "are"} left out (didn&rsquo;t play). Fill in 0 for someone who played and broke even.
        </p>
      )}

      {error && <p className="rounded-xl bg-chip/15 px-4 py-3 text-sm font-semibold text-chip-dark">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending || rows.length === 0}
          onClick={onSave}
          className="min-h-12 rounded-full bg-felt px-7 font-bold text-ivory hover:bg-felt-light disabled:opacity-50"
        >
          {pending ? "Saving…" : results ? "Save results" : initial ? "Save changes" : "Save session"}
        </button>
      </div>
    </div>
  );
}
