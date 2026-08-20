"use client";

import { useState, type CSSProperties } from "react";

import { CHARACTER_BY_ID } from "~/data/characters";
import { meta } from "~/data/metadata";
import { poster, POSTER_ATLAS, type PosterCell } from "~/data/posters";
import { TITLE_BY_ID } from "~/data/titles";
import { watchLinks } from "~/data/watch";
import type { DepKind, Dependency } from "~/data/types";
import {
  REALITIES,
  directChildren,
  directParents,
  prerequisitesOf,
  watchOrder,
} from "~/lib/graph";
import { useT } from "~/i18n";

const RUN_LABEL = "text-[11px] font-semibold uppercase tracking-[0.12em]";

/**
 * Prerequisites are grouped by strength, so the row itself carries no badge.
 * Only the styling lives here; the group's name is translated at render.
 *
 * `drawn` is whether the canvas will do anything about this group. The map
 * stops at `recommended` (see MAX_KIND), so an optional prerequisite is listed
 * here with its reason but never lit or linked out there — the group says so
 * rather than leaving you to notice that clicking it changes nothing.
 */
const GROUPS: {
  kind: DepKind;
  rule: string;
  tone: string;
  drawn: boolean;
}[] = [
  {
    kind: "essential",
    rule: "bg-[var(--color-required)]",
    tone: "text-[var(--color-required)]",
    drawn: true,
  },
  {
    kind: "recommended",
    rule: "bg-[var(--color-ancestor)]",
    tone: "text-[var(--color-ancestor)]",
    drawn: true,
  },
  {
    kind: "optional",
    rule: "bg-white/15",
    tone: "text-text-muted",
    drawn: false,
  },
];

