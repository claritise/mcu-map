/**
 * Fills src/data/metadata.ts with per-title facts from Wikidata:
 * IMDb id, director (or creator, for series), runtime, episode count and the
 * exact release date.
 *
 *   pnpm metadata
 *
 * Every title is pinned to its English Wikipedia article rather than looked up
 * by name: searching Wikidata for "Iron Man" cheerfully returns the character,
 * the comic and an anime, and an IMDb id is not a field you want a fuzzy match
 * on. Articles resolve to Wikidata ids in one batch, claims in a second.
 */
import { readFileSync } from "node:fs";

import { writeGenerated } from "./write-generated.mjs";

const UA = "mcu-map/0.1 (local dev)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(host, params) {
  const url = new URL(`https://${host}/w/api.php`);
  url.search = new URLSearchParams({ format: "json", ...params }).toString();
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429) {
      await sleep(1200 * (attempt + 1));
      continue;
    }
    if (res.ok) return res.json();
  }
  return null;
}

/**
 * title id → English Wikipedia article. Seasons point at the series article.
 *
 * A bare `Q…` is used instead where the film has no article of its own yet:
 * "Avengers: Secret Wars" redirects into the Phase Six list, whose Wikidata
 * item is the list, not the film, and carries no IMDb id. Naming the film's
 * item directly skips the redirect.
 */
const ARTICLE = {
  "iron-man": "Iron Man (2008 film)",
  "incredible-hulk": "The Incredible Hulk (film)",
  "iron-man-2": "Iron Man 2",
  thor: "Thor (film)",
  "first-avenger": "Captain America: The First Avenger",
  avengers: "The Avengers (2012 film)",
  "iron-man-3": "Iron Man 3",
  "thor-dark-world": "Thor: The Dark World",
  "winter-soldier": "Captain America: The Winter Soldier",
  guardians: "Guardians of the Galaxy (film)",
  "age-of-ultron": "Avengers: Age of Ultron",
  "ant-man": "Ant-Man (film)",
  "civil-war": "Captain America: Civil War",
  "doctor-strange": "Doctor Strange (2016 film)",
  "gotg-2": "Guardians of the Galaxy Vol. 2",
  homecoming: "Spider-Man: Homecoming",
  ragnarok: "Thor: Ragnarok",
  "black-panther": "Black Panther (film)",
  "infinity-war": "Avengers: Infinity War",
  "ant-man-wasp": "Ant-Man and the Wasp",
  "captain-marvel": "Captain Marvel (film)",
  endgame: "Avengers: Endgame",
  "far-from-home": "Spider-Man: Far From Home",
  wandavision: "WandaVision",
  "falcon-winter-soldier": "The Falcon and the Winter Soldier",
  "loki-s1": "Loki (TV series)",
  "loki-s2": "Loki (TV series)",
  "black-widow": "Black Widow (2021 film)",
  "what-if-s1": "What If...? (TV series)",
  "what-if-s2": "What If...? (TV series)",
  "what-if-s3": "What If...? (TV series)",
  "shang-chi": "Shang-Chi and the Legend of the Ten Rings",
  eternals: "Eternals (film)",
  hawkeye: "Hawkeye (miniseries)",
  "no-way-home": "Spider-Man: No Way Home",
  "moon-knight": "Moon Knight (miniseries)",
  "multiverse-of-madness": "Doctor Strange in the Multiverse of Madness",
  "ms-marvel": "Ms. Marvel (miniseries)",
  "love-and-thunder": "Thor: Love and Thunder",
  "she-hulk": "She-Hulk: Attorney at Law",
  "werewolf-by-night": "Werewolf by Night (TV special)",
  "wakanda-forever": "Black Panther: Wakanda Forever",
  "gotg-holiday": "The Guardians of the Galaxy Holiday Special",
  quantumania: "Ant-Man and the Wasp: Quantumania",
  "gotg-3": "Guardians of the Galaxy Vol. 3",
  "secret-invasion": "Secret Invasion (miniseries)",
  "the-marvels": "The Marvels",
  echo: "Echo (miniseries)",
  "deadpool-wolverine": "Deadpool & Wolverine",
  "agatha-all-along": "Agatha All Along (miniseries)",
  "your-friendly-neighborhood-spider-man":
    "Your Friendly Neighborhood Spider-Man",
  "brave-new-world": "Captain America: Brave New World",
  "daredevil-born-again": "Daredevil: Born Again",
  thunderbolts: "Thunderbolts*",
  ironheart: "Ironheart (miniseries)",
  "fantastic-four-first-steps": "The Fantastic Four: First Steps",
  "eyes-of-wakanda": "Eyes of Wakanda",
  "marvel-zombies": "Marvel Zombies (miniseries)",
  "wonder-man": "Wonder Man (miniseries)",
  "born-again-s2": "Daredevil: Born Again",
  "born-again-s3": "Daredevil: Born Again",
  "punisher-one-last-kill": "The Punisher: One Last Kill",
  "brand-new-day": "Spider-Man: Brand New Day",
  visionquest: "VisionQuest",
  "avengers-doomsday": "Avengers: Doomsday",
  "avengers-secret-wars": "Q113244842",
  "x-men": "X-Men (film)",
  x2: "X2 (film)",
  "last-stand": "X-Men: The Last Stand",
  "origins-wolverine": "X-Men Origins: Wolverine",
  "the-wolverine": "The Wolverine (film)",
  "first-class": "X-Men: First Class",
  "days-of-future-past": "X-Men: Days of Future Past",
  apocalypse: "X-Men: Apocalypse",
  "dark-phoenix": "Dark Phoenix (film)",
  "new-mutants": "The New Mutants (film)",
  logan: "Logan (film)",
  deadpool: "Deadpool (film)",
  "deadpool-2": "Deadpool 2",
  "fantastic-four-2005": "Fantastic Four (2005 film)",
  "rise-silver-surfer": "Fantastic Four: Rise of the Silver Surfer",
  fant4stic: "Fantastic Four (2015 film)",
  "daredevil-2003": "Daredevil (2003 film)",
  "elektra-2005": "Elektra (2005 film)",
  "spider-man-2002": "Spider-Man (2002 film)",
  "spider-man-2": "Spider-Man 2",
  "spider-man-3": "Spider-Man 3",
  "amazing-spider-man": "The Amazing Spider-Man (2012 film)",
  "amazing-spider-man-2": "The Amazing Spider-Man 2",
  venom: "Venom (2018 film)",
  "venom-carnage": "Venom: Let There Be Carnage",
  morbius: "Morbius (film)",
  "madame-web": "Madame Web (film)",
  "venom-last-dance": "Venom: The Last Dance",
  kraven: "Kraven the Hunter (film)",
  "into-spider-verse": "Spider-Man: Into the Spider-Verse",
  "across-spider-verse": "Spider-Man: Across the Spider-Verse",
  // x-men-mcu, ghost-rider and black-panther-3 are dated but unannounced: no article yet.
};

