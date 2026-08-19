/**
 * Module hooks that let a plain `node` script import the app's TypeScript
 * sources: they resolve the `~/…` alias against src/ and fill in the file
 * extension that TypeScript imports leave off. Node ≥22.18 strips the types.
 *
 * Registered by the script that needs it, never imported for its side effects.
 */
import { pathToFileURL } from "node:url";

const SRC = new URL("../src/", pathToFileURL(import.meta.filename)).href;

export async function resolve(specifier, context, next) {
  const target = specifier.startsWith("~/")
    ? new URL(specifier.slice(2), SRC).href
    : specifier;

  try {
    return await next(target, context);
  } catch (error) {
    if (target.startsWith(".") || target.startsWith("file:")) {
      for (const ext of [".ts", ".tsx", "/index.ts"]) {
        try {
          return await next(target + ext, context);
        } catch {
          // Try the next extension; the original error is thrown if none work.
        }
      }
    }
    throw error;
  }
}
