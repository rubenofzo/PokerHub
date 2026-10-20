import { parseAmountToCents } from "./money";
import { cleanName } from "./names";

export type SheetRow = {
  name: string;
  moneyInCents: number;
  moneyOutCents: number;
  buyIns: number | null;
};

export type SheetParseResult = {
  rows: SheetRow[];
  errors: string[];
  hasBuyInsColumn: boolean;
};

type Column = "name" | "in" | "out" | "buyIns";

const HEADER_ALIASES: Record<Column, string[]> = {
  name: ["name", "naam", "player", "speler"],
  in: ["moneyin", "in", "buyin", "inleg", "ingelegd"],
  out: ["moneyout", "out", "cashout", "uit", "eruit"],
  buyIns: ["buyins", "buyinscount", "rebuys", "aantalbuyins"],
};

function headerKey(cell: unknown): Column | null {
  if (typeof cell !== "string") return null;
  const key = cell.toLowerCase().replace(/[^a-z]/g, "");
  for (const col of Object.keys(HEADER_ALIASES) as Column[]) {
    if (HEADER_ALIASES[col].includes(key)) return col;
  }
  return null;
}

/**
 * Turns raw sheet cells (from an .xlsx or .csv) into session rows.
 * Expects a header row with Name, Money in, Money out and optionally Buy-ins;
 * rows above the header and empty rows are skipped.
 */
export function parseSheetRows(cells: unknown[][]): SheetParseResult {
  const errors: string[] = [];
  const headerIndex = cells.findIndex((row) => row.some((c) => headerKey(c) === "name"));
  if (headerIndex === -1) {
    return {
      rows: [],
      errors: ["No header row found. The sheet needs columns Name, Money in and Money out."],
      hasBuyInsColumn: false,
    };
  }

  const columns: Partial<Record<Column, number>> = {};
  cells[headerIndex].forEach((cell, i) => {
    const key = headerKey(cell);
    if (key && columns[key] === undefined) columns[key] = i;
  });
  if (columns.in === undefined || columns.out === undefined) {
    return {
      rows: [],
      errors: ["Missing a Money in or Money out column."],
      hasBuyInsColumn: false,
    };
  }

  const rows: SheetRow[] = [];
  cells.slice(headerIndex + 1).forEach((row, offset) => {
    const line = headerIndex + offset + 2;
    const rawName = row[columns.name!];
    const name = rawName == null ? "" : cleanName(String(rawName));
    const empty = row.every((c) => c == null || String(c).trim() === "");
    if (empty) return;
    if (!name) {
      errors.push(`Row ${line}: missing a name.`);
      return;
    }
    // Skip summary lines such as "Total".
    if (/^(total|totaal|sum|som)$/i.test(name)) return;

    const moneyIn = parseAmount(row[columns.in!]);
    const moneyOut = parseAmount(row[columns.out!]);
    if (moneyIn === null || moneyOut === null || moneyIn < 0 || moneyOut < 0) {
      errors.push(`Row ${line} (${name}): money in and out must be amounts of 0 or more.`);
      return;
    }

    let buyIns: number | null = null;
    if (columns.buyIns !== undefined) {
      const raw = row[columns.buyIns];
      if (raw != null && String(raw).trim() !== "") {
        const n = Number(String(raw).trim());
        if (!Number.isInteger(n) || n < 0) {
          errors.push(`Row ${line} (${name}): Buy-ins must be a whole number.`);
          return;
        }
        buyIns = n;
      }
    }
    rows.push({ name, moneyInCents: moneyIn, moneyOutCents: moneyOut, buyIns });
  });

  if (rows.length === 0 && errors.length === 0) errors.push("The sheet has no player rows.");
  return { rows, errors, hasBuyInsColumn: columns.buyIns !== undefined };
}

/** An empty cell counts as 0, so a template with blank amounts reads back cleanly. */
function parseAmount(cell: unknown): number | null {
  if (cell == null || (typeof cell === "string" && cell.trim() === "")) return 0;
  return parseAmountToCents(cell);
}

/** Header of the CSV template, in the order parseSheetRows reads best. */
export const TEMPLATE_HEADER = ["Name", "Money in", "Money out", "Buy-ins"];

function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** A CSV with one row per name and the amounts left empty, to fill in at the table. */
export function templateCsv(names: string[]): string {
  const lines = [TEMPLATE_HEADER.join(","), ...names.map((n) => `${csvField(n)},,,`)];
  return `${lines.join("\r\n")}\r\n`;
}

/** pokerhub-2026-10-24.csv, or pokerhub-session-12.csv while the date is TBD. */
export function templateFilename(sessionId: number, date: string | null): string {
  return date ? `pokerhub-${date}.csv` : `pokerhub-session-${sessionId}.csv`;
}

/** Minimal CSV reader: detects ; , or tab as separator and handles quoted fields. */
export function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const counts = [";", "\t", ","].map((d) => [d, firstLine.split(d).length] as const);
  const delimiter = counts.sort((a, b) => b[1] - a[1])[0][0];

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Pulls a YYYY-MM-DD (or DD-MM-YYYY) date out of a filename such as "2026-10-16 poker.xlsx". */
export function dateFromFilename(filename: string): string | null {
  const iso = filename.match(/(20\d{2})[-_.](\d{2})[-_.](\d{2})/);
  if (iso) return validDate(`${iso[1]}-${iso[2]}-${iso[3]}`);
  const eu = filename.match(/(\d{2})[-_.](\d{2})[-_.](20\d{2})/);
  if (eu) return validDate(`${eu[3]}-${eu[2]}-${eu[1]}`);
  return null;
}

function validDate(iso: string): string | null {
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(iso) ? iso : null;
}
