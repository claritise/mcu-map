import { CHARACTER_BY_ID } from "~/data/characters";
import { DEPENDENCIES } from "~/data/dependencies";
import { TITLES, TITLE_BY_ID } from "~/data/titles";
import type { BannerId, DepKind, Medium, RealityId, Title } from "~/data/types";

/**
 * Films are posters, series and specials are landscape key art, the shapes the
 * artwork actually comes in. Rows are as tall as the tallest card.
 */
export const CARD: Record<Medium, { w: number; h: number }> = {
  film: { w: 150, h: 222 },
  series: { w: 244, h: 138 },
  special: { w: 244, h: 138 },
};

export const cardOf = (t: Title) => CARD[t.medium];

export const ROW_H = CARD.film.h;

export const DEP_RANK: Record<DepKind, number> = {
  essential: 0,
  recommended: 1,
  optional: 2,
};

/**
 * The banners: who shot it. A banner exists to group realities in the filter
 * panel and to keep one studio's films sitting together in a timeline row.
 */
export const BANNERS: Record<BannerId, { label: string; lane: number }> = {
  marvel: { label: "Marvel Studios", lane: 0 },
  fox: { label: "20th Century Fox", lane: 1 },
  sony: { label: "Sony", lane: 2 },
};

/**
 * Every reality the map covers, keyed by the designation where one exists.
 *
 * `sourcing` is not decoration. Earth-616, Earth-838 and Earth-10005 are said
 * out loud on screen; Earth-828 was confirmed for First Steps; the two Fox
 * handbook numbers appear in Marvel's own reference material but in no film;
 * and the 2015 Fantastic Four reboot has no designation anyone can point to, so
 * it gets an internal id and says so rather than inventing one.
 *
 * Warm hues are Marvel Studios, cool ones Fox — so a glance at the map reads
 * the split before it reads a single label.
 */
export const REALITIES: Record<
  RealityId,
  {
    label: string;
    designation?: string;
    banner: BannerId;
    accent: string;
    lane: number;
    sourcing: "screen" | "handbook" | "unofficial";
    blurb: string;
  }
