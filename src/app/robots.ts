import type { MetadataRoute } from "next";

import { SITE_URL } from "~/lib/site";

/**
 * Nothing here is private and there is only one page, so the file exists to
 * point at the sitemap rather than to keep anything out.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", SITE_URL).href,
  };
}
