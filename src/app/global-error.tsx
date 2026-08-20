"use client";

import { useEffect } from "react";

import { reportError } from "~/lib/report-error";

/**
 * The last resort: a crash in the root layout itself, which replaces the whole
 * document and so has to bring its own <html> and <body>.
 *
 * It cannot use the app's styles — a layout that failed to render is exactly
 * the case where the stylesheet may be why — so the palette is inlined.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: "root", digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          background: "#101010",
          color: "#d0cfca",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <h1 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>
          MCU Map failed to load.
        </h1>
        <p style={{ fontSize: 13, color: "#9b9a91", margin: 0, maxWidth: 380 }}>
          Something went wrong before the page could start. Reloading usually
          clears it.
        </p>
        <button
          onClick={reset}
          style={{
            font: "inherit",
            fontSize: 13,
            color: "#d0cfca",
            background: "rgba(255,255,255,0.09)",
            border: 0,
            borderRadius: 6,
            padding: "12px 16px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
