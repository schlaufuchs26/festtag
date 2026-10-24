import { formatDate } from "../game";
import type { Holiday } from "../types";

/**
 * The clue: dates and local names only. The English names stay hidden until
 * the reveal, since they often contain the country.
 */
export function HolidayList({ holidays }: { holidays: Holiday[] }) {
  return (
    <div className="holidays">
      {holidays.map((holiday) => (
        <div className="holiday" key={holiday.date + holiday.local}>
          <span className="date">{formatDate(holiday.date)}</span>
          <span className="local" lang="und">
            {holiday.local}
          </span>
          <span className="days">
            {holiday.days > 1 ? `${holiday.days} days` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
