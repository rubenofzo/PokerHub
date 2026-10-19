import clsx from "clsx";
import { formatSigned } from "@/lib/money";

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={clsx("font-display text-[26px] leading-tight sm:text-3xl", className)}>{children}</h2>;
}

/** Dark translucent panel sitting on the felt. */
export function FeltPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-[20px] border border-line bg-felt-panel p-5 sm:p-7", className)}>
      {children}
    </section>
  );
}

/** Ivory "playing card" panel. */
export function CardPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={clsx(
        "rounded-[20px] bg-ivory p-5 text-ink shadow-[0_12px_30px_rgba(0,0,0,0.35)] sm:p-7",
        className,
      )}
    >
      {children}
    </section>
  );
}

const SUIT_COLORS: Record<string, string> = { "♠": "text-ink", "♣": "text-ink", "♦": "text-chip-dark", "♥": "text-chip-dark" };

export function KpiCard({
  label,
  value,
  sub,
  suit,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  suit: "♠" | "♣" | "♦" | "♥";
}) {
  return (
    <div className="relative flex min-h-[132px] flex-col gap-2.5 rounded-[14px] bg-ivory px-6 pt-5 pb-6 text-ink shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
      <span aria-hidden className={clsx("absolute top-3 right-4 font-display text-[26px]", SUIT_COLORS[suit])}>
        {suit}
      </span>
      <span className="text-[13px] font-bold tracking-[0.14em] text-ink-muted uppercase">{label}</span>
      <span className="font-display text-[34px] leading-none sm:text-[40px]">{value}</span>
      {sub && <span className="text-sm text-ink-muted">{sub}</span>}
    </div>
  );
}

/** A signed amount coloured for its background ("felt" or "card"). */
export function Money({ cents, on = "card", className }: { cents: number; on?: "card" | "felt"; className?: string }) {
  const tone =
    cents > 0
      ? on === "card"
        ? "text-win-dark"
        : "text-win"
      : cents < 0
        ? on === "card"
          ? "text-chip-dark"
          : "text-chip"
        : on === "card"
          ? "text-ink-muted"
          : "text-mist";
  return <span className={clsx("tabular font-bold whitespace-nowrap", tone, className)}>{formatSigned(cents)}</span>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <FeltPanel className="text-center text-mist">
      <p className="text-base">{children}</p>
    </FeltPanel>
  );
}