> = {
  "earth-616": {
    label: "Sacred Timeline",
    designation: "Earth-616",
    banner: "marvel",
    accent: "#e23636",
    lane: 0,
    sourcing: "screen",
    blurb: "The MCU proper, from Iron Man onward.",
  },
  "earth-838": {
    label: "Illuminati's Earth",
    designation: "Earth-838",
    banner: "marvel",
    accent: "#f2766c",
    lane: 1,
    sourcing: "screen",
    blurb: "The world Strange and America land on in Multiverse of Madness.",
  },
  "earth-828": {
    label: "First Steps Earth",
    designation: "Earth-828",
    banner: "marvel",
    accent: "#ffb27a",
    lane: 2,
    sourcing: "screen",
    blurb:
      "The retro-futurist world the Fantastic Four are the only heroes of.",
  },
  "earth-10005": {
    label: "Fox X-Men",
    designation: "Earth-10005",
    banner: "fox",
    accent: "#3b82f6",
    lane: 0,
    sourcing: "screen",
    blurb:
      "Twenty years of X-Men, Deadpool included — named by the TVA itself.",
  },
  "earth-121698": {
    label: "Fox Fantastic Four",
    designation: "Earth-121698",
    banner: "fox",
    accent: "#38bdf8",
    lane: 1,
    sourcing: "handbook",
    blurb: "The 2005 and 2007 Fantastic Four films.",
  },
  "fox-ff-2015": {
    label: "Fant4stic",
    banner: "fox",
    accent: "#818cf8",
    lane: 2,
    sourcing: "unofficial",
    blurb: "The 2015 reboot: its own reality, and no designation on record.",
  },
  "earth-701306": {
    label: "Fox street level",
    designation: "Earth-701306",
    banner: "fox",
    accent: "#a855f7",
    lane: 3,
    sourcing: "handbook",
    blurb: "Affleck's Daredevil and the Elektra spin-off.",
  },
  "earth-96283": {
    label: "Raimi's Spider-Man",
    designation: "Earth-96283",
    banner: "sony",
    accent: "#22c55e",
    lane: 0,
    sourcing: "handbook",
    blurb: "Tobey Maguire's trilogy — and half the villains of No Way Home.",
  },
  "earth-120703": {
    label: "The Amazing Spider-Man",
    designation: "Earth-120703",
    banner: "sony",
    accent: "#14b8a6",
    lane: 1,
    sourcing: "handbook",
    blurb: "Andrew Garfield's two films, Gwen Stacy and all.",
  },
  "earth-688": {
    label: "Sony's Spider-Man Universe",
    designation: "Earth-688",
    banner: "sony",
    accent: "#84cc16",
    lane: 2,
    sourcing: "handbook",
    blurb:
      "Venom, Morbius, Kraven and Madame Web: a Spider-Man universe without one.",
  },
  "earth-1610b": {
    label: "Miles' Brooklyn",
    designation: "Earth-1610",
    banner: "sony",
    accent: "#facc15",
    lane: 3,
    sourcing: "screen",
    blurb:
      "The animated Spider-Verse home world — the films put the number on screen.",
  },
  /*
   * Character-only realities. Nothing on this map is SET here, but people from
   * these worlds walk through films that are, and the animated films name them
   * out loud — including a second Earth-616 that has nothing to do with the
   * MCU's, which is exactly why realities need ids of their own.
   */
  "earth-616-atsv": {
    label: "Peter B.'s Earth",
    designation: "Earth-616",
    banner: "sony",
    accent: "#fbbf24",
    lane: 4,
    sourcing: "screen",
    blurb:
      "Into the Spider-Verse's Earth-616. Same number as the MCU, different world.",
  },
  "earth-65": {
    label: "Gwen's Earth",
    designation: "Earth-65",
    banner: "sony",
    accent: "#f472b6",
    lane: 5,
    sourcing: "screen",
    blurb: "Where Gwen Stacy is the one who got bitten.",
  },
  "earth-90214": {
    label: "Spider-Man Noir's 1933",
    designation: "Earth-90214",
    banner: "sony",
    accent: "#a8a29e",
    lane: 7,
    sourcing: "screen",
    blurb: "Black-and-white New York, and a Spider-Man who fights Nazis.",
  },
  "earth-928": {
    label: "Nueva York 2099",
    designation: "Earth-928",
    banner: "sony",
    accent: "#fb923c",
    lane: 6,
    sourcing: "screen",
    blurb: "Miguel O'Hara's future, and the Spider-Society's base.",
  },
};

/**
 * Realities you can actually filter: the ones some title is set in. Earth-838
 * is a real reality with real people on it, but no title on this map takes
 * place there — Multiverse of Madness only visits — so it would be a switch
 * that does nothing.
 */
export const ALL_REALITIES = (Object.keys(REALITIES) as RealityId[]).filter(
  (r) => TITLES.some((t) => t.reality === r),
);

/** Realities grouped under the banner that shot them, in display order. */
export const REALITIES_BY_BANNER = (Object.keys(BANNERS) as BannerId[])
  .sort((a, b) => BANNERS[a].lane - BANNERS[b].lane)
  .map((banner) => ({
    banner,
    ...BANNERS[banner],
    realities: ALL_REALITIES.filter((r) => REALITIES[r].banner === banner).sort(
      (a, b) => REALITIES[a].lane - REALITIES[b].lane,
    ),
  }))
  .filter((group) => group.realities.length > 0);

/**
 * What to print where a designation goes. Realities without one say so rather
 * than repeating their own name back at you — or worse, inventing a number.
 */
export const designationOf = (reality: RealityId) =>
  REALITIES[reality].designation ?? "unlisted reality";

/** Sort key that keeps a banner's realities adjacent inside a timeline row. */
const realityLane = (reality: RealityId) =>
  BANNERS[REALITIES[reality].banner].lane * 100 + REALITIES[reality].lane;

/** Adjacency built once; the dataset is static. */
const parents = new Map<string, string[]>();
const children = new Map<string, string[]>();
for (const dep of DEPENDENCIES) {
  parents.set(dep.to, [...(parents.get(dep.to) ?? []), dep.from]);
  children.set(dep.from, [...(children.get(dep.from) ?? []), dep.to]);
}

