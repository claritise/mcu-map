"use client";

import { animated, useSpring } from "@react-spring/web";
import {
  Handle,
  Position,
  useStore,
  type Node,
  type NodeProps,
} from "@xyflow/react";

import { poster, POSTER_ATLAS } from "~/data/posters";
import type { DepKind, Medium, RealityId } from "~/data/types";
import { CARD, REALITIES } from "~/lib/graph";
import { useT } from "~/i18n";

/**
 * root:     the title you clicked
 * direct:   a stated prerequisite of it: gets a line, a warm border and a reason
 * indirect: reachable further up the chain: cool border, no line, no reason
 */
export type Relation = "none" | "root" | "direct" | "indirect";

export type TitleNodeData = {
  label: string;
  year: number;
  medium: Medium;
  reality: RealityId;
  phase?: string;
  saga: string;
  upcoming?: boolean;
  relation: Relation;
  /** Why this one comes first, shown on hover, only for direct prerequisites. */
  reason?: string;
  reasonKind?: DepKind;
  dimmed: boolean;
  /**
   * Every traced character who appears here, each carrying the continuity they
   * belong to rather than the one this title is set in — a blue Wolverine chip
   * on a Marvel-produced film is the whole point of Deadpool & Wolverine.
   */
  traced: { id: string; name: string; reality: RealityId }[];
  /** Timeline mode flows bottom-to-top; dependency mode flows left-to-right. */
  vertical: boolean;
};

export type TitleNodeType = Node<TitleNodeData, "title">;

const MEDIUM_GLYPH: Record<Medium, string> = {
  film: "▶",
  series: "▤",
  special: "✦",
};

const SELECT_SPRING = { tension: 560, friction: 40 };

/**
 * Chips stack up on a card when several people are traced at once. Past three
 * they start eating the artwork, so the rest become a count.
 */
const MAX_CHIPS = 3;

/** Thumb-tier widths, mirroring TIERS in scripts/optimize-posters.mjs. */
const THUMB_W = { cover: 96, contain: 156 };

