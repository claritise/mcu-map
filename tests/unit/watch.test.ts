/**
 * The detail panel's outbound links and the two date/duration formatters.
 *
 * Small surface, but every one of these failures is silent: a wrong month name
 * still reads as a date, and a JustWatch search for "Loki (Season 2)" returns
 * an empty results page rather than an error.
 */
import { describe, expect, it } from "vitest";

import { METADATA } from "~/data/metadata";
import { TITLES, TITLE_BY_ID } from "~/data/titles";
import { formatReleased, formatRuntime, watchLinks } from "~/data/watch";

const byId = (id: string) => TITLE_BY_ID.get(id)!;

/** The `q=` a JustWatch link actually searches for. */
const searchQuery = (id: string) => {
  const link = watchLinks(byId(id)).find((l) => l.kind === "watch");
  return link ? new URL(link.href).searchParams.get("q") : null;
};

describe("formatReleased", () => {
  it("prints a plain calendar date", () => {
    expect(formatReleased("2019-04-26")).toBe("26 Apr 2019");
  });

  it("does not pad the day", () => {
    // The source is ISO, so the day arrives zero-padded and has to be unpadded
    // on the way out: "02 May" reads like a serial number.
    expect(formatReleased("2008-05-02")).toBe("2 May 2008");
  });

  it("does not shift the date by a timezone", () => {
    /*
     * The reason this is hand-rolled instead of `Intl`. A release date is a
     * calendar fact with no time and no zone; running it through `Date` moves
     * it a day either side of UTC, and moves it differently on the server than
     * in the browser, which is a hydration mismatch on top of a wrong answer.
     */
    expect(formatReleased("2019-01-01")).toBe("1 Jan 2019");
    expect(formatReleased("2019-12-31")).toBe("31 Dec 2019");
  });

  it("returns null rather than a half-formed date", () => {
    expect(formatReleased(undefined)).toBeNull();
    expect(formatReleased("")).toBeNull();
    expect(formatReleased("2019")).toBeNull();
    expect(formatReleased("2019-04")).toBeNull();
    // Month 13 has no name, and "26 undefined 2019" must never reach a reader.
    expect(formatReleased("2019-13-01")).toBeNull();
  });

  it("formats every release date in the dataset", () => {
    for (const [id, meta] of Object.entries(METADATA)) {
      if (!meta.released) continue;
      expect(formatReleased(meta.released), id).toMatch(
        /^\d{1,2} [A-Z][a-z]{2} \d{4}$/,
      );
    }
  });
});

describe("formatRuntime", () => {
  it("splits hours from minutes", () => {
    expect(formatRuntime(181)).toBe("3h 1m");
  });

  it("drops a zero remainder rather than printing '2h 0m'", () => {
    expect(formatRuntime(120)).toBe("2h");
  });

  it("prints minutes alone under the hour", () => {
    expect(formatRuntime(45)).toBe("45m");
  });

  it("treats no runtime and a zero runtime the same", () => {
    // Series carry no runtime at all; either way there is nothing to print.
    expect(formatRuntime(undefined)).toBeNull();
    expect(formatRuntime(0)).toBeNull();
  });
});

describe("watchLinks", () => {
  it("offers somewhere to watch a released title", () => {
    const links = watchLinks(byId("endgame"));
    const watch = links.find((l) => l.kind === "watch")!;
    expect(watch.href).toContain("justwatch.com/us/search");
    expect(searchQuery("endgame")).toBe("Avengers: Endgame");
  });

  it("offers nowhere to watch something that has not come out", () => {
    /*
     * The link would resolve to an empty JustWatch page, which reads as "we
     * looked and there is nothing" rather than "this is not out yet".
     */
    const upcoming = TITLES.filter((t) => t.upcoming);
    expect(upcoming.length).toBeGreaterThan(0);
    for (const title of upcoming) {
      expect(
        watchLinks(title).some((l) => l.kind === "watch"),
        title.id,
      ).toBe(false);
    }
  });

  it("strips our own season labels out of the search term", () => {
    // "(Season 2)" is this map's way of splitting a run into rows. No
    // storefront has ever called it that.
    expect(searchQuery("loki-s2")).toBe("Loki");
  });

  it("strips a disambiguating year out of the search term", () => {
    // Ditto "(2015)": ours, to tell three Fantastic Fours apart.
    expect(searchQuery("fant4stic")).toBe("Fantastic Four");
    expect(searchQuery("daredevil-2003")).toBe("Daredevil");
  });

  it("spells the ellipsis out for a search box", () => {
    expect(searchQuery("what-if-s1")).toBe("What If...?");
  });

  it("leaves a year that is part of the actual name alone", () => {
    /*
     * The regex is anchored to the end and to our two shapes on purpose. A
     * bare `\(\d{4}\)` swept anywhere in the string would eat a real title.
     */
    for (const title of TITLES) {
      if (title.upcoming) continue;
      const q = searchQuery(title.id)!;
      expect(q.length, title.id).toBeGreaterThan(0);
      expect(q, title.id).not.toMatch(/\(Season \d+\)|\(\d{4}\)/);
      expect(q, title.id).not.toMatch(/…/);
    }
  });

  it("links to IMDb where the dataset has an id, and nowhere where it does not", () => {
    for (const title of TITLES) {
      const imdb = watchLinks(title).find((l) => l.kind === "reference");
      const id = METADATA[title.id]?.imdb;
      if (id) {
        expect(imdb?.href, title.id).toBe(`https://www.imdb.com/title/${id}/`);
      } else {
        expect(imdb, title.id).toBeUndefined();
      }
    }
  });

  it("gives an unreleased title its reference link even so", () => {
    // Announced films have an IMDb page long before they have a storefront.
    const announced = TITLES.filter((t) => t.upcoming && METADATA[t.id]?.imdb);
    expect(announced.length).toBeGreaterThan(0);
    for (const title of announced) {
      expect(
        watchLinks(title).map((l) => l.kind),
        title.id,
      ).toEqual(["reference"]);
    }
  });

  it("produces valid, escaped URLs for every title", () => {
    for (const title of TITLES) {
      for (const link of watchLinks(title)) {
        expect(() => new URL(link.href), title.id).not.toThrow();
        expect(link.href, title.id).toMatch(/^https:\/\//);
        expect(link.label, title.id).toBeTruthy();
      }
    }
  });
});
