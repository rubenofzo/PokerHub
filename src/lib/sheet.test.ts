import { describe, expect, it } from "vitest";
import { parseAmountToCents } from "./money";
import { dateFromFilename, parseCsv, parseSheetRows, templateCsv, templateFilename } from "./sheet";

describe("parseAmountToCents", () => {
  it.each([
    [12, 1200],
    [16.65, 1665],
    ["22,05", 2205],
    ["€ 1.234,56", 123456],
    ["1,234.56", 123456],
    ["-5", -500],
    ["abc", null],
    ["", null],
  ])("%s → %s", (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected);
  });
});

describe("parseSheetRows", () => {
  it("reads a sheet with a header row and skips totals", () => {
    const result = parseSheetRows([
      ["Poker night"],
      ["Name", "Money in", "Money out"],
      ["Sander", 16.65, 4.35],
      ["  Ruben ", "5", "7"],
      [],
      ["Total", 21.65, 11.35],
    ]);
    expect(result.errors).toEqual([]);
    expect(result.hasBuyInsColumn).toBe(false);
    expect(result.rows).toEqual([
      { name: "Sander", moneyInCents: 1665, moneyOutCents: 435, buyIns: null },
      { name: "Ruben", moneyInCents: 500, moneyOutCents: 700, buyIns: null },
    ]);
  });

  it("reads an optional Buy-ins column", () => {
    const result = parseSheetRows([
      ["name", "in", "out", "Buy-ins"],
      ["Tibbe", 30, 4.2, 6],
    ]);
    expect(result.rows[0].buyIns).toBe(6);
    expect(result.hasBuyInsColumn).toBe(true);
  });

  it("reports bad rows", () => {
    const result = parseSheetRows([
      ["Name", "Money in", "Money out"],
      ["Koen", "ten", 2],
    ]);
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0]).toContain("Koen");
  });

  it("needs a header", () => {
    expect(parseSheetRows([["a", 1, 2]]).errors[0]).toContain("header");
  });
});

describe("parseCsv", () => {
  it("handles Dutch semicolon CSV with decimal commas", () => {
    expect(parseCsv("Name;Money in;Money out\r\nTijs;10;22,05\r\n")).toEqual([
      ["Name", "Money in", "Money out"],
      ["Tijs", "10", "22,05"],
    ]);
  });

  it("handles quoted fields", () => {
    expect(parseCsv('Name,Money in,Money out\n"de Boer, R",5,"7,00"')).toEqual([
      ["Name", "Money in", "Money out"],
      ["de Boer, R", "5", "7,00"],
    ]);
  });
});

describe("dateFromFilename", () => {
  it("finds ISO and Dutch dates", () => {
    expect(dateFromFilename("2026-10-16 poker.xlsx")).toBe("2026-10-16");
    expect(dateFromFilename("poker_16-10-2026.csv")).toBe("2026-10-16");
    expect(dateFromFilename("poker.xlsx")).toBeNull();
    expect(dateFromFilename("2026-02-31.xlsx")).toBeNull();
  });
});

describe("templateCsv", () => {
  it("round-trips through parseCsv and parseSheetRows without errors", () => {
    const names = ["Tijs", "de Boer, R", 'Sam "the shark"', "Zoë"];
    const csv = templateCsv(names);
    expect(csv.split("\r\n")[0]).toBe("Name,Money in,Money out,Buy-ins");
    const result = parseSheetRows(parseCsv(csv));
    expect(result.errors).toEqual([]);
    expect(result.hasBuyInsColumn).toBe(true);
    expect(result.rows).toEqual(
      names.map((name) => ({ name, moneyInCents: 0, moneyOutCents: 0, buyIns: null })),
    );
  });

  it("names the file after the date, or the session while the date is TBD", () => {
    expect(templateFilename(7, "2026-10-24")).toBe("pokerhub-2026-10-24.csv");
    expect(dateFromFilename(templateFilename(7, "2026-10-24"))).toBe("2026-10-24");
    expect(templateFilename(7, null)).toBe("pokerhub-session-7.csv");
  });
});
