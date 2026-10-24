import { describe, expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { GuessBox } from "../src/components/GuessBox";
import { HolidayList } from "../src/components/HolidayList";
import { Reveal } from "../src/components/Reveal";
import dataset from "../src/data/holidays.json";
import { clueLabel, rarityIndex } from "../src/game";
import type { Country, Dataset } from "../src/types";

const data = dataset as unknown as Dataset;
const rarity = rarityIndex(data.countries);
const byCode = (code: string): Country =>
  data.countries.find((c) => c.code === code) as Country;

describe("GuessBox", () => {
  test("a suggestion click submits that country", () => {
    const picked: string[] = [];
    render(
      <GuessBox
        countries={data.countries}
        disabled={false}
        onSubmit={(name) => picked.push(name)}
      />,
    );
    fireEvent.change(screen.getByLabelText("Which country?"), {
      target: { value: "belgi" },
    });
    const options = screen.getAllByRole("option");
    expect(options[0]?.textContent).toBe("Belgium");
    if (options[0]) fireEvent.click(options[0]);
    expect(picked).toEqual(["Belgium"]);
  });

  test("arrow keys move the highlight and Enter takes it", () => {
    const picked: string[] = [];
    render(
      <GuessBox
        countries={data.countries}
        disabled={false}
        onSubmit={(name) => picked.push(name)}
      />,
    );
    const input = screen.getByLabelText("Which country?");
    fireEvent.change(input, { target: { value: "ge" } });
    const names = screen.getAllByRole("option").map((o) => o.textContent);

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(picked).toEqual([names[1] as string]);
  });

  test("free text that matches nothing is still submitted", () => {
    const picked: string[] = [];
    render(
      <GuessBox
        countries={data.countries}
        disabled={false}
        onSubmit={(name) => picked.push(name)}
      />,
    );
    const input = screen.getByLabelText("Which country?");
    fireEvent.change(input, { target: { value: "Atlantis" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(picked).toEqual(["Atlantis"]);
  });
});

describe("HolidayList", () => {
  test("shows the English name and keeps the native one back", () => {
    const czech = byCode("CZ");
    const shown = czech.holidays.filter((h) => h.local !== h.en).slice(0, 3);
    render(<HolidayList holidays={shown} country={czech} />);
    for (const holiday of shown) {
      expect(screen.getByText(holiday.en)).toBeInTheDocument();
      expect(screen.queryByText(holiday.local)).toBeNull();
    }
  });

  test("prints a neutral label where the English name gives the country away", () => {
    const canada = byCode("CA");
    const canadaDay = canada.holidays.find((h) => h.en === "Canada Day");
    if (!canadaDay) throw new Error("no Canada Day");
    render(<HolidayList holidays={[canadaDay]} country={canada} />);
    expect(screen.queryByText("Canada Day")).toBeNull();
    expect(screen.getByText(clueLabel(canadaDay, canada))).toBeInTheDocument();
  });
});

describe("Reveal", () => {
  const props = {
    countries: data.countries,
    rarity,
    solved: true,
    guesses: [],
    hints: 0,
    median: 12,
    isLast: false,
    onNext: () => {},
  };

  test("says when the rarest holiday exists nowhere else in the game", () => {
    render(<Reveal {...props} answer={byCode("BI")} />);
    const reveal = screen.getByTestId("reveal");
    expect(reveal.textContent).toContain(
      "Only one of the countries here has it.",
    );
    expect(reveal.textContent).toContain("+100 points");
  });

  test("lists the countries that share the rarest holiday, then the rest", () => {
    render(<Reveal {...props} answer={byCode("CM")} />);
    const reveal = screen.getByTestId("reveal");
    expect(reveal.textContent).toContain("Youth Day");
    expect(reveal.textContent).toContain("Albania");
    expect(reveal.textContent).toContain("and others");
  });

  test("prints the native name under the English one", () => {
    const czech = byCode("CZ");
    render(<Reveal {...props} answer={czech} />);
    const reveal = screen.getByTestId("reveal");
    const native = czech.holidays.find((h) => h.local !== h.en);
    if (!native) throw new Error("no holiday with a native name");
    expect(reveal.textContent).toContain(native.en);
    expect(reveal.textContent).toContain(native.local);
  });

  test("the next button hands control back", () => {
    let next = 0;
    render(
      <Reveal {...props} answer={byCode("DK")} onNext={() => next++} isLast />,
    );
    fireEvent.click(screen.getByRole("button", { name: "See the result" }));
    expect(next).toBe(1);
  });
});
