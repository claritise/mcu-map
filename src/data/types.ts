export type Universe = "mcu" | "xmen" | "fox-ff" | "fox-street";

export type Medium = "film" | "series" | "special";

/**
 * How badly you need the source title before the target one.
 *  - essential: the target is confusing or spoiled without it
 *  - recommended: you'll follow the plot, but you'll miss the weight
 *  - optional: a cameo, a stinger, a running joke
 */
export type DepKind = "essential" | "recommended" | "optional";

export interface Character {
  id: string;
  name: string;
  /** Civilian / real name, when the codename is the primary one. */
  alias?: string;
  /** Every performer who has played them across the map. */
  actors: string[];
}

export interface CastEntry {
  characterId: string;
  /** Overrides the character's default actor for this title (recasts, variants). */
  actor?: string;
  /** "cameo" | "post-credits" | "voice" etc. */
  note?: string;
  /** Leads first — used to trim the node preview. */
  lead?: boolean;
}

export interface Title {
  id: string;
  name: string;
  year: number;
  medium: Medium;
  universe: Universe;
  /** "Infinity Saga", "Multiverse Saga", "Fox X-Men"… */
  saga: string;
  /** "Phase One"… only meaningful inside the MCU. */
  phase?: string;
  /** Release order within the year, for tie-breaking the timeline layout. */
  order?: number;
  blurb: string;
  upcoming?: boolean;
  cast: CastEntry[];
}

export interface Dependency {
  /** Watch this first. */
  from: string;
  to: string;
  kind: DepKind;
  /** Why. Shown on the edge tooltip and in the detail panel. */
  reason: string;
}
