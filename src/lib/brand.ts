/**
 * Single source of truth for the site's identity.
 *
 * Every piece of metadata, every canonical URL and every absolute link reads
 * from here, so rebranding is one edit rather than a sweep through four page
 * files. The exported values are also what the JSON-LD, the sitemap and the
 * manifest use, which keeps structured data from drifting out of sync with the
 * meta tags.
 *
 * `siteUrl` has no trailing slash. Next resolves every relative `openGraph.
 * images`, `icons` and `alternates.canonical` entry against `metadataBase`, so
 * this is what makes share images resolve to absolute URLs -- a relative share
 * image is silently dropped by several scrapers, and a relative canonical is
 * ignored outright.
 *
 * `NEXT_PUBLIC_SITE_URL` overrides the origin for local previews. It defaults to
 * the production domain rather than localhost, because a deployed build with an
 * unset variable would otherwise advertise a localhost canonical, which is
 * worse than no canonical at all.
 */
export const siteConfig = {
  name: "Sayyad Adeel",
  fullName: "Sayyad Adeel Ahmad",
  /** Short form used where the full name will not fit. */
  shortName: "Adeel",
  owner: "Sayyad Adeel Ahmad",
  role: "Freelance web developer",
  url: "https://adeelsayyad.tech",
  locale: "en_US",
  language: "en",
  themeColor: "#fb8626",
  backgroundColor: "#eee",
  /**
   * One description for the site, used as the default by every route. It reads
   * as a freelance web developer rather than a student: the subject is what he
   * can build and ship, not what he is still figuring out.
   */
  description:
    "Freelance web developer Sayyad Adeel Ahmad — builds fast websites, ecommerce stores and AI automation. Clear process, real projects, and a straight answer on what your build takes.",
  keywords: [
    "Sayyad Adeel",
    "Adeel Ahmad",
    "freelance web developer",
    "Next.js developer",
    "ecommerce developer",
    "AI automation",
    "web development",
    "hire a developer",
    "build a website",
    "custom web apps",
  ],
  links: {
    github: "https://github.com/SayyadAdeel-a",
    linkedin: "https://www.linkedin.com/in/adeelsayyad/",
    instagram: "https://www.instagram.com/adeelsayyad.a/",
  },
  /**
   * Deployed origin. Overridable so a local build advertises the local origin
   * during QA rather than the production domain.
   */
  get siteUrl(): string {
    return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://adeelsayyad.tech").replace(/\/$/, "");
  },
} as const;

export type SiteConfig = typeof siteConfig;