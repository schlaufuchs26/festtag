import { flagEmoji } from "../game";
import type { Country } from "../types";

type Props = {
  results: { country: Country; points: number; solved: boolean }[];
  total: number;
  max: number;
  onRestart: () => void;
};

export function EndScreen({ results, total, max, onRestart }: Props) {
  const perfect = results.filter((r) => r.points === 100).length;
  const solved = results.filter((r) => r.solved).length;

  return (
    <div className="card" data-testid="end-screen">
      <div>
        <div className="big-score">
          {total} <small>/ {max}</small>
        </div>
        <div className="reveal-meta">
          {solved} of {results.length} countries found, {perfect} on the first
          guess.
        </div>
      </div>

      <div className="summary-list">
        {results.map((result) => (
          <div key={result.country.code}>
            <span>
              <span aria-hidden="true">{flagEmoji(result.country.code)}</span>{" "}
              {result.country.name}
            </span>
            <span className="pts">
              {result.solved ? `+${result.points}` : "missed"}
            </span>
          </div>
        ))}
      </div>

      <div className="row">
        <button className="primary" type="button" onClick={onRestart}>
          Play again
        </button>
      </div>
    </div>
  );
}
