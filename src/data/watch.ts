import { meta } from "./metadata";
import type { Title } from "./types";

/**
 * Outbound links for a title.
 *
 * Streaming availability is deliberately not stored anywhere in this repo: it
 * is regional, it is split across subscription/rent/buy, and it changes often
 * enough that any hard-coded answer would be wrong within weeks. JustWatch
 * already aggregates all of that per region, so we link to it and stay correct
 * without maintenance.
 */
export type WatchLink = {
  label: string;
  href: string;
  /** `watch` is where to stream or buy it; `reference` is further reading. */
  kind: "watch" | "reference";
};

/** Which JustWatch storefront to send people to. */
const REGION = "us";

const MONTHS = [
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
 * Formatted without `Intl`/`Date` on purpose: the value is a plain calendar
 * date, and running it through a timezone can move it a day either way and
 * mismatch between server and client render.
 */
export function formatReleased(iso?: string) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  const month = MONTHS[Number(m) - 1];
  return y && month && d ? `${Number(d)} ${month} ${y}` : null;
}

export function formatRuntime(minutes?: number) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

/** "Loki (Season 1)" and "Fantastic Four (2015)" are our labels, not search terms. */
const searchName = (name: string) =>
  name
    .replace(/\s*\((?:Season \d+|\d{4})\)\s*$/, "")
    .replace(/…/g, "...")
    .trim();

export function watchLinks(title: Title): WatchLink[] {
  const links: WatchLink[] = [];

  // Nothing to stream or buy yet, so offering the link would just disappoint.
  if (!title.upcoming) {
    links.push({
      kind: "watch",
      label: "Where to watch",
      href: `https://www.justwatch.com/${REGION}/search?q=${encodeURIComponent(searchName(title.name))}`,
    });
  }

  const { imdb } = meta(title.id);
  if (imdb) {
    links.push({
      kind: "reference",
      label: "IMDb",
      href: `https://www.imdb.com/title/${imdb}/`,
    });
  }

  return links;
}
