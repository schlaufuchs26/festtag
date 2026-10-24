import { clueLabel, formatDate } from "../game";
import type { Country, Holiday } from "../types";

/**
 * The clue: dates and English names only. The native names stay hidden until
 * the reveal, and a name that would give the country away is replaced by its
 * neutral label (see `data/neutral-labels.ts`).
 */
export function HolidayList({
  holidays,
  country,
}: {
  holidays: Holiday[];
  country: Country;
}) {
  return (
    <div className="holidays">
      {holidays.map((holiday) => (
        <div className="holiday" key={holiday.date + holiday.en}>
          <span className="date">{formatDate(holiday.date)}</span>
          <span className="name">{clueLabel(holiday, country)}</span>
          <span className="days">
            {holiday.days > 1 ? `${holiday.days} days` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
