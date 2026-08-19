/**
 * `next build`, with one retry for a race in Next's own build pipeline.
 *
 * Roughly one clean build in three to five dies during "Collecting page data":
 *
 *     [Error [PageNotFoundError]: Cannot find module for page: /_not-found]
 *     > Build error occurred
 *     [Error: Failed to collect page data for /_not-found]
 *
 * On a failed run `.next/server/app-paths-manifest.json` contains only
 * `{"/page": "app/page.js"}` — the `_not-found` and `icon.svg` entries are
 * missing even though their output directories exist. So the manifest is being
 * read before every app route has been emitted into it, and the workers that
 * collect page data then cannot require what the manifest never named.
 *
 * It is timing-sensitive rather than deterministic (it shows up under CPU
 * contention, which is to say on CI), it happens under both webpack and
 * Turbopack, and it does not reproduce on a bare Next app of the same version
 * with the same node_modules — so it is not something this repo's config,
 * fonts, worker count or ESLint step is causing. Next 16 may well have fixed
 * it; that is a major-version migration and a separate decision.
 *
 * Until then: recognise that one failure by its signature and run again. Any
 * other failure — a type error, a real broken import — is passed straight
 * through on the first attempt, so this cannot hide a genuine build break.
 */
import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { createRequire } from "node:module";

/*
 * Resolved rather than taken from PATH. `pnpm build` puts node_modules/.bin on
 * PATH and a bare `node scripts/build.mjs` does not, so spawning "next" worked
 * through the package script and died with "next: command not found" anywhere
 * else — including from a CI step that calls the file directly.
 */
const NEXT_BIN = createRequire(import.meta.url).resolve("next/dist/bin/next");

/** The race, and nothing else. */
const RACE = [
  "Cannot find module for page:",
  "Failed to collect page data",
  "PageNotFoundError",
];

const ATTEMPTS = 2;

function build(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [NEXT_BIN, "build", ...args], {
      stdio: ["inherit", "pipe", "pipe"],
    });
    let output = "";
    for (const stream of [child.stdout, child.stderr]) {
      stream.on("data", (chunk) => {
        output += chunk;
        process.stdout.write(chunk);
      });
    }
    child.on("close", (code) => resolve({ code, output }));
  });
}

const args = process.argv.slice(2);

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  const { code, output } = await build(args);
  if (code === 0) process.exit(0);

  const isRace = RACE.some((line) => output.includes(line));
  if (!isRace || attempt === ATTEMPTS) process.exit(code ?? 1);

  console.log(
    `\nnext build hit the page-data collection race (see scripts/build.mjs).` +
      ` Clearing .next and retrying — attempt ${attempt + 1} of ${ATTEMPTS}.\n`,
  );
  await rm(".next", { recursive: true, force: true });
}
