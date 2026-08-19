/**
 * Write a generated TypeScript file through Prettier.
 *
 * The generators build their output by string template, which is the right way
 * to keep them readable but produces lines Prettier disagrees with — so
 * `pnpm format:check` failed on files nobody is allowed to hand-edit. Running
 * the source through Prettier here means a regenerated file is committed in
 * exactly the shape the repo's own formatter would leave it.
 */
import { writeFileSync } from "node:fs";
import { format, resolveConfig } from "prettier";

export async function writeGenerated(path, source) {
  const config = await resolveConfig(path);
  writeFileSync(path, await format(source, { ...config, filepath: path }));
}
