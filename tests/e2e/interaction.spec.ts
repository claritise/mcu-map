/**
 * The ways into a title that are not a mouse click, plus the one piece of
 * feedback the search field owes you.
 *
 * Here for the same reason as the layout specs: the map is a canvas, so none of
 * this is reachable from a unit test, and all of it is easy to break from a
 * distance — a deep link, a keyboard open and a tap all land in the same
 * `selectTitle` the camera work reaches for.
 */
import { expect, test } from "@playwright/test";

import { DESKTOP, onscreenCard, settle } from "./helpers";

test.use({ viewport: DESKTOP });

test("opens a title from a deep link", async ({ page }) => {
  await page.goto("/?title=endgame");
  await settle(page);

  await expect(
    page.getByRole("heading", { name: "Avengers: Endgame" }),
  ).toBeVisible();
});

test("puts the open title back into the URL", async ({ page }) => {
  // The share link is the point: a panel nobody can link to is a panel nobody
  // can send anyone.
  await page.goto("/");
  await settle(page);

  const card = await onscreenCard(page);
  await card.locator.click();
  await expect(page).toHaveURL(new RegExp(`[?&]title=${card.id}(&|$)`));
});

test("opens the focused card on Enter", async ({ page }) => {
  /*
   * Every card is reachable by tab, so every card has to be openable without a
   * pointer. The handler lives on the map pane and finds the card by walking up
   * from whatever has focus — exactly the sort of thing that survives a
   * refactor in form and stops working in fact.
   */
  await page.goto("/");
  await settle(page);

  const card = await onscreenCard(page);
  await card.locator.focus();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(new RegExp(`[?&]title=${card.id}(&|$)`));
  await expect(
    page.getByRole("heading", { name: /watch first/i }),
  ).toBeVisible();
});

test("says so when a search matches nothing", async ({ page }) => {
  /*
   * A query that lights no cards leaves the map looking identical to one that
   * lights all of them — dimming everything and dimming nothing are the same
   * picture at a glance. The line under the field is the only thing that tells
   * the two apart.
   */
  await page.goto("/");
  await settle(page);

  await page.getByPlaceholder("Search titles…").fill("qzqzqz");
  await expect(page.getByText("No title by that name.")).toBeVisible();

  // And it goes away again once the query does match something.
  await page.getByPlaceholder("Search titles…").fill("Endgame");
  await expect(page.getByText("No title by that name.")).toHaveCount(0);
});
