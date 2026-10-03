import { notFound } from "next/navigation";
import Editor from "@/components/admin/Editor";
import {
  FILE_ELEMENTS,
  FILE_ROOTS,
  FILE_TOTALS,
  PAGES,
  routeFiles,
  type EditableNode,
} from "@/generated/admin-registry";

/**
 * The editor for one page.
 *
 * ## Why the URL is `/admin/edit[/...]`
 *
 * `/admin` is the page list, so the editor needed a prefix of its own. The first
 * attempt mapped the homepage to `/admin`, which collided with the list, and
 * joined the rest as `"/admin" + route.slice(1)` — producing `/adminabout`. Both
 * were wrong in the same way: the URL was assembled by string surgery instead of
 * derived once. `editorUrl()` in the generated registry does it properly, and
 * this route is the other half of that pair.
 *
 * The catch-all is **optional** (`[[...slug]]`) so the homepage has a real URL —
 * `/admin/edit` with no segments — rather than being smuggled in as a fake
 * segment like `/admin/home`.
 *
 * ## Why the registry arrives as props
 *
 * This module also holds `PAGES`, a map of dynamic imports of the site's page
 * modules. `Editor` is a client component, so importing *any* part of that module
 * pulls the whole map into the browser bundle — and every page module exports
 * `metadata`, a server-only export, which fails the build on all 25 routes. So
 * the tables the client needs are passed down from here instead.
 *
 * Only this route's files are sent. `FILE_ELEMENTS` for the whole site is ~90 KB,
 * and a page is built from 6–20 files.
 *
 * Dynamic because the admin surface is per-request — the session gate lives in
 * the layout — and because the route set is generated rather than enumerated.
 */
export const dynamic = "force-dynamic";

export default async function AdminEditorPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const segments = (slug ?? []).filter(Boolean);
  const route = "/" + segments.join("/");

  const load = PAGES[route];
  if (!load) notFound();

  const { default: Page } = await load();
  const files = routeFiles(route);

  // The element index and the per-file element totals, narrowed to this route's
  // files so the browser does not carry the whole site's tables.
  const elements: Record<string, EditableNode[]> = {};
  const totals: Record<string, Record<string, number>> = {};
  for (const file of files) {
    if (FILE_ELEMENTS[file]) elements[file] = FILE_ELEMENTS[file];
    if (FILE_TOTALS[file]) totals[file] = FILE_TOTALS[file];
  }

  return (
    <Editor route={route} files={files} roots={FILE_ROOTS} elements={elements} totals={totals}>
      <Page />
    </Editor>
  );
}