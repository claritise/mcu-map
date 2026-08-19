/**
 * Re-encodes the source artwork in assets/posters-src/ into what the map ships,
 * and regenerates src/data/posters.ts.
 *
 *   pnpm posters:optimize
 *
 * Two tiers, and the small one is a single image:
 *
 *  - ATLAS — every thumbnail packed onto one sprite sheet. The map opens zoomed
 *    out with the whole timeline on screen, so it would otherwise fire ~100
 *    image requests on first paint. Vercel's free tier caps edge REQUESTS
 *    (1M/month) long before it caps bytes, so one request for the whole mosaic
 *    is worth far more than one fewer kilobyte. Cells are cropped to the two
 *    card shapes exactly, which is what the cards render anyway.
 *  - CARD — full-resolution art per title, fetched only once a card is drawn
 *    bigger than its atlas cell. That is a handful of files per session.
 *
 * Filenames carry a content hash, which is what lets next.config.js serve them
 * `immutable` for a year: new artwork is a new URL, so nothing can go stale.
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import { writeGenerated } from "./write-generated.mjs";
import sharp from "sharp";

const SRC_DIR = "assets/posters-src";
const OUT_DIR = "public/posters";
const MANIFEST = `${SRC_DIR}/manifest.json`;

/**
 * Card widths come from CARD in src/lib/graph.ts (150 for posters, 244 for
 * landscape key art) doubled, so the art still holds up on a retina screen at
 * full zoom. THUMB is sized for the zoomed-out mosaic.
 */
const CARD = { cover: 300, contain: 488, quality: 72 };

/**
 * Atlas cell sizes, in the two shapes the cards come in: 2:3 for posters and
 * 16:9 for landscape key art, matching CARD in src/lib/graph.ts. Cells are a
 * fixed size per shape so the map can place one by arithmetic alone.
 */
const CELL = {
  cover: { w: 96, h: 142 },
  contain: { w: 156, h: 88 },
};
const ATLAS_WIDTH = 1200;
/** The map's own background, so letterboxing and gaps are invisible. */
const CANVAS = "#0d0d0c";
const ATLAS_QUALITY = 62;