function Artwork({ id, name }: { id: string; name: string }) {
  const t = useT();
  const art = poster(id);
  const film = TITLE_BY_ID.get(id)?.medium === "film";
  const box = film ? "h-[96px] w-[64px]" : "h-[68px] w-[121px]";

  if (!art) {
    return (
      <div
        className={`${box} shrink-0 rounded-md bg-white/[0.04] ring-1 ring-white/10`}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={art.src}
      alt={t.ui.artworkAlt(name)}
      className={`${box} shrink-0 rounded-md ring-1 ring-white/10 ${
        art.fit === "contain" ? "object-contain" : "object-cover"
      }`}
    />
  );
}

/** The dependency-list thumb column, in px — the sprite maths needs a number. */
const THUMB_COLUMN = 64;

/**
 * Place one cell of the sprite atlas at a given rendered width. Percentages
 * would be wrong here: CSS resolves a percentage background-position against
 * (container − image), not as a pixel offset, so sprites must be sized and
 * positioned in px.
 */
function atlasCell(cell: PosterCell, width: number): CSSProperties {
  const scale = width / cell.w;
  return {
    aspectRatio: `${cell.w} / ${cell.h}`,
    backgroundImage: `url(${POSTER_ATLAS.src})`,
    backgroundSize: `${POSTER_ATLAS.width * scale}px ${POSTER_ATLAS.height * scale}px`,
    backgroundPosition: `-${cell.x * scale}px -${cell.y * scale}px`,
  };
}

/**
 * Fixed-WIDTH thumb column: every artwork fills the same width and takes the
 * height its own aspect ratio wants, so a poster reads as a poster rather than
 * a sliver next to the 16:9 series art.
 */
function Thumb({ id }: { id: string }) {
  const art = poster(id);
  return (
    <span className="w-[64px] shrink-0">
      {art ? (
        <span
          aria-hidden
          className="block w-full rounded-sm ring-1 ring-white/10"
          style={atlasCell(art.cell, THUMB_COLUMN)}
        />
      ) : (
        <span className="block h-9 w-full rounded-sm bg-white/[0.04] ring-1 ring-white/10" />
      )}
    </span>
  );
}

function DepRow({
  dep,
  side,
  onSelect,
}: {
  dep: Dependency;
  side: "from" | "to";
  onSelect: (id: string) => void;
}) {
  const t = useT();
  const other = TITLE_BY_ID.get(side === "from" ? dep.from : dep.to);
  if (!other) return null;
  return (
    <li>
      <button
        onClick={() => onSelect(other.id)}
        className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
      >
        <Thumb id={other.id} />
        <span className="min-w-0 flex-1">
          <span className="text-text-primary block text-[13px] leading-snug font-medium">
            {t.titleName(other)}{" "}
            <span className="text-text-muted font-normal">{other.year}</span>
          </span>
          <span className="text-text-secondary mt-1 block text-[12px] leading-[1.55]">
            {t.reason(dep)}
          </span>
        </span>
      </button>
    </li>
  );
}

export function DetailPanel({
  titleId,
  activeCharacters,
  maxKind,
  onSelectTitle,
  onToggleCharacter,
  onClose,
  collapsed = false,
  onToggleCollapse,
  onFit,
}: {
  titleId: string;
  /** Everyone currently being traced; clicking a row adds to or leaves that set. */
  activeCharacters: string[];
  maxKind: DepKind;
  onSelectTitle: (id: string) => void;
  onToggleCharacter: (id: string) => void;
  onClose: () => void;
  /** Folded down to its title bar. The title stays selected and lit on the map. */
  collapsed?: boolean;
  /** Absent on desktop, where the column has room for the whole panel. */
  onToggleCollapse?: () => void;
  /**
   * Refit the map. Only the folded bar offers it: on a phone the controls
   * sheet — and with it the slider and its own Fit — is hidden for as long as
   * a title is open, so folding the details back down would otherwise hand
   * you the map with pinch as the only way to move the camera.
   */
  onFit?: () => void;
}) {
  const [showChain, setShowChain] = useState(false);
  const t = useT();
  const title = TITLE_BY_ID.get(titleId);
  if (!title) return null;

  /*
   * Folded: the map wants the screen back, but you have not finished with this
   * title — it stays selected, its prerequisites stay lit, and the bar is the
   * way back into the reading.
   */
  if (collapsed) {
    const folded = REALITIES[title.reality];
    return (
      <aside className="bg-surface flex shrink-0 items-center gap-3 rounded-lg border border-white/5 py-2 pr-2 pl-3 shadow-2xl shadow-black/60 max-lg:rounded-b-none max-lg:border-x-0 max-lg:border-b-0 max-lg:pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <span
          className="h-8 w-0.5 shrink-0 rounded-full"
          style={{ backgroundColor: folded.accent }}
        />
        <button
          onClick={onToggleCollapse}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={false}
          aria-label={t.ui.expandPanel}
        >
          <span className="min-w-0 flex-1">
            <span className="text-text-primary block truncate text-[14px] leading-snug font-semibold">
              {t.titleName(title)}
            </span>
            <span className="text-text-secondary block text-[12px]">
              {title.year} · {t.ui.expandPanel}
            </span>
          </span>
          <span
            className="text-text-muted flex h-11 w-8 shrink-0 items-center justify-center"
            aria-hidden
          >
            <svg viewBox="0 0 14 14" className="h-3.5 w-3.5">
              <path
                d="M2.5 9L7 4.5 11.5 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
        {onFit && (
          <button
            onClick={onFit}
            className="text-text-secondary hover:text-text-primary flex h-11 min-w-11 shrink-0 items-center justify-center rounded-md px-2 text-[13px] transition-colors hover:bg-white/[0.06] active:bg-white/[0.1]"
          >
            {t.ui.fit}
          </button>
        )}
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/[0.06] active:bg-white/[0.1]"
          aria-label={t.ui.closePanel}
        >
          <svg viewBox="0 0 14 14" aria-hidden className="h-3.5 w-3.5">
            <path
              d="M3 3l8 8M11 3l-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </aside>
    );
  }

  const before = directParents(titleId);
  const after = directChildren(titleId);
  const chain = watchOrder(prerequisitesOf(titleId, maxKind));
  const reality = REALITIES[title.reality];
  const cast = [...title.cast].sort((a, b) => Number(b.lead) - Number(a.lead));
  const facts = meta(title.id);
  // Two names read better joined with "and" than with a comma.
  const credits = t.credits(facts.director ?? facts.creator ?? []);
  const links = watchLinks(title);

  return (
    <aside className="bg-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/5 shadow-2xl shadow-black/60 max-lg:rounded-b-none max-lg:border-x-0 max-lg:border-b-0">
      <header className="p-4">
        <div className="flex gap-3">
          <Artwork id={titleId} name={t.titleName(title)} />

          <div className="min-w-0 flex-1">
            {/* One line, always: a reality name plus its designation is too
                long to survive uppercase tracking in a 200px column. */}
            <div className="flex min-w-0 items-center justify-between gap-2">
              <span
                className="inline-flex min-w-0 items-center gap-1.5 rounded-full py-1 pr-2 pl-1.5 text-[11px] leading-none whitespace-nowrap"
                style={{
                  color: reality.accent,
                  backgroundColor: `${reality.accent}1f`,
                  boxShadow: `inset 0 0 0 1px ${reality.accent}55`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: reality.accent }}
                />
                <span className="truncate font-medium">
                  {t.realityLabel(title.reality)}
                </span>
                <span
                  className="h-2.5 w-px shrink-0"
                  style={{ backgroundColor: `${reality.accent}59` }}
                />
                <span className="shrink-0 font-mono text-[10px] opacity-75">
                  {t.designation(title.reality)}
                </span>
              </span>
              <div className="-mt-2 -mr-2 flex shrink-0 items-center lg:-mt-1.5 lg:-mr-1.5">
                {/* Fold, don't close: the phone's way of getting the map back
                  without giving up the title you are reading about. */}
                {onToggleCollapse && (
                  <button
                    onClick={onToggleCollapse}
                    aria-expanded
                    className="text-text-muted hover:text-text-primary flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/[0.06] active:bg-white/[0.1]"
                    aria-label={t.ui.minimizePanel}
                  >
                    <svg
                      viewBox="0 0 14 14"
                      aria-hidden
                      className="h-3.5 w-3.5"
                    >
                      <path
                        d="M2.5 5L7 9.5 11.5 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/[0.06] active:bg-white/[0.1] lg:h-8 lg:w-8"
                  aria-label={t.ui.closePanel}
                >
                  {/* Drawn rather than the ✕ glyph, which renders at whatever
                    weight the font feels like and never centres. */}
                  <svg viewBox="0 0 14 14" aria-hidden className="h-3.5 w-3.5">
                    <path
                      d="M3 3l8 8M11 3l-8 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <h2 className="text-text-primary mt-1.5 text-[17px] leading-[1.25] font-semibold tracking-tight">
              {t.titleName(title)}
            </h2>
            <p className="text-text-secondary mt-1.5 text-[12px]">
              {[
                t.released(facts.released) ?? String(title.year),
                t.medium(title.medium),
                t.runtime(facts.runtime),
                facts.episodes ? t.ui.episodes(facts.episodes) : null,
                t.phase(title.phase),
                title.upcoming ? t.ui.unreleased : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {credits && (
              <p className="text-text-muted mt-1 text-[12px]">
                {facts.director ? t.ui.directedBy : t.ui.createdBy} {credits}
              </p>
            )}
            {/* Where else it actually goes. No Way Home is an Earth-616 film,
                but half of it belongs to two Sony realities. */}
            {title.visits && title.visits.length > 0 && (
              <p className="text-text-muted mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
                {t.ui.alsoIn}
                {title.visits.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono"
                    style={{
                      color: REALITIES[r].accent,
                      backgroundColor: `${REALITIES[r].accent}1a`,
                    }}
                  >
                    {t.designation(r)}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        <p className="text-text-body mt-3 text-[13px] leading-[1.6]">
          {t.blurb(title)}
        </p>

        {links.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={`flex min-h-11 items-center rounded-md px-3.5 text-[13px] font-medium transition-colors lg:min-h-0 lg:px-2.5 lg:py-1.5 lg:text-[12px] ${
                  link.kind === "watch"
                    ? "text-text-primary bg-white/[0.09] hover:bg-white/[0.15]"
                    : "text-text-secondary hover:text-text-primary ring-1 ring-white/10 hover:bg-white/[0.06]"
                }`}
              >
                {link.kind === "watch" ? t.ui.whereToWatch : link.label} ↗
              </a>
            ))}
          </div>
        )}
      </header>

      <div className="hairline mx-4" />

      <div className="flex-1 overflow-y-auto px-4 py-4 max-lg:pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className={`${RUN_LABEL} text-text-secondary`}>
              {t.ui.watchFirst}
            </h3>
            {chain.length > 0 && (
              <button
                onClick={() => setShowChain((s) => !s)}
                className="text-text-secondary hover:text-text-primary text-[12px] transition-colors"
              >
                {showChain ? t.ui.hideFullOrder : t.ui.fullOrder(chain.length)}
              </button>
            )}
          </div>

          {before.length === 0 ? (
            <p className="text-text-body mt-2.5 text-[13px] leading-relaxed">
              {t.ui.noPrerequisites}
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              {GROUPS.map((group) => {
                const rows = before.filter((dep) => dep.kind === group.kind);
                if (rows.length === 0) return null;
                return (
                  <div key={group.kind} className="flex gap-2.5">
                    <span
                      className={`mt-1 w-0.5 shrink-0 rounded-full ${group.rule}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`${RUN_LABEL} ${group.tone}`}>
                        {t.kind(group.kind)} · {rows.length}
                      </p>
                      {!group.drawn && (
                        /* Sentence case and unemphatic: it is a footnote about
                           the canvas, not a warning about the titles. */
                        <p className="text-text-muted mt-0.5 text-[11px] normal-case">
                          {t.ui.notDrawn}
                        </p>
                      )}
                      <ul className="mt-1 -ml-2 space-y-0.5">
                        {rows.map((dep) => (
                          <DepRow
                            key={dep.from}
                            dep={dep}
                            side="from"
                            onSelect={onSelectTitle}
                          />
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showChain && chain.length > 0 && (
            <ol className="mt-4 divide-y divide-white/5 rounded-md border border-white/5 bg-black/25">
              {chain.map((step, i) => (
                <li key={step.id}>
                  <button
                    onClick={() => onSelectTitle(step.id)}
                    className="flex w-full items-baseline gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-white/[0.05]"
                  >
                    <span className="text-text-muted w-4 shrink-0 text-right font-mono text-[10px]">
                      {i + 1}
                    </span>
                    <span className="text-text-body text-[12px]">
                      {t.titleName(step)}
                    </span>
                    <span className="text-text-muted ml-auto font-mono text-[10px]">
                      {step.year}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        {after.length > 0 && (
          <section className="mt-7">
            <h3 className={`${RUN_LABEL} text-text-secondary`}>
              {t.ui.setsUp}
            </h3>
            <ul className="mt-1.5 -ml-2 space-y-0.5">
              {after.map((dep) => (
                <DepRow
                  key={dep.to}
                  dep={dep}
                  side="to"
                  onSelect={onSelectTitle}
                />
              ))}
            </ul>
          </section>
        )}

        <section className="mt-7 pb-2">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className={`${RUN_LABEL} text-text-secondary`}>
              {t.ui.characters} · {cast.length}
            </h3>
            <span className="text-text-secondary text-[12px]">
              {t.ui.clickToTrace}
            </span>
          </div>

          {cast.length === 0 ? (
            <p className="text-text-muted mt-2.5 text-[13px]">{t.ui.noCast}</p>
          ) : (
            /* Pulled back by the row's own px-2 so each character's rule lands
               on the same left edge as the WATCH FIRST group rules above. */
            <ul className="mt-2 -ml-2 space-y-0.5">
              {cast.map((entry) => {
                const character = CHARACTER_BY_ID.get(entry.characterId);
                if (!character) return null;
                const active = activeCharacters.includes(entry.characterId);
                // The actor is per-title: Norton here, Ruffalo everywhere after.
                const actor = entry.actor ?? character.actors[0];
                /*
                 * Which continuity's version of them this is. Usually the
                 * title's own, and then it goes unsaid, but Deadpool &
                 * Wolverine is full of Fox characters, and that IS the point of
                 * the scene, so a visitor gets named.
                 */
                const from = REALITIES[character.reality];
                const visiting = character.reality !== title.reality;
                return (
                  <li key={`${entry.characterId}-${entry.note ?? ""}`}>
                    <button
                      aria-pressed={active}
                      onClick={() => onToggleCharacter(entry.characterId)}
                      /* Traced: lit in the character's OWN continuity colour,
                         the same one their chip carries on the map and in the
                         picker. One language for "you are tracing this". */
                      /* An outline rather than a border: a border occupies a
                         pixel of layout, which walked the rule off the line the
                         dependency groups sit on. */
                      style={
                        active
                          ? {
                              outline: `1px solid ${from.accent}`,
                              outlineOffset: -1,
                              backgroundColor: `${from.accent}1f`,
                            }
                          : undefined
                      }
                      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors ${
                        active ? "" : "hover:bg-white/[0.06]"
                      }`}
                    >
                      {/* No monogram: a circled initial told you nothing two
                          rows of "K" could not both claim. The continuity does
                          the marking instead, in its own colour. */}
                      <span
                        className="w-0.5 shrink-0 self-stretch rounded-full"
                        style={{ backgroundColor: from.accent }}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-[13px] leading-snug ${
                            entry.lead
                              ? "text-text-primary font-medium"
                              : "text-text-body"
                          }`}
                        >
                          {t.characterName(character)}
                        </span>
                        <span className="text-text-secondary block truncate text-[12px]">
                          {t.person(actor)}
                          {entry.note ? ` · ${t.note(entry.note)}` : ""}
                          {t.timeline(character)
                            ? ` · ${t.timeline(character)}`
                            : ""}
                        </span>
                        {/* A visitor gets named: Deadpool & Wolverine is full
                            of Fox characters and that IS the point of the
                            scene. The designation itself rides on the right of
                            every row, visiting or not. */}
                        {visiting && (
                          <span
                            className="mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10.5px] font-medium tracking-wide"
                            style={{
                              color: from.accent,
                              backgroundColor: `${from.accent}1f`,
                            }}
                          >
                            {t.ui.versionOf(t.realityLabel(character.reality))}
                          </span>
                        )}
                      </span>

                      <span
                        className="shrink-0 self-start pt-0.5 font-mono text-[10px]"
                        style={{ color: from.accent }}
                      >
                        {t.designation(character.reality)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </aside>
  );
}
