/**
 * The three layout bugs from the r/marvelstudios thread, pinned.
 *
 * All three had the same root cause — on a phone the chrome is a sheet floating
 * over the bottom of the map, and the camera treated the whole pane as visible
 * — and all three were invisible to every other check in this repo. The data
 * was consistent, the types were sound, `layoutTitles` returned exactly the
 * coordinates it was supposed to, and thirteen cards were still unreachable.
 * The only thing that catches that is measuring a rendered card against the
 * rendered chrome, at a real viewport size.
 *
 * Each test states the number the bug reported, so a regression says what it
 * broke rather than just failing.
 */
import { expect, test } from "@playwright/test";

import { DESKTOP, geometry, MOBILE, settle } from "./helpers";

test.describe("phone, nothing selected", () => {
  test.use({ viewport: MOBILE });

  test("opens with no card stranded under the controls sheet", async ({
    page,
  }) => {
    /*
     * Was: thirteen cards below the sheet's top edge at fit zoom on a 375×812
     * phone — X-Men, Spider-Man, Daredevil, Elektra, the 2005 Fantastic Four
     * and Iron Man itself. Which is why the thread reported titles as missing
     * that had been on the map the whole time.
     */
    await page.goto("/");
    await settle(page);

    const { chrome, nodes } = await geometry(page);
    expect(nodes.length).toBeGreaterThan(0);
    expect(chrome.height).toBeGreaterThan(0);

    const buried = nodes.filter((n) => n.top >= chrome.top).map((n) => n.id);
    expect(buried).toEqual([]);
  });
});

test.describe("phone, a title selected", () => {
  test.use({ viewport: MOBILE });

  test("frames the tapped card and the lines out of it", async ({ page }) => {
    /*
     * Was: tapping a poster put a 70%-tall panel over the map, usually over the
     * card you had just tapped and every line drawn from it — so nothing
     * appeared to happen at all. Zero edges were on screen.
     *
     * Endgame because it has three direct prerequisites, so there is something
     * for the arrows to connect it to.
     */
    await page.goto("/");
    await settle(page);

    await page.locator('.react-flow__node[data-id="endgame"]').click();
    await settle(page);

    const { chrome, nodes, edges } = await geometry(page);
    const endgame = nodes.find((n) => n.id === "endgame");

    expect(endgame, "the selected card is still rendered").toBeDefined();
    // Fully clear of the sheet, not merely peeking out from behind it.
    expect(endgame!.bottom).toBeLessThanOrEqual(chrome.top);
    expect(edges).toBeGreaterThan(0);
  });
});

test.describe("laptop, a title selected", () => {
  test.use({ viewport: DESKTOP });

  test("gives the detail panel a window worth scrolling", async ({ page }) => {
    /*
     * Was: on a 720px-tall column the controls took 406px and the details got
     * 278px, of which the header is 229 — a 47px window onto 3300px of
     * prerequisites and cast. The controls now cap and scroll internally when a
     * title is open, and the panel claims the rest.
     *
     * 150px is well under the ~200px the fix produces and well over the 47px
     * that started this, so it fails on the bug and not on a font metric.
     */
    await page.goto("/?title=endgame");
    await settle(page);

    /*
     * Found by walking up from the heading to whatever is actually scrolling,
     * rather than by a utility class. An earlier version of this test looked
     * for `.overflow-y-auto`, which stopped matching the moment that scroll
     * moved to a breakpoint variant — a false failure that said nothing about
     * the bug it exists to catch. What matters is that the prerequisites sit
     * in a scrolling box with room to read, whichever element owns it.
     */
    const scroller = await page.evaluate(() => {
      const heading = [...document.querySelectorAll("aside h3")].find((h) =>
        /watch first/i.test(h.textContent ?? ""),
      );
      for (let el = heading?.parentElement; el; el = el.parentElement) {
        if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY)) continue;
        return {
          height: el.getBoundingClientRect().height,
          overflow: el.scrollHeight - el.clientHeight,
        };
      }
      return null;
    });

    expect(
      scroller,
      "no scrolling ancestor above the prerequisites",
    ).not.toBeNull();
    expect(scroller!.height).toBeGreaterThan(150);

    // And it is a window onto more than it can show, which is the whole point.
    expect(scroller!.overflow).toBeGreaterThan(0);
  });
});
