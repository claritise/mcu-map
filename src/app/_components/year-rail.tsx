"use client";

import type { Title } from "~/data/types";
import { PHASE_META, RAIL_W, timelineRows } from "~/lib/graph";
import { useT } from "~/i18n";

/** #rrggbb → rgba(), so one phase hue can carry the spine and its ghosts. */
const tint = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const SPINE_W = 5;

/** Where the year column ends, left of the phase name and the spine. */
const PHASE_COL = 34;

/** Four digits, set vertically, run about this many ems tall. */
const YEAR_EM = 2.7;
/** Clear air between one year and the next, so two never read as one number. */
const YEAR_GAP = 8;
/** Below this a year is a smudge, not a number. Nothing is drawn smaller. */
const YEAR_MIN = 11;
const YEAR_MAX = 72;

/** Ticks people already read timelines by: every year, other, fifth, tenth. */
const YEAR_STEPS = [1, 2, 5, 10];

type Row = ReturnType<typeof timelineRows>[number];

/**
 * Which years get a label, and how much vertical room each one has to itself.
 *
 * Rows shrink with the zoom but a four-digit year has a floor, so past a
 * certain point the rail turns into a column of overlapping digits. Rather
 * than let that happen, thin the labels onto a calendar step — every other
 * year, every fifth, every tenth — and let the spine, which reads at any size,
 * go on carrying the phases in between.
 *
 * Rows are stacked one after another rather than by calendar distance, so a
 * missing year (there is no 2001) leaves two multiples of a step sitting on
 * neighbouring rows. Judging a step by its TIGHTEST pair let that single
 * collision throw out the whole step: at fit zoom every-other-year fitted
 * everywhere except 2000/2002, and the rail fell back to every fifth year and
 * five labels. So the step is judged by the room it usually leaves, and the
 * odd pair that still collides loses one of its two labels below.
 */
function yearSlots(rows: Row[], zoom: number) {
  const centre = (row: Row) => (row.y + row.height / 2) * zoom;
  const need = YEAR_MIN * YEAR_EM + YEAR_GAP;
  const gap = (a: Row | undefined, b: Row | undefined) =>
    a && b ? Math.abs(centre(a) - centre(b)) : Infinity;

  for (const step of YEAR_STEPS) {
    const kept =
      step === 1 ? rows : rows.filter((row) => row.year % step === 0);
    const coarsest = step === YEAR_STEPS[YEAR_STEPS.length - 1];
    if (!coarsest && typicalGap(kept, gap) < need) continue;

    /*
     * Whatever the step leaves too tight, drop — keeping the rounder year of
     * the pair, so the rail stays anchored on the decades and half-decades
     * people look for rather than on whichever side of the gap came first.
     */
    const placed: Row[] = [];
    for (const row of kept) {
      const prev = placed[placed.length - 1];
      if (gap(prev, row) >= need) {
        placed.push(row);
      } else if (
        roundness(row.year) > roundness(prev!.year) &&
        gap(placed[placed.length - 2], row) >= need
      ) {
        placed[placed.length - 1] = row;
      }
    }

    return new Map<number, number>(
      placed.map((row, i) => [
        row.year,
        Math.min(gap(placed[i - 1], row), gap(placed[i + 1], row)),
      ]),
    );
  }
  return new Map<number, number>();
}

/** The gap a step leaves between labels in the general case, outliers aside. */
function typicalGap(kept: Row[], gap: (a?: Row, b?: Row) => number) {
  if (kept.length < 2) return Infinity;
  const gaps = kept.slice(1).map((row, i) => gap(kept[i], row));
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)]!;
}

/** 2020 beats 2015 beats 2014, when only one of a pair can keep its label. */
const roundness = (year: number) =>
  year % 10 === 0 ? 2 : year % 5 === 0 ? 1 : 0;

/**
 * Year labels live in SCREEN space, not on the canvas, pinned to the left edge
 * of the map pane. That means the poster rows can fill the whole viewport at
 * maximum zoom without a year ever being pushed off the side, and each label
 * still tracks the row it belongs to as you scroll.
 *
 * The MCU phase rides the same rail: a thick bar in the phase's colour down the
 * inside edge, its name beside it, and the year ghosted in the same hue, so
 * consecutive rows of one phase read as a single unbroken stripe.
 */
