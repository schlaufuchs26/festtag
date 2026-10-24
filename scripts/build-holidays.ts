/**
 * Regenerates src/data/holidays.json.
 *
 * Two public sources, no API keys:
 *   - Nager.Date (https://date.nager.at) for the public holidays, including the
 *     local-language names, which are the puzzle itself.
 *   - World Bank for the population figures used as a hint.
 *
 * Run with `bun scripts/build-holidays.ts` when the data should move to a new
 * year or the country list should change. The output is committed; the game
 * never fetches at runtime.
 */

const YEAR = 2026;
const API = "https://date.nager.at/api/v3";
const MIN_HOLIDAYS = 8;

/** Sovereign states only: territories and dependencies make ambiguous rounds. */
const REGIONS: Record<string, string> = {
  // Europe
  AD: "Europe",
  AL: "Europe",
  AT: "Europe",
  BA: "Europe",
  BE: "Europe",
  BG: "Europe",
  BY: "Europe",
  CH: "Europe",
  CY: "Europe",
  CZ: "Europe",
  DE: "Europe",
  DK: "Europe",
  EE: "Europe",
  ES: "Europe",
  FI: "Europe",
  FR: "Europe",
  GB: "Europe",
  GR: "Europe",
  HR: "Europe",
  HU: "Europe",
  IE: "Europe",
  IS: "Europe",
  IT: "Europe",
  LI: "Europe",
  LT: "Europe",
  LU: "Europe",
  LV: "Europe",
  MC: "Europe",
  MD: "Europe",
  ME: "Europe",
  MK: "Europe",
  MT: "Europe",
  NL: "Europe",
  NO: "Europe",
  PL: "Europe",
  PT: "Europe",
  RO: "Europe",
  RS: "Europe",
  RU: "Europe",
  SE: "Europe",
  SI: "Europe",
  SK: "Europe",
  SM: "Europe",
  UA: "Europe",
  VA: "Europe",
  // Asia
  AM: "Asia",
  BH: "Asia",
  CN: "Asia",
  GE: "Asia",
  ID: "Asia",
  IQ: "Asia",
  JP: "Asia",
  KH: "Asia",
  KZ: "Asia",
  MN: "Asia",
  PH: "Asia",
  SG: "Asia",
  SY: "Asia",
  TR: "Asia",
  YE: "Asia",
  // Africa
  AO: "Africa",
  BF: "Africa",
  BI: "Africa",
  BJ: "Africa",
  BW: "Africa",
  CD: "Africa",
  CF: "Africa",
  CG: "Africa",
  CI: "Africa",
  CM: "Africa",
  CV: "Africa",
  DJ: "Africa",
  DZ: "Africa",
  EG: "Africa",
  ER: "Africa",
  ET: "Africa",
  GA: "Africa",
  GH: "Africa",
  GM: "Africa",
  GN: "Africa",
  GQ: "Africa",
  GW: "Africa",
  KE: "Africa",
  KM: "Africa",
  LR: "Africa",
  LS: "Africa",
  LY: "Africa",
  MA: "Africa",
  MG: "Africa",
  ML: "Africa",
  MR: "Africa",
  MW: "Africa",
  MZ: "Africa",
  NA: "Africa",
  NE: "Africa",
  NG: "Africa",
  RW: "Africa",
  SC: "Africa",
  SD: "Africa",
  SL: "Africa",
  SN: "Africa",
  SO: "Africa",
  SS: "Africa",
  ST: "Africa",
  SZ: "Africa",
  TD: "Africa",
  TG: "Africa",
  TN: "Africa",
  TZ: "Africa",
  UG: "Africa",
  ZA: "Africa",
  ZM: "Africa",
  ZW: "Africa",
  // North America
  AG: "North America",
  BB: "North America",
  BS: "North America",
  BZ: "North America",
  CA: "North America",
  CR: "North America",
  CU: "North America",
  DM: "North America",
  DO: "North America",
  GD: "North America",
  GT: "North America",
  HN: "North America",
  HT: "North America",
  JM: "North America",
  KN: "North America",
  LC: "North America",
  MX: "North America",
  NI: "North America",
  PA: "North America",
  SV: "North America",
  TT: "North America",
  US: "North America",
  VC: "North America",
  // South America
  AR: "South America",
  BO: "South America",
  BR: "South America",
  CL: "South America",
  CO: "South America",
  EC: "South America",
  GY: "South America",
  PE: "South America",
  PY: "South America",
  SR: "South America",
  UY: "South America",
  VE: "South America",
  // Oceania
  AU: "Oceania",
  FM: "Oceania",
  KI: "Oceania",
  MH: "Oceania",
  NR: "Oceania",
  NZ: "Oceania",
  PG: "Oceania",
  PW: "Oceania",
  SB: "Oceania",
  TO: "Oceania",
  TV: "Oceania",
  VU: "Oceania",
  WS: "Oceania",
};

