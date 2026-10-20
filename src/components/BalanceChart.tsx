"use client";

import { useMemo, useState } from "react";
import { formatEuro } from "@/lib/money";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type ChartSeries = { key: string; name: string; color: string };
export type ChartPoint = { label: string } & Record<string, number | string>;

const euro = (v: number) => formatEuro(Math.round(v * 100));

export function BalanceChart({
  points,
  series,
  showLegend = true,
  height = 320,
}: {
  points: ChartPoint[];
  series: ChartSeries[];
  showLegend?: boolean;
  height?: number;
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<string | null>(null);
  const visible = useMemo(() => series.filter((s) => !hidden.has(s.key)), [series, hidden]);

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="flex flex-col gap-2.5 md:gap-4">
      {/* Shorter on phones; `height` is the desktop height. */}
      <div style={{ "--chart-h": `${height}px` } as React.CSSProperties} className="h-[220px] w-full md:h-(--chart-h)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#2e6a55" vertical={false} />
            <XAxis dataKey="label" stroke="#a9c1b4" tick={{ fill: "#a9c1b4", fontSize: 13 }} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#a9c1b4"
              tick={{ fill: "#a9c1b4", fontSize: 13 }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v: number) => (v < 0 ? `−€${-v}` : `€${v}`)}
            />
            <ReferenceLine y={0} stroke="#5e8b78" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={{ background: "#f4eedc", border: "none", borderRadius: 12, color: "#1b1b18" }}
              labelStyle={{ fontWeight: 700, color: "#1b1b18" }}
              itemStyle={{ color: "#1b1b18", padding: 0 }}
              itemSorter={(item) => -Number(item.value)}
              formatter={(value, name) => [euro(Number(value)), name]}
            />
            {visible.map((s) => (
              <Line
                key={s.key}
                type="linear"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={focus === s.key ? 4 : 2.5}
                strokeOpacity={focus && focus !== s.key ? 0.25 : 1}
                dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {showLegend && (
        <div>
          {/* Phones: one swipeable row of names, bleeding to the panel edges. */}
          <div
            className="no-scrollbar -mx-3.5 -my-1.5 flex flex-nowrap gap-1.5 overflow-x-auto px-3.5 py-1.5 md:mx-0 md:my-0 md:flex-wrap md:gap-2 md:overflow-visible md:p-0"
            aria-label="Show or hide players"
          >
            {series.map((s) => {
              const on = !hidden.has(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.key)}
                  onMouseEnter={() => setFocus(s.key)}
                  onMouseLeave={() => setFocus(null)}
                  onFocus={() => setFocus(s.key)}
                  onBlur={() => setFocus(null)}
                  // 32px chip on phones with a 44px hit area (the ::before reaches into the row's padding).
                  className="relative inline-flex min-h-8 flex-none items-center gap-2 rounded-full border px-3 text-[12.5px] font-semibold transition-colors before:absolute before:inset-x-0 before:-inset-y-1.5 md:min-h-9 md:px-3.5 md:text-sm md:before:hidden"
                  style={{
                    borderColor: s.color,
                    background: on ? s.color : "transparent",
                    color: on ? "#0e3b2c" : "#a9c1b4",
                  }}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-mist md:hidden">Swipe the names, tap to show or hide a line</p>
        </div>
      )}
    </div>
  );
}
