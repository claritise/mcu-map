import { DEPENDENCIES } from "~/data/dependencies";
import { TITLE_BY_ID, TITLES } from "~/data/titles";
import { REALITIES, releaseRank } from "~/lib/graph";

/**
 * The map, written out.
 *
 * The graph is a canvas built entirely on the client, so the served document
 * used to contain the app's name and nothing else: no title, no year, no
 * reason. That is a blank page to anything that does not run JavaScript, and
 * the whole substance of this site is the hundred titles it will not name.
 *
 * So the same data is rendered here, on the server, inside `<noscript>`. It is
 * honestly what the page has to offer without JavaScript — a plain reverse
 * chronology of everything on the map and what each title asks you to watch
 * first — rather than markup hidden from the reader and kept for the crawler.
 */
export function TitleIndex() {
  const byYear = [...TITLES].sort((a, b) => releaseRank(b) - releaseRank(a));

  /** Prerequisites per title, so each entry can state its own. */
  const before = new Map<string, string[]>();
  for (const dep of DEPENDENCIES) {
    before.set(dep.to, [...(before.get(dep.to) ?? []), dep.from]);
  }

  return (
    <noscript>
      <div style={{ margin: "0 auto", maxWidth: 760, padding: "48px 24px" }}>
        <h1>MCU Map</h1>
        <p>
          Marvel watch order as a dependency graph. The interactive map needs
          JavaScript; below is every title it covers, newest first, with what
          each one asks you to watch beforehand.
        </p>

        <ul>
          {byYear.map((title) => {
            const prerequisites = (before.get(title.id) ?? [])
              .map((id) => TITLE_BY_ID.get(id))
              .filter((t) => t !== undefined)
              .sort((a, b) => releaseRank(a) - releaseRank(b));

            return (
              <li key={title.id}>
                <h2>
                  {title.name} ({title.year})
                </h2>
                <p>
                  {[
                    title.medium,
                    REALITIES[title.reality].label,
                    title.phase,
                    title.upcoming ? "unreleased" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p>{title.blurb}</p>
                {prerequisites.length > 0 && (
                  <p>
                    Watch first:{" "}
                    {prerequisites
                      .map((t) => `${t.name} (${t.year})`)
                      .join(", ")}
                    .
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </noscript>
  );
}
