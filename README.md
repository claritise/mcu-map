# Marvel viewing-dependency map

Every Marvel Studios, Fox and Sony release as an interactive graph. Artwork cards are the
nodes: 2:3 posters for films, 16:9 key art for series, laid out one row per release year
with the oldest at the bottom. Click a title and the map lights up **only the things you
should watch first**, with the reason on hover and the full cast in the panel. The whole
interface is bilingual, English and Simplified Chinese.

```bash
pnpm dev
```

## How it's put together

| Piece        | File                                                                                                                        | What it holds                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Types        | [src/data/types.ts](src/data/types.ts)                                                                                      | `Title`, `Character`, `CastEntry`, `Dependency`                      |
| Characters   | [src/data/characters.ts](src/data/characters.ts)                                                                            | One entry per character, with every actor who has played them        |
| Titles       | [titles.mcu.ts](src/data/titles.mcu.ts), [titles.fox.ts](src/data/titles.fox.ts), [titles.sony.ts](src/data/titles.sony.ts) | 100 films, series and specials with their cast                       |
| Edges        | [src/data/dependencies.ts](src/data/dependencies.ts)                                                                        | 187 "watch this first" links, each with a strength and a reason      |
| Facts        | [src/data/metadata.ts](src/data/metadata.ts)                                                                                | Runtime, release date, director, IMDb id. Generated, `pnpm metadata` |
| Graph logic  | [src/lib/graph.ts](src/lib/graph.ts)                                                                                        | Layouts, ancestor traversal, topological watch order                 |
| UI           | [src/app/_components/](src/app/_components/)                                                                                | Canvas, artwork node, year rail, detail panel                        |
| Artwork      | [src/data/posters.ts](src/data/posters.ts)                                                                                  | Generated, see _Artwork_ below                                       |
| Translations | [src/i18n/](src/i18n/)                                                                                                      | Chrome strings plus a Simplified-Chinese layer over every data file  |

### The data model

A dependency is a directed edge with a strength:

```ts
d(
  "wandavision",
  "multiverse-of-madness",
  "essential",
  "Wanda's villain turn happens off-screen, in the show.",
);
```

- **essential**: the target is confusing or spoiled without it
- **recommended**: you'll follow the plot, but you'll miss the weight
- **optional**: a cameo, a stinger, a running joke

The map draws **essential and recommended** links and stops there — `MAX_KIND` in
[media-map.tsx](src/app/_components/media-map.tsx). Essential-only was too thin to be worth
a control and everything-including-cameos too noisy, so it is a constant rather than a
switch. Optional edges still exist in the data and still appear in the detail panel's
prerequisite list; they are simply never drawn on the canvas.