if (!existsSync(MANIFEST)) {
  console.error(`No ${MANIFEST}. Run \`pnpm posters --download\` first.`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

// Start clean: stale hashed files would otherwise pile up in the deploy.
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const digest = (buf) =>
  createHash("sha256").update(buf).digest("hex").slice(0, 8);

async function encodeCard(id, file, fit) {
  const out = await sharp(`${SRC_DIR}/${file}`)
    .resize({ width: CARD[fit], withoutEnlargement: true })
    .webp({ quality: CARD.quality, effort: 6 })
    .toBuffer();
  const name = `${id}.${digest(out)}.webp`;
  writeFileSync(`${OUT_DIR}/${name}`, out);
  return { path: `/posters/${name}`, bytes: out.length };
}

/**
 * One cell, at exactly the card's shape. A real poster is cropped to fill, the
 * way the card does; landscape key art is letterboxed inside the cell instead,
 * because those files are wide logos that lose their title the moment you crop
 * them. The padding is the canvas colour, so it disappears into the card.
 */
const cellBuffer = (file, fit) =>
  sharp(`${SRC_DIR}/${file}`)
    // NB: sharp wants width/height and silently ignores anything else, so the
    // cell's w/h are mapped by hand rather than spread.
    .resize({
      width: CELL[fit].w,
      height: CELL[fit].h,
      fit: fit === "contain" ? "contain" : "cover",
      background: CANVAS,
    })
    .toBuffer();

/**
 * Shelf packing, one shelf per shape: posters fill rows of 12, key art rows of
 * 7. Nothing clever is needed — the exact rectangle of every cell is written
 * into the data file, so the layout only has to be stable, not optimal.
 */
function pack(items) {
  const placed = [];
  let y = 0;
  for (const shape of ["cover", "contain"]) {
    const shelf = items.filter((i) => i.fit === shape);
    const perRow = Math.floor(ATLAS_WIDTH / CELL[shape].w);
    for (let i = 0; i < shelf.length; i += perRow) {
      shelf.slice(i, i + perRow).forEach((item, column) => {
        placed.push({ ...item, x: column * CELL[shape].w, y, ...CELL[shape] });
      });
      y += CELL[shape].h;
    }
  }
  return { placed, height: y };
}

const items = [];
let sourceBytes = 0;
let cardBytes = 0;

for (const [id, entry] of Object.entries(manifest)) {
  // Entries from a non---download run are remote URLs with nothing to encode.
  if (!entry.file || !existsSync(`${SRC_DIR}/${entry.file}`)) continue;
  sourceBytes += readFileSync(`${SRC_DIR}/${entry.file}`).length;

  const card = await encodeCard(id, entry.file, entry.fit);
  cardBytes += card.bytes;
  items.push({ id, file: entry.file, fit: entry.fit, card: card.path });
  console.log(
    `✓ ${id.padEnd(38)} ${String(Math.round(card.bytes / 1024)).padStart(4)} KB card`,
  );
}

// ── The atlas ─────────────────────────────────────────────────────────────
const { placed, height } = pack(items);
const cells = await Promise.all(
  placed.map(async (cell) => ({
    input: await cellBuffer(cell.file, cell.fit),
    left: cell.x,
    top: cell.y,
  })),
);
const atlas = await sharp({
  create: {
    width: ATLAS_WIDTH,
    height,
    channels: 3,
    background: CANVAS,
  },
})
  .composite(cells)
  .webp({ quality: ATLAS_QUALITY, effort: 6 })
  .toBuffer();

const atlasName = `atlas.${digest(atlas)}.webp`;
writeFileSync(`${OUT_DIR}/${atlasName}`, atlas);

const body = placed
  .map(
    (cell) =>
      `  "${cell.id}": { src: "${items.find((i) => i.id === cell.id).card}", fit: "${cell.fit}",` +
      ` cell: { x: ${cell.x}, y: ${cell.y}, w: ${cell.w}, h: ${cell.h} } },`,
  )
  .join("\n");

await writeGenerated(
  "src/data/posters.ts",
  `/**
 * Poster artwork per title id. Generated by \\\`pnpm posters:optimize\\\`; do not
 * hand-edit — sources live in assets/posters-src/ and never ship.
 *
 *  - \\\`fit: "cover"\\\` is a real 2:3 poster and fills the card.
 *  - \\\`fit: "contain"\\\` is landscape key art (Wikipedia has no free poster for
 *    most series) and is centred inside the card rather than cropped to death.
 *  - \\\`cell\\\` is where the title sits on the sprite atlas — the zoomed-out map
 *    paints every card from that ONE image, and only fetches \\\`src\\\` once a card
 *    is drawn bigger than its cell.
 *
 * Filenames carry a content hash, so they are served immutable for a year.
 * Anything missing falls back to a typographic card in its reality's colour.
 */
export type PosterCell = { x: number; y: number; w: number; h: number };
export type PosterEntry = { src: string; fit: "cover" | "contain"; cell: PosterCell };

/** The sprite sheet every thumbnail on the map comes from: one request, total. */
export const POSTER_ATLAS = {
  src: "/posters/${atlasName}",
  width: ${ATLAS_WIDTH},
  height: ${height},
};

export const POSTERS: Record<string, PosterEntry> = {
${body}
};

export const poster = (id: string): PosterEntry | null => POSTERS[id] ?? null;
`,
);

const mb = (n) => (n / 1048576).toFixed(2);
console.log(
  `\n${items.length} titles · ${mb(sourceBytes)} MB source` +
    `\n  atlas  ${ATLAS_WIDTH}×${height}  ${(atlas.length / 1024).toFixed(0)} KB  (1 request for the whole map)` +
    `\n  cards  ${mb(cardBytes)} MB  (fetched only when zoomed in)`,
);
console.log(
  `Files in ${OUT_DIR} are content-hashed; sources stay in ${SRC_DIR}.`,
);
