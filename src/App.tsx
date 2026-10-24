import { useMemo, useState } from "react";
import { CalendarStrip } from "./components/CalendarStrip";
import { EndScreen } from "./components/EndScreen";
import { GuessBox } from "./components/GuessBox";
import { HolidayList } from "./components/HolidayList";
import { Reveal } from "./components/Reveal";
import dataset from "./data/holidays.json";
import {
  flagEmoji,
  formatPopulation,
  MAX_GUESSES,
  MAX_HINTS,
  medianHolidayCount,
  mulberry32,
  pickRounds,
  pointsFor,
  ROUNDS,
  rarityIndex,
  resolveGuess,
  visibleHolidays,
} from "./game";
import type { Country, Dataset } from "./types";

const data = dataset as Dataset;

type RoundState = {
  guesses: Country[];
  hints: number;
  revealed: boolean;
  solved: boolean;
  message: string;
};

type RunState = {
  rounds: Country[];
  index: number;
  round: RoundState;
  results: { country: Country; points: number; solved: boolean }[];
  finished: boolean;
};

const freshRound = (): RoundState => ({
  guesses: [],
  hints: 0,
  revealed: false,
  solved: false,
  message: "",
});

function newRun(seed: number): RunState {
  return {
    rounds: pickRounds(data.countries, ROUNDS, mulberry32(seed)),
    index: 0,
    round: freshRound(),
    results: [],
    finished: false,
  };
}

export function App({ seed }: { seed?: number }) {
  const [run, setRun] = useState<RunState>(() =>
    newRun(seed ?? Math.floor(Math.random() * 2 ** 31)),
  );
  const rarity = useMemo(() => rarityIndex(data.countries), []);
  const median = useMemo(() => medianHolidayCount(data.countries), []);

  const answer = run.rounds[run.index];
  const total = run.results.reduce((sum, r) => sum + r.points, 0);
  const max = ROUNDS * 100;

  function guess(name: string) {
    if (!answer) return;
    setRun((current) => {
      const result = resolveGuess(name, data.countries, answer);
      if (result.kind === "unknown") {
        return {
          ...current,
          round: {
            ...current.round,
            message:
              "Not one of the countries in this game; pick from the list.",
          },
        };
      }
      const correct = result.kind === "correct";
      // Only wrong guesses count up; the correct one ends the round.
      const guesses = correct
        ? current.round.guesses
        : [...current.round.guesses, result.country];
      const outOfGuesses = !correct && guesses.length >= MAX_GUESSES;
      const revealed = correct || outOfGuesses;
      const points = correct
        ? pointsFor(guesses.length + 1, current.round.hints)
        : 0;

      return {
        ...current,
        round: {
          ...current.round,
          guesses,
          revealed,
          solved: correct,
          message: correct
            ? ""
            : result.sameRegion
              ? `Not ${result.country.name}: still ${result.country.region}.`
              : `Not ${result.country.name}: not in ${result.country.region}.`,
        },
        results: revealed
          ? [...current.results, { country: answer, points, solved: correct }]
          : current.results,
      };
    });
  }

  function hint() {
    setRun((current) =>
      current.round.revealed || current.round.hints >= MAX_HINTS
        ? current
        : {
            ...current,
            round: { ...current.round, hints: current.round.hints + 1 },
          },
    );
  }

  function next() {
    setRun((current) => {
      if (current.index + 1 >= current.rounds.length) {
        return { ...current, finished: true };
      }
      return {
        ...current,
        index: current.index + 1,
        round: freshRound(),
      };
    });
  }

  if (run.finished || !answer) {
    return (
      <div className="shell">
        <div className="topbar">
          <div>
            <div className="brand">
              Fest<span>tag</span> 🦊
            </div>
            <div className="tagline">
              One country, hidden in its public holidays.
            </div>
          </div>
        </div>
        <EndScreen
          results={run.results}
          total={total}
          max={max}
          onRestart={() => setRun(newRun(Math.floor(Math.random() * 2 ** 31)))}
        />
      </div>
    );
  }

  const { shown, hidden } = visibleHolidays(answer, rarity);

  return (
    <div className="shell">
      <div className="topbar">
        <div>
          <div className="brand">
            Fest<span>tag</span> 🦊
          </div>
          <div className="tagline">
            One country, hidden in its public holidays.
          </div>
        </div>
        <div className="stats">
          Round <strong>{run.index + 1}</strong>/{run.rounds.length} ·{" "}
          <strong>{total}</strong> points
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>{data.year} calendar</h2>
          <span className="stats">
            {answer.holidays.length} public holidays
          </span>
        </div>
        <CalendarStrip holidays={answer.holidays} />
        <HolidayList holidays={shown} />
        {hidden > 0 && (
          <div className="hint-line">
            {hidden} more, mostly the ones every country has.
          </div>
        )}

        {!run.round.revealed && (
          <>
            <GuessBox
              countries={data.countries}
              disabled={run.round.revealed}
              onSubmit={guess}
            />
            <div className="row">
              <button
                className="ghost"
                type="button"
                onClick={hint}
                disabled={run.round.hints >= MAX_HINTS}
              >
                {run.round.hints >= MAX_HINTS
                  ? "No hints left"
                  : `Hint −15 (${MAX_HINTS - run.round.hints} left)`}
              </button>
              <span className="hint-line">
                {MAX_GUESSES - run.round.guesses.length} of {MAX_GUESSES}{" "}
                guesses left
              </span>
            </div>
            {run.round.hints >= 1 && (
              <div className="hint-line">
                Continent: <strong>{answer.region}</strong>
              </div>
            )}
            {run.round.hints >= 2 && (
              <div className="hint-line">
                {flagEmoji(answer.code)} {formatPopulation(answer.population)}{" "}
                people
              </div>
            )}
            <div
              className={
                run.round.message.startsWith("Not ")
                  ? "feedback bad"
                  : "feedback"
              }
              data-testid="feedback"
            >
              {run.round.message}
            </div>
          </>
        )}
      </div>

      {run.round.revealed && (
        <Reveal
          answer={answer}
          countries={data.countries}
          rarity={rarity}
          solved={run.round.solved}
          guesses={run.round.guesses}
          hints={run.round.hints}
          median={median}
          isLast={run.index + 1 >= run.rounds.length}
          onNext={next}
        />
      )}

      <p className="howto">
        <b>How to play:</b> eight countries, ten holidays each, no names
        translated. Read the language, the dates and the religion in the list.
        Three guesses per country; two hints cost 15 points each.
      </p>
    </div>
  );
}
