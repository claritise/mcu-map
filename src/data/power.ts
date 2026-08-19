/**
 * Power levels. Every number here is an opinion.
 *
 * There is no in-universe scale — the films never once say how many tons Thor
 * lifts — so this is a ranking, not a measurement: one editor's reading of what
 * each version has actually been shown to do on screen, in the continuity they
 * belong to. It is scoped per incarnation for the same reason the rest of the
 * map is: Fox's Silver Surfer and Earth-828's are different beings with
 * different feats, and averaging them would be the one genuinely wrong answer.
 *
 * Rules the numbers were assigned by, so the disagreements can at least be
 * about the right thing:
 *  - Feats on screen, not the comics, and not the character's reputation.
 *  - Peak state counts. Jean is Phoenix, Wanda is the Darkhold, Thor is
 *    Wakanda-forge Thor — nobody is scored at their weakest scene.
 *  - Borrowed power belongs to whoever wields it. The Gauntlet is not Tony's.
 *  - Being unkillable is a power. Being clever is not, unless the cleverness
 *    is the weapon (Doom, the Leader, Killian).
 *
 * The scale runs 1–100,000 and it is LOGARITHMIC: every ×10 is one real step,
 * so Daredevil at 171 and Spider-Man at 4,410 are one class apart, not "twenty-
 * five Daredevils". A linear scale cannot hold this cast — put Galactus and
 * Foggy Nelson on the same ruler and every human being on the map rounds to
 * zero, which is both useless and ruder than intended.
 *
 * The top is pinned: the Watcher takes the full 100,000 because he is the only
 * one on this list who has watched everyone else lose. Below three digits the
 * scale stops discriminating and ties are left standing — Weasel and Trevor
 * Slattery both landing on 2 is the correct amount of precision for Weasel and
 * Trevor Slattery.
 */