export const titlesByCharacter = new Map<string, string[]>();
for (const title of TITLES) {
  // A title can list one character twice (Days of Future Past casts both the
  // young and the old Xavier), but it should still count as a single credit.
  for (const characterId of new Set(
    title.cast.map((entry) => entry.characterId),
  )) {
    titlesByCharacter.set(characterId, [
      ...(titlesByCharacter.get(characterId) ?? []),
      title.id,
    ]);
  }
}

export const releaseRank = (t: Title) => t.year * 100 + (t.order ?? 50);

const KIND_OF_EDGE = new Map<string, number>(
  DEPENDENCIES.map(
    (dep) => [`${dep.from}->${dep.to}`, DEP_RANK[dep.kind]] as const,
  ),
);

function walk(
  start: string,
  edges: Map<string, string[]>,
  maxKind: DepKind,
): Set<string> {
  const allowed = DEP_RANK[maxKind];
  const seen = new Set<string>();
  const queue = [start];
  while (queue.length) {
    const current = queue.shift()!;
    for (const next of edges.get(current) ?? []) {
      const key =
        edges === parents ? `${next}->${current}` : `${current}->${next}`;
      if ((KIND_OF_EDGE.get(key) ?? 99) > allowed) continue;
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

/** Everything you should watch before `id`, at or below the given strength. */
export const prerequisitesOf = (id: string, maxKind: DepKind = "optional") =>
  walk(id, parents, maxKind);

/** Everything that leans on `id`. */
export const unlockedBy = (id: string, maxKind: DepKind = "optional") =>
  walk(id, children, maxKind);

export const directParents = (id: string) =>
  DEPENDENCIES.filter((dep) => dep.to === id);

export const directChildren = (id: string) =>
  DEPENDENCIES.filter((dep) => dep.from === id);

/**
 * A watchable ordering: dependencies first, ties broken by release date.
 * (Kahn's algorithm over the induced subgraph.)
 */
export function watchOrder(ids: Set<string> | string[]): Title[] {
  const set = new Set(ids);
  const indegree = new Map<string, number>();
  for (const id of set) indegree.set(id, 0);
  for (const dep of DEPENDENCIES) {
    if (set.has(dep.from) && set.has(dep.to)) {
      indegree.set(dep.to, (indegree.get(dep.to) ?? 0) + 1);
    }
  }
  const ready = [...set].filter((id) => (indegree.get(id) ?? 0) === 0);
  const out: Title[] = [];
  while (ready.length) {
    ready.sort(
      (a, b) =>
        releaseRank(TITLE_BY_ID.get(a)!) - releaseRank(TITLE_BY_ID.get(b)!),
    );
    const id = ready.shift()!;
    out.push(TITLE_BY_ID.get(id)!);
    for (const dep of DEPENDENCIES) {
      if (dep.from !== id || !set.has(dep.to)) continue;
      const left = (indegree.get(dep.to) ?? 1) - 1;
      indegree.set(dep.to, left);
      if (left === 0) ready.push(dep.to);
    }
  }
  return out;
}

export const ROW_GAP = 46;
export const COL_GAP = 26;

/**
 * The year rail is drawn in screen space (see YearRail). It costs the canvas no
 * layout, but the camera still has to keep clear of it so a poster never slides
 * underneath a year.
 */
export const GUTTER_W = 0;

export const RAIL_W = 124;

/** Breathing room between the rail's phase spine and the first poster. */
export const RAIL_GAP = 28;

/**
 * Phone-sized rail. 124px is a third of a 375px screen, which leaves the
 * posters nowhere to go, so the year keeps its spine but loses the phase word.
 */
export const RAIL_W_COMPACT = 56;
export const RAIL_GAP_COMPACT = 10;

/** Slack above the newest row and below the oldest, in flow units. */
export const EDGE_MARGIN = 110;

/**
 * One row per release year, oldest at the bottom, so dependency arrows all
 * point upward through time. Within a row, titles are grouped by banner, then
 * by reality, then by release order.
 */
function rowOf(titles: Title[], year: number) {
  return titles
    .filter((t) => t.year === year)
    .sort(
      (a, b) =>
        realityLane(a.reality) - realityLane(b.reality) ||
        (a.order ?? 0) - (b.order ?? 0) ||
        a.name.localeCompare(b.name),
    );
}

const rowWidth = (row: Title[]) =>
  row.reduce((sum, t) => sum + cardOf(t).w, 0) +
  Math.max(0, row.length - 1) * COL_GAP;

/** Row height follows its content: a year of only series is a short row. */
const rowHeight = (row: Title[]) =>
  Math.max(...row.map((t) => cardOf(t).h), CARD.series.h);

/** Newest year at y = 0, each older year stacked below it. */
function rowTops(titles: Title[]) {
  const years = [...new Set(titles.map((t) => t.year))].sort((a, b) => b - a);
  const tops = new Map<number, { top: number; height: number }>();
  let top = 0;
  for (const year of years) {
    const height = rowHeight(rowOf(titles, year));
    tops.set(year, { top, height });
    top += height + ROW_GAP;
  }
  return tops;
}

function timelineLayout(titles: Title[]) {
  const positions = new Map<string, { x: number; y: number }>();
  const tops = rowTops(titles);

  for (const [year, row] of groupByYear(titles)) {
    const band = tops.get(year)!;
    let x = -rowWidth(row) / 2;
    for (const t of row) {
      const card = cardOf(t);
      positions.set(t.id, { x, y: band.top + (band.height - card.h) / 2 });
      x += card.w + COL_GAP;
    }
  }
  return positions;
}

function groupByYear(titles: Title[]) {
  const years = [...new Set(titles.map((t) => t.year))].sort((a, b) => a - b);
  return years.map((year) => [year, rowOf(titles, year)] as const);
}

/**
 * One hue per MCU phase, warm through the Infinity Saga and cold through the
 * Multiverse one. Used for the gutter spine, so phases read as blocks of the
 * timeline before you read a single word.
 */
export const PHASE_META: Record<string, { color: string; short: string }> = {
  "Phase One": { color: "#e23636", short: "Phase 1" },
  "Phase Two": { color: "#f59e0b", short: "Phase 2" },
  "Phase Three": { color: "#8b5cf6", short: "Phase 3" },
  "Phase Four": { color: "#38bdf8", short: "Phase 4" },
  "Phase Five": { color: "#ec4899", short: "Phase 5" },
  "Phase Six": { color: "#34d399", short: "Phase 6" },
};

/**
 * The phase a row belongs to: whichever phase most of its titles carry, ties
 * broken by release order. Rows with no phased title (a Fox-only year, or the
 * MCU filtered out) get nothing rather than a guess.
 */
function phaseOf(row: Title[]) {
  const counts = new Map<string, number>();
  for (const t of [...row].sort((a, b) => releaseRank(a) - releaseRank(b))) {
    if (t.phase) counts.set(t.phase, (counts.get(t.phase) ?? 0) + 1);
  }
  let best: string | undefined;
  for (const [phase, count] of counts) {
    if (!best || count > counts.get(best)!) best = phase;
  }
  return best;
}

/** Year gutter labels: one per row, sized to the row they label. */
export function timelineRows(titles: Title[]) {
  const tops = rowTops(titles);
  const left =
    -Math.max(
      ...[...new Set(titles.map((t) => t.year))].map((y) =>
        rowWidth(rowOf(titles, y)),
      ),
      0,
    ) /
      2 -
    GUTTER_W;

  const rows = groupByYear(titles).map(([year, row]) => ({
    year,
    count: row.length,
    phase: phaseOf(row),
    x: left,
    y: tops.get(year)!.top,
    height: tops.get(year)!.height,
  }));

  /*
   * Rows run oldest-first here but oldest-at-the-bottom on screen, so a row's
   * downstairs neighbour is the one before it. When they share a phase the
   * spine bridges the gap between them and the phase reads as one unbroken
   * stripe instead of a dashed line.
   */
  return rows.map((row, i) => {
    const bridges = !!row.phase && rows[i - 1]?.phase === row.phase;
    return {
      ...row,
      spine: bridges ? row.height + ROW_GAP : row.height,
      // Round only where a phase actually starts and ends; a rounded cap
      // mid-run reads as a seam.
      capTop: rows[i + 1]?.phase !== row.phase,
      capBottom: !bridges,
    };
  });
}

export function layoutTitles(titles: Title[]) {
  return timelineLayout(titles);
}

export const characterName = (id: string) =>
  CHARACTER_BY_ID.get(id)?.name ?? id;
