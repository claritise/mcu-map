/**
 * Where this map lives, as an absolute URL.
 *
 * Open Graph tags, robots.txt and the sitemap all have to name the site in
 * absolute terms — a relative `/opengraph-image` is meaningless to the crawler
 * on the other end. Next fills `VERCEL_PROJECT_PRODUCTION_URL` in on Vercel,
 * so a normal deploy needs no configuration; `NEXT_PUBLIC_SITE_URL` overrides
 * it for a custom domain or any other host, and localhost is the fallback so a
 * dev build never fails for want of a domain name.
 */
const configured =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_URL = new URL(configured);
