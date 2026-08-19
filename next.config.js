/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // The dev overlay badge sits exactly where the map's zoom control lives.
  devIndicators: false,

  /**
   * Everything under /_next/static is already served immutable; files in
   * public/ are not — Next sends them `must-revalidate`, so a returning visitor
   * pays a round trip per poster just to be told nothing changed. Poster
   * filenames carry a content hash (see scripts/optimize-posters.mjs), so new
   * artwork is always a new URL and a year-long immutable cache is safe.
   */
  async headers() {
    return [
      {
        source: "/posters/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default config;