Only **direct** edges are stored. `iron-man → avengers → civil-war` needs no shortcut edge;
`prerequisitesOf()` walks the graph, and `watchOrder()` runs Kahn's algorithm over the
result to produce a numbered watch list (that's the "full chain · 21" link in the panel).

### Characters and actors

Characters are stored once and referenced by id, because the same character is played by
different people across the map. `Character.actors` lists everyone who has played them;
a cast entry pins the performer for that specific title:

```ts
// The Incredible Hulk
c("hulk", true, { actor: "Edward Norton" });
// The Avengers onward
c("hulk", true, { actor: "Mark Ruffalo" });
```

Recast characters that this matters for: Hulk, War Machine, Red Skull, Thunderbolt Ross,
Professor X, Magneto, Mystique, Jean Grey, Cyclops, Storm, Beast, Nightcrawler, Colossus,
Stryker, Sabretooth, Kingpin, Elektra, Daredevil, and all four of the Fantastic Four.

Clicking a character in the detail panel traces every title they appear in across the map.

## Artwork

Two steps. [scripts/fetch-posters.mjs](scripts/fetch-posters.mjs) finds the artwork and
writes `assets/posters-src/manifest.json`; [scripts/optimize-posters.mjs](scripts/optimize-posters.mjs)
encodes it and regenerates [src/data/posters.ts](src/data/posters.ts).

```bash
pnpm posters --download      # find artwork, self-host into assets/posters-src/
pnpm posters:optimize        # encode to WebP, build the sprite atlas, write posters.ts
```

`posters:optimize` emits two tiers: one shared sprite atlas that paints every thumbnail on
the zoomed-out map in a single request, and a per-title card fetched only once that card is
drawn larger than its atlas cell. Filenames carry a content hash, so `public/posters` is
served immutable for a year (see [next.config.js](next.config.js)).

Anything with no artwork falls back to a typographic card in its reality's colour — that is
the intended state for the unannounced titles, which have no Wikipedia article to draw
from. They are listed in `NO_ARTICLE` in the fetch script precisely so a blind search
cannot hand them somebody else's poster.

Wikipedia is the default because it needs no signup, but its film posters are non-free
fair-use files capped around 260×384, and most series only have a logo rather than key art,
so `--download` (self-hosting) is the polite way to use it. That's what's checked in right
now: 95 of 100 titles.

TMDB is the better source: real artwork for series, higher resolution, and a CDN meant
for hotlinking:

1. Free read token at <https://www.themoviedb.org/settings/api>
2. `TMDB_READ_TOKEN=...` in `.env`
3. Then:

```bash
TMDB_READ_TOKEN=$(grep TMDB_READ_TOKEN .env | cut -d= -f2- | tr -d '"') pnpm posters --source=tmdb
```

TMDB asks for one line of attribution if you publish this. Either way, the artwork itself
belongs to the studios. Fine for a personal map, worth a thought before you deploy it.

## Adding a title

1. Append a `Title` to the right file in `src/data/`.
2. Add any new characters to `characters.ts`.
3. Add its edges to `dependencies.ts`: direct prerequisites only, each with a reason.
4. `pnpm posters --download && pnpm posters:optimize` to pick up its artwork.
5. `pnpm metadata` to pick up its runtime, release date, director and IMDb id.
6. Add the Chinese name, blurb and any new people to `src/i18n/zh/`.

Ids are validated by TypeScript at the type level only. The full check:

```bash
pnpm typecheck && pnpm lint && pnpm i18n:check && pnpm format:check
```

`pnpm i18n:check` fails on anything in `src/data` with no Simplified-Chinese counterpart,
and on translations keyed to something that no longer exists. The app itself never breaks
on a gap — every lookup falls back to the English source — which is exactly why the gap has
to be shouted about here.

## Reading the map

Selection drives everything. Nothing is drawn until you click a title, because the full
edge set is an unreadable hairball across 100 titles. Cards are focusable, so Tab reaches
them and Enter or Space opens one.

| Border     | Means                                                                               |
| ---------- | ----------------------------------------------------------------------------------- |
| Bone white | the title you clicked                                                               |
| Amber      | a **direct** prerequisite: it also gets a line, and its reason on hover             |
| Steel blue | further back up the chain: lit, but no line                                         |
| Name chip  | tracing a character marks their cards with that title's casting instead (see below) |

**Character view** folds open in the chrome column. Pick anyone from the searchable list —
by character, alias, actor or reality, in either language — and every title they appear in
is marked with a chip carrying their name, bordered in the continuity that version of them
comes from: a blue Wolverine chip on a Marvel-produced film is the whole point of _Deadpool
& Wolverine_. The chip names _that title's_ casting, so Norton is on _The Incredible Hulk_
and Ruffalo everywhere after. A monogram in a circle made you guess which "N" you were
looking at; the name does not. Tracing is a set — pick Steve and Bucky at once and the map
lights everything either of them is in.

Only direct prerequisites get lines. Drawing the whole ancestor chain put lines through
every row between; and the reason text lives on the **card** (hover it) rather than on
the edge, because edge labels stacked on top of each other the moment two prerequisites
sat near one another.

## Layout and camera

- **One row per release year**, oldest at the bottom, so every arrow points up through
  time. Row height follows its content, so a year of only series is a short row, and the
  year label is set sideways at whatever size fills it. The rail thins the labels onto a
  calendar step — every year, other, fifth, tenth — rather than letting four digits collide.
- The camera is rail-mounted: horizontally pinned to the centre of the graph, scroll moves
  up and down only and stops at the ends, pinch/⌘-scroll zooming is off, and the slider is
  the zoom. The notch at 100% is the widest row exactly spanning the pane; the track carries
  on to 200%, where a poster is twice that size and the map is something you read rather
  than survey. **Fit** takes you to 0%, the whole graph in one screen.
- The map **opens at the notch**, not at the fit. Twenty-five years of releases squeezed
  into one pane shows you the shape of the thing and none of the content, which is a diagram
  of a map rather than a map.

The map owns its own pane; the controls, legend and detail panel live in a column beside
it, so no card is ever hidden behind chrome.

## Design notes

Chrome follows the surfaceful v0.3 language: warm-neutral dark palette
(`#101010` canvas / `#161615` surface / `#2a2a28` border), the 14/13/12/10/9 type ladder,
tapered hairline dividers, and the `bg-white/[0.06]` → `/[0.08]` → `/10` wash ladder.
Motion is [react-spring](https://react-spring.dev) on the same tuning as that mock
(`tension: 560, friction: 40`): the panel rises in, prerequisite rows trail in one by one,
and cards cross-fade between lit and dimmed. Cards deliberately never scale on selection;
rows are packed tight enough that growing one made it collide with its neighbours.

The React Flow attribution is hidden via `proOptions`. The library is MIT-licensed so this
is permitted, but the maintainers ask that you keep it unless you hold a Pro subscription,
your call.
