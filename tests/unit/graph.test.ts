/**
 * The graph is the half of this app with nothing to check by eye. Everything it
 * computes reaches the screen as a camera position, a lit border or a row of
 * the watch order, where a wrong answer looks like a design decision rather
 * than a bug — which is how thirteen cards spent months parked under the
 * controls sheet with nobody able to say whether they were missing or hidden.
 *
 * These run against the real dataset, not fixtures. It is static, `pnpm
 * data:check` already guarantees it is internally consistent, and a six-node
 * fixture would not catch what actually goes wrong in here: a `maxKind` filter
 * that prunes the first edge and not the walk behind it, or a topological sort
 * that silently drops everything downstream of one bad edge.
 */
import { describe, expect, it } from "vitest";

import { DEPENDENCIES } from "~/data/dependencies";
import { TITLES, TITLE_BY_ID } from "~/data/titles";
import type { DepKind, RealityId, Title } from "~/data/types";
import {
  CARD,
  COL_GAP,
  cardOf,
  designationOf,
  layoutTitles,
  prerequisitesOf,
  REALITIES,
  releaseRank,
  ROW_GAP,
  timelineRows,
  unlockedBy,
  watchOrder,
} from "~/lib/graph";

const KINDS: DepKind[] = ["essential", "recommended", "optional"];

const ALL_IDS = TITLES.map((t) => t.id);

/** Every year the dataset covers, oldest first. */
const YEARS = [...new Set(TITLES.map((t) => t.year))].sort((a, b) => a - b);

const titlesIn = (year: number) => TITLES.filter((t) => t.year === year);

describe("prerequisitesOf", () => {
  it("returns nothing for a title you can start on", () => {
    // Iron Man is the top of the MCU chain and depends on nothing.
    expect([...prerequisitesOf("iron-man")]).toEqual([]);
  });

  it("walks the whole chain, not just the stated parents", () => {
    const before = prerequisitesOf("endgame");
    // Endgame names three prerequisites; Iron Man is four hops behind them.
    expect(before.has("infinity-war")).toBe(true);
    expect(before.has("avengers")).toBe(true);
    expect(before.has("iron-man")).toBe(true);
    expect(before.size).toBeGreaterThan(3);
  });

  it("never includes the title itself", () => {
    // The graph is acyclic (enforced by pnpm data:check), so reaching yourself
    // would mean the walk had started from the wrong end.
    for (const id of ALL_IDS) {
      for (const kind of KINDS) {
        expect(prerequisitesOf(id, kind).has(id)).toBe(false);
      }
    }
  });

  it("prunes the edge itself when it is weaker than maxKind", () => {
    /*
     * `iron-man → incredible-hulk` is the only edge into The Incredible Hulk
     * and it is optional — the Stark cameo in the last scene and nothing more.
     * So the whole prerequisite list appears and disappears with the filter.
     */
    expect([...prerequisitesOf("incredible-hulk", "optional")]).toEqual([
      "iron-man",
    ]);
    expect([...prerequisitesOf("incredible-hulk", "recommended")]).toEqual([]);
    expect([...prerequisitesOf("incredible-hulk", "essential")]).toEqual([]);
  });

  it("prunes everything behind a weak edge, not only the edge", () => {
    /*
     * The regression this is really guarding. Guardians hangs off the rest of
     * the MCU by one optional edge from The Dark World, so filtering that edge
     * out has to take the seven titles upstream of it with it. A filter that
     * checked only the first hop would leave them all reachable.
     */
    expect(prerequisitesOf("guardians", "optional").size).toBe(7);
    expect(prerequisitesOf("guardians", "essential").size).toBe(0);
  });

  it("only ever grows as the filter loosens", () => {
    for (const id of ALL_IDS) {
      const essential = prerequisitesOf(id, "essential");
      const recommended = prerequisitesOf(id, "recommended");
      const optional = prerequisitesOf(id, "optional");
      for (const x of essential) expect(recommended.has(x)).toBe(true);
      for (const x of recommended) expect(optional.has(x)).toBe(true);
    }
  });

  it("defaults to the loosest filter", () => {
    for (const id of ALL_IDS) {
      expect([...prerequisitesOf(id)]).toEqual([
        ...prerequisitesOf(id, "optional"),
      ]);
    }
  });
});

