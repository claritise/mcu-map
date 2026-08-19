/**
 * Who made it. A banner is a production continuity — one company's run of
 * films — and it can contain several realities: Marvel Studios alone shoots on
 * three distinct Earths.
 */
export type BannerId = "marvel" | "fox" | "sony";

/**
 * A single reality. This, not the studio, is what a title is set in and what a
 * character belongs to — Earth-838's Reed Richards and Earth-828's are both
 * "Marvel Studios" and have nothing else in common.
 */
export type RealityId =
  | "earth-616"
  | "earth-838"
  | "earth-828"
  | "earth-10005"
  | "earth-121698"
  | "fox-ff-2015"
  | "earth-701306"
  | "earth-96283"
  | "earth-120703"
  | "earth-688"
  | "earth-1610b"
  | "earth-616-atsv"
  | "earth-65"
  | "earth-928"
  | "earth-90214";

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
  /**
   * The reality this incarnation is FROM, not simply where they turn up. Fox's
   * Human Torch stays on Earth-121698 when Chris Evans walks into an MCU film,
   * because the map is tracing that version of him; Earth-828's Johnny Storm is
   * a separate entry with a separate actor.
   */
  reality: RealityId;
  /**
   * Which run of that reality's history this version belongs to, when the
   * reality has been rewritten. Days of Future Past leaves Earth-10005 with two
   * Charles Xaviers who never share a timeline, only a world.
   */
  timeline?: string;
  /** Every performer who has played THIS version, in order of appearance. */
  actors: string[];
}

export interface CastEntry {
  characterId: string;
  /** Overrides the character's default actor for this title (recasts, variants). */
  actor?: string;
  /** "cameo" | "post-credits" | "voice" etc. */
  note?: string;
  /** Leads first; used to trim the node preview. */
  lead?: boolean;
}

export interface Title {
  id: string;
  name: string;
  year: number;
  medium: Medium;
  /** The reality it plays out in — First Steps is Marvel Studios, but Earth-828. */
  reality: RealityId;
  /**
   * Other realities the title spends real time in. No Way Home is an Earth-616
   * film that two other Spider-Men walk into; Multiverse of Madness is half set
   * on Earth-838. Home reality still decides where the card sits on the map.
   */
  visits?: RealityId[];
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