export const POWER: Record<string, number> = {
  // ── Avengers ──────────────────────────────────────────────────────────
  "iron-man": 5620,
  "captain-america": 794,
  thor: 50100,
  hulk: 28200,
  "black-widow": 56,
  hawkeye: 40,
  "nick-fury": 14,
  "maria-hill": 12,
  "phil-coulson": 12,
  "war-machine": 2240,
  "pepper-potts": 112,
  "happy-hogan": 4,
  falcon: 631,
  "winter-soldier": 355,
  /* Above Strange. She beat him, then beat a version of him that had already
     beaten a version of her, and the film never pretended otherwise. */
  "scarlet-witch": 79400,
  vision: 14100,
  jarvis: 6,
  "quicksilver-mcu": 200,
  "sharon-carter": 50,
  "peggy-carter": 36,
  "howard-stark": 5,
  "red-skull": 22,
  zemo: 18,

  // ── Asgard ────────────────────────────────────────────────────────────
  loki: 3550,
  odin: 44700,
  heimdall: 1410,
  sif: 282,
  "jane-foster": 20000,
  darcy: 3,
  "erik-selvig": 4,
  hela: 39800,
  valkyrie: 1590,
  korg: 109,
  /** An Elder of the Universe doing a bit. The bit is not the ceiling. */
  grandmaster: 8910,
  gorr: 17800,

  // ── Cosmic / Guardians ────────────────────────────────────────────────
  thanos: 56200,
  nebula: 891,
  gamora: 785,
  "star-lord": 251,
  drax: 604,
  groot: 1370,
  rocket: 141,
  mantis: 447,
  yondu: 623,
  kraglin: 35,
  "high-evolutionary": 4470,
  "adam-warlock": 15900,
  collector: 1120,
  ronan: 2820,
  /** A planet with a face and an agenda. Celestial, and priced like one. */
  ego: 38900,
  korath: 89,

  // ── Ant-Man ───────────────────────────────────────────────────────────
  "ant-man": 1110,
  wasp: 881,
  "hank-pym": 178,
  "janet-van-dyne": 224,
  "cassie-lang": 176,
  luis: 2,

  // ── Spider-Man (616) ──────────────────────────────────────────────────
  "spider-man": 4410,
  "spider-man-yfnsm": 2210,
  mj: 4,
  ned: 4,
  "aunt-may": 4,
  "aunt-may-yfnsm": 3,
  vulture: 111,
  mysterio: 63,
  "norman-osborn": 50,
  "harry-osborn": 4,
  "otto-octavius": 197,
  tombstone: 174,
  nkati: 35,
  jorani: 870,
  noni: 35,
  bkai: 63,

  // ── Street level ──────────────────────────────────────────────────────
  daredevil: 171,
  "daredevil-fox": 88,
  kingpin: 221,
  "kingpin-fox": 110,
  elektra: 126,
  "elektra-fox": 70,
  punisher: 100,
  "karen-page": 3,
  "foggy-nelson": 3,
  "foggy-nelson-fox": 3,
  bullseye: 140,
  "bullseye-fox": 79,
  "white-tiger": 159,
  "jessica-jones": 708,
  "luke-cage": 775,
  "heather-glenn": 3,
  swordsman: 45,
  "curtis-hoyle": 11,
  echo: 562,
  "nico-minoru": 1570,
  blade: 1780,
  "ma-gnucci": 8,
  "bill-metzger": 3,

  // ── Thunderbolts / New Avengers ───────────────────────────────────────
  "kate-bishop": 39,
  yelena: 87,
  "red-guardian": 194,
  taskmaster: 169,
  "us-agent": 398,
  ghost: 501,
  val: 9,
  /** A million exploding suns, and the Void is the same entry. */
  sentry: 70800,

  // ── Mystic ────────────────────────────────────────────────────────────
  "doctor-strange": 35500,
  "ancient-one": 27800,
  mordo: 2180,
  /** Sorcerer Supreme of record, and the only person on this list to have
      taken the Abomination in a sanctioned bout. Above most of the Avengers,
      and that is the correct reading of the tape. */
  wong: 5480,
  "christine-palmer": 4,
  "america-chavez": 11200,
  agatha: 5550,
  "billy-maximoff": 12600,
  clea: 14000,
  "the-hood": 441,
  mephisto: 70000,
  "rio-vidal": 78500,
  lilia: 859,
  "jen-kale": 393,
  "alice-gulliver": 108,

  // ── Cosmic-adjacent Earth ─────────────────────────────────────────────
  "captain-marvel": 49600,
  "monica-rambeau": 9980,
  "ms-marvel": 1400,
  talos: 62,
  /** A Flerken. Swallowed the Tesseract and kept it in her own body, which is
      more than any founding Avenger managed. Ranked accordingly, on purpose. */
  goose: 2760,
  gravik: 2160,
  giah: 5490,
  "sonya-falsworth": 10,

  // ── Time ──────────────────────────────────────────────────────────────
  kang: 63100,
  mobius: 7,
  sylvie: 1760,
  ravonna: 34,
  ob: 11,
  "tva-paradox": 8,
  /** Watches. Could end it. Chooses the former, which is its own answer. */
  watcher: 100000,

  // ── Wakanda ───────────────────────────────────────────────────────────
  "black-panther": 2000,
  shuri: 1550,
  okoye: 168,
  mbaku: 193,
  killmonger: 848,
  namor: 17600,
  "everett-ross": 6,
  riri: 616,
  klaue: 10,

  // ── Ten Rings ─────────────────────────────────────────────────────────
  "shang-chi": 7080,
  xialing: 218,
  wenwu: 5420,
  /** The floor of the scale, and entirely at peace with it. */
  "trevor-slattery": 2,
  katy: 11,
  "razor-fist": 70,
  "ying-nan": 248,

  // ── Monsters ──────────────────────────────────────────────────────────
  "moon-knight": 1260,
  khonshu: 25100,
  layla: 245,
  "arthur-harrow": 608,
  "jack-russell": 838,
  "elsa-bloodstone": 49,
  "man-thing": 1970,
  verussa: 20,

  // ── Gamma ─────────────────────────────────────────────────────────────
  "she-hulk": 11100,
  abomination: 8810,
  "thunderbolt-ross": 9890,
  sterns: 107,
  "betty-ross": 3,

  // ── Eternals ──────────────────────────────────────────────────────────
  ikaris: 24800,
  thena: 19700,
  kingo: 9800,
  sprite: 2780,
  phastos: 7000,
  makkari: 12500,
  druig: 7940,
  gilgamesh: 13800,
  sersi: 8690,
  ajak: 11300,
  starfox: 1100,
  /** Owns the Ebony Blade. Has so far owned it in a drawer. */
  "dane-whitman": 22,

  // ── Fantastic Four & Galactus ─────────────────────────────────────────
  "reed-richards": 3500,
  "sue-storm": 8700,
  "johnny-storm": 3980,
  "the-thing": 5010,
  "silver-surfer": 44100,
  galactus: 98900,
  "doctor-doom": 31600,
  "mole-man": 190,
  "reed-richards-fox": 1080,
  "sue-storm-fox": 1740,
  "johnny-storm-fox": 1380,
  "the-thing-fox": 2130,
  "doctor-doom-fox": 2100,
  "silver-surfer-fox": 35000,
  "reed-richards-fox-2015": 700,
  "sue-storm-fox-2015": 1070,
  "johnny-storm-fox-2015": 827,
  "the-thing-fox-2015": 1360,
  "doctor-doom-fox-2015": 1520,

  // ── Earth-838 ─────────────────────────────────────────────────────────
  "reed-richards-838": 2750,
  "captain-carter-838": 601,
  "professor-x-838": 17400,
  "maria-rambeau": 27500,
  "black-bolt": 39300,

  // ── X-Men ─────────────────────────────────────────────────────────────
  wolverine: 3930,
  "professor-x": 31300,
  "professor-x-first-class": 24500,
  magneto: 27200,
  "magneto-first-class": 22400,
  mystique: 350,
  "mystique-first-class": 316,
  "jean-grey": 55500,
  "jean-grey-first-class": 48900,
  "jean-grey-mcu": 1050,
  cyclops: 3160,
  "cyclops-first-class": 2510,
  storm: 15700,
  "storm-first-class": 11000,
  rogue: 4360,
  beast: 816,
  "beast-first-class": 766,
  iceman: 6910,
  nightcrawler: 1250,
  "nightcrawler-first-class": 1040,
  /** The kitchen. Then the mansion. Nobody else gets to argue about the tier. */
  "quicksilver-fox": 13600,
  "kitty-pryde": 998,
  colossus: 1710,
  "emma-frost": 3470,
  "sebastian-shaw": 4300,
  apocalypse: 34700,
  stryker: 5,
  "stryker-first-class": 5,
  sabretooth: 1510,
  laura: 3130,
  caliban: 14,
  trask: 4,
  moira: 4,
  psylocke: 436,
  magik: 2080,
  "cassandra-nova": 22100,
  pyro: 555,
  "dani-moonstar": 8590,
  wolfsbane: 242,
  cannonball: 430,
  sunspot: 593,
  "cecilia-reyes": 34,
  vuk: 1350,
  "wonder-man": 3080,

  // ── Deadpool ──────────────────────────────────────────────────────────
  deadpool: 2050,
  cable: 2720,
  /** Probability manipulation is the most broken power in any of these films
      and the film knows it. Scored accordingly. */
  domino: 7850,
  negasonic: 586,
  vanessa: 3,
  ajax: 165,
  weasel: 2,
  "blind-al": 3,
  dopinder: 3,
  "angel-dust": 125,
  yukio: 55,
  firefist: 1020,

  // ── Iron Man / Avengers rogues ────────────────────────────────────────
  ultron: 12300,
  "obadiah-stane": 313,
  "ivan-vanko": 123,
  killian: 425,
  malekith: 2480,
  "zeke-stane": 157,

  // ── Ms. Marvel / Cap 4 ────────────────────────────────────────────────
  "joaquin-torres": 155,
  "isaiah-bradley": 308,
  "ruth-bat-seraph": 105,
  sidewinder: 61,
  bruno: 4,
  "red-dagger": 99,
  kamran: 172,
  najma: 106,
  cleary: 2,
  lylla: 11,
  stakar: 691,

  // ── Raimi (Earth-96283) ───────────────────────────────────────────────
  "spider-man-96283": 3890,
  "green-goblin-96283": 756,
  "doc-ock-96283": 1330,
  "sandman-96283": 1940,
  "venom-96283": 806,
  "mj-96283": 3,
  "harry-osborn-96283": 33,
  "aunt-may-96283": 3,
  "uncle-ben-96283": 3,
  "j-jonah-jameson-96283": 5,

  // ── Webb (Earth-120703) ───────────────────────────────────────────────
  "spider-man-120703": 3420,
  "lizard-120703": 683,
  "electro-120703": 4250,
  "gwen-stacy-120703": 5,
  "harry-osborn-120703": 163,
  "aunt-may-120703": 3,
  "captain-stacy-120703": 9,

  // ── Sony's Spider-Man Universe ────────────────────────────────────────
  "venom-eddie": 5360,
  "anne-weying": 33,
  carnage: 10800,
  morbius: 995,
  "vulture-688": 121,
  "madame-web": 420,
  "ezekiel-sims": 187,
  kraven: 795,
  "rhino-688": 104,
  riot: 4290,
  /** The god who made the symbiotes. Sony has spent three films pointing at
      him; the number is for what got shown, which was still a lot. */
  knull: 66100,

  // ── Spider-Verse ──────────────────────────────────────────────────────
  "miles-morales": 6310,
  "kingpin-1610": 347,
  "prowler-1610": 138,
  /** Started as a joke about a bagel. Ended as a canon-level threat. */
  "the-spot": 17100,
  "peter-b-parker": 3380,
  "gwen-stacy-65": 3840,
  "jessica-drew": 2020,
  "miguel-ohara": 8480,
  "spider-man-noir": 578,
};

