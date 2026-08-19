import type { Title } from "./types";
import { MCU_TITLES } from "./titles.mcu";
import { FOX_TITLES } from "./titles.fox";
import { SONY_TITLES } from "./titles.sony";

export const TITLES: Title[] = [...MCU_TITLES, ...FOX_TITLES, ...SONY_TITLES];

export const TITLE_BY_ID = new Map(TITLES.map((t) => [t.id, t]));
