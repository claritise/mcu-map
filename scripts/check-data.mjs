/**
 * Fails if the dataset is internally inconsistent.
 *
 * TypeScript checks the SHAPE of this data and nothing about its meaning: every
 * id is a `string`, so a typo in a dependency endpoint, a cast entry pointing
 * at a character that was renamed, or a cycle introduced by a plausible-looking
 * edge all compile perfectly and fail at runtime — usually as a blank detail
 * panel or a crash inside `watchOrder`, on one title, which nobody notices
 * until somebody clicks it.
 *
 * `graph.ts` is entitled to assume this file passed. `watchOrder` in particular
 * asserts non-null on `TITLE_BY_ID.get(...)`, which is only safe because every
 * dependency endpoint is checked here.
 *
 * Run it with `pnpm data:check`.
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

register("./ts-alias-hooks.mjs", pathToFileURL(import.meta.filename));

const [{ TITLES }, { CHARACTERS }, { DEPENDENCIES }, { POSTERS }] =
  await Promise.all(
    [
      "../src/data/titles.ts",
      "../src/data/characters.ts",
      "../src/data/dependencies.ts",
      "../src/data/posters.ts",
    ].map((f) => import(new URL(f, import.meta.url).href)),
  );

const problems = [];
const fail = (message) => problems.push(message);

const titleIds = new Set();
for (const title of TITLES) {
  if (titleIds.has(title.id)) fail(`duplicate title id: ${title.id}`);
  titleIds.add(title.id);
}

const characterIds = new Set();
for (const character of CHARACTERS) {
  if (characterIds.has(character.id))
    fail(`duplicate character id: ${character.id}`);
  characterIds.add(character.id);
  if (!character.actors?.length)
    fail(`character with no actors: ${character.id}`);
}

// ── Dependencies resolve, and mean something ──────────────────────────────
const seenEdge = new Map();
for (const dep of DEPENDENCIES) {
  const edge = `${dep.from}->${dep.to}`;
  if (!titleIds.has(dep.from)) fail(`dependency from unknown title: ${edge}`);
  if (!titleIds.has(dep.to)) fail(`dependency to unknown title: ${edge}`);
  if (dep.from === dep.to) fail(`title depends on itself: ${dep.from}`);
  if (!dep.reason?.trim()) fail(`dependency with no reason: ${edge}`);
  if (seenEdge.has(edge)) fail(`duplicate dependency: ${edge}`);
  seenEdge.set(edge, dep.kind);
}
for (const dep of DEPENDENCIES) {
  if (seenEdge.has(`${dep.to}->${dep.from}`)) {
    fail(`two titles each require the other: ${dep.from} <-> ${dep.to}`);
  }
}

// ── Cast resolves, and nobody is listed twice in one title ────────────────
const castCharacters = new Set();
for (const title of TITLES) {
  const seen = new Set();
  for (const entry of title.cast ?? []) {
    if (!characterIds.has(entry.characterId)) {
      fail(`unknown character "${entry.characterId}" in ${title.id}`);
    }
    if (seen.has(entry.characterId) && !entry.note) {
      fail(`${entry.characterId} listed twice in ${title.id}`);
    }
    seen.add(entry.characterId);
    castCharacters.add(entry.characterId);
  }
  if (!title.blurb?.trim()) fail(`title with no blurb: ${title.id}`);
}
for (const character of CHARACTERS) {
  if (!castCharacters.has(character.id)) {
    fail(`character appears in no title: ${character.id}`);
  }
}

// ── No cycles: watchOrder is a topological sort and would silently drop ───
// ── everything downstream of one.                                       ───
const outgoing = new Map(TITLES.map((t) => [t.id, []]));
for (const dep of DEPENDENCIES) outgoing.get(dep.from)?.push(dep.to);

const state = new Map();
const path = [];
function visit(id) {
  state.set(id, "open");
  path.push(id);
  for (const next of outgoing.get(id) ?? []) {
    if (state.get(next) === "open") {
      fail(`cycle: ${path.slice(path.indexOf(next)).join(" → ")} → ${next}`);
    } else if (!state.has(next)) {
      visit(next);
    }
  }
  path.pop();
  state.set(id, "done");
}
for (const title of TITLES) if (!state.has(title.id)) visit(title.id);

// ── A prerequisite released after the thing it precedes is a typo ─────────
const byId = new Map(TITLES.map((t) => [t.id, t]));
for (const dep of DEPENDENCIES) {
  const from = byId.get(dep.from);
  const to = byId.get(dep.to);
  if (from && to && from.year > to.year) {
    fail(
      `prerequisite is newer than what it precedes: ` +
        `${dep.from} (${from.year}) → ${dep.to} (${to.year})`,
    );
  }
}

// ── Artwork the data claims actually shipped ──────────────────────────────
for (const [id, entry] of Object.entries(POSTERS)) {
  if (!titleIds.has(id)) fail(`poster for unknown title: ${id}`);
  if (!existsSync(new URL(`../public${entry.src}`, import.meta.url))) {
    fail(`poster file missing: ${entry.src}`);
  }
}

const counts = [
  ["titles", TITLES.length],
  ["characters", CHARACTERS.length],
  ["dependencies", DEPENDENCIES.length],
  ["cast entries", TITLES.reduce((n, t) => n + (t.cast?.length ?? 0), 0)],
  ["artwork", Object.keys(POSTERS).length],
];
for (const [label, n] of counts) {
  console.log(`ok   ${label}: ${n}`);
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
