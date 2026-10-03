import { notFound } from "next/navigation";
import Editor from "@/components/admin/Editor";
import { FILE_ROOTS, PAGES, routeFiles } from "@/generated/admin-registry";

/**
 * The editor for one page.
 *
 * The route is resolved to the site's own page module and rendered *as children*
 * of the editor. That is the whole design: `/admin/about` runs exactly the
 * components `/about` runs, so the preview cannot drift from the published page,
 * and no props are threaded through to "make it editable" — there is nothing to
 * forget to undo.
 *
 * ## Why the registry is passed as props rather than imported in the editor
 *
 * This module also holds `PAGES`, a map of dynamic imports of the site's page
 * modules. `Editor` is a client component, so importing *any* part of that module
 * pulls the whole map into the browser bundle — and every page module exports
 * `metadata`, a server-only export, which fails the build on all 25 routes.
 *
 * So the data the client needs (`routeFiles`, `FILE_ROOTS`) arrives as props from
 * this server component instead. The client bundle then contains the editor and
 * two small tables, and no page module.
 *
 * Dynamic because the admin surface is per-request — the session gate lives in
 * the layout — and because the route set is generated rather than enumerated.
 */
export const dynamic = "force-dynamic";

export default async function AdminEditorPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const route = "/" + slug.join("/");

  const load = PAGES[route];
  if (!load) notFound();

  const { default: Page } = await load();

  return (
    <Editor route={route} files={routeFiles(route)} roots={FILE_ROOTS}>
      <Page />
    </Editor>
  );
}