"use client";

import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";
import { formatPercent } from "@/lib/format";
import { formatEuro, formatSigned } from "@/lib/money";

export type StatsRow = {
  slug: string;
  name: string;
  rank: number;
  net: number;
  sessions: number;
  average: number;
  winRate: number;
  roi: number | null;
  best: number;
  worst: number;
  bestStreak: number;
  worstStreak: number;
  rebuys: number;
  swing: number;
  attendance: number;
};

type Key = Exclude<keyof StatsRow, "slug">;

const COLUMNS: { key: Key; label: string; title: string; render: (r: StatsRow) => React.ReactNode }[] = [
  { key: "net", label: "Net", title: "All-time profit", render: (r) => <Signed cents={r.net} /> },
  { key: "sessions", label: "Sessions", title: "Sessions played", render: (r) => r.sessions },
  { key: "average", label: "Avg", title: "Average result per session", render: (r) => <Signed cents={r.average} /> },
  { key: "winRate", label: "Win %", title: "Share of sessions finished in profit", render: (r) => formatPercent(r.winRate) },
  { key: "roi", label: "ROI", title: "Total cashed out ÷ total bought in", render: (r) => (r.roi === null ? "–" : `${r.roi.toFixed(2)}×`) },
  { key: "best", label: "Best", title: "Biggest single-session win", render: (r) => (r.best ? <Signed cents={r.best} /> : "–") },
  { key: "worst", label: "Worst", title: "Biggest single-session loss", render: (r) => (r.worst ? <Signed cents={r.worst} /> : "–") },
  { key: "bestStreak", label: "Win run", title: "Longest run of winning sessions", render: (r) => r.bestStreak },
  { key: "worstStreak", label: "Loss run", title: "Longest run of losing sessions", render: (r) => r.worstStreak },
  { key: "rebuys", label: "Rebuys", title: "Buy-ins beyond the first, all sessions", render: (r) => r.rebuys },
  { key: "swing", label: "Swing", title: "How much results vary (standard deviation)", render: (r) => formatEuro(r.swing) },
  { key: "attendance", label: "Attend.", title: "Share of all sessions attended", render: (r) => formatPercent(r.attendance) },
];

/** The player column stays put while the rest scrolls, on phones only. */
const STICKY = "max-md:sticky max-md:left-0 max-md:z-[1] max-md:bg-ivory max-md:shadow-[6px_0_8px_-6px_rgba(0,0,0,0.25)]";

function Signed({ cents }: { cents: number }) {
  const tone = cents > 0 ? "text-win-dark" : cents < 0 ? "text-chip-dark" : "text-ink-muted";
  return <span className={`font-bold whitespace-nowrap ${tone}`}>{formatSigned(cents)}</span>;
}

export function StatsTable({ rows }: { rows: StatsRow[] }) {
  const [sort, setSort] = useState<{ key: Key | "name"; desc: boolean }>({ key: "net", desc: true });

  const sorted = [...rows].sort((a, b) => {
    const av = sort.key === "name" ? a.name : a[sort.key];
    const bv = sort.key === "name" ? b.name : b[sort.key];
    const cmp =
      typeof av === "string" && typeof bv === "string"
        ? av.localeCompare(bv)
        : (av === null ? -1e15 : Number(av)) - (bv === null ? -1e15 : Number(bv));
    return sort.desc ? -cmp : cmp;
  });

  const header = (key: Key | "name", label: string, title: string, align: "left" | "right") => {
    const active = sort.key === key;
    return (
      <th
        key={key}
        scope="col"
        aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
        className={clsx(
          "border-b border-ivory-line md:border-0",
          align === "right" ? "text-right" : `text-left ${STICKY}`,
        )}
      >
        <button
          type="button"
          title={title}
          onClick={() => setSort({ key, desc: active ? !sort.desc : key !== "name" })}
          className={clsx(
            "min-h-11 px-2.5 text-[10px] font-bold tracking-[0.14em] whitespace-nowrap uppercase md:px-2 md:text-xs md:tracking-[0.12em]",
            align === "left" && "pl-3.5 md:pl-2",
            active ? "text-brass-dark" : "text-ink-muted",
          )}
        >
          {label}
          {active ? (sort.desc ? " ▾" : " ▴") : ""}
        </button>
      </th>
    );
  };

  return (
    // Phones: the table bleeds to the card edges and scrolls sideways under a sticky name column.
    <div className="no-scrollbar -mx-3.5 overflow-x-auto md:mx-0">
      <table className="w-full border-separate border-spacing-0 text-[13px] md:min-w-[960px] md:border-collapse md:text-[15px]">
        <thead>
          <tr>
            {header("name", "Player", "Name", "left")}
            {COLUMNS.map((c) => header(c.key, c.label, c.title, "right"))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.slug} className="md:border-t md:border-ivory-line">
              <th
                scope="row"
                className={`h-10 border-b border-ivory-line py-0 pr-2.5 pl-3.5 text-left whitespace-nowrap md:h-auto md:border-0 md:px-2 md:py-2.5 ${STICKY}`}
              >
                <Link href={`/players/${r.slug}`} className="font-semibold text-ink hover:text-brass-dark md:font-bold">
                  {r.name}
                </Link>
              </th>
              {COLUMNS.map((c) => (
                <td
                  key={c.key}
                  className="tabular border-b border-ivory-line px-2.5 text-right whitespace-nowrap text-ink-muted md:border-0 md:px-2 md:py-2.5"
                >
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