type RawHoliday = {
  date: string;
  localName: string;
  name: string;
  global: boolean;
  types: string[];
};

type Holiday = { date: string; local: string; en: string; days: number };

export type Country = {
  code: string;
  name: string;
  region: string;
  population: number;
  holidays: Holiday[];
};

/** "Eid al-Fitr First Day" and friends are one holiday spread over days. */
function baseName(en: string): string {
  return en.replace(/\s+(First|Second|Third|Fourth|Fifth)\s+Day$/i, "");
}

function dayDiff(a: string, b: string): number {
  return Math.round(
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000,
  );
}

/**
 * Collapses consecutive same-name days into one entry, and drops the
 * per-day duplicates some countries carry (Bahrain's National Day appears
 * twice). Two holidays with the same English name far apart in the year stay
 * separate: Egypt has two different "Revolution Day"s.
 */
export function normalize(raw: RawHoliday[]): Holiday[] {
  const kept = raw
    .filter((h) => h.global && h.types.includes("Public"))
    .sort((a, b) => a.date.localeCompare(b.date));

  const out: Holiday[] = [];
  for (const h of kept) {
    const en = baseName(h.name);
    const prev = out.at(-1);
    if (
      prev &&
      prev.en === en &&
      dayDiff(prev.date, h.date) <= 1 &&
      dayDiff(prev.date, h.date) >= 0
    ) {
      prev.days = dayDiff(prev.date, h.date) + 1;
      continue;
    }
    out.push({ date: h.date, local: h.localName, en, days: 1 });
  }
  return out;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return (await res.json()) as T;
}

async function main() {
  const countries = await getJson<{ countryCode: string; name: string }[]>(
    `${API}/AvailableCountries`,
  );
  const names = new Map(countries.map((c) => [c.countryCode, c.name]));

  const wb = await getJson<
    [unknown, { country: { id: string }; date: string; value: number | null }[]]
  >(
    "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL" +
      "?date=2024&format=json&per_page=400",
  );
  const population = new Map<string, number>();
  for (const row of wb[1]) {
    if (row.value !== null) population.set(row.country.id, row.value);
  }

  const out: Country[] = [];
  for (const code of Object.keys(REGIONS)) {
    const name = names.get(code);
    if (!name) {
      console.warn(`no country name for ${code}, skipped`);
      continue;
    }
    const raw = await getJson<RawHoliday[]>(
      `${API}/PublicHolidays/${YEAR}/${code}`,
    );
    const holidays = normalize(raw);
    if (holidays.length < MIN_HOLIDAYS) {
      console.warn(
        `${code} ${name}: only ${holidays.length} holidays, skipped`,
      );
      continue;
    }
    const pop = population.get(code);
    if (!pop) {
      console.warn(`${code} ${name}: no population, skipped`);
      continue;
    }
    out.push({
      code,
      name,
      region: REGIONS[code] as string,
      population: pop,
      holidays,
    });
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  await Bun.write(
    `${import.meta.dir}/../src/data/holidays.json`,
    `${JSON.stringify({ year: YEAR, countries: out })}\n`,
  );
  console.log(`${out.length} countries written for ${YEAR}`);
}

if (import.meta.main) await main();
