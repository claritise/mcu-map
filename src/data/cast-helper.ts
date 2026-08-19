import type { CastEntry } from "./types";

/** Terse cast builder: c("iron-man", true, { note: "post-credits" }). */
export const c = (
  characterId: string,
  lead = false,
  extra: { actor?: string; note?: string } = {},
): CastEntry => ({ characterId, lead, ...extra });
