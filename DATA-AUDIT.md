# Data accuracy audit

Scope: `src/data/{titles.mcu,titles.fox,characters,dependencies,posters}.ts`.
Checked against Wikipedia cast/credit lists and release dates.
Audited 2026-08-19 · §1 added 2026-08-20 · **all findings applied 2026-08-20**.

The "after" column is the state at the close of that audit. The map has grown since —
the Sony banner in particular — so the live figures are the ones the pre-release scan
records below, not these.

|              | before | after (2026-08-20) | now     |
| ------------ | ------ | ------------------ | ------- |
| titles       | 73     | 87                 | **100** |
| characters   | 153    | 241                | **309** |
| dependencies | 158    | 174                | **187** |
| cast entries | —      | 674                | —       |

Verified after the fixes: `tsc --noEmit` clean, `next lint` clean, app renders with no console
errors, and the audit scripts report no unresolved references, no cycles, no duplicate ids, no
unpinned ambiguous actors, and no dependency running backward through release time.

## Still open (deliberate)

- **Posters**: 95 of 100 titles have artwork. `wonder-man` and `born-again-s3` are simply
  missing and would be picked up by a `pnpm posters --download` run. The other three are
  the unannounced titles below, which have no article to fetch from and are listed in
  `NO_ARTICLE` in the fetch script so that a blind Wikipedia search cannot hand them
  somebody else's poster — which is exactly what had happened: `x-men-mcu` and
  `ghost-rider` shipped the same artwork, and `black-panther-3` shipped Wakanda Forever's.
- **`x-men-mcu`, `ghost-rider`, `black-panther-3`** carry `saga: "Unannounced Saga"`, no `phase`
  and empty casts. Marvel has released dates and nothing else; inventing a phase would be worse
  than leaving it blank.
- **`your-friendly-neighborhood-spider-man`** has no dependency edges on purpose — it is an
  explicitly separate timeline. Consider an `altTimeline?: boolean` on `Title` if you want the
  UI to say so rather than relying on the blurb.
- **`goose`** still has `actors: ["—"]`. It is a cat.
- **`days-of-future-past`** still lists `professor-x` and `magneto` twice, which is correct (young
  and old, different actors pinned). `titlesByCharacter` in `graph.ts` now de-dupes so the film
  counts once per character.

---

## What was already correct

- All 73 title ids, 153 character ids and all 316 dependency endpoints resolve. No duplicate ids, no self-edges, no reciprocal pairs, **no cycles**.
- Every `year` present is correct — all 73, MCU and Fox.
- Every `saga` and `phase` assignment is correct, including the contested ones: Ironheart and Daredevil: Born Again S1 are Phase Five, The Fantastic Four: First Steps is Phase Six.
- Every pinned `CastEntry.actor` exists in that character's `actors` array (though see §2 for one that's the _wrong_ actor).
- All 72 poster files referenced exist on disk; none orphaned.

---

## 1. Missing titles — the dataset stops in mid-2025

The largest gap. Fourteen titles are absent, nine of which have **already released**. Coverage effectively ends at `fantastic-four-first-steps` (Jul 2025), then skips straight to `avengers-doomsday`.

### Released, absent (9)

| Title                                      | Released           | Medium  | Phase | Notes                                                                                                                                                                                      |
| ------------------------------------------ | ------------------ | ------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| What If…? — Season 2                       | Dec 22–30, 2023    | series  | Five  | 9 eps                                                                                                                                                                                      |
| What If…? — Season 3                       | Dec 22–29, 2024    | series  | Five  | 8 eps                                                                                                                                                                                      |
| Your Friendly Neighborhood Spider-Man — S1 | Jan 29, 2025       | series  | Five  | Animated. Explicitly set in an **alternate timeline**, not the Sacred Timeline — so it's a legitimate `upcoming`-style special case for the dependency graph                               |
| Eyes of Wakanda                            | Aug 1, 2025        | series  | Six   | Animated, 4 eps. The **first Phase Six release** — currently the data implies First Steps opens Phase Six                                                                                  |
| Marvel Zombies                             | Sep 24, 2025       | series  | Six   | Animated, 4 eps. Direct spin-off of the What If…? S1 episode "What If… Zombies?!" — an unusually strong `essential` edge                                                                   |
| Wonder Man                                 | Jan 27, 2026       | series  | Six   | Yahya Abdul-Mateen II as Simon Williams; **Ben Kingsley reprises Trevor Slattery**, so it's a direct payoff to `iron-man-3` → `shang-chi`                                                  |
| Daredevil: Born Again — Season 2           | Mar 24–May 5, 2026 | series  | Six   | Brings **Jessica Jones (Krysten Ritter) and Luke Cage (Mike Colter)** into the MCU proper                                                                                                  |
| The Punisher: One Last Kill                | May 12, 2026       | special | Six   | Bernthal; Deborah Ann Woll as Karen Page                                                                                                                                                   |
| **Spider-Man: Brand New Day**              | Jul 31, 2026       | film    | Six   | Holland, Zendaya, Batalon, Tomei — plus Bernthal's Punisher, Florence Pugh's Yelena, Ruffalo's Hulk, and **Sadie Sink as Jean Grey**, the first X-Men character in the main MCU continuity |

