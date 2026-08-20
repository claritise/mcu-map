/**
 * The bilingual layer, and specifically its two failure modes.
 *
 * `pnpm i18n:check` already shouts when src/data grows an entry that src/i18n/zh
 * has no counterpart for. What it cannot check is what the reader sees in the
 * window between those two commits, because the answer depends on the fallback
 * chain rather than on the data: a lookup that returned `undefined` or the raw
 * id would print a blank line or `avengers-doomsday` into a Chinese panel.
 *
 * The other direction matters just as much and has no checker at all — English
 * is assembled by the same functions, so a `zh` test that drifted to the wrong
 * side of a ternary would hand English readers Chinese.
 */
import { describe, expect, it } from "vitest";

import { CHARACTERS } from "~/data/characters";
import { DEPENDENCIES } from "~/data/dependencies";
import { TITLES } from "~/data/titles";
import type { BannerId, DepKind, RealityId, Title } from "~/data/types";
import { translator } from "~/i18n";
import { BANNERS, REALITIES } from "~/lib/graph";

const en = translator("en");
const zh = translator("zh");

/** Any CJK ideograph: the cheapest "is this the wrong language" test there is. */
const HAN = /[㐀-䶿一-鿿]/;

const REALITY_IDS = Object.keys(REALITIES) as RealityId[];
const BANNER_IDS = Object.keys(BANNERS) as BannerId[];
const KINDS: DepKind[] = ["essential", "recommended", "optional"];

/**
 * A title that exists nowhere in src/data, standing in for one added after
 * src/i18n/zh was last touched. Built from a real entry so it stays a valid
 * Title if the shape changes.
 */
const untranslated: Title = {
  ...TITLES[0]!,
  id: "not-a-real-title",
  name: "Some Film Nobody Has Translated",
  blurb: "Added to the dataset five minutes ago.",
};

describe("translator('zh')", () => {
  it("actually translates what has been translated", () => {
    // Otherwise every fallback assertion below would pass vacuously.
    const ironMan = TITLES.find((t) => t.id === "iron-man")!;
    expect(zh.titleName(ironMan)).toMatch(HAN);
    expect(zh.titleName(ironMan)).not.toBe(ironMan.name);
    expect(zh.blurb(ironMan)).toMatch(HAN);
  });

  it("falls back to the English source, not to a blank or an id", () => {
    expect(zh.titleName(untranslated)).toBe(untranslated.name);
    expect(zh.blurb(untranslated)).toBe(untranslated.blurb);
    expect(zh.titleName(untranslated)).not.toBe(untranslated.id);
  });

  it("falls back for a dependency reason too", () => {
    const invented = {
      from: "not-a-real-title",
      to: "also-not-real",
      kind: "essential" as const,
      reason: "Because it is a test.",
    };
    expect(zh.reason(invented)).toBe(invented.reason);
  });

  it("falls back for a character, a phase, a saga and a person", () => {
    const character = { ...CHARACTERS[0]!, id: "nobody", name: "Nobody" };
    expect(zh.characterName(character)).toBe("Nobody");
    expect(zh.phase("Phase Nine")).toBe("Phase Nine");
    expect(zh.saga("Some Other Saga")).toBe("Some Other Saga");
    expect(zh.person("A Nameless Extra")).toBe("A Nameless Extra");
  });

  it("says something for every title, character and dependency", () => {
    for (const title of TITLES) {
      expect(zh.titleName(title), title.id).toBeTruthy();
      expect(zh.blurb(title), title.id).toBeTruthy();
    }
    for (const character of CHARACTERS) {
      expect(zh.characterName(character), character.id).toBeTruthy();
    }
    for (const dep of DEPENDENCIES) {
      expect(zh.reason(dep), `${dep.from}->${dep.to}`).toBeTruthy();
    }
  });

  it("keeps the empty answers empty rather than inventing one", () => {
    // `undefined` is the honest answer where the source has no value, and the
    // panel omits the whole line on it.
    expect(zh.phase(undefined)).toBeUndefined();
    expect(zh.note(undefined)).toBeUndefined();
    expect(zh.person(undefined)).toBeUndefined();
    expect(zh.released(undefined)).toBeNull();
    expect(zh.runtime(undefined)).toBeNull();
    expect(zh.credits([])).toBeNull();
  });
});

