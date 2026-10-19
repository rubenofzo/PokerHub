export function formatDate(iso: string, opts: { year?: boolean } = {}): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: opts.year === false ? undefined : "numeric",
    timeZone: "UTC",
  });
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/** Ten line colours that stay apart on the felt background, assigned in name order. */
const PALETTE = [
  "#e2c27e", // brass
  "#f4eedc", // ivory
  "#e0675c", // chip red
  "#7fb8e6", // sky
  "#8fe0b5", // mint
  "#b9a3e3", // lavender
  "#f0a35e", // orange
  "#e89bc0", // pink
  "#5cc8c0", // teal
  "#c8d46a", // olive
];

export function playerColors(playerIds: number[]): Map<number, string> {
  return new Map(playerIds.map((id, i) => [id, PALETTE[i % PALETTE.length]]));
}
