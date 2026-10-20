import clsx from "clsx";
import type { RarityTier } from "@/achievements/engine";
import { formatSigned } from "@/lib/money";

/*
 * Shared building blocks. Classes are mobile-first: the bare classes are the phone layout,
 * `md:` restores the desktop look (768px and up).
 */

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={clsx("font-display text-[22px] leading-tight md:text-3xl", className)}>{children}</h2>;
}

/** Page heading (Achievements, Players, a player or session). */
export function PageTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h1 className={clsx("font-display text-[32px] leading-[1.05] md:text-5xl md:leading-none", className)}>{children}</h1>;
}

/** Dark translucent panel sitting on the felt. */
export function FeltPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-line bg-felt-panel px-3.5 py-4 md:rounded-[20px] md:p-7",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Ivory "playing card" panel. `list` drops the vertical padding on phones, for edge-to-edge rows. */
export function CardPanel({
  children,
  className,
  list = false,
}: {
  children: React.ReactNode;
  className?: string;
  list?: boolean;
}) {
  return (
    <section
      className={clsx(
        "rounded-2xl bg-ivory px-3.5 text-ink shadow-[0_12px_30px_rgba(0,0,0,0.35)] md:rounded-[20px] md:p-7",
        !list && "py-4",
        className,
      )}
    >
      {children}
    </section>
  );
}

const SUIT_COLORS: Record<string, string> = { "♠": "text-ink", "♣": "text-ink", "♦": "text-chip-dark", "♥": "text-chip-dark" };

/**
 * A key number on an ivory card. Compact on phones (for a 2×2 grid). With `grouped`, phones
 * draw it as one cell of a shared ivory card (the parent supplies the card); desktop is the same.
 */
export function KpiCard({
  label,
  value,
  sub,
  suit,
  grouped = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  suit: "♠" | "♣" | "♦" | "♥";
  grouped?: boolean;
}) {
  return (
    <div
      className={clsx(
        "relative flex min-w-0 flex-col gap-1 px-3.5 py-3 text-ink md:min-h-[132px] md:gap-2.5 md:px-6 md:pt-5 md:pb-6",
        grouped
          ? "border-ivory-line max-md:odd:border-r max-md:[&:nth-child(-n+2)]:border-b md:rounded-[14px] md:bg-ivory md:shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
          : "rounded-[14px] bg-ivory shadow-[0_10px_24px_rgba(0,0,0,0.35)]",
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "absolute top-2.5 right-3.5 font-display text-[13px] md:top-3 md:right-4 md:text-[26px]",
          SUIT_COLORS[suit],
        )}
      >
        {suit}
      </span>
      <span className="pr-4 text-[10px] font-bold tracking-[0.14em] text-ink-muted uppercase md:pr-0 md:text-[13px]">
        {label}
      </span>
      <span className="font-display text-[26px] leading-[1.1] break-words md:text-[40px] md:leading-none">{value}</span>
      {sub && <span className="text-[11.5px] text-ink-muted md:text-sm">{sub}</span>}
    </div>
  );
}

/** A signed amount coloured for its background ("felt" or "card"). */
export function Money({
  cents,
  on = "card",
  display = false,
  className,
}: {
  cents: number;
  on?: "card" | "felt";
  /** Set in the display serif instead of bold sans, for hero numbers. */
  display?: boolean;
  className?: string;
}) {
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
  return (
    <span className={clsx("tabular whitespace-nowrap", display ? "font-display" : "font-bold", tone, className)}>
      {formatSigned(cents)}
    </span>
  );
}

/**
 * Small circle in the player's chart colour, so a player is recognisable across pages. The ring
 * keeps light colours (one is ivory) visible on the ivory cards.
 */
export function PlayerDot({
  color,
  size = 10,
  on = "card",
  className,
}: {
  color?: string;
  size?: number;
  on?: "card" | "felt";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={clsx(
        "inline-block flex-none rounded-full ring-1",
        on === "card" ? "ring-ink/40" : "ring-ivory/30",
        className,
      )}
      style={{ backgroundColor: color ?? "#e2c27e", width: size, height: size }}
    />
  );
}

/** Rarity label colour on phones (desktop keeps them all muted). Uncommon is mint, never blue. */
export const TIER_TEXT: Record<RarityTier, string> = {
  common: "text-ink-muted",
  uncommon: "text-win-dark",
  rare: "text-brass-dark",
  ultra: "text-brass-dark",
};

/** Progress towards a locked achievement: a thin bar plus "3 / 10". */
export function ProgressBar({ value, className }: { value: [number, number]; className?: string }) {
  const [current, target] = value;
  return (
    <span className={clsx("flex items-center gap-2 text-xs font-semibold text-ink-muted", className)}>
      <span className="h-1.5 w-28 overflow-hidden rounded-full bg-ivory-line">
        <span className="block h-full bg-brass-dark" style={{ width: `${Math.min(1, current / target) * 100}%` }} />
      </span>
      {current} / {target}
    </span>
  );
}

/** Round close button for the ivory dialogs (filled on phones, quiet until hovered on desktop). */
export function DialogClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClick}
      className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ivory-line/60 text-ink hover:bg-ivory-line md:bg-transparent md:text-ink-muted md:hover:bg-ivory-line"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
      </svg>
    </button>
  );
}

/** Chevron used at the end of tappable list rows on phones. */
export function Chevron({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
      className={clsx("flex-none", className)}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <FeltPanel className="text-center text-mist">
      <p className="text-base">{children}</p>
    </FeltPanel>
  );
}