export function TitleNode({ id, data }: NodeProps<TitleNodeType>) {
  const t = useT();
  /** Lower-case run-in labels, matching the hover card's typography. */
  const kindLabel: Record<DepKind, string> = {
    essential: t.ui.kindEssentialShort,
    recommended: t.ui.kindRecommendedShort,
    optional: t.ui.kindOptionalShort,
  };
  const accent = REALITIES[data.reality].accent;
  const art = poster(id);
  /*
   * Which artwork tier to fetch, decided in real pixels rather than by a magic
   * zoom number: swap to full art only once the card is drawn wider than the
   * thumb is, allowing for the screen's pixel density. Zoomed out — which is
   * where the map opens — a 96px thumb covers a 50px card and the full artwork
   * would be bytes nobody can see. The selector returns a boolean, so a node
   * re-renders when the threshold is crossed, not on every frame of a pinch.
   */
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio;
  const thumbWidth = data.medium === "film" ? THUMB_W.cover : THUMB_W.contain;
  const detailed = useStore(
    (state) => state.transform[2] * CARD[data.medium].w * dpr > thumbWidth,
  );
  /** Atlas pixels → card pixels. Cells are cut to the card's exact shape. */
  const scale = CARD[data.medium].w / thumbWidth;
  const card = CARD[data.medium];

  // Cards never scale: rows are packed tight, so growing the selected one just
  // made it collide with its neighbours. Emphasis is ring + glow instead.
  const style = useSpring({
    to: {
      opacity: data.dimmed ? 0.12 : data.relation === "indirect" ? 0.9 : 1,
    },
    config: SELECT_SPRING,
  });

  // Border colour IS the legend: bone = what you clicked, amber = watch this
  // first, steel = further back up the chain. Traced characters are named on
  // the card instead, in their own continuity's colour.
  const edge =
    data.relation === "root"
      ? "ring-[3px] ring-[var(--color-text-primary)] shadow-[0_0_32px_-4px_rgba(208,207,202,0.45)]"
      : data.relation === "direct"
        ? "ring-2 ring-[var(--color-required)] shadow-xl shadow-black/40"
        : data.relation === "indirect"
          ? "ring-2 ring-[var(--color-ancestor)]/55"
          : "ring-1 ring-white/5";

  return (
    <animated.div
      style={{ ...style, width: card.w, height: card.h }}
      className="group relative"
    >
      <Handle
        type="target"
        position={data.vertical ? Position.Bottom : Position.Left}
        className="!h-1 !w-1 !border-0 !bg-white/20"
      />

      <div
        className={`bg-surface relative h-full w-full overflow-hidden rounded-lg ${edge}`}
      >
        {art ? (
          <>
            {/* A tinted ground so artwork with transparency doesn't sit on flat black. */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(160deg, ${accent}22, #0d0d0c)`,
              }}
            />
            {detailed ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={art.src}
                alt={t.ui.artworkAlt(data.label)}
                loading="lazy"
                draggable={false}
                /* Posters fill the card; landscape key art is centred inside
                   it, because those files are wide logos that lose their own
                   title if you crop them. Matches the atlas cell exactly, so
                   nothing shifts when the tiers swap. */
                className={`absolute inset-0 h-full w-full ${
                  art.fit === "contain" ? "object-contain" : "object-cover"
                }`}
              />
            ) : (
              /* Zoomed out, the card is painted from the shared sprite sheet:
                 one HTTP request for the entire mosaic instead of a hundred.
                 The cell is scaled up to card size, which is the same crop the
                 <img> above would produce. */
              <span
                role="img"
                aria-label={t.ui.artworkAlt(data.label)}
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${POSTER_ATLAS.src})`,
                  backgroundSize: `${POSTER_ATLAS.width * scale}px ${POSTER_ATLAS.height * scale}px`,
                  backgroundPosition: `-${art.cell.x * scale}px -${art.cell.y * scale}px`,
                }}
              />
            )}
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(120% 80% at 20% 0%, ${accent}44, transparent 60%), linear-gradient(160deg, #1a1a19, #0d0d0c)`,
            }}
          />
        )}

        {/* Scrim keeps the title readable over any artwork. */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/75 to-transparent" />
        <span
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ backgroundColor: accent, opacity: 0.9 }}
        />

        <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2">
          <p className="text-text-primary line-clamp-2 text-[13px] leading-tight font-medium">
            {data.label}
          </p>
          <p className="text-text-secondary mt-0.5 flex items-center gap-1.5 font-mono text-[9px]">
            <span style={{ color: accent }}>{MEDIUM_GLYPH[data.medium]}</span>
            <span>{data.year}</span>
            {data.upcoming && (
              <span className="text-[var(--color-required)]">{t.ui.soon}</span>
            )}
          </p>
        </div>
      </div>

      {/*
        Tracing names the character on the card, in a chip bordered with the
        continuity they come from — the same chip the picker shows, so the panel
        and the map read as one language. A monogram in a circle made you guess
        which "N" you were looking at; the name does not.
      */}
      {data.traced.length > 0 && (
        <div
          className="absolute top-1.5 left-1.5 z-30 flex flex-col items-start gap-1"
          title={data.traced.map((c) => c.name).join(" · ")}
        >
          {data.traced.slice(0, MAX_CHIPS).map((c) => {
            const chipAccent = REALITIES[c.reality].accent;
            return (
              <span
                key={c.id}
                style={{
                  maxWidth: card.w - 14,
                  borderColor: chipAccent,
                  // A tint over an near-opaque ground: artwork underneath must
                  // not muddy 10px type, but the chip still carries its colour.
                  backgroundImage: `linear-gradient(0deg, ${chipAccent}30, ${chipAccent}30)`,
                  backgroundColor: "rgba(11,11,10,0.92)",
                }}
                className="text-text-primary truncate rounded-full border px-1.5 py-[1px] text-[10px] leading-[15px] font-medium shadow-lg shadow-black/50"
              >
                {c.name}
              </span>
            );
          })}
          {data.traced.length > MAX_CHIPS && (
            <span
              style={{ backgroundColor: "rgba(11,11,10,0.92)" }}
              className="text-text-secondary rounded-full border border-white/25 px-1.5 py-[1px] font-mono text-[10px] leading-[15px] shadow-lg shadow-black/50"
            >
              +{data.traced.length - MAX_CHIPS}
            </span>
          )}
        </div>
      )}

      {/*
        The reason lives here rather than on the edge. Edge labels stacked on
        top of each other the moment two prerequisites sat near one another;
        one hover shows one reason, anchored to the card it belongs to.

        Shown and hidden outright, with no fade: animating it in promoted a new
        compositor layer inside the map's transformed viewport, and the whole
        canvas flashed dark and back on every hover.
      */}
      {data.reason && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-56 -translate-x-1/2 group-hover:block">
          <div className="bg-surface-elevated rounded-lg border border-white/5 px-3 py-2 shadow-2xl shadow-black/70">
            <p className="font-mono text-[9px] tracking-widest text-[var(--color-required)] uppercase">
              {data.reasonKind
                ? kindLabel[data.reasonKind]
                : t.ui.watchFirstShort}
            </p>
            <p className="text-text-body mt-1 text-[11px] leading-snug">
              {data.reason}
            </p>
          </div>
          <div className="mx-auto h-2 w-px bg-white/10" />
        </div>
      )}

      <Handle
        type="source"
        position={data.vertical ? Position.Top : Position.Right}
        className="!h-1 !w-1 !border-0 !bg-white/20"
      />
    </animated.div>
  );
}
