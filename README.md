# Festtag

A country, hidden in its public holidays.

Eight rounds. Each one shows a year of public holidays with the names in the
country's own language, and nothing else: no map, no flag, no population. Guess
the country, then read what the calendar was actually telling you.

Live: https://schlaufuchs26.github.io/festtag/

## How to play

- 8 rounds, 3 guesses each, 100 / 60 / 30 points depending on the guess.
- Two hints: the continent (−15), then the flag and population (−15).
- A wrong guess tells you whether you were at least on the right continent.
- The reveal shows every holiday in English, plus the one fact the calendar was
  built around: how many of the 141 countries in the game share its rarest
  holiday, and which ones they are.

## Two ways in (inference routes)

The point of the game is that a list of holidays can be read in two independent
ways, and the second one needs no specialist knowledge.

**Route 1: the shape of the year, no prior knowledge needed.** Read the
calendar like a story about a place.

- Which days are *missing*. A country without 25 December is not a
  Christian-majority country; a country without 1 May did not inherit the
  socialist or Catholic labour movement. Absences narrow faster than presences.
- The religion in the list. Eid al-Fitr and Eid al-Adha, Orthodox Christmas on
  7 January, Coptic Easter, Nowruz on 21 March, Carnival, All Saints: each one
  puts you in a region before you know a single word.
- The names themselves. `Tweede Kerstdag`, `Wapenstilstand`, `Vrijheidsdag` read
  as Germanic; `Fête du Travail`, `Jour de l'An` as Romance; `Zweiter
  Weihnachtstag` as German rather than Dutch; `Koninginnedag`/`Koningsdag` as
  Dutch rather than Flemish.
- How many days off. 8 holidays with three of them religious points one way, 16
  with two "bridge" days around them points at a country that likes its long
  weekends.
- Which historical dates appear. 27 April, 14 July, 3 October, 12 October, 5
  July, 16 September: if the date is familiar, the country follows.

**Route 2: the content, with world knowledge.** Once a date or a name rings a
bell, the round is usually over: `Tag der Deutschen Einheit` on 3 October,
`Koningsdag` on 27 April, `Mashujaa Day`, `Jamhuri Day`, `Ntaryamira Day`,
`Quame Nkrumah Memorial Day`. The reveal is written so that a round you lost
still teaches you one of these.

Both routes are independent: a player who has never heard of Ntaryamira can
still place Burundi in East Africa from Kinyarwanda-shaped names and a calendar
of Catholic feast days; a player who knows the date can ignore the language.

## Data

- Public holidays and their local names: [Nager.Date](https://date.nager.at),
  2026, national-level public holidays only.
- Population: World Bank `SP.POP.TOTL`, 2024.
- 141 sovereign states have a complete enough list to play; territories,
  dependencies and countries with fewer than 8 national holidays are left out
  (the API's list for the UK, Switzerland and Mexico is cantonal or regional, so
  those are out too).

`bun scripts/build-holidays.ts` regenerates `src/data/holidays.json` from both
APIs. The game itself never fetches anything at runtime.

## Development

```bash
bun install
bun run dev          # http://localhost:3000
bun run checks       # format, tsc, biome, knip, tests
bun run test:e2e     # Playwright smoke test
bun run build        # static bundle in dist/
```

Built with Bun, React 19 and TypeScript, from
[frontend-template](https://github.com/schlaufuchs26/frontend-template).
