/**
 * Fills src/data/posters.ts with poster artwork for every title.
 *
 *   pnpm posters                          Wikipedia, hotlinked (no key needed)
 *   pnpm posters --download               Wikipedia, saved to assets/posters-src/
 *   TMDB_READ_TOKEN=… pnpm posters --source=tmdb [--download]
 *
 * TMDB is the better source: real posters for series too, and a CDN intended for
 * hotlinking. Wikipedia's film posters are non-free fair-use files, so --download
 * (self-hosting) is the polite way to use them.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const download = args.includes("--download");
const token = process.env.TMDB_READ_TOKEN;
const apiKey = process.env.TMDB_API_KEY;
const source =
  args.find((a) => a.startsWith("--source="))?.split("=")[1] ??
  (token || apiKey ? "tmdb" : "wikipedia");

if (source === "tmdb" && !token && !apiKey) {
  console.error(
    "--source=tmdb needs TMDB_READ_TOKEN or TMDB_API_KEY. Free at themoviedb.org/settings/api",
  );
  process.exit(1);
}

const UA = "mcu-map/0.1 (local dev; https://github.com/)";

/**
 * Whatever previous runs found. Wikipedia throttles a full sweep hard, and a
 * run that gets 429'd must ADD to the manifest, never replace it — this used
 * to be written but never called, so each throttled run quietly dropped every
 * title it failed to re-fetch.
 */
function existingManifest(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Titles, parsed straight out of the data files ─────────────────────────
const source_ts = [
  "src/data/titles.mcu.ts",
  "src/data/titles.fox.ts",
  "src/data/titles.sony.ts",
]
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

const titles = [];
for (const block of source_ts.split(/\n  \{\n/).slice(1)) {
  const id = /^    id: "([^"]+)"/m.exec(block)?.[1];
  const name = /^    name: "([^"]+)"/m.exec(block)?.[1];
  const year = Number(/^    year: (\d+)/m.exec(block)?.[1]);
  const medium = /^    medium: "([^"]+)"/m.exec(block)?.[1];
  if (id && name) titles.push({ id, name, year, medium });
}

/**
 * Titles with no Wikipedia article at all: announced with a date and nothing
 * else. They are listed rather than left to fall through, because the search
 * below takes the single top hit for "<name> <year> film" and will happily
 * return somebody else's page — that is how X-Men and Ghost Rider both ended
 * up shipping the same artwork, and Black Panther III shipped Wakanda
 * Forever's poster. No article means no poster, and the map already has a
 * typographic fallback card for exactly that.
 */
const NO_ARTICLE = new Set(["x-men-mcu", "ghost-rider", "black-panther-3"]);

/** Wikipedia article names where a plain search picks the wrong page. */
const WIKI_ARTICLE = {
  "spider-man-2002": "Spider-Man (2002 film)",
  "spider-man-2": "Spider-Man 2",
  "spider-man-3": "Spider-Man 3",
  "amazing-spider-man": "The Amazing Spider-Man (2012 film)",
  "amazing-spider-man-2": "The Amazing Spider-Man 2",
  venom: "Venom (2018 film)",
  "venom-carnage": "Venom: Let There Be Carnage",
  "venom-last-dance": "Venom: The Last Dance",
  morbius: "Morbius (film)",
  "madame-web": "Madame Web (film)",
  kraven: "Kraven the Hunter (film)",
  "into-spider-verse": "Spider-Man: Into the Spider-Verse",
  "across-spider-verse": "Spider-Man: Across the Spider-Verse",
  "iron-man": "Iron Man (2008 film)",
  "incredible-hulk": "The Incredible Hulk (film)",
  thor: "Thor (film)",
  avengers: "The Avengers (2012 film)",
  guardians: "Guardians of the Galaxy (film)",
  "ant-man": "Ant-Man (film)",
  "doctor-strange": "Doctor Strange (2016 film)",
  "black-panther": "Black Panther (film)",
  "captain-marvel": "Captain Marvel (film)",
  "black-widow": "Black Widow (2021 film)",
  eternals: "Eternals (film)",
  wandavision: "WandaVision",
  "falcon-winter-soldier": "The Falcon and the Winter Soldier",
  "loki-s1": "Loki (TV series)",
  "loki-s2": "Loki (TV series)",
  "what-if-s1": "What If...? (TV series)",
  hawkeye: "Hawkeye (miniseries)",
  "moon-knight": "Moon Knight (TV series)",
  "ms-marvel": "Ms. Marvel (TV series)",
  "she-hulk": "She-Hulk: Attorney at Law",
  "werewolf-by-night": "Werewolf by Night (film)",
  "gotg-holiday": "The Guardians of the Galaxy Holiday Special",
  "secret-invasion": "Secret Invasion (miniseries)",
  echo: "Echo (miniseries)",
  "agatha-all-along": "Agatha All Along (miniseries)",
  ironheart: "Ironheart (miniseries)",
  "daredevil-born-again": "Daredevil: Born Again",
  thunderbolts: "Thunderbolts*",
  "deadpool-wolverine": "Deadpool & Wolverine",
  "x-men": "X-Men (film)",
  deadpool: "Deadpool (film)",
  logan: "Logan (film)",
  "new-mutants": "The New Mutants (film)",
  "fantastic-four-2005": "Fantastic Four (2005 film)",
  fant4stic: "Fantastic Four (2015 film)",
  "daredevil-2003": "Daredevil (2003 film)",
  "elektra-2005": "Elektra (2005 film)",
};

