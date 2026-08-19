import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";

import { VisitAnalytics } from "~/app/_components/analytics";
import { SITE_URL } from "~/lib/site";
import { LocaleProvider } from "~/i18n/locale";

const DESCRIPTION =
  "Every Marvel Studios, Fox and Sony film, series and special on one interactive map. Pick any title and see exactly what you need to watch first, or follow a single character across the whole timeline. Available in English and Simplified Chinese. 中英双语的漫威观影顺序地图。";

export const metadata: Metadata = {
  /* Open Graph and the sitemap both need absolute URLs; without this Next
     resolves `/opengraph-image` against nothing and drops the tag. */
  metadataBase: SITE_URL,
  title: "MCU Map: Marvel watch order as a dependency graph",
  description: DESCRIPTION,
  applicationName: "MCU Map",
  keywords: [
    "MCU",
    "Marvel",
    "watch order",
    "viewing order",
    "Marvel timeline",
    "X-Men",
    "Fox Marvel",
    "漫威",
    "漫威宇宙",
    "观影顺序",
  ],
  openGraph: {
    type: "website",
    siteName: "MCU Map",
    title: "MCU Map: Marvel watch order as a dependency graph",
    description:
      "Pick any Marvel title and see exactly what you need to watch first.",
  },
  /* The generated card is 1200×630, so it earns the large format — `summary`
     would crop it to a thumbnail beside the text. */
  twitter: {
    card: "summary_large_image",
    title: "MCU Map",
    description:
      "Pick any Marvel title and see exactly what you need to watch first.",
  },
};

/**
 * Stated explicitly rather than left to Next's default. `viewportFit: "cover"`
 * lets the map paint under a notch; user scaling is deliberately left alone,
 * because pinching to read a poster is the point on a phone.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#141414",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /* `lang` is rewritten on the client by LocaleProvider once the stored
       choice is known; the served markup is always the default. */
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-canvas-bg text-text-primary antialiased">
        <LocaleProvider>{children}</LocaleProvider>
        <VisitAnalytics />
      </body>
    </html>
  );
}
