import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    /*
     * The `~/…` alias, spelled out again. Vitest does not read tsconfig
     * `paths`, and pulling in a plugin to do it would be a dependency for one
     * line. This is the third place the alias is stated — tsconfig.json for the
     * compiler, scripts/ts-alias-hooks.mjs for plain `node` — so all three move
     * together if src/ ever does.
     */
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  /*
   * tsconfig sets `jsx: "preserve"` because Next does the transform. Vite reads
   * that and then hands raw JSX to a parser that cannot take it, which is a
   * syntax error in src/i18n/locale.tsx the moment a test imports ~/i18n —
   * nothing renders here, the module just has to load.
   */
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    /*
     * Unit tests only. The Playwright specs beside them are run by `pnpm e2e`;
     * if vitest collected them it would import @playwright/test's runner
     * outside its own process and fail on the spot.
     */
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
