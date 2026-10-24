import { expect, test } from "@playwright/test";

/**
 * Browser smoke test for Festtag. The happy-dom suite covers the game logic;
 * this file checks the layout contract in a real browser: the calendar is on
 * screen, the type-ahead works, a guess produces either the reveal or a
 * feedback line, and nothing overflows a laptop viewport.
 */

const LAPTOP = { width: 1280, height: 757 };

test("the calendar of a round boots in a real browser", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.setViewportSize(LAPTOP);
  await page.goto("/");

  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.getByText(/Fest/)).toBeVisible();
  await expect(page).toHaveTitle(/Festtag/);

  // Ten holidays at most, but never fewer than the cut allows.
  const holidays = page.locator(".holiday");
  expect(await holidays.count()).toBeGreaterThanOrEqual(8);
  await expect(page.locator(".month")).toHaveCount(12);

  // The English names stay hidden until the reveal.
  await expect(page.getByTestId("reveal")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("a guess via the type-ahead produces feedback or the reveal", async ({
  page,
}) => {
  await page.setViewportSize(LAPTOP);
  await page.goto("/");

  const input = page.getByLabel("Which country?");
  await input.fill("Fran");
  const suggestion = page.getByRole("option", { name: "France" });
  await expect(suggestion).toBeVisible();
  await suggestion.click();

  await expect(
    page.locator('[data-testid="feedback"], [data-testid="reveal"]'),
  ).toBeVisible();
});

test("the hint button reveals the continent", async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.goto("/");

  await page.getByRole("button", { name: /Hint/ }).click();
  await expect(page.getByText(/Continent:/)).toBeVisible();
});

test("nothing overflows the laptop viewport", async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.goto("/");

  const doc = await page.evaluate(() => {
    const el = document.scrollingElement;
    return {
      scrollWidth: el?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    };
  });
  expect(doc.scrollWidth).toBeLessThanOrEqual(doc.innerWidth);
});
