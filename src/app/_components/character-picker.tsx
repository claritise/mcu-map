"use client";

import { useMemo, useState } from "react";

import { CHARACTERS, CHARACTER_BY_ID } from "~/data/characters";
import { POWER, TIER_COLOR, powerFraction, powerTier } from "~/data/power";
import { REALITIES, titlesByCharacter } from "~/lib/graph";
import { useT } from "~/i18n";

/**
 * A character's mark: their initial in a circle. There are no photographs on
 * this map — actor headshots meant tens of megabytes of images for a 34px
 * badge, and the monogram carries the same information at no cost.
 */
export function Face({ name, size }: { name: string; size: number }) {
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className="text-text-secondary flex shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-medium ring-1 ring-white/15"
    >
      {name.slice(0, 1)}
    </span>
  );
}

type SortMode = "appearances" | "power";

/**
 * The roster. `value` is every character being traced, and `onToggle` flips one
 * of them — tracing is a set, so picking a second person adds to the first
 * rather than replacing them.
 *
 * Anyone traced is lifted OUT of the roster and into the block at the top, so a
 * character is on screen exactly once: either you are tracing them, or they are
 * someone you could add. Two renderings of one person, a few rows apart, read
 * as a duplicate rather than as a state.
 */
export function CharacterPicker({
  value,
  markedCount,
  onToggle,
  onClear,
}: {
  value: string[];
  /** How many titles the traced set lights between them. */
  markedCount: number;
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  /* Appearances is the ordering the map is actually for. Power is an argument,
     and it is opt-in for that reason — it never silently reorders the roster
     out from under someone who came here to trace a character. */
  const [sort, setSort] = useState<SortMode>("appearances");
  const t = useT();
  const chosen = new Set(value);

  /** In the order they were picked: the first one you chose stays first. */
  const traced = value
    .map((id) => CHARACTER_BY_ID.get(id))
    .filter((character) => character !== undefined);

  /** Busiest characters first, unless you asked to start a fight instead. */
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CHARACTERS.map((character) => ({
      character,
      count: titlesByCharacter.get(character.id)?.length ?? 0,
      power: POWER[character.id],
    }))
      .filter(({ character, count }) => {
        if (count === 0) return false;
        // Already traced: they live in the block above, not down here twice.
        if (chosen.has(character.id)) return false;
        if (!needle) return true;
        /* Both languages are searched whichever one is on screen: people type
           "Rogue" as readily as "小淘气", and an actor's Latin name is often
           the only spelling someone remembers. */
        return [
          character.name,
          character.alias,
          t.characterName(character),
          t.characterAlias(character),
          ...character.actors,
          ...character.actors.map((a) => t.person(a)),
          REALITIES[character.reality].label,
          t.realityLabel(character.reality),
          character.timeline ?? "",
          t.designation(character.reality),
        ].some((field) => field?.toLowerCase().includes(needle));
      })
      .sort((a, b) => {
        if (sort === "power") {
          /* Unrated sinks rather than sorting as a zero: nobody in this data
             set is a zero, they are simply someone we have not argued about
             yet, and floating them among the civilians would read as a claim. */
          const byPower = (b.power ?? -1) - (a.power ?? -1);
          if (byPower !== 0) return byPower;
        } else if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.character.name.localeCompare(b.character.name);
      });
    /* eslint-disable-next-line react-hooks/exhaustive-deps --
       `chosen` is a fresh Set each render; `value` is the real dependency. */
  }, [query, sort, t, value]);

  return (
    <div>
      {traced.length > 0 && (
        /*
         * Tags, not table rows. These are a handful of names, and a column of
         * full-width rows spent four lines repeating one designation and four
         * separate × buttons to say it. The chip's own border is the reality
         * instead, so two Daredevils still read apart with nothing written
         * twice — and no monogram competing with the name for the space.
         */
        <div className="mb-2.5">
          <ul className="flex flex-wrap gap-1.5">
            {traced.map((character) => {
              const name = t.characterName(character);
              const accent = REALITIES[character.reality].accent;
              return (
                <li key={character.id}>
                  {/*
                    The whole chip removes, so the target is the chip — 28px
                    tall and as wide as the name. The × is drawn at a size you
                    can actually see and lights its own well on hover, rather
                    than being a 7px glyph pretending to be the control.
                  */}
                  <button
                    onClick={() => onToggle(character.id)}
                    title={`${t.ui.stopTracing(name)} · ${t.designation(character.reality)}`}
                    aria-label={t.ui.stopTracing(name)}
                    style={{
                      borderColor: accent,
                      backgroundColor: `${accent}1f`,
                    }}
                    className="group flex h-10 items-center gap-1 rounded-full border pr-1.5 pl-3 transition duration-150 hover:brightness-[1.45] active:brightness-[1.6] lg:h-7 lg:pr-1 lg:pl-2.5"
                  >
                    <span className="text-text-primary max-w-[150px] truncate text-[12.5px]">
                      {name}
                    </span>
                    <span className="text-text-secondary group-hover:text-text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors group-hover:bg-white/20 lg:h-5 lg:w-5">
                      <svg
                        viewBox="0 0 10 10"
                        aria-hidden
                        className="h-2.5 w-2.5"
                      >
                        <path
                          d="M1 1 9 9M9 1 1 9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex items-center justify-between gap-3">
            {/* The count is already on the header badge; what it buys you —
                how much of the map stays lit — is not stated anywhere else. */}
            <span className="text-text-secondary truncate text-[11px]">
              {t.ui.markedIn(markedCount)}
            </span>
            <button
              onClick={onClear}
              className="text-text-secondary hover:text-text-primary -my-1.5 flex min-h-11 shrink-0 items-center rounded-md px-2 text-[12px] transition-colors hover:bg-white/[0.06] lg:my-0 lg:min-h-0 lg:px-0 lg:hover:bg-transparent"
            >
              {t.ui.clearAll}
            </button>
          </div>
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.ui.findCharacter}
        /* 16px on touch: anything smaller and iOS Safari zooms the whole page
           the moment the field takes focus. */
        className="text-text-primary placeholder:text-text-secondary w-full rounded-md border border-white/5 bg-white/[0.03] px-3 py-3 text-[16px] transition-colors focus:border-white/15 focus:outline-none lg:py-2 lg:text-[13px]"
      />

      {/*
        Two orderings, both of them honest about what they are. The segmented
        control sits between the field and the list because that is where the
        ordering it describes begins — put above the field it reads as a filter.
      */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-text-secondary shrink-0 text-[11px]">
          {t.ui.sortBy}
        </span>
        <div className="flex rounded-md border border-white/5 bg-white/[0.03] p-0.5">
          {(["appearances", "power"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSort(mode)}
              aria-pressed={sort === mode}
              /* Taller on touch, like the traced chips: a 25px segment is a
                 miss waiting to happen on a phone. */
              className={`rounded-[5px] px-2.5 py-2 text-[11px] transition-colors lg:py-1 ${
                sort === mode
                  ? "text-text-primary bg-white/10"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {mode === "power" ? t.ui.sortPower : t.ui.sortAppearances}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-1.5 max-h-56 space-y-0.5 overflow-y-auto">
        {rows.length === 0 && (
          <li className="text-text-secondary px-2 py-2 text-[12px]">
            {t.ui.noCharacterMatch}
          </li>
        )}
        {rows.map(({ character, count, power }) => {
          const tier = power === undefined ? undefined : powerTier(power);
          return (
            <li key={character.id}>
              <button
                onClick={() => {
                  onToggle(character.id);
                  /* Adding someone almost always means going looking for the
                     next one, so the search clears itself out of the way. */
                  setQuery("");
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/[0.06]"
              >
                <Face name={t.characterName(character)} size={26} />
                <span className="min-w-0 flex-1">
                  <span className="text-text-body block truncate text-[13px]">
                    {t.characterName(character)}
                  </span>
                  {/* Two Daredevils, two Reeds: the continuity is what tells
                      one row from the other, so it is never optional. */}
                  <span className="text-text-secondary flex items-center gap-1.5 text-[11px]">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: REALITIES[character.reality].accent,
                      }}
                    />
                    <span className="truncate">
                      {t.characterAlias(character)
                        ? `${t.characterAlias(character)} · `
                        : ""}
                      {t.realityLabel(character.reality)}
                      {t.timeline(character)
                        ? ` · ${t.timeline(character)}`
                        : ""}
                    </span>
                    <span className="text-text-muted ml-auto shrink-0 font-mono text-[10px]">
                      {t.designation(character.reality)}
                    </span>
                  </span>
                </span>
                {sort === "power" ? (
                  /* The bar is what makes the number a ranking rather than
                     trivia: 50,100 next to 171 only means something once you
                     can see the gap without reading either of them. It fills
                     by decade, like the scale — a linear fill would leave every
                     human on the list at a hairline and say nothing. */
                  <span
                    title={
                      power === undefined || tier === undefined
                        ? t.ui.unrated
                        : t.ui.powerOf(
                            power.toLocaleString(t.zh ? "zh-CN" : "en-US"),
                            t.ui.powerTier[tier],
                          )
                    }
                    className="flex shrink-0 items-center gap-1.5"
                  >
                    <span className="hidden h-1 w-8 overflow-hidden rounded-full bg-white/10 sm:block">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${(powerFraction(power ?? 0) * 100).toFixed(1)}%`,
                          backgroundColor: tier
                            ? TIER_COLOR[tier]
                            : "transparent",
                        }}
                      />
                    </span>
                    <span
                      className="w-[46px] shrink-0 text-right font-mono text-[10.5px] tabular-nums"
                      style={{ color: tier ? TIER_COLOR[tier] : undefined }}
                    >
                      {power?.toLocaleString(t.zh ? "zh-CN" : "en-US") ?? "—"}
                    </span>
                  </span>
                ) : (
                  <span className="text-text-secondary shrink-0 text-[11px] tabular-nums">
                    {count}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {sort === "power" && (
        /* Stated where the numbers are, not in a tooltip somebody has to go
           find. The ranking is a provocation; the least it can do is admit it. */
        <p className="text-text-muted mt-2 text-[10.5px] leading-snug">
          {t.ui.powerDisclaimer}
        </p>
      )}
    </div>
  );
}