export type PowerTierId =
  | "abstract"
  | "cosmic"
  | "planetary"
  | "heavy"
  | "field"
  | "street"
  | "civilian";

/**
 * Descending, so the first band a level clears is the one it lands in. Read
 * them as decades of the log scale rather than as slices of a ruler: each band
 * is roughly a factor of ten wide, and the bottom one swallows everybody whose
 * difference from each other stopped mattering.
 */
const TIERS: { min: number; id: PowerTierId }[] = [
  { min: 63000, id: "abstract" },
  { min: 20000, id: "cosmic" },
  { min: 3500, id: "planetary" },
  { min: 630, id: "heavy" },
  { min: 63, id: "field" },
  { min: 9, id: "street" },
  { min: 0, id: "civilian" },
];

export function powerTier(level: number): PowerTierId {
  return TIERS.find((tier) => level >= tier.min)!.id;
}

/** Where a level sits on the bar, 0–1. Log, because the scale is. */
export function powerFraction(level: number): number {
  return Math.min(1, Math.max(0, Math.log10(Math.max(1, level)) / 5));
}

/**
 * The colour a level is drawn in. Deliberately its own ramp rather than the
 * reality accents — a power tier is a claim about the character, and reusing a
 * continuity's colour here would read as one.
 */
export const TIER_COLOR: Record<PowerTierId, string> = {
  abstract: "#f5d76e",
  cosmic: "#f0a04b",
  planetary: "#e2725b",
  heavy: "#b06ab3",
  field: "#6d8fd6",
  street: "#5a9e8f",
  civilian: "#7a8290",
};

/** Anyone without a number is unrated rather than powerless. */
export const power = (id: string): number | undefined => POWER[id];