describe("unlockedBy", () => {
  it("is exactly the inverse of prerequisitesOf, at every strength", () => {
    /*
     * Both directions share one `walk`, which reconstructs the edge key from
     * whichever adjacency map it was handed — the one line in graph.ts where
     * the two directions can silently disagree. If the children walk built the
     * key backwards it would filter against the wrong edge's kind, and this is
     * what would notice.
     */
    for (const kind of KINDS) {
      const forward = new Set<string>();
      for (const id of ALL_IDS) {
        for (const before of prerequisitesOf(id, kind)) {
          forward.add(`${before}->${id}`);
        }
      }
      const backward = new Set<string>();
      for (const id of ALL_IDS) {
        for (const after of unlockedBy(id, kind)) {
          backward.add(`${id}->${after}`);
        }
      }
      expect([...backward].sort()).toEqual([...forward].sort());
    }
  });

  it("prunes on maxKind too", () => {
    // Iron Man reaches most of the MCU, but a chunk of it only through edges
    // weaker than essential.
    expect(unlockedBy("iron-man", "essential").size).toBeLessThan(
      unlockedBy("iron-man", "optional").size,
    );
  });
});

describe("watchOrder", () => {
  const positionsIn = (order: Title[]) =>
    new Map(order.map((t, i) => [t.id, i]));

  it("emits every title it was given, exactly once", () => {
    const order = watchOrder(ALL_IDS);
    expect(order).toHaveLength(TITLES.length);
    expect(new Set(order.map((t) => t.id)).size).toBe(TITLES.length);
  });

  it("puts every dependency before its dependent", () => {
    /*
     * The property the whole feature rests on. Kahn's algorithm returns a
     * partial list rather than throwing when it stalls, so a bad edge does not
     * fail loudly — it just quietly stops printing the back half of the order.
     */
    const at = positionsIn(watchOrder(ALL_IDS));
    for (const dep of DEPENDENCIES) {
      expect(at.get(dep.from)!).toBeLessThan(at.get(dep.to)!);
    }
  });

  it("breaks ties by release date at every step", () => {
    /*
     * "Topologically sorted" alone permits an order that jumps from 2008 to
     * 2019 and back. The stated behaviour is stronger: at each step the next
     * title is the earliest-released of everything currently watchable. Ranks
     * are compared rather than ids because a year with no stated order gives
     * several titles the same rank, and any of them is a correct answer.
     */
    const parents = new Map<string, string[]>();
    for (const dep of DEPENDENCIES) {
      parents.set(dep.to, [...(parents.get(dep.to) ?? []), dep.from]);
    }

    const order = watchOrder(ALL_IDS);
    const seen = new Set<string>();
    for (const title of order) {
      const watchable = ALL_IDS.filter(
        (id) =>
          !seen.has(id) && (parents.get(id) ?? []).every((p) => seen.has(p)),
      );
      const earliest = Math.min(
        ...watchable.map((id) => releaseRank(TITLE_BY_ID.get(id)!)),
      );
      expect(releaseRank(title)).toBe(earliest);
      seen.add(title.id);
    }
  });

  it("orders a subset without dragging in titles outside it", () => {
    // What the detail panel actually asks for: one title and its own history.
    const ids = new Set([...prerequisitesOf("endgame"), "endgame"]);
    const order = watchOrder(ids);
    expect(order.map((t) => t.id).sort()).toEqual([...ids].sort());
    // Everything in the set precedes Endgame, so it can only come last.
    expect(order.at(-1)!.id).toBe("endgame");
  });

  it("takes a set or an array, and copes with an empty one", () => {
    expect(watchOrder([])).toEqual([]);
    expect(watchOrder(new Set(["iron-man"])).map((t) => t.id)).toEqual([
      "iron-man",
    ]);
    expect(watchOrder(["avengers", "iron-man"]).map((t) => t.id)).toEqual([
      "iron-man",
      "avengers",
    ]);
  });
});

