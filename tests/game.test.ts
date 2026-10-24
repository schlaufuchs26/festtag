import { describe, expect, test } from "bun:test";
import dataset from "../src/data/holidays.json";
import {
  filterCountries,
  flagEmoji,
  formatDate,
  formatPopulation,
  HINT_COST,
  MAX_HINTS,
  medianHolidayCount,
  mulberry32,
  pickRounds,
  pointsFor,
  ROUNDS,
  rarestHoliday,
  rarityIndex,
  rarityOf,
  resolveGuess,
  sharedWith,
  visibleHolidays,
} from "../src/game";
import type { Country, Dataset } from "../src/types";

const data = dataset as unknown as Dataset;
const byCode = (code: string): Country =>
  data.countries.find((c) => c.code === code) as Country;

describe("mulberry32", () => {
  test("is deterministic per seed and lands in [0, 1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 5; i++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe("pickRounds", () => {
  test("returns the requested number of distinct countries", () => {
    const rounds = pickRounds(data.countries, ROUNDS, mulberry32(7));
    expect(rounds).toHaveLength(ROUNDS);
    expect(new Set(rounds.map((c) => c.code)).size).toBe(ROUNDS);
  });

  test("same seed, same run; different seed, different run", () => {
    const first = pickRounds(data.countries, ROUNDS, mulberry32(99));
    const again = pickRounds(data.countries, ROUNDS, mulberry32(99));
    const other = pickRounds(data.countries, ROUNDS, mulberry32(100));
    expect(first.map((c) => c.code)).toEqual(again.map((c) => c.code));
    expect(first.map((c) => c.code)).not.toEqual(other.map((c) => c.code));
  });

  test("never picks more than the pool holds", () => {
    const small = data.countries.slice(0, 3);
    expect(pickRounds(small, 8, mulberry32(1))).toHaveLength(3);
  });
});

describe("rarityIndex", () => {
  const rarity = rarityIndex(data.countries);

  test("counts the countries that celebrate a holiday", () => {
    expect(rarity.get("New Year's Day")).toBe(
      data.countries.filter((c) =>
        c.holidays.some((h) => h.en === "New Year's Day"),
      ).length,
    );
    expect(rarity.get("New Year's Day")).toBeGreaterThan(
      rarity.get("Culture Day") ?? 0,
    );
  });

  test("picks a holiday of minimal rarity", () => {
    const japan = byCode("JP");
    const star = rarestHoliday(japan, rarity);
    const minimum = Math.min(...japan.holidays.map((h) => rarityOf(h, rarity)));
    expect(rarityOf(star, rarity)).toBe(minimum);
    expect(rarityOf(star, rarity)).toBeLessThan(
      rarityOf(japan.holidays[0] as never, rarity),
    );
  });

  test("skips bookkeeping filler like a Portuguese bridge day", () => {
    const angola = byCode("AO");
    expect(angola.holidays.some((h) => h.en.includes("(Ponte)"))).toBe(true);
    expect(rarestHoliday(angola, rarity).en).not.toContain("(Ponte)");
  });

  test("names the other countries that share the rarest holiday", () => {
    const japan = byCode("JP");
    const shared = sharedWith(
      rarestHoliday(japan, rarity),
      japan,
      data.countries,
    );
    expect(shared.map((c) => c.code)).not.toContain("JP");
    const star = rarestHoliday(japan, rarity);
    for (const country of shared) {
      expect(country.holidays.some((h) => h.en === star.en)).toBe(true);
    }
  });
});

describe("visibleHolidays", () => {
  const rarity = rarityIndex(data.countries);

  test("shows a short list completely", () => {
    const country = {
      ...byCode("JP"),
      holidays: byCode("JP").holidays.slice(0, 4),
    };
    const { shown, hidden } = visibleHolidays(country, rarity);
    expect(shown).toHaveLength(4);
    expect(hidden).toBe(0);
  });

  test("cuts the common holidays, keeps the rare ones, stays chronological", () => {
    const japan = byCode("JP");
    const { shown, hidden } = visibleHolidays(japan, rarity, 6);
    expect(shown).toHaveLength(6);
    expect(hidden).toBe(japan.holidays.length - 6);
    expect(shown.some((h) => h.en === "New Year's Day")).toBe(false);
    const rarestShown = Math.max(...shown.map((h) => rarityOf(h, rarity)));
    const rarestHidden = Math.min(
      ...japan.holidays
        .filter((h) => !shown.includes(h))
        .map((h) => rarityOf(h, rarity)),
    );
    expect(rarestShown).toBeLessThanOrEqual(rarestHidden);
    const dates = shown.map((h) => h.date);
    expect(dates).toEqual([...dates].sort());
  });
});

describe("scoring", () => {
  test("drops with every guess and every hint, never below zero", () => {
    expect(pointsFor(1, 0)).toBe(100);
    expect(pointsFor(2, 0)).toBe(60);
    expect(pointsFor(3, 0)).toBe(30);
    expect(pointsFor(1, 1)).toBe(100 - HINT_COST);
    expect(pointsFor(3, MAX_HINTS)).toBe(0);
    expect(pointsFor(4, 0)).toBe(0);
  });
});

describe("formatting", () => {
  test("flags come from the country code", () => {
    expect(flagEmoji("BE")).toBe("🇧🇪");
    expect(flagEmoji("jp")).toBe("🇯🇵");
  });

  test("populations read like prose", () => {
    expect(formatPopulation(11_760_000)).toBe("11.8 million");
    expect(formatPopulation(1_400_000_000)).toBe("1.4 billion");
    expect(formatPopulation(38_000)).toBe("38 thousand");
    expect(formatPopulation(800)).toBe("800");
  });

  test("dates are month-name short and UTC-safe", () => {
    expect(formatDate("2026-04-27")).toBe("27 Apr");
    expect(formatDate("2026-12-01")).toBe("1 Dec");
  });

  test("median holiday count is a whole number", () => {
    expect(medianHolidayCount([])).toBe(0);
    expect(
      medianHolidayCount([
        { ...byCode("JP"), holidays: byCode("JP").holidays.slice(0, 4) },
        { ...byCode("JP"), holidays: byCode("JP").holidays.slice(0, 6) },
        { ...byCode("JP"), holidays: byCode("JP").holidays.slice(0, 8) },
      ]),
    ).toBe(6);
  });
});

describe("filterCountries", () => {
  test("prefix matches come before inner matches", () => {
    const names = filterCountries("an", data.countries).map((c) => c.name);
    expect(names[0]?.toLowerCase().startsWith("an")).toBe(true);
  });

  test("empty query offers nothing, a real fragment offers the country", () => {
    expect(filterCountries("   ", data.countries)).toEqual([]);
    expect(filterCountries("belgi", data.countries)[0]?.code).toBe("BE");
  });
});

describe("resolveGuess", () => {
  const answer = byCode("JP");

  test("finds the country case-insensitively", () => {
    const result = resolveGuess("  japan ", data.countries, answer);
    expect(result.kind).toBe("correct");
  });

  test("says whether a wrong guess shares the continent", () => {
    const same = resolveGuess("Belgium", data.countries, answer);
    expect(same).toEqual({
      kind: "wrong",
      country: byCode("BE"),
      sameRegion: false,
    });
    const near = resolveGuess("Cambodia", data.countries, answer);
    expect(near.kind === "wrong" && near.sameRegion).toBe(true);
  });

  test("rejects names outside the pool", () => {
    expect(resolveGuess("Atlantis", data.countries, answer).kind).toBe(
      "unknown",
    );
  });
});