const source = [
  "src/data/titles.mcu.ts",
  "src/data/titles.fox.ts",
  "src/data/titles.sony.ts",
]
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");
const titles = [
  ...source.matchAll(
    /id: "([\w-]+)",\n\s+name: "([^"]+)",\n\s+year: (\d+),\n(?:\s+order: \d+,\n)?\s+medium: "(\w+)"/g,
  ),
].map(([, id, name, year, medium]) => ({ id, name, year: +year, medium }));

// ── articles → wikidata ids ───────────────────────────────────────────────
const isQid = (a) => /^Q\d+$/.test(a);
const wanted = [...new Set(Object.values(ARTICLE))].filter((a) => !isQid(a));
const qidByArticle = new Map(
  [...new Set(Object.values(ARTICLE))].filter(isQid).map((q) => [q, q]),
);
for (let i = 0; i < wanted.length; i += 40) {
  const json = await api("en.wikipedia.org", {
    action: "query",
    prop: "pageprops",
    ppprop: "wikibase_item",
    redirects: "1",
    titles: wanted.slice(i, i + 40).join("|"),
  });
  const q = json?.query ?? {};
  const alias = new Map(
    [...(q.normalized ?? []), ...(q.redirects ?? [])].map((h) => [
      h.from,
      h.to,
    ]),
  );
  const byTitle = new Map(
    Object.values(q.pages ?? {}).map((p) => [
      p.title,
      p.pageprops?.wikibase_item,
    ]),
  );
  for (const a of wanted.slice(i, i + 40)) {
    let at = a;
    for (let hop = 0; hop < 4 && alias.has(at); hop++) at = alias.get(at);
    if (byTitle.get(at)) qidByArticle.set(a, byTitle.get(at));
  }
  await sleep(300);
}
console.log(
  `${wanted.filter((a) => qidByArticle.has(a)).length}/${wanted.length} articles resolved to Wikidata`,
);

// ── wikidata claims ───────────────────────────────────────────────────────
const qids = [...new Set(qidByArticle.values())];
const claimsByQid = new Map();
for (let i = 0; i < qids.length; i += 40) {
  const json = await api("www.wikidata.org", {
    action: "wbgetentities",
    props: "claims",
    ids: qids.slice(i, i + 40).join("|"),
  });
  for (const [qid, ent] of Object.entries(json?.entities ?? {}))
    claimsByQid.set(qid, ent.claims ?? {});
  await sleep(300);
}

const read = (cl, p, f) =>
  (cl[p] ?? [])
    .filter((x) => x.rank !== "deprecated")
    .map((x) => f(x.mainsnak?.datavalue?.value))
    .filter(Boolean);

/**
 * P577 carries one dated statement per territory, qualified with P291 (place
 * of publication; Q30 is the United States).
 *
 * Abandoned schedule slots: the COVID shuffles, Doomsday moving off 1 May,
 * stay on the entity as `rank: "deprecated"`, so those must be dropped or the
 * film reads as released on a date it never opened. Where an entity marks a
 * date `preferred`, that is the one to take. Emit nothing rather than guess.
 */
