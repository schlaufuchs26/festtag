import { useState } from "react";
import { filterCountries } from "../game";
import type { Country } from "../types";

type Props = {
  countries: Country[];
  disabled: boolean;
  onSubmit: (name: string) => void;
};

/**
 * Type-ahead over the countries in the pool. Enter takes the exact match, or
 * the highlighted suggestion when the text is only a fragment.
 */
export function GuessBox({ countries, disabled, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [active, setActive] = useState(0);
  const suggestions = disabled ? [] : filterCountries(value, countries);
  const highlighted = Math.min(active, Math.max(0, suggestions.length - 1));

  function submit() {
    const exact = countries.find(
      (c) => c.name.toLowerCase() === value.trim().toLowerCase(),
    );
    const target = exact ?? suggestions[highlighted];
    // Free text that matches nothing still gets submitted, so the game can
    // answer "not one of the countries here" instead of silently doing nothing.
    onSubmit(target ? target.name : value);
    setValue("");
    setActive(0);
  }

  return (
    <form
      className="guessbox"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder="Which country?"
        aria-label="Which country?"
        autoComplete="off"
        onChange={(event) => {
          setValue(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive(Math.min(highlighted + 1, suggestions.length - 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive(Math.max(highlighted - 1, 0));
          }
        }}
      />
      <button className="primary" type="submit" disabled={disabled}>
        Guess
      </button>
      {suggestions.length > 0 && (
        <div className="suggestions" role="listbox" aria-label="Countries">
          {suggestions.map((country, index) => (
            <button
              key={country.code}
              type="button"
              role="option"
              aria-selected={index === highlighted}
              className={index === highlighted ? "active" : undefined}
              onMouseEnter={() => setActive(index)}
              onClick={() => {
                onSubmit(country.name);
                setValue("");
                setActive(0);
              }}
            >
              {country.name}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
