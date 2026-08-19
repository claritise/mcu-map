"use client";

import { Analytics } from "@vercel/analytics/next";

/**
 * One event per visit, and nothing else.
 *
 * Vercel's free tier includes 50,000 Web Analytics events a month, and this is
 * a single-page app: the only thing worth counting is that somebody arrived.
 * `beforeSend` drops everything that is not that first pageview — custom
 * events, and any repeat pageview the SPA might emit — so one visitor costs
 * exactly one event no matter how long they poke at the map.
 *
 * The URL is stripped to its path as well: search terms and filter state have
 * no business leaving the browser.
 */
/* Module scope, not component state: this must survive re-renders, and it is
   meant to reset only when the page itself is loaded again. */
let counted = false;

export function VisitAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        if (event.type !== "pageview" || counted) return null;
        counted = true;
        return { ...event, url: new URL(event.url).origin + "/" };
      }}
    />
  );
}
