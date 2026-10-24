import { describe, expect, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "../src/App";
import dataset from "../src/data/holidays.json";
import {
  clueLabel,
  formatDate,
  mulberry32,
  pickRounds,
  ROUNDS,
  rarityIndex,
  visibleHolidays,
} from "../src/game";
import type { Country, Dataset } from "../src/types";

const data = dataset as unknown as Dataset;
const SEED = 424242;
const rounds = pickRounds(data.countries, ROUNDS, mulberry32(SEED));
const first = rounds[0] as Country;
const rarity = rarityIndex(data.countries);
const firstShown = visibleHolidays(first, rarity).shown;

function renderApp() {
  render(<App seed={SEED} />);
}

describe("App", () => {
  test("shows the first round's calendar without the answer's name", () => {
    renderApp();
    expect(screen.getByText(/Fest/)).toBeInTheDocument();
    expect(screen.getByText(/Round/).textContent).toContain(`1/${ROUNDS}`);

    const firstHoliday = firstShown[0];
    if (!firstHoliday) throw new Error("no holidays");
    expect(screen.getByText(formatDate(firstHoliday.date))).toBeInTheDocument();

    // Every shown holiday carries its English name, not its native one.
    for (const holiday of firstShown) {
      expect(
        screen.getAllByText(clueLabel(holiday, first)).length,
      ).toBeGreaterThan(0);
      if (holiday.local !== holiday.en) {
        expect(screen.queryByText(holiday.local)).toBeNull();
      }
    }
    // The country's own name is the answer; it must not be on the clue card.
    expect(screen.queryByTestId("reveal")).toBeNull();
  });

  test("a wrong guess reports the continent", () => {
    renderApp();
    const input = screen.getByLabelText("Which country?");
    const other = data.countries.find((c) => c.code !== first.code);
    if (!other) throw new Error("no other country");

    fireEvent.change(input, { target: { value: other.name } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    const feedback = screen.getByTestId("feedback");
    expect(feedback.textContent).toContain(other.name);
    expect(feedback.textContent).toMatch(/not in|still/);
  });

  test("a name outside the pool does not cost a guess", () => {
    renderApp();
    const input = screen.getByLabelText("Which country?");
    fireEvent.change(input, { target: { value: "Atlantis" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(screen.getByTestId("feedback").textContent).toContain(
      "Not one of the countries",
    );
    expect(screen.getByText(/3 of 3 guesses left/)).toBeInTheDocument();
  });

  test("the native names appear only in the reveal", () => {
    // Seed 2 opens on a country whose names are not English, which is where
    // the difference between the clue and the reveal shows.
    const NATIVE_SEED = 2;
    const answer = pickRounds(
      data.countries,
      ROUNDS,
      mulberry32(NATIVE_SEED),
    )[0] as Country;
    const native = answer.holidays.find((h) => h.local !== h.en);
    if (!native) throw new Error("no holiday with a native name");
    render(<App seed={NATIVE_SEED} />);
    expect(screen.queryByText(native.local)).toBeNull();

    const input = screen.getByLabelText("Which country?");
    fireEvent.change(input, { target: { value: answer.name } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(screen.getByTestId("reveal").textContent).toContain(native.local);
  });

  test("the right answer opens the reveal with the English names", () => {
    renderApp();
    const input = screen.getByLabelText("Which country?");
    fireEvent.change(input, { target: { value: first.name } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    const reveal = screen.getByTestId("reveal");
    expect(within(reveal).getByText(first.name)).toBeInTheDocument();
    const english = (firstShown[0] ?? first.holidays[0])?.en ?? "";
    expect(reveal.textContent).toContain(english);
    expect(reveal.textContent).toContain("+100 points");
  });

  test("hints cost points and reveal the continent", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: /Hint/ }));
    expect(screen.getByText(first.region)).toBeInTheDocument();

    const input = screen.getByLabelText("Which country?");
    fireEvent.change(input, { target: { value: first.name } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(screen.getByTestId("reveal").textContent).toContain("+85 points");
  });

  test("three wrong guesses end the round with no points", () => {
    renderApp();
    const input = screen.getByLabelText("Which country?");
    const wrong = data.countries
      .filter((c) => c.code !== first.code)
      .slice(0, 3);

    for (const country of wrong) {
      fireEvent.change(input, { target: { value: country.name } });
      fireEvent.submit(input.closest("form") as HTMLFormElement);
    }

    expect(screen.getByTestId("reveal").textContent).toContain(
      "Out of guesses",
    );
  });

  test("a full run ends on the score screen and can restart", () => {
    renderApp();
    for (let round = 0; round < ROUNDS; round++) {
      const answer = rounds[round] as Country;
      const input = screen.getByLabelText("Which country?");
      fireEvent.change(input, { target: { value: answer.name } });
      fireEvent.submit(input.closest("form") as HTMLFormElement);
      fireEvent.click(
        screen.getByRole("button", { name: /Next country|See the result/ }),
      );
    }

    const end = screen.getByTestId("end-screen");
    expect(end.textContent).toContain(`${ROUNDS * 100}`);
    expect(end.textContent).toContain(`${ROUNDS} of ${ROUNDS} countries found`);

    fireEvent.click(screen.getByRole("button", { name: "Play again" }));
    expect(screen.getByLabelText("Which country?")).toBeInTheDocument();
  });
});
