import {
  flagEmoji,
  formatDate,
  formatPopulation,
  pointsFor,
  rarestHoliday,
  rarityOf,
  sharedWith,
} from "../game";
import type { Country } from "../types";

type Props = {
  answer: Country;
  countries: Country[];
  rarity: Map<string, number>;
  solved: boolean;
  guesses: Country[];
  hints: number;
  median: number;
  isLast: boolean;
  onNext: () => void;
};

export function Reveal({
  answer,
  countries,
  rarity,
  solved,
  guesses,
  hints,
  median,
  isLast,
  onNext,
}: Props) {
  const star = rarestHoliday(answer, rarity);
  const starCount = rarityOf(star, rarity);
  const also = sharedWith(star, answer, countries);
  const points = solved ? pointsFor(guesses.length + 1, hints) : 0;

  const alsoText =
    also.length === 0
      ? "Only one of the countries here has it."
      : `It is a public holiday in ${starCount} of the ${countries.length} countries here, also ${also
          .map((c) => c.name)
          .join(", ")}${starCount > also.length + 1 ? ", and others" : ""}.`;

  return (
    <div className="card" data-testid="reveal">
      <div className="reveal-head">
        <span className="flag" aria-hidden="true">
          {flagEmoji(answer.code)}
        </span>
        <div>
          <h3>{answer.name}</h3>
          <div className="reveal-meta">
            {answer.region} · {formatPopulation(answer.population)} people ·{" "}
            {answer.holidays.length} public holidays
          </div>
        </div>
      </div>

      <p className="fact">
        The rarest name on this calendar is <b>{star.en}</b>
        {star.local !== star.en && <span lang="und"> ({star.local})</span>}.{" "}
        {alsoText} The median country in this game has {median}.
      </p>

      <table className="holidays-table">
        <tbody>
          {answer.holidays.map((holiday) => (
            <tr
              key={holiday.date + holiday.local}
              className={holiday.en === star.en ? "rare" : undefined}
            >
              <td>{formatDate(holiday.date)}</td>
              <td>
                {holiday.en}
                {holiday.local !== holiday.en && (
                  <span className="native" lang="und">
                    {holiday.local}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="row">
        <span className={solved ? "feedback good" : "feedback bad"}>
          {solved
            ? `Solved with ${guesses.length + 1} ${
                guesses.length === 0 ? "guess" : "guesses"
              } and ${hints} ${hints === 1 ? "hint" : "hints"}: +${points} points.`
            : "Out of guesses: no points for this one."}
        </span>
        <button className="primary" type="button" onClick={onNext}>
          {isLast ? "See the result" : "Next country"}
        </button>
      </div>
    </div>
  );
}
