/**
 * The one place a client-side crash is reported from.
 *
 * There is no Sentry and no Datadog in this project — the only telemetry it
 * ships is Vercel Web Analytics, which counts one pageview per visit and is
 * deliberately blind to everything else (see `_components/analytics.tsx`). So
 * until an error tracker is wired up, a crash reaches exactly one place: the
 * browser console of the person it happened to.
 *
 * This function exists so that when a tracker IS added, there is a single call
 * site to change rather than a hunt through every boundary — and so that the
 * context worth having is already being assembled at the point of failure.
 *
 * To wire up Sentry, this becomes:
 *
 *     Sentry.captureException(error, { extra: context(...) })
 *
 * and nothing else in the app has to move.
 */
export type ErrorContext = {
  /** Which boundary caught it: "root", "page", or a named subsystem. */
  boundary: string;
  /** Next's error digest, when it has one — the key to the server-side log. */
  digest?: string;
} & Record<string, unknown>;

export function reportError(error: unknown, context: ErrorContext) {
  /*
   * Assembled even though nothing consumes it yet: it is the difference
   * between "the map crashed" and a report somebody can act on, and it costs
   * nothing to gather at the point the boundary already has it.
   */
  const payload = {
    ...context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    // Everything below narrows a report to the class of browser it came from,
    // which is where this app's failures actually live: storage policy,
    // viewport, and whether the canvas is being asked to do something odd.
    href: typeof window === "undefined" ? undefined : window.location.href,
    userAgent:
      typeof navigator === "undefined" ? undefined : navigator.userAgent,
    viewport:
      typeof window === "undefined"
        ? undefined
        : `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`,
    language: typeof navigator === "undefined" ? undefined : navigator.language,
    at: new Date().toISOString(),
  };

  console.error("[mcu-map] unhandled error", payload);
}
