import { defineConfig, devices } from "@playwright/test";

/**
 * The browser half of the harness, deliberately kept out of `pnpm check`.
 *
 * These specs exist because the three bugs they pin were all invisible to
 * everything else in this repo: the data was right, the types were right, the
 * layout maths was right, and thirteen cards were still parked under a sheet
 * because nothing had ever compared a rendered card's box against the chrome's.
 * That comparison needs a real browser at a real size, so it is its own
 * command — `pnpm e2e` — rather than a browser download bolted onto the check
 * everyone runs before every commit.
 */
const PORT = 3100;
const HOST = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  /* A committed `.only` silently shrinks CI's run to one test. */
  forbidOnly: !!process.env.CI,
  /*
   * The assertions are about a camera that animates into place, so the failure
   * mode on a loaded CI box is "measured too early" rather than "wrong". The
   * specs wait for the viewport transform to stop moving before measuring; the
   * retry is for the case where even that wait loses a race with a cold
   * Turbopack compile.
   */
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  /* CI also writes the HTML report, which is what the workflow uploads: the
     failures here are visual, and a stack trace cannot show a card sitting
     under a sheet. */
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: HOST,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    /*
     * `next dev`, not a production build: the point is to catch a camera
     * regression in the source someone is editing, and asking for a build first
     * would put four minutes between a change and the test that judges it.
     */
    command: `pnpm exec next dev --turbo --port ${PORT}`,
    url: HOST,
    reuseExistingServer: !process.env.CI,
    // First request compiles the whole route, which is not fast on a cold cache.
    timeout: 180_000,
  },
});
