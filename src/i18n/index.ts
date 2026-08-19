import { useMemo } from "react";

import type {
  BannerId,
  Character,
  DepKind,
  Dependency,
  Medium,
  RealityId,
  Title,
} from "~/data/types";
import { BANNERS, REALITIES } from "~/lib/graph";
import { useLocale, type Locale } from "./locale";
import { UI } from "./ui";
import { ZH_TITLES } from "./zh/titles";
import { ZH_CHARACTERS } from "./zh/characters";
import { ZH_DEPENDENCIES } from "./zh/dependencies";
import { ZH_PEOPLE } from "./zh/people";
import {
  ZH_BANNERS,
  ZH_CAST_NOTES,
  ZH_KIND,
  ZH_MEDIUM,
  ZH_PHASES,
  ZH_PHASES_SHORT,
  ZH_REALITIES,
  ZH_SAGAS,
  ZH_SOURCING,
  ZH_TIMELINES,
} from "./zh/terms";

const MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Every lookup falls back to the English source rather than to a blank or to
 * the raw id: a data entry added after this file was last touched should read
 * as untranslated, not as broken.
 */
export function translator(locale: Locale) {
  const zh = locale === "zh";
  const ui = UI[locale];

  const person = (name?: string) =>
    !name ? undefined : zh ? (ZH_PEOPLE[name] ?? name) : name;

  /** Two names read better joined than comma-separated, in either language. */
  const credits = (names: string[]) => {
    const list = names.map((n) => person(n)!);
    if (list.length === 0) return null;
    if (zh) return list.join("、");
    return list.length === 2 ? list.join(" and ") : list.join(", ");
  };

  const titleName = (title: Title) =>
    (zh ? ZH_TITLES[title.id]?.name : undefined) ?? title.name;

  const characterName = (character: Character) =>
    (zh ? ZH_CHARACTERS[character.id]?.name : undefined) ?? character.name;

  return {
    locale,
    zh,
    ui,

    titleName,
    blurb: (title: Title) =>
      (zh ? ZH_TITLES[title.id]?.blurb : undefined) ?? title.blurb,

    characterName,
    /** `undefined` when there is no civilian name, same as the source data. */
    characterAlias: (character: Character) =>
      zh
        ? ZH_CHARACTERS[character.id]
          ? ZH_CHARACTERS[character.id]?.alias
          : character.alias
        : character.alias,

    person,
    credits,

    reason: (dep: Dependency) =>
      (zh ? ZH_DEPENDENCIES[`${dep.from}->${dep.to}`] : undefined) ??
      dep.reason,

    realityLabel: (id: RealityId) =>
      (zh ? ZH_REALITIES[id]?.label : undefined) ?? REALITIES[id].label,
    realityBlurb: (id: RealityId) =>
      (zh ? ZH_REALITIES[id]?.blurb : undefined) ?? REALITIES[id].blurb,
    /** The Earth number, or the stand-in phrase when a reality has none. */
    designation: (id: RealityId) =>
      REALITIES[id].designation ?? ui.unlistedReality,
    /** The run of history a version belongs to, when its reality has two. */
    timeline: (character: Character) =>
      !character.timeline
        ? undefined
        : zh
          ? (ZH_TIMELINES[character.timeline] ?? character.timeline)
          : character.timeline,
    sourcing: (kind: "screen" | "handbook" | "unofficial") =>
      zh ? ZH_SOURCING[kind] : kind,
    banner: (id: BannerId) => (zh ? ZH_BANNERS[id] : BANNERS[id].label),

    medium: (m: Medium) => (zh ? ZH_MEDIUM[m] : m),
    saga: (s: string) => (zh ? (ZH_SAGAS[s] ?? s) : s),
    phase: (p?: string) => (!p ? undefined : zh ? (ZH_PHASES[p] ?? p) : p),
    phaseShort: (p: string) => (zh ? (ZH_PHASES_SHORT[p] ?? p) : p),
    note: (n?: string) => (!n ? undefined : zh ? (ZH_CAST_NOTES[n] ?? n) : n),

    kind: (k: DepKind) =>
      zh
        ? ZH_KIND[k]
        : {
            essential: "Essential",
            recommended: "Recommended",
            optional: "Nice to have",
          }[k],

    /**
     * Formatted by hand rather than through `Intl`: the value is a plain
     * calendar date, and putting it through a timezone can shift it a day and
     * make the server and client renders disagree.
     */
    released: (iso?: string) => {
      if (!iso) return null;
      const [y, m, d] = iso.split("-");
      if (!y || !m || !d) return null;
      if (zh) return `${Number(y)}年${Number(m)}月${Number(d)}日`;
      const month = MONTHS_EN[Number(m) - 1];
      return month ? `${Number(d)} ${month} ${y}` : null;
    },

    runtime: (minutes?: number) => {
      if (!minutes) return null;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      if (zh) return h ? (m ? `${h}小时${m}分钟` : `${h}小时`) : `${m}分钟`;
      return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
    },

    /** Separator between the facts on the detail panel's meta line. */
    sep: zh ? " · " : " · ",
  };
}

export type Translator = ReturnType<typeof translator>;

export function useT(): Translator & { setLocale: (next: Locale) => void } {
  const { locale, setLocale } = useLocale();
  const t = useMemo(() => translator(locale), [locale]);
  return useMemo(() => ({ ...t, setLocale }), [t, setLocale]);
}

export { useLocale, type Locale } from "./locale";