const releaseDate = (cl, year) => {
  const rows = (cl.P577 ?? [])
    .filter((st) => st.rank !== "deprecated")
    .map((st) => ({
      date: st.mainsnak?.datavalue?.value?.time?.slice(1, 11),
      us: (st.qualifiers?.P291 ?? []).some(
        (q) => q.datavalue?.value?.id === "Q30",
      ),
      preferred: st.rank === "preferred",
    }))
    .filter((r) => r.date?.startsWith(String(year)));
  return (
    rows.find((r) => r.preferred && r.us) ??
    rows.find((r) => r.us) ??
    rows.find((r) => r.preferred) ??
    rows.sort((a, b) => a.date.localeCompare(b.date))[0]
  )?.date;
};

const facts = new Map();
for (const [qid, cl] of claimsByQid) {
  facts.set(qid, {
    claims: cl,
    imdb: read(cl, "P345", (v) => v)[0],
    directors: read(cl, "P57", (v) => v?.id),
    creators: read(cl, "P170", (v) => v?.id),
    runtime:
      Math.round(+(read(cl, "P2047", (v) => v?.amount)[0] ?? 0)) || undefined,
    episodes:
      Math.round(+(read(cl, "P1113", (v) => v?.amount)[0] ?? 0)) || undefined,
  });
}

/** An article shared by more than one title means those titles are seasons. */
const articleUse = {};
for (const t of titles)
  articleUse[ARTICLE[t.id]] = (articleUse[ARTICLE[t.id]] ?? 0) + 1;
const isSeason = (t) => (articleUse[ARTICLE[t.id]] ?? 0) > 1;

// ── people ids → names ────────────────────────────────────────────────────
const people = [
  ...new Set(
    [...facts.values()].flatMap((f) => [...f.directors, ...f.creators]),
  ),
];
const nameOf = new Map();
for (let i = 0; i < people.length; i += 40) {
  const json = await api("www.wikidata.org", {
    action: "wbgetentities",
    props: "labels",
    languages: "en",
    ids: people.slice(i, i + 40).join("|"),
  });
  for (const [qid, ent] of Object.entries(json?.entities ?? {})) {
    if (ent.labels?.en?.value) nameOf.set(qid, ent.labels.en.value);
  }
  await sleep(300);
}

const misses = [];
const body = titles
  .map((t) => {
    const f = facts.get(qidByArticle.get(ARTICLE[t.id]));
    if (!f) {
      misses.push(t.id);
      return null;
    }
    const isFilm = t.medium === "film";
    const who = (
      isFilm ? f.directors : f.creators.length ? f.creators : f.directors
    )
      .map((q) => nameOf.get(q))
      .filter(Boolean);
    const parts = [];
    if (f.imdb) parts.push(`imdb: ${JSON.stringify(f.imdb)}`);
    if (who.length)
      parts.push(`${isFilm ? "director" : "creator"}: ${JSON.stringify(who)}`);
    if (f.runtime && isFilm) parts.push(`runtime: ${f.runtime}`);
    // A season shares its series' article, so the show-wide episode count and
    // first-air date would both be wrong against a single season.
    if (!isSeason(t)) {
      if (f.episodes && !isFilm) parts.push(`episodes: ${f.episodes}`);
      const released = releaseDate(f.claims, t.year);
      if (released) parts.push(`released: ${JSON.stringify(released)}`);
    }
    return parts.length
      ? `  ${JSON.stringify(t.id)}: { ${parts.join(", ")} },`
      : null;
  })
  .filter(Boolean)
  .join("\n");

await writeGenerated(
  "src/data/metadata.ts",
  `/**
 * Per-title facts pulled from Wikidata. Generated by \\\`pnpm metadata\\\`;
 * do not hand-edit.
 *
 * Streaming availability is deliberately NOT stored: it is regional and it
 * changes constantly. \\\`watchLinks()\\\` in ./watch.ts builds aggregator links
 * instead, which stay correct without maintenance.
 *
 * Season entries share their series' article, so they share its IMDb id and
 * creator credit, and carry no release date of their own.
 */
export type TitleMeta = {
  /** IMDb title id, e.g. "tt4154796". */
  imdb?: string;
  /** Films. */
  director?: string[];
  /** Series and specials. */
  creator?: string[];
  /** Minutes; films only. */
  runtime?: number;
  episodes?: number;
  /** Exact release / first-air date, ISO. */
  released?: string;
};

export const METADATA: Record<string, TitleMeta> = {
${body}
};

export const meta = (id: string): TitleMeta => METADATA[id] ?? {};
`,
);

console.log(
  `${titles.length - misses.length}/${titles.length} titles written.`,
);
if (misses.length) console.log(`No article mapped: ${misses.join(", ")}`);