describe("timelineRows", () => {
  const rows = timelineRows(TITLES);

  it("gives every year one row, oldest at the bottom", () => {
    expect(rows.map((r) => r.year)).toEqual(YEARS);
    // Newest year anchored at y = 0; every older year sits below it.
    expect(Math.min(...rows.map((r) => r.y))).toBe(0);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1]!.y).toBeGreaterThan(rows[i]!.y);
    }
  });

  it("stacks the bands with exactly one gap between them", () => {
    // Rows run oldest-first, so index i+1 is the row ABOVE on screen.
    for (let i = 1; i < rows.length; i++) {
      const older = rows[i - 1]!;
      const newer = rows[i]!;
      expect(older.y).toBe(newer.y + newer.height + ROW_GAP);
    }
  });

  it("sizes a row to its tallest card, with a series-height floor", () => {
    for (const row of rows) {
      const tallest = Math.max(...titlesIn(row.year).map((t) => cardOf(t).h));
      expect(row.height).toBe(Math.max(tallest, CARD.series.h));
    }
  });

  it("counts the titles in the row", () => {
    for (const row of rows) {
      expect(row.count).toBe(titlesIn(row.year).length);
    }
  });

  it("bridges the spine to the row below only when the phase continues", () => {
    // Not a vacuous check: several MCU phases run across consecutive years.
    expect(rows.filter((r) => r.spine > r.height).length).toBeGreaterThan(0);

    for (const [i, row] of rows.entries()) {
      const below = rows[i - 1];
      const continues = !!row.phase && below?.phase === row.phase;
      expect(row.spine).toBe(continues ? row.height + ROW_GAP : row.height);
    }
  });

  it("caps a phase run at its two ends and nowhere in between", () => {
    /*
     * A rounded cap mid-run reads as a seam, which is the whole reason the
     * flags exist. Stated here as the property rather than the arithmetic: in
     * any unbroken run of one phase, exactly the newest row caps its top and
     * exactly the oldest caps its bottom.
     */
    const phased = rows.filter((r) => r.phase);
    expect(phased.length).toBeGreaterThan(0);

    for (const [i, row] of rows.entries()) {
      if (!row.phase) continue;
      expect(row.capBottom).toBe(rows[i - 1]?.phase !== row.phase);
      expect(row.capTop).toBe(rows[i + 1]?.phase !== row.phase);
    }
  });

  it("leaves a year with no phased title alone rather than guessing", () => {
    /*
     * A Fox-only year, or any year once the MCU is filtered out. It gets no
     * phase and therefore no spine, so it must never bridge into its
     * neighbour's.
     */
    const unphased = rows.filter((r) => !r.phase);
    expect(unphased.length).toBeGreaterThan(0);
    for (const row of unphased) {
      expect(row.phase).toBeUndefined();
      expect(row.spine).toBe(row.height);
    }
  });

  it("picks the phase most of the row carries", () => {
    for (const row of rows) {
      if (!row.phase) continue;
      const phases = titlesIn(row.year)
        .map((t) => t.phase)
        .filter((p) => p !== undefined);
      const mine = phases.filter((p) => p === row.phase).length;
      for (const other of new Set(phases)) {
        expect(mine).toBeGreaterThanOrEqual(
          phases.filter((p) => p === other).length,
        );
      }
    }
  });

  it("re-lays out from whatever it is given", () => {
    // The filter chips hand it a subset; years with nothing left disappear.
    const fox = TITLES.filter((t) => t.reality === "earth-10005");
    const foxRows = timelineRows(fox);
    expect(foxRows.map((r) => r.year)).toEqual(
      [...new Set(fox.map((t) => t.year))].sort((a, b) => a - b),
    );
  });
});

