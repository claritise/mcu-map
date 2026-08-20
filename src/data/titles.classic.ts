import type { Title } from "./types";
import { c } from "./cast-helper";

/**
 * The Marvel films from before there was a Marvel Studios: licensed out one
 * character at a time to whoever would take them, each its own continuity with
 * no interest in any of the others.
 *
 * They are on the map because the thread asking for them is right — Blade is
 * the film that proved this could work at all, and Wesley Snipes walks into
 * Deadpool & Wolverine off the back of it. None of them depend on anything
 * outside their own run, which is the honest shape of the era.
 */
export const CLASSIC_TITLES: Title[] = [
  // ══ New World · The Punisher ══════════════════════════════════════════
  {
    id: "punisher-1989",
    name: "The Punisher (1989)",
    year: 1989,
    medium: "film",
    reality: "punisher-1989",
    saga: "The Punisher on Film",
    blurb:
      "Dolph Lundgren, no skull on the chest, and a straight-to-video release in the States. The first Marvel Punisher on film.",
    cast: [
      c("punisher-1989", true),
      c("jake-berkowitz", true),
      c("gianni-franco", true),
    ],
  },

  // ══ New Line · the Blade trilogy ══════════════════════════════════════
  {
    id: "blade",
    name: "Blade",
    year: 1998,
    medium: "film",
    reality: "blade-trilogy",
    saga: "Blade Trilogy",
    blurb:
      "The one that proved a Marvel adaptation could be a hit — two years before X-Men, ten before Iron Man.",
    cast: [
      c("blade", true),
      c("whistler", true),
      c("deacon-frost", true),
      c("karen-jenson", true),
    ],
  },
  {
    id: "blade-2",
    name: "Blade II",
    year: 2002,
    medium: "film",
    reality: "blade-trilogy",
    saga: "Blade Trilogy",
    blurb:
      "Guillermo del Toro's. Blade allies with the vampires against something that eats them.",
    cast: [
      c("blade", true),
      c("whistler", true),
      c("nomak", true),
      c("nyssa", true),
      c("damaskinos", false),
    ],
  },
  {
    id: "blade-trinity",
    name: "Blade: Trinity",
    year: 2004,
    order: 2,
    medium: "film",
    reality: "blade-trilogy",
    saga: "Blade Trilogy",
    blurb:
      "Dracula, the Nightstalkers, and Ryan Reynolds twelve years before Deadpool.",
    cast: [
      c("blade", true),
      c("abigail-whistler", true),
      c("hannibal-king", true),
      c("drake", true),
      c("whistler", false),
    ],
  },

  // ══ Universal · Hulk ══════════════════════════════════════════════════
  {
    id: "hulk-2003",
    name: "Hulk (2003)",
    year: 2003,
    order: 2,
    medium: "film",
    reality: "universal-hulk",
    saga: "Ang Lee's Hulk",
    blurb:
      "Ang Lee's, with the comic-panel edits and the father problem. The Incredible Hulk five years later is a restart, not a sequel.",
    cast: [
      c("hulk-universal", true),
      c("betty-ross-universal", true),
      c("david-banner", true),
      c("thunderbolt-ross-universal", true),
      c("glenn-talbot-universal", false),
    ],
  },

  // ══ Lionsgate · The Punisher, twice ═══════════════════════════════════
  {
    id: "punisher-2004",
    name: "The Punisher (2004)",
    year: 2004,
    order: 1,
    medium: "film",
    reality: "punisher-2004",
    saga: "The Punisher on Film",
    blurb: "Thomas Jane's Frank Castle, and a revenge film rather than a war.",
    cast: [
      c("punisher-2004", true),
      c("howard-saint", true),
      c("joan-punisher", false),
      c("quentin-glass", false),
    ],
  },
  {
    id: "punisher-war-zone",
    name: "Punisher: War Zone",
    year: 2008,
    order: 2,
    medium: "film",
    reality: "punisher-war-zone",
    saga: "The Punisher on Film",
    blurb:
      "A reboot four years on, not a sequel: new Frank, new everything, and Jigsaw.",
    cast: [
      c("punisher-war-zone", true),
      c("jigsaw", true),
      c("paul-budiansky", false),
    ],
  },

  // ══ Columbia · Ghost Rider ════════════════════════════════════════════
  {
    id: "ghost-rider-2007",
    name: "Ghost Rider (2007)",
    year: 2007,
    medium: "film",
    reality: "ghost-rider-films",
    saga: "Ghost Rider",
    blurb:
      "Nicolas Cage takes the deal. Nothing to do with the Ghost Rider Marvel Studios has dated for 2028.",
    cast: [
      c("ghost-rider-blaze", true),
      c("roxanne-simpson", true),
      c("blackheart", true),
      c("mephistopheles", true, { actor: "Peter Fonda" }),
      c("carter-slade", false),
    ],
  },
  {
    id: "spirit-of-vengeance",
    name: "Ghost Rider: Spirit of Vengeance",
    year: 2011,
    order: 1,
    medium: "film",
    reality: "ghost-rider-films",
    saga: "Ghost Rider",
    blurb:
      "Cage again, in Eastern Europe, with a different devil and a much stranger performance.",
    cast: [
      c("ghost-rider-blaze", true),
      c("moreau", true),
      c("nadya-ketch", true),
      c("danny-ketch", true),
      c("mephistopheles", false, { actor: "Ciarán Hinds", note: "as Roarke" }),
    ],
  },
];