export function YearRail({
  titles,
  viewport,
  height,
  width = RAIL_W,
  compact = false,
}: {
  titles: Title[];
  viewport: { y: number; zoom: number };
  height: number;
  width?: number;
  /** Phones: keep the year and the spine, drop the phase name — no room. */
  compact?: boolean;
}) {
  const rows = timelineRows(titles);
  /** Where the year column stops: clear of the spine, and of the phase name. */
  const yearRight = compact ? SPINE_W + 6 : PHASE_COL;
  const slots = yearSlots(rows, viewport.zoom);
  const t = useT();

  /*
   * ONE size for the whole column, set by the tightest slot on the rail.
   *
   * Sizing each year to its own row looked right until the rail stopped being
   * capped by its width: from there down, a year of nothing but series set
   * smaller type than the film year under it, and since the column is
   * right-aligned every size change moved that year's left edge. The rail read
   * as a wobbling stack of numbers rather than a column, and it started
   * wobbling at whatever zoom the cap let go — which is what "the years are
   * positioned differently once you zoom out" was.
   *
   * The tightest slot rather than a typical one because a single year sized
   * over its slot would collide with its neighbour, and one size means one
   * collision is everyone's. The rail's width caps it either way: the glyphs
   * are as wide as the font is tall, so sizing on height alone let a zoomed-in
   * row throw 70px digits across a 56px rail and out over the posters.
   *
   * Measured over every row, not the handful on screen, so the numbers hold
   * their size as you scroll instead of breathing with what's in view.
   */
  const fontSize = Math.max(
    YEAR_MIN,
    Math.min(
      YEAR_MAX,
      (Math.min(...slots.values()) - YEAR_GAP) / YEAR_EM,
      width - yearRight - 2,
    ),
  );

  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 z-10 overflow-hidden select-none"
      style={{ width }}
    >
      {rows.map((row) => {
        const top = viewport.y + row.y * viewport.zoom;
        const rowHeight = row.height * viewport.zoom;
        if (top + rowHeight < -40 || top > height + 40) return null;

        const labelled = slots.has(row.year);
        const phase = row.phase ? PHASE_META[row.phase] : undefined;
        // Below this the phase is a smear rather than a word; the bar carries it.
        const phaseSize = compact ? 0 : Math.min(20, rowHeight / 9);

        return (
          <div
            key={row.year}
            className="absolute left-0"
            style={{ top, height: rowHeight, width: "100%" }}
          >
            {/* Fixed columns, so a year with no phase beside it still lines up
                with the years that have one — and the year's box is given its
                width outright rather than shrink-wrapped around vertical text,
                which is where a browser's idea of a rotated glyph's intrinsic
                width would otherwise leak into where the number sits. */}
            {labelled && (
              <span
                className="absolute inset-y-0 flex items-center justify-center"
                style={{ right: yearRight, width: fontSize }}
              >
                <span
                  className="leading-none font-bold tracking-tight"
                  style={{
                    fontSize,
                    color: phase
                      ? tint(phase.color, 0.18)
                      : "rgba(255,255,255,0.09)",
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  {row.year}
                </span>
              </span>
            )}

            {phase && phaseSize >= 11 && (
              <span
                className="absolute inset-y-0 flex items-center justify-end"
                style={{ right: SPINE_W + 7 }}
              >
                {/* Latin runs bottom-to-top, which needs the 180° flip. Chinese
                    already stacks upright in vertical-rl, and flipping it would
                    stand every character on its head. */}
                <span
                  className={`leading-none font-black whitespace-nowrap ${
                    t.zh ? "tracking-[0.08em]" : "tracking-[0.14em] uppercase"
                  }`}
                  style={{
                    fontSize: phaseSize,
                    color: phase.color,
                    textShadow: `0 0 22px ${tint(phase.color, 0.5)}`,
                    writingMode: "vertical-rl",
                    transform: t.zh ? undefined : "rotate(180deg)",
                  }}
                >
                  {t.phaseShort(phase.short)}
                </span>
              </span>
            )}

            {phase && (
              <span
                className="absolute right-0"
                style={{
                  top: 0,
                  width: SPINE_W,
                  height: row.spine * viewport.zoom,
                  borderRadius: `${row.capTop ? SPINE_W : 0}px ${row.capTop ? SPINE_W : 0}px ${
                    row.capBottom ? SPINE_W : 0
                  }px ${row.capBottom ? SPINE_W : 0}px`,
                  background: phase.color,
                  boxShadow: `0 0 18px ${tint(phase.color, 0.45)}`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