describe("layoutTitles", () => {
  const positions = layoutTitles(TITLES);

  it("places every title and nothing else", () => {
    expect([...positions.keys()].sort()).toEqual([...ALL_IDS].sort());
  });

  it("centres each year's row on x = 0", () => {
    for (const year of YEARS) {
      const row = titlesIn(year);
      const left = Math.min(...row.map((t) => positions.get(t.id)!.x));
      const right = Math.max(
        ...row.map((t) => positions.get(t.id)!.x + cardOf(t).w),
      );
      // Half-pixel slack: an odd total width cannot straddle zero exactly.
      expect(Math.abs(left + right)).toBeLessThanOrEqual(1);
    }
  });

  it("leaves exactly one gap between cards and never overlaps them", () => {
    for (const year of YEARS) {
      const row = titlesIn(year)
        .map((t) => ({ ...positions.get(t.id)!, w: cardOf(t).w }))
        .sort((a, b) => a.x - b.x);
      for (let i = 1; i < row.length; i++) {
        expect(row[i]!.x - (row[i - 1]!.x + row[i - 1]!.w)).toBe(COL_GAP);
      }
    }
  });

  it("centres each card in its row's band", () => {
    const bands = new Map(timelineRows(TITLES).map((r) => [r.year, r]));
    for (const title of TITLES) {
      const band = bands.get(title.year)!;
      const { y } = positions.get(title.id)!;
      expect(y).toBe(band.y + (band.height - cardOf(title).h) / 2);
    }
  });

  it("lays out only what it is given", () => {
    const subset = TITLES.filter((t) => t.year >= 2020);
    const partial = layoutTitles(subset);
    expect(partial.size).toBe(subset.length);
    // Re-centred around what is left, not around a hole where the rest was.
    const row2020 = subset.filter((t) => t.year === 2020);
    const left = Math.min(...row2020.map((t) => partial.get(t.id)!.x));
    const right = Math.max(
      ...row2020.map((t) => partial.get(t.id)!.x + cardOf(t).w),
    );
    expect(Math.abs(left + right)).toBeLessThanOrEqual(1);
  });
});

describe("releaseRank", () => {
  it("sorts by year before anything else", () => {
    for (const a of TITLES) {
      for (const b of TITLES) {
        if (a.year >= b.year) continue;
        expect(releaseRank(a)).toBeLessThan(releaseRank(b));
      }
    }
  });

  it("breaks a year by the stated release order", () => {
    const base = TITLES.find((t) => t.id === "iron-man")!;
    expect(releaseRank({ ...base, year: 2012, order: 1 })).toBeLessThan(
      releaseRank({ ...base, year: 2012, order: 2 }),
    );
  });

  it("drops a title with no stated order into the middle of its year", () => {
    /*
     * 50 rather than 0: an unordered title should sort after an explicit early
     * release and before an explicit late one, not ahead of the whole year.
     */
    const base = TITLES.find((t) => t.id === "iron-man")!;
    const loose = releaseRank({ ...base, year: 2012, order: undefined });
    expect(loose).toBe(201250);
    expect(loose).toBeGreaterThan(
      releaseRank({ ...base, year: 2012, order: 1 }),
    );
    expect(loose).toBeLessThan(releaseRank({ ...base, year: 2012, order: 99 }));
  });
});

describe("designationOf", () => {
  const REALITY_IDS = Object.keys(REALITIES) as RealityId[];

  it("prints the Earth number where a film says one", () => {
    expect(designationOf("earth-616")).toBe("Earth-616");
    expect(designationOf("earth-10005")).toBe("Earth-10005");
  });

  it("says so rather than inventing a number where there is none", () => {
    // The 2015 Fantastic Four reboot has no designation on record anywhere.
    expect(designationOf("fox-ff-2015")).toBe("unlisted reality");
    for (const id of REALITY_IDS) {
      if (REALITIES[id].designation) continue;
      expect(designationOf(id)).toBe("unlisted reality");
      // Never the reality's own label or id dressed up as a designation.
      expect(designationOf(id)).not.toBe(REALITIES[id].label);
      expect(designationOf(id)).not.toBe(id);
    }
  });

  it("answers for every reality", () => {
    for (const id of REALITY_IDS) {
      expect(designationOf(id)).toBeTruthy();
    }
  });
});