describe("translator('en')", () => {
  it("never returns Chinese, for anything in the dataset", () => {
    for (const title of TITLES) {
      expect(en.titleName(title), title.id).not.toMatch(HAN);
      expect(en.blurb(title), title.id).not.toMatch(HAN);
      expect(en.medium(title.medium), title.id).not.toMatch(HAN);
      expect(en.saga(title.saga), title.id).not.toMatch(HAN);
      if (title.phase) expect(en.phase(title.phase), title.id).not.toMatch(HAN);
    }
    for (const character of CHARACTERS) {
      expect(en.characterName(character), character.id).not.toMatch(HAN);
      for (const actor of character.actors) {
        expect(en.person(actor), character.id).toBe(actor);
      }
    }
    for (const dep of DEPENDENCIES) {
      expect(en.reason(dep), `${dep.from}->${dep.to}`).not.toMatch(HAN);
    }
    for (const id of REALITY_IDS) {
      expect(en.realityLabel(id), id).not.toMatch(HAN);
      expect(en.realityBlurb(id), id).not.toMatch(HAN);
      expect(en.designation(id), id).not.toMatch(HAN);
    }
    for (const id of BANNER_IDS) expect(en.banner(id), id).not.toMatch(HAN);
    for (const kind of KINDS) expect(en.kind(kind), kind).not.toMatch(HAN);
    for (const source of ["screen", "handbook", "unofficial"] as const) {
      expect(en.sourcing(source), source).not.toMatch(HAN);
    }
  });

  it("passes the English source straight through", () => {
    for (const title of TITLES) {
      expect(en.titleName(title), title.id).toBe(title.name);
      expect(en.blurb(title), title.id).toBe(title.blurb);
    }
  });
});

describe("designation", () => {
  it("prints the number where a reality has one, in both languages", () => {
    expect(en.designation("earth-616")).toBe("Earth-616");
    expect(zh.designation("earth-616")).toBe("Earth-616");
  });

  it("says 'no number on record' in the reader's own language", () => {
    // A designation is a fact from a film; the stand-in phrase for its absence
    // is the interface talking, so it translates.
    expect(en.designation("fox-ff-2015")).toBe("unlisted reality");
    expect(zh.designation("fox-ff-2015")).toMatch(HAN);
    expect(zh.designation("fox-ff-2015")).not.toBe("unlisted reality");
  });
});

describe("dates and durations", () => {
  it("formats a date each way without moving it", () => {
    expect(en.released("2019-04-26")).toBe("26 Apr 2019");
    expect(zh.released("2019-04-26")).toBe("2019年4月26日");
  });

  it("refuses a half-formed date in both languages", () => {
    for (const t of [en, zh]) {
      expect(t.released("2019")).toBeNull();
      expect(t.released("2019-04")).toBeNull();
    }
    // Only English needs a month name, so only English can fail to find one.
    expect(en.released("2019-13-01")).toBeNull();
  });

  it("formats a runtime each way", () => {
    expect(en.runtime(181)).toBe("3h 1m");
    expect(zh.runtime(181)).toBe("3小时1分钟");
    expect(en.runtime(120)).toBe("2h");
    expect(zh.runtime(120)).toBe("2小时");
    expect(en.runtime(45)).toBe("45m");
    expect(zh.runtime(45)).toBe("45分钟");
  });
});

describe("credits", () => {
  it("joins two names with 'and' and more with commas", () => {
    expect(en.credits(["Anthony Russo", "Joe Russo"])).toBe(
      "Anthony Russo and Joe Russo",
    );
    expect(en.credits(["A", "B", "C"])).toBe("A, B, C");
    expect(en.credits(["Jon Favreau"])).toBe("Jon Favreau");
  });

  it("uses the Chinese enumeration comma", () => {
    // "、" rather than ", ": a Latin comma between Han names reads as a list of
    // sentences.
    expect(zh.credits(["A", "B"])).toBe("A、B");
  });
});
