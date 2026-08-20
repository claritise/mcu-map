"use client";

import { useEffect } from "react";

import { reportError } from "~/lib/report-error";

/**
 * Catches a crash inside the map without taking the document with it.
 *
 * Before this existed, any throw below the layout — and the map is one big
 * client component full of effects, canvas maths and browser APIs — fell
 * through to Next's generic "client-side exception has occurred" page. Nothing
 * was logged anywhere, nobody was told, and the visitor had no way back except
 * the browser's own reload button.
 */
export default function MapError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: "page", digest: error.digest });
  }, [error]);

  return (
    <main className="bg-canvas-bg text-text-primary flex h-[100dvh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div>
        <h1 className="text-[17px] font-semibold tracking-tight">
          The map stopped drawing.
        </h1>
        <p className="text-text-secondary mx-auto mt-2 max-w-sm text-[13px] leading-relaxed">
          Something went wrong rendering the graph. Nothing you did caused it,
          and nothing is saved that could be lost.
        </p>
        {error.digest && (
          <p className="text-text-muted mt-3 font-mono text-[11px]">
            {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="text-text-primary min-h-11 rounded-md bg-white/[0.09] px-4 text-[13px] font-medium transition-colors hover:bg-white/[0.15]"
      >
        Try again
      </button>
    </main>
  );
}