### Upcoming, absent (5)

| Title                            | Scheduled    | Medium | Phase |
| -------------------------------- | ------------ | ------ | ----- |
| VisionQuest                      | Oct 14, 2026 | series | Six   |
| Daredevil: Born Again — Season 3 | Mar 2027     | series | Six   |
| Untitled X-Men film              | May 5, 2028  | film   | —     |
| Ghost Rider                      | Jul 28, 2028 | film   | —     |
| Black Panther III                | Dec 15, 2028 | film   | —     |

VisionQuest matters structurally: Paul Bettany's White Vision **and James Spader's Ultron**, closing the trilogy that runs `wandavision` → `agatha-all-along` → VisionQuest. Both existing legs are already in the data with edges between them.

The two upcoming films that _are_ present (`avengers-doomsday` 2026, `avengers-secret-wars` 2027) have correct years — Doomsday is Dec 18, 2026 and Secret Wars Dec 17, 2027.

### Edges these imply

At minimum: `what-if-s1 → what-if-s2 → what-if-s3`; `what-if-s1 → marvel-zombies` (essential); `no-way-home → brand-new-day` and `daredevil-born-again → brand-new-day` (Punisher) and `thunderbolts → brand-new-day` (Yelena); `wandavision → visionquest`, `agatha-all-along → visionquest`, `age-of-ultron → visionquest`; `iron-man-3`/`shang-chi → wonder-man`; `daredevil-born-again → born-again-s2` and `→ punisher-one-last-kill`; `black-panther → eyes-of-wakanda`.

## 2. Factually wrong — a character or actor who isn't in the title

