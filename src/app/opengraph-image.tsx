import { ImageResponse } from "next/og";

import { DEPENDENCIES } from "~/data/dependencies";
import { CHARACTERS } from "~/data/characters";
import { TITLES } from "~/data/titles";

/**
 * The link preview, drawn at build time rather than shipped as a binary.
 *
 * A share of this map used to arrive as a bare text card, because there was no
 * image at all. Rather than commit a PNG that goes stale the moment the data
 * grows, the card is generated from the data itself: the counts below are the
 * real ones, so the preview cannot drift from what the page contains.
 *
 * Deliberately typographic. Poster artwork is the studios' and a link preview
 * is the one place it would travel outside the site, so the card is built from
 * the map's own palette instead.
 */
export const alt = "MCU Map — Marvel watch order as a dependency graph";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* The three highlight roles, in the order the legend names them. */
const DOTS = ["#e8b14c", "#7f9bd1", "#4ea88a"];

export default function OpengraphImage() {
  const stats = [
    [String(TITLES.length), "titles"],
    [String(DEPENDENCIES.length), "dependencies"],
    [String(CHARACTERS.length), "characters"],
  ];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#101010",
        color: "#d0cfca",
        padding: "72px 80px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", gap: 18 }}>
        {DOTS.map((colour) => (
          <div
            key={colour}
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              background: colour,
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 82, fontWeight: 700, letterSpacing: -2 }}>
          MCU Map
        </div>
        <div style={{ fontSize: 38, color: "#9b9a91", marginTop: 14 }}>
          Marvel watch order as a dependency graph
        </div>
      </div>

      <div style={{ display: "flex", gap: 56 }}>
        {stats.map(([value, label]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 46, fontWeight: 600 }}>{value}</div>
            <div
              style={{
                fontSize: 22,
                color: "#6f6e66",
                textTransform: "uppercase",
                letterSpacing: 3,
                marginTop: 6,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
