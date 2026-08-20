import type { Title } from "./types";
import { MCU_TITLES } from "./titles.mcu";
import { FOX_TITLES } from "./titles.fox";
import { SONY_TITLES } from "./titles.sony";
import { TV_TITLES } from "./titles.tv";
import { CLASSIC_TITLES } from "./titles.classic";

export const TITLES: Title[] = [
  ...MCU_TITLES,
  ...FOX_TITLES,
  ...SONY_TITLES,
  ...TV_TITLES,
  ...CLASSIC_TITLES,
];

export const TITLE_BY_ID = new Map(TITLES.map((t) => [t.id, t]));
