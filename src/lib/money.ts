/** All money is handled as integer euro cents to avoid floating point drift. */

const euro = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

/** €12.05, or €-3.40 written with a real minus sign. */
export function formatEuro(cents: number): string {
  const s = euro.format(Math.abs(cents) / 100);
  return cents < 0 ? `−${s}` : s;
}

/** +€12.05 / −€3.40 / €0.00, for results where the sign matters. */
export function formatSigned(cents: number): string {
  if (cents > 0) return `+${formatEuro(cents)}`;
  return formatEuro(cents);
}

/** Plain number for charts, in euros. */
export function centsToEuros(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Parses an amount typed or exported from a sheet: 12, "12.5", "12,50", "€ 1.234,56", "-5".
 * Returns cents, or null when it isn't a number.
 */
export function parseAmountToCents(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value * 100) : null;
  }
  if (typeof value !== "string") return null;
  let s = value.trim().replace(/[€\s]/g, "").replace(/[−–]/g, "-");
  if (s === "") return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) {
    // Comma is the decimal separator (Dutch style): drop thousand dots.
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}