| Title                   | Entry                                        | Reality                                                                                                                                                                                                                                          |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deadpool-wolverine`    | `elektra` pinned **Élodie Yung**             | Elektra is **Jennifer Garner**, reprising the 2003/2005 Fox role. Yung played Elektra in Netflix's _Daredevil_ and isn't in the film. Passed the actor-in-list check because both names are on the `elektra` record.                             |
| `multiverse-of-madness` | `monica-rambeau`                             | Teyonah Parris does not appear in the film.                                                                                                                                                                                                      |
| `multiverse-of-madness` | `captain-marvel`, note `"variant"`           | The Illuminati member is **Maria Rambeau** / Captain Marvel (Lashana Lynch) — a different character, not a Carol Danvers variant. Also missing from the Illuminati: Captain Carter (Hayley Atwell) and Black Bolt (Anson Mount).                 |
| `brave-new-world`       | `abomination`                                | Tim Roth does not appear in _Brave New World_.                                                                                                                                                                                                   |
| `secret-invasion`       | `thunderbolt-ross` pinned **Harrison Ford**  | Ross is not in _Secret Invasion_. Ford's debut as Ross is _Brave New World_.                                                                                                                                                                     |
| `endgame`               | `cassie-lang`, unpinned                      | Teen Cassie in _Endgame_ is **Emma Fuhrmann**, who is not on the `cassie-lang` record at all. The entry currently resolves to Abby Ryder Fortson (child, earlier films) or Kathryn Newton (_Quantumania_).                                       |
| `what-if-s1`            | `star-lord`, `captain-marvel`, `black-widow` | Chris Pratt, Brie Larson and Scarlett Johansson did **not** voice Season 1. Carol was Alexandra Daniels; Quill and Natasha were likewise recast. (Hiddleston, Hemsworth, Cumberbatch, Atwell and Wright _did_ reprise — those entries are fine.) |
| `characters.ts`         | `kitty-pryde` actor `"Ellen Page"`           | **Elliot Page**. He came out as transgender in December 2020; his X-Men credits (_The Last Stand_, _Days of Future Past_) are now under that name.                                                                                               |

## 3. Ambiguous actor resolution — the record picks the wrong performer

`CastEntry.actor` is the only disambiguator for multi-actor characters, and it's missing where it matters. Each of these resolves to the first name in `actors`, which is the wrong one:

- **`hulk`** (`[Edward Norton, Mark Ruffalo]`) unpinned in `iron-man-3`, `age-of-ultron`, `ragnarok`, `infinity-war`, `endgame`, `shang-chi`, `she-hulk` — all Ruffalo. `avengers` is the only title that pins him.
- **`war-machine`** (`[Terrence Howard, Don Cheadle]`) unpinned in `iron-man-3`, `age-of-ultron`, `civil-war`, `infinity-war`, `endgame` — all Cheadle.
- **`thunderbolt-ross`** (`[William Hurt, Harrison Ford]`) unpinned in `civil-war` — William Hurt.
- **`cassie-lang`** in `endgame` — see §2.

## 4. Characters named in `reason` text that don't exist at all

- **Ultron** is named in three dependency reasons and is the title villain of `age-of-ultron` — but there is no `ultron` character record. He also returns in VisionQuest (§1).
- **Klaue** — `d("civil-war", "black-panther", …)` reads _"Klaue and Ross carry over."_ Ross exists; Klaue (Andy Serkis, in _Age of Ultron_ and _Black Panther_) does not.
- **Samuel Sterns** — `d("incredible-hulk", "brave-new-world", …)` names him. He's _Brave New World_'s antagonist (Tim Blake Nelson).

More broadly, `characters.ts` has near-complete hero coverage and patchy villain coverage: no Ultron, Klaue, Aldrich Killian, Malekith, Obadiah Stane or Ivan Vanko.

## 5. Missing appearances the dataset's own text asserts

- **Red Skull (Ross Marquand)** is absent from `infinity-war` and `endgame`. Those are his only MCU appearances, and they're the sole reason `red-skull` carries a second actor — so Marquand is currently dead weight.
- **Yondu** is absent from `gotg-3`, but `d("gotg-2", "gotg-3", …)` reads _"Ego, Yondu and Rocket's damage all feed the finale."_ Michael Rooker does appear.
- **Johnny Storm (Chris Evans)** is absent from `deadpool-wolverine`, but `d("fantastic-four-2005", "deadpool-wolverine", …)` is _entirely_ about that cameo.
- **Cable** — the reverse problem. `d("deadpool-2", "deadpool-wolverine", …)` says _"Cable's time device and the X-Force fallout are the setup,"_ but **Josh Brolin does not appear**. The reason overclaims; the cast list is right to omit him.
- **The Ancient One (Tilda Swinton)** is absent from `endgame`. She appears in the 2012 time-heist sequence.

## 6. Casts too thin to be accurate

Beyond the two empty ones (`werewolf-by-night`, `avengers-secret-wars`), several titles omit leads and antagonists — not just background:

| Title                     | Has               | Missing (notable)                                                                                                     |
| ------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `werewolf-by-night`       | _nothing_         | Jack Russell (Gael García Bernal), Elsa Bloodstone (Laura Donnelly), Man-Thing, Verussa                               |
| `new-mutants`             | `magik`           | **Dani Moonstar (Blu Hunt) — the protagonist**, Wolfsbane, Cannonball, Sunspot, Cecilia Reyes                         |
| `ironheart`               | `riri`            | **The Hood (Anthony Ramos) — the antagonist**, **Mephisto (Sacha Baron Cohen)**, Zeke Stane, N.A.T.A.L.I.E.           |
| `moon-knight`             | `moon-knight`     | Arthur Harrow (Ethan Hawke), Layla / Scarlet Scarab, Khonshu                                                          |
| `eternals`                | `sersi`, `ikaris` | 9 of the 11 Eternals — Ajak, Thena, Kingo, Sprite, Phastos, Makkari, Druig, Gilgamesh — plus Dane Whitman and Starfox |
| `agatha-all-along`        | 3 entries         | **Rio Vidal / Death (Aubrey Plaza) — the co-lead**, Lilia, Jen Kale, Alice                                            |
| `dark-phoenix`            | 9 entries         | **Vuk (Jessica Chastain) — the antagonist**                                                                           |
| `secret-invasion`         | 4 entries         | **Rhodey (Don Cheadle)**, Gravik, G'iah, Sonya Falsworth                                                              |
| `shang-chi`               | 8 entries         | **Katy (Awkwafina) — a lead**, Razor Fist, Ying Nan, Ying Li                                                          |
| `daredevil-2003`          | 3 entries         | **Bullseye (Colin Farrell)**                                                                                          |
| `daredevil-born-again`    | 3 entries         | Karen Page, Foggy Nelson, Bullseye, White Tiger                                                                       |
| `deadpool` / `deadpool-2` | 4 / 6             | Ajax, Blind Al, Weasel, Dopinder / Firefist, Juggernaut, Yukio                                                        |
| `deadpool-wolverine`      | 9 entries         | Blade (Wesley Snipes), Pyro, Yukio, Blind Al, Happy Hogan (Jon Favreau — already a character)                         |
| `ms-marvel`               | 2 entries         | Bruno, Kamran, Najma, Red Dagger                                                                                      |
| `brave-new-world`         | 4 entries         | Joaquin Torres, Isaiah Bradley, Ruth Bat-Seraph, Samuel Sterns, Betty Ross, Sidewinder                                |

## 7. Release-order errors (`order`)

Two are outright inverted:

- **2021**: `no-way-home` is `order: 8`, `hawkeye` is `order: 9`. _Hawkeye_ premiered **Nov 24**, _No Way Home_ **Dec 17**. Swap them.
- **2025**: `thunderbolts` is `order: 2`, `daredevil-born-again` is `order: 3`. _Born Again_ premiered **Mar 4**, _Thunderbolts\*_ **May 2**. Swap them.

Everything else with an explicit `order` is correct. But titles sharing a year with **no** `order` fall through to `a.name.localeCompare(b.name)` in `rowOf()`, which is wrong in five rows:

| Year | Unordered                               | Correct release order                                                                 |
| ---- | --------------------------------------- | ------------------------------------------------------------------------------------- |
| 2015 | `age-of-ultron`, `ant-man`, `fant4stic` | Age of Ultron (May), Ant-Man (Jul), Fant4stic (Aug) — alphabetical puts Ant-Man first |
| 2016 | `deadpool`, `apocalypse`                | Deadpool (Feb), Civil War (May 6), Apocalypse (May 27), Doctor Strange (Nov)          |
| 2017 | `logan`                                 | Logan (Mar) should be **first**, before GotG2                                         |
| 2018 | `deadpool-2`                            | Black Panther (Feb), Infinity War (Apr), Deadpool 2 (May), Ant-Man & Wasp (Jul)       |
| 2019 | `dark-phoenix`                          | Captain Marvel (Mar), Endgame (Apr), Dark Phoenix (Jun), Far From Home (Jul)          |

2013 and 2014 also lack `order`, but alphabetical happens to give the right answer there.

## 8. One dependency runs backward through release time

`d("first-avenger", "iron-man-2", "optional", "Howard Stark's files and a glimpse of the shield.")` — _First Avenger_ is 2011, _Iron Man 2_ is 2010. It's the only such edge in 158.

Defensible as a watch-order hint, but it inverts the invariant `graph.ts` documents on `timelineLayout`: _"oldest at the bottom, so dependency arrows all point upward through time."_

## 9. Modeling problems that produce wrong output

- **`black-panther` conflates T'Challa and Shuri** — `alias: "T'Challa / Shuri"`, `actors: [Chadwick Boseman, Letitia Wright]` — while a separate `shuri` record also exists and is what `wakanda-forever` uses. Wright is never pinned on `black-panther`, so half that record is unreachable. Two people, two records.
- **`days-of-future-past` lists `professor-x` and `magneto` twice each** (young + old, correctly pinned) — but `titlesByCharacter` in `graph.ts:43` appends without deduping, so DoFP appears twice in both filmographies.
- **`bucky-thunderbolt`** is the id for _Bob / Sentry_ (Lewis Pullman). Nothing to do with Bucky — who is in the same cast list as `winter-soldier`. Rename to `sentry`.
- **`kamar-taj`** is the id for _Clea_. Kamar-Taj is a place. Rename to `clea`.
- **`quicksilver-fox`** has `name: "Peter Maximoff"` with no codename, while `quicksilver-mcu` is `name: "Quicksilver", alias: "Pietro Maximoff"`.
- **`goose`** has `actors: ["—"]`, a placeholder standing in for "it's a cat."
- **`jean-grey`** will need Sadie Sink added once Brand New Day is entered — and that record then spans Fox _and_ MCU continuity, which no other character currently does.
