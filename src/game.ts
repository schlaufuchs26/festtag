import type { Country, GuessResult, Holiday } from "./types";

export const ROUNDS = 8;
export const MAX_GUESSES = 3;
export const MAX_HINTS = 2;
const SHOWN_HOLIDAYS = 10;
export const HINT_COST = 15;

/** Deterministic PRNG, so a run can be replayed from its seed (and tested). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Samples `count` distinct countries, in random order. */
export function pickRounds(
  countries: Country[],
  count: number,
  rng: () => number,
): Country[] {
  const pool = [...countries];
  const picked: Country[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(rng() * pool.length);
    const [country] = pool.splice(index, 1);
    if (country) picked.push(country);
  }
  return picked;
}

/**
 * How many countries in the pool celebrate each holiday (by English name).
 * The rarest holiday is the most informative clue, so it drives the reveal.
 */
export function rarityIndex(countries: Country[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const country of countries) {
    for (const holiday of country.holidays) {
      counts.set(holiday.en, (counts.get(holiday.en) ?? 0) + 1);
    }
  }
  return counts;
}

export function rarityOf(
  holiday: Holiday,
  rarity: Map<string, number>,
): number {
  return rarity.get(holiday.en) ?? 1;
}

/**
 * Filler entries ("New Year's Day (Ponte)", "Day after Ascension Day") are rare
 * for bookkeeping reasons, not because they say anything about the country, so
 * they are only used when nothing else is left.
 */
const FILLER = /\(Ponte\)|^Day after /i;

export function rarestHoliday(
  country: Country,
  rarity: Map<string, number>,
): Holiday {
  const telling = country.holidays.filter((h) => !FILLER.test(h.en));
  const pool = telling.length > 0 ? telling : country.holidays;
  return [...pool].sort(
    (a, b) => rarityOf(a, rarity) - rarityOf(b, rarity),
  )[0] as Holiday;
}

/**
 * The holidays shown during a round. A long list would just be a calendar, so
 * the common ones (New Year, Christmas) are the ones that get cut: the rare
 * names carry the information.
 */
export function visibleHolidays(
  country: Country,
  rarity: Map<string, number>,
  max = SHOWN_HOLIDAYS,
): { shown: Holiday[]; hidden: number } {
  if (country.holidays.length <= max) {
    return { shown: [...country.holidays], hidden: 0 };
  }
  const shown = [...country.holidays]
    .sort((a, b) => rarityOf(a, rarity) - rarityOf(b, rarity))
    .slice(0, max)
    .sort((a, b) => a.date.localeCompare(b.date));
  return { shown, hidden: country.holidays.length - max };
}

/** 100 for the first guess, then 60 and 30; every hint costs 15. */
export function pointsFor(guessNumber: number, hints: number): number {
  const base = [100, 60, 30][guessNumber - 1] ?? 0;
  return Math.max(0, base - hints * HINT_COST);
}

export function flagEmoji(code: string): string {
  return [...code.toUpperCase()]
    .map((letter) => String.fromCodePoint(127_397 + letter.charCodeAt(0)))
    .join("");
}

export function formatPopulation(population: number): string {
  if (population >= 1_000_000_000) {
    return `${(population / 1_000_000_000).toFixed(1)} billion`;
  }
  if (population >= 1_000_000) {
    return `${(population / 1_000_000).toFixed(1)} million`;
  }
  if (population >= 10_000) {
    return `${Math.round(population / 1000)} thousand`;
  }
  return population.toLocaleString("en-US");
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-04-27" -> "27 Apr"; dates are parsed as UTC, never in local time. */
export function formatDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1] ?? ""}`.trim();
}

export function monthIndex(iso: string): number {
  return Number(iso.split("-")[1]) - 1;
}

export function filterCountries(
  query: string,
  countries: Country[],
  limit = 6,
): Country[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [];
  const starts = countries.filter((c) =>
    c.name.toLowerCase().startsWith(needle),
  );
  const rest = countries.filter(
    (c) =>
      !c.name.toLowerCase().startsWith(needle) &&
      c.name.toLowerCase().includes(needle),
  );
  return [...starts, ...rest].slice(0, limit);
}

export function resolveGuess(
  input: string,
  countries: Country[],
  answer: Country,
): GuessResult {
  const needle = input.trim().toLowerCase();
  const match = countries.find((c) => c.name.toLowerCase() === needle);
  if (!match) return { kind: "unknown" };
  if (match.code === answer.code) return { kind: "correct", country: match };
  return {
    kind: "wrong",
    country: match,
    sameRegion: match.region === answer.region,
  };
}

/** The other countries that also make this holiday a public one. */
export function sharedWith(
  holiday: Holiday,
  answer: Country,
  countries: Country[],
  limit = 3,
): Country[] {
  return countries
    .filter(
      (c) =>
        c.code !== answer.code && c.holidays.some((h) => h.en === holiday.en),
    )
    .slice(0, limit);
}

export function medianHolidayCount(countries: Country[]): number {
  const counts = countries.map((c) => c.holidays.length).sort((a, b) => a - b);
  const middle = Math.floor(counts.length / 2);
  if (counts.length === 0) return 0;
  if (counts.length % 2 === 1) return counts[middle] ?? 0;
  return Math.round(((counts[middle - 1] ?? 0) + (counts[middle] ?? 0)) / 2);
}
