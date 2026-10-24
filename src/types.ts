export type Holiday = {
  /** ISO date of the first day, e.g. "2026-04-27". */
  date: string;
  /** The name in the country's own language: the puzzle. */
  local: string;
  /** English name, hidden until the reveal. */
  en: string;
  /** Days the holiday covers; multi-day feasts arrive as one entry. */
  days: number;
};

export type Country = {
  code: string;
  name: string;
  region: string;
  population: number;
  holidays: Holiday[];
};

export type Dataset = { year: number; countries: Country[] };

export type GuessResult =
  | { kind: "unknown" }
  | { kind: "wrong"; country: Country; sameRegion: boolean }
  | { kind: "correct"; country: Country };
