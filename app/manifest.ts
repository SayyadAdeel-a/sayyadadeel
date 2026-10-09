import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/brand";

/**
 * site.webmanifest
 *
 * The icons are the branded set in `public/assets/brand/`, which is also what
 * `metadata.icons` points at, so the installed app icon and the browser tab icon
 * are the same artwork. `purpose: "any maskable"` on the 512 icon lets Android
 * crop it to the launcher shape without clipping the letterform.
 *
 * `start_url` is the homepage because that is the entire site; there is no
 * route a user would want restored to that is not reachable from it.
 */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.fullName} — Learning, Building & Experimenting`,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    lang: siteConfig.language,
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: siteConfig.backgroundColor,
    theme_color: siteConfig.themeColor,
    categories: ["portfolio", "personal", "education", "developer"],
    icons: [
      { src: "/assets/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/assets/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/assets/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Contact",
        short_name: "Contact",
        url: "/contact",
        icons: [{ src: "/assets/brand/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}