import type { PlayerRecord, RawSession } from "./stats";

/** The group's first two real sessions, used by the tests. */
const names = ["Arjan", "Chion", "Hidde", "Koen", "Ruben", "Sam", "Sander", "Tibbe", "Tijs"];
export const fixturePlayers: PlayerRecord[] = names.map((name, i) => ({
  id: i + 1,
  name,
  slug: name.toLowerCase(),
}));
const id = (name: string) => names.indexOf(name) + 1;
const row = (name: string, inEuro: number, outEuro: number) => ({
  playerId: id(name),
  moneyInCents: Math.round(inEuro * 100),
  moneyOutCents: Math.round(outEuro * 100),
  buyIns: null,
});

export const fixtureSessions: RawSession[] = [
  {
    id: 2,
    date: "2026-10-16",
    note: null,
    results: [
      row("Sander", 16.65, 4.35),
      row("Ruben", 5, 7),
      row("Tibbe", 5, 5.7),
      row("Tijs", 15, 0),
      row("Hidde", 15, 4),
      row("Sam", 5, 28.25),
      row("Chion", 5, 24.35),
      row("Koen", 10, 2.65),
    ],
  },
  {
    id: 1,
    date: "2026-10-02",
    note: null,
    results: [
      row("Tijs", 10, 22.05),
      row("Sander", 5, 7.85),
      row("Tibbe", 30, 4.2),
      row("Hidde", 0, 10.9),
      row("Arjan", 5, 5),
    ],
  },
];