async function wikiArticle(title) {
  if (NO_ARTICLE.has(title.id)) return null;
  if (WIKI_ARTICLE[title.id]) return WIKI_ARTICLE[title.id];
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrlimit: "1",
    gsrsearch: `${title.name} ${title.year} ${title.medium === "film" ? "film" : "series"}`,
  }).toString();
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  const json = await res.json();
  const pages = Object.values(json.query?.pages ?? {});
  return pages[0]?.title ?? null;
}

async function fromWikipedia(title) {
  const article = await wikiArticle(title);
  if (!article) return null;
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article.replace(/ /g, "_"))}`,
    { headers: { "User-Agent": UA } },
  );
  if (!res.ok) return null;
  const json = await res.json();
  const image = json.originalimage;
  if (!image?.source) return null;
  return {
    src: image.source.split("?")[0],
    fit: image.height >= image.width ? "cover" : "contain",
    via: article,
  };
}

async function fromTmdb(title) {
  const query = title.name
    .replace(/\s*\((?:Season \d+|\d{4})\)$/, "")
    .replace(/\*$/, "")
    .replace(/…/g, "...");
  const kinds = title.medium === "film" ? ["movie", "tv"] : ["tv", "movie"];
  for (const kind of kinds) {
    for (const withYear of [true, false]) {
      const url = new URL(`https://api.themoviedb.org/3/search/${kind}`);
      url.searchParams.set("query", query);
      if (apiKey) url.searchParams.set("api_key", apiKey);
      if (withYear) {
        url.searchParams.set(
          kind === "movie" ? "year" : "first_air_date_year",
          String(title.year),
        );
      }
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) continue;
      const json = await res.json();
      const hit = json.results?.find((r) => r.poster_path);
      if (hit) {
        return {
          src: `https://image.tmdb.org/t/p/w342${hit.poster_path}`,
          fit: "cover",
          via: hit.title ?? hit.name,
        };
      }
    }
  }
  return null;
}

/**
 * Originals land OUTSIDE public/ on purpose: they are the source images, not
 * the ones the site ships. `pnpm posters:optimize` re-encodes them into
 * public/posters/ at a tenth of the weight.
 */
async function save(id, src) {
  const res = await fetch(src, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} downloading ${src}`);
  const ext = (
    new URL(src).pathname.match(/\.(jpg|jpeg|png|webp)$/i)?.[1] ?? "jpg"
  ).toLowerCase();
  mkdirSync(SRC_DIR, { recursive: true });
  writeFileSync(
    `${SRC_DIR}/${id}.${ext}`,
    Buffer.from(await res.arrayBuffer()),
  );
  return `${id}.${ext}`;
}

const SRC_DIR = "assets/posters-src";
const MANIFEST = `${SRC_DIR}/manifest.json`;

// ── Run ───────────────────────────────────────────────────────────────────
console.log(
  `Source: ${source}${download ? ` (self-hosting into ${SRC_DIR})` : ""}\n`,
);

const entries = existingManifest(MANIFEST);
const misses = [];
const logos = [];

for (const title of titles) {
  let hit = null;
  try {
    hit =
      source === "tmdb" ? await fromTmdb(title) : await fromWikipedia(title);
  } catch (error) {
    console.warn(`! ${title.id}: ${error.message}`);
  }

  if (!hit) {
    misses.push(title.id);
    console.warn(`✗ ${title.id}`);
    await sleep(120);
    continue;
  }

  let src = hit.src;
  if (download) {
    try {
      src = await save(title.id, hit.src);
    } catch (error) {
      console.warn(`! ${title.id} download failed: ${error.message}`);
    }
  }

  entries[title.id] = download
    ? { file: src, fit: hit.fit }
    : { src, fit: hit.fit };
  if (hit.fit === "contain") logos.push(title.id);
  console.log(
    `✓ ${title.id.padEnd(28)} ${hit.fit === "contain" ? "logo " : "poster"}  ${hit.via}`,
  );
  await sleep(120);
}

writeFileSync(MANIFEST, JSON.stringify(entries, null, 2) + "\n");

console.log(`\n${Object.keys(entries).length}/${titles.length} artwork found.`);
if (logos.length)
  console.log(
    `Logos rather than posters (TMDB would fix): ${logos.join(", ")}`,
  );
if (misses.length) console.log(`Missing: ${misses.join(", ")}`);
console.log(
  `\nManifest written to ${MANIFEST}. Run \`pnpm posters:optimize\` to encode.`,
);
