/**
 * Fails if anything in src/data has no Simplified-Chinese counterpart in
 * src/i18n/zh, or if a translation is keyed to something that no longer exists.
 *
 * The app never breaks on a gap — every lookup in src/i18n falls back to the
 * English source — which is exactly why a gap has to be shouted about here
 * rather than quietly shipping a half-translated panel.
 *
 * Run it with `pnpm i18n:check`.
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./ts-alias-hooks.mjs", pathToFileURL(import.meta.filename));

const [
  { TITLES },
  { CHARACTERS },
  { DEPENDENCIES },
  { METADATA },
  { BANNERS, REALITIES },
  zhTitles,
  zhCharacters,
  zhDependencies,
  zhPeople,
  terms,
] = await Promise.all(
  [
    "../src/data/titles.ts",
    "../src/data/characters.ts",
    "../src/data/dependencies.ts",
    "../src/data/metadata.ts",
    "../src/lib/graph.ts",
    "../src/i18n/zh/titles.ts",
    "../src/i18n/zh/characters.ts",
    "../src/i18n/zh/dependencies.ts",
    "../src/i18n/zh/people.ts",
    "../src/i18n/zh/terms.ts",
  ].map((p) => import(new URL(p, import.meta.url).href)),
);

/** Every value some field takes across a collection, skipping the empty ones. */
const values = (rows, pick) =>
  new Set(rows.flatMap((row) => [pick(row)].flat().filter(Boolean)));

const expected = {
  titles: values(TITLES, (t) => t.id),
  characters: values(CHARACTERS, (c) => c.id),
  dependencies: values(DEPENDENCIES, (d) => `${d.from}->${d.to}`),
  people: new Set([
    ...CHARACTERS.flatMap((c) => c.actors),
    ...TITLES.flatMap((t) =>
      t.cast.map((entry) => entry.actor).filter(Boolean),
    ),
    ...Object.values(METADATA).flatMap((m) => m.director ?? m.creator ?? []),
  ]),
  "cast notes": values(TITLES, (t) => t.cast.map((entry) => entry.note)),
  sagas: values(TITLES, (t) => t.saga),
  phases: values(TITLES, (t) => t.phase),
  timelines: values(CHARACTERS, (c) => c.timeline),
  realities: new Set(Object.keys(REALITIES)),
  banners: new Set(Object.keys(BANNERS)),
};

const translated = {
  titles: new Set(Object.keys(zhTitles.ZH_TITLES)),
  characters: new Set(Object.keys(zhCharacters.ZH_CHARACTERS)),
  dependencies: new Set(Object.keys(zhDependencies.ZH_DEPENDENCIES)),
  people: new Set(Object.keys(zhPeople.ZH_PEOPLE)),
  "cast notes": new Set(Object.keys(terms.ZH_CAST_NOTES)),
  sagas: new Set(Object.keys(terms.ZH_SAGAS)),
  phases: new Set(Object.keys(terms.ZH_PHASES)),
  timelines: new Set(Object.keys(terms.ZH_TIMELINES)),
  realities: new Set(Object.keys(terms.ZH_REALITIES)),
  banners: new Set(Object.keys(terms.ZH_BANNERS)),
};

let failed = false;
for (const [label, want] of Object.entries(expected)) {
  const got = translated[label];
  const missing = [...want].filter((k) => !got.has(k));
  const stale = [...got].filter((k) => !want.has(k));
  if (missing.length || stale.length) {
    failed = true;
    console.error(
      `FAIL ${label}: ${want.size} in the data, ${got.size} translated`,
    );
    if (missing.length) console.error(`  untranslated: ${missing.join(", ")}`);
    if (stale.length)
      console.error(`  gone from the data: ${stale.join(", ")}`);
  } else {
    console.log(`ok   ${label}: ${want.size}`);
  }
}

if (failed) {
  console.error(
    "\nAdd the missing entries to src/i18n/zh, or drop the stale ones.",
  );
  process.exit(1);
}
