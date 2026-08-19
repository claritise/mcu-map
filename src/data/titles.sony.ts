import type { Title } from "./types";
import { c } from "./cast-helper";

/**
 * Sony's four Spider-Man realities. None of them is the MCU, and only one of
 * them is even live-action-adjacent to it — but No Way Home reaches into two,
 * Venom's stinger reaches into a third, and leaving them off the map made the
 * MCU's own multiverse films look like they came from nowhere.
 */
export const SONY_TITLES: Title[] = [
  // ══ Raimi ════════════════════════════════════════════════════════════
  {
    id: "spider-man-2002",
    name: "Spider-Man",
    year: 2002,
    medium: "film",
    reality: "earth-96283",
    saga: "Raimi trilogy",
    blurb:
      "The one that proved the genre worked. Norman Osborn's glider, and the first great origin.",
    cast: [
      c("spider-man-96283", true),
      c("green-goblin-96283", true),
      c("mj-96283", true),
      c("harry-osborn-96283"),
      c("aunt-may-96283"),
      c("uncle-ben-96283"),
      c("j-jonah-jameson-96283"),
    ],
  },
  {
    id: "spider-man-2",
    name: "Spider-Man 2",
    year: 2004,
    medium: "film",
    reality: "earth-96283",
    saga: "Raimi trilogy",
    blurb:
      "Doc Ock, the train, and the best argument the genre has ever made for itself.",
    cast: [
      c("spider-man-96283", true),
      c("doc-ock-96283", true),
      c("mj-96283", true),
      c("harry-osborn-96283"),
      c("aunt-may-96283"),
      c("j-jonah-jameson-96283"),
    ],
  },
  {
    id: "spider-man-3",
    name: "Spider-Man 3",
    year: 2007,
    medium: "film",
    reality: "earth-96283",
    saga: "Raimi trilogy",
    blurb:
      "Three villains, one dance sequence. Sandman is the one No Way Home wants back.",
    cast: [
      c("spider-man-96283", true),
      c("sandman-96283", true),
      c("venom-96283", true),
      c("harry-osborn-96283", true),
      c("mj-96283"),
      c("aunt-may-96283"),
    ],
  },

  // ══ Webb ═════════════════════════════════════════════════════════════
  {
    id: "amazing-spider-man",
    name: "The Amazing Spider-Man",
    year: 2012,
    medium: "film",
    reality: "earth-120703",
    saga: "The Amazing Spider-Man",
    blurb:
      "A second origin five years later. Its real inheritance is Gwen Stacy.",
    cast: [
      c("spider-man-120703", true),
      c("lizard-120703", true),
      c("gwen-stacy-120703", true),
      c("aunt-may-120703"),
      c("captain-stacy-120703"),
    ],
  },
  {
    id: "amazing-spider-man-2",
    name: "The Amazing Spider-Man 2",
    year: 2014,
    medium: "film",
    reality: "earth-120703",
    saga: "The Amazing Spider-Man",
    blurb:
      "Electro, Harry, and the clock tower. The wound this Peter carries into No Way Home.",
    cast: [
      c("spider-man-120703", true),
      c("electro-120703", true),
      c("gwen-stacy-120703", true),
      c("harry-osborn-120703", true),
      c("aunt-may-120703"),
    ],
  },

  // ══ Sony's Spider-Man Universe ═══════════════════════════════════════
  {
    id: "venom",
    name: "Venom",
    year: 2018,
    medium: "film",
    reality: "earth-688",
    saga: "Sony's Spider-Man Universe",
    blurb: "A symbiote buddy comedy in a universe with no Spider-Man in it.",
    cast: [c("venom-eddie", true), c("anne-weying", true), c("riot")],
  },
  {
    id: "venom-carnage",
    name: "Venom: Let There Be Carnage",
    year: 2021,
    order: 8,
    medium: "film",
    reality: "earth-688",
    saga: "Sony's Spider-Man Universe",
    blurb:
      "Ninety minutes of Cletus Kasady, then a stinger that drops Eddie into the MCU.",
    cast: [c("venom-eddie", true), c("carnage", true), c("anne-weying")],
  },
  {
    id: "morbius",
    name: "Morbius",
    year: 2022,
    medium: "film",
    reality: "earth-688",
    saga: "Sony's Spider-Man Universe",
    blurb:
      "A vampire origin whose post-credits scene tried to borrow a Vulture and got the wrong universe.",
    cast: [
      c("morbius", true),
      c("vulture-688", false, { note: "post-credits" }),
    ],
  },
  {
    id: "madame-web",
    name: "Madame Web",
    year: 2024,
    order: 1,
    medium: "film",
    reality: "earth-688",
    saga: "Sony's Spider-Man Universe",
    blurb: "A 2003-set precognition thriller. Connects to nothing you need.",
    cast: [c("madame-web", true), c("ezekiel-sims", true)],
  },
  {
    id: "venom-last-dance",
    name: "Venom: The Last Dance",
    year: 2024,
    order: 6,
    medium: "film",
    reality: "earth-688",
    saga: "Sony's Spider-Man Universe",
    blurb:
      "Eddie back home after No Way Home, with Knull rattling the cage behind him.",
    cast: [c("venom-eddie", true), c("knull")],
  },
  {
    id: "kraven",
    name: "Kraven the Hunter",
    year: 2024,
    order: 9,
    medium: "film",
    reality: "earth-688",
    saga: "Sony's Spider-Man Universe",
    blurb:
      "The last of the run: a Spider-Man villain origin with no Spider-Man to hunt.",
    cast: [c("kraven", true), c("rhino-688")],
  },

  // ══ Spider-Verse ═════════════════════════════════════════════════════
  {
    id: "into-spider-verse",
    name: "Spider-Man: Into the Spider-Verse",
    year: 2018,
    order: 7,
    medium: "film",
    reality: "earth-1610b",
    saga: "Spider-Verse",
    blurb:
      "Miles Morales, and the film that made the multiverse legible to everyone else.",
    cast: [
      c("miles-morales", true),
      c("peter-b-parker", true),
      c("gwen-stacy-65", true),
      c("kingpin-1610"),
      c("prowler-1610"),
      c("spider-man-noir"),
    ],
  },
  {
    id: "across-spider-verse",
    name: "Spider-Man: Across the Spider-Verse",
    year: 2023,
    order: 6,
    medium: "film",
    reality: "earth-1610b",
    saga: "Spider-Verse",
    blurb:
      "The Spider-Society, the canon-event argument, and a cliffhanger with no landing yet.",
    cast: [
      c("miles-morales", true),
      c("gwen-stacy-65", true),
      c("miguel-ohara", true),
      c("the-spot", true),
      c("peter-b-parker"),
      c("jessica-drew"),
    ],
  },
];
