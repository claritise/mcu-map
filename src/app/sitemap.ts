import type { MetadataRoute } from "next";

import { SITE_URL } from "~/lib/site";

/**
 * One route, because the map is one page. Every title is reached by clicking
 * the same document rather than by its own URL, and a crawler has no use for a
 * hundred entries that all resolve to it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL.href, changeFrequency: "monthly", priority: 1 }];
}
