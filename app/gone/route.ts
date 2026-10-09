/**
 * 410 Gone, for every URL this site used to publish and never will again.
 *
 * Reached by the `beforeFiles` rewrites in next.config.ts, which map the 18 dead
 * routes here. A rewrite rather than a redirect, deliberately: a redirect needs
 * a destination, and the only destination available for content that no longer
 * exists in any form is a page saying so. Sending these to the homepage would
 * tell Google "this moved" about content that was deleted.
 *
 * 410 over 404 is the useful difference. A 404 says "not found", which leaves a
 * crawler free to keep checking whether it appears later; a 410 says
 * "permanently gone" and lets it drop the URL from the crawl budget. With 25
 * stale URLs already sitting in Search Console as "Discovered - currently not
 * indexed", that is the difference between clearing them in weeks and not.
 *
 * The body is a short HTML page rather than nothing, because a person can reach
 * one of these by following an old link or a bookmark. It has noindex on it, so
 * being reachable does not make it an indexable page.
 */

const HOMEPAGE = "https://adeelsayyad.tech/";

/** Escape interpolated text. Everything here is a literal, but this is a habit. */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const page = (path: string) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page gone &mdash; Sayyad Adeel Ahmad</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #1d1d1d; color: #eee;
    font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    padding: 24px;
  }
  main { max-width: 34rem; }
  h1 { font-size: 1.75rem; line-height: 1.25; margin: 0 0 .75rem; }
  p { margin: 0 0 1rem; color: #b9b3ad; }
  code { background: #2c2c2c; padding: .15em .4em; border-radius: 4px; font-size: .9em; }
  ul { margin: 0; padding-left: 1.1rem; }
  li { margin: .4rem 0; }
  a { color: #fb8626; }
</style>
</head>
<body>
<main>
  <h1>This page is gone</h1>
  <p>
    <code>${esc(path)}</code> belonged to an earlier version of this site and no
    longer exists. The work it described is not here.
  </p>
  <p>What is here:</p>
  <ul>
    <li><a href="/">The projects, notes and process</a></li>
    <li><a href="/#work">Selected work</a></li>
    <li><a href="/#notes">Notes from the rabbit hole</a></li>
    <li><a href="/contact">Get in touch</a></li>
  </ul>
</main>
</body>
</html>
`;

/**
 * Next populates `request.nextUrl.pathname` with the *original* path for a
 * rewrite, so the body can name the URL the visitor actually asked for. If that
 * ever stops being true the page still renders -- it just says "/".
 *
 * Deliberately dynamic: naming the requested URL means reading the request, so
 * this must not declare `force-static`. It is cheap to serve (a 1.3 KB string,
 * no data access) and the `cache-control` header below is what actually governs
 * caching for a route handler.
 */
export async function GET(request: Request) {
  let path = "/";
  try {
    const url = new URL(request.url);
    const nextUrl = (request as { nextUrl?: URL }).nextUrl;
    path = (nextUrl?.pathname ?? url.pathname) || "/";
  } catch {
    /* keep the default */
  }

  return new Response(page(path), {
    status: 410,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
      // Belt and braces: the page carries its own noindex meta, but a crawler
      // that only reads headers should be told too.
      "x-robots-tag": "noindex, nofollow",
    },
  });
}