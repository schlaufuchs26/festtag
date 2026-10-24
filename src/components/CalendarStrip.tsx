import { clueLabel, monthIndex } from "../game";
import type { Country, Holiday } from "../types";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/**
 * The year at a glance: one column per month, one dot per holiday. Rare
 * holidays glow, the common ones stay grey, so the shape of the year reads
 * before the names do.
 */
export function CalendarStrip({
  holidays,
  country,
}: {
  holidays: Holiday[];
  country: Country;
}) {
  const byMonth = MONTHS.map((_, index) =>
    holidays.filter((h) => monthIndex(h.date) === index),
  );
  const max = Math.max(1, ...byMonth.map((list) => list.length));

  return (
    <div className="months" aria-hidden="true">
      {MONTHS.map((label, index) => (
        <div className="month" key={label + String(index)}>
          <div className="dots" style={{ minHeight: 6 * max }}>
            {(byMonth[index] ?? []).map((holiday) => (
              <div
                className="dot"
                key={holiday.date + holiday.en}
                title={clueLabel(holiday, country)}
              />
            ))}
          </div>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
