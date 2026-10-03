"use client";

/**
 * The visual editor.
 *
 * ## The preview is the real page
 *
 * The page rendered here is the real page — the same components the public route
 * renders, with no props overridden and no markup rewritten. That is what keeps
 * the preview honest, and it is also why everything below has to work from the
 * DOM: the generated components hard-code their copy as literal JSX, so there is
 * no prop to push a new headline through.
 *
 * ## How a click becomes a source edit
 *
 * `FILE_ELEMENTS` in the generated registry is the spine of this. It is produced
 * by `lib/admin/codemod.ts` — the same scanner that performs the patch — so "the
 * editor offers this element" and "the codemod can rewrite this element" are the
 * same statement rather than two implementations that have to be kept in step.
 * The first version of the editor guessed with a hard-coded tag list
 * (`h1,h2,p,li,a,img,span,blockquote`), which silently excluded much of a Webflow
 * page: Webflow renders a great deal of its copy as `div`, so button captions and
 * small labels were simply not selectable.
 *
 * On mount, `buildIndex` walks the rendered DOM once and resolves each element to
 * its address, mirroring the source scan exactly:
 *
 *   1. Find the component roots — elements whose first class is a registered
 *      root. First class, because Webflow's runtime appends `w--current`,
 *      `w--tab-active` and `gsap_split_*`, and the first class is the only part
 *      that survives into the live DOM.
 *   2. For each root, take its subtree in document order and count preceding
 *      elements with the same tag and source class. That count is the ordinal.
 *   3. Look the resulting address up in `FILE_ELEMENTS`. Not found means not
 *      editable — so it is never offered, and never fails at save time.
 *
 * Elements with no class are skipped, which is what makes SplitText work: it
 * replaces a button label with per-character spans that exist in the DOM but not
 * in the source, and counting them would shift every ordinal after it.
 *
 * ## Safety: the DOM must match the source
 *
 * If React rendered conditionally, a subtree could hold more elements than the
 * file declares, and every ordinal after the divergence would point at the wrong
 * element. Each file's element counts are compared against the registry
 * afterwards, and a file that disagrees is dropped from the index entirely and
 * reported in the status bar. Refusing is the right outcome: a save that silently
 * rewrites the wrong headline is the worst failure this system can have.
 *
 * ## Why the preview mutates the DOM
 *
 * React cannot update literal JSX, so the only way to show a change immediately
 * is to write to the node directly. Every mutation records the value it replaced,
 * which is what the change list shows and what the server uses to detect a no-op
 * save.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { EditKind } from "@/lib/admin/codemod";
import type { EditableNode, EditableProperty } from "@/generated/admin-registry";

/** The element an `href` edit should be recorded against. */
interface LinkOwner {
  element: HTMLElement;
  file: string;
  node: string;
  href: string;
}

interface Addressable {
  file: string;
  node: string;
  /** Which properties this element exposes. */
  caps: EditableProperty[];
}

interface Selection {
  element: HTMLElement;
  file: string;
  node: string;
  caps: EditKind[];
  label: string;
  text: string;
  src?: string;
  alt?: string;
  /**
   * The enclosing link, when there is one.
   *
   * A Webflow button is `<a class="button"><div class="nav-button-wrap">…`, so the
   * `href` lives on an ancestor of the text you can actually see. Rather than
   * making the operator hunt for an invisible target, the panel offers the link
   * whenever the selection sits inside one — with its own address, because the
   * anchor is a different node in the source than the words inside it.
   */
  link?: LinkOwner;
}

type Status =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; commitUrl?: string; files: number; changes: number }
  | { state: "error"; message: string };

interface Pending {
  key: string;
  file: string;
  node: string;
  kind: EditKind;
  from: string;
  to: string;
  label: string;
}

const MAX_PENDING = 400;

function firstClass(element: Element): string {
  return element.classList.length > 0 ? element.classList[0] : "";
}

/**
 * Resolve the index once for the whole route: every addressable DOM element, and
 * the files whose DOM disagrees with their source.
 *
 * Returned from a `useMemo` rather than an effect so the first paint already has
 * hover feedback, and so hover cannot observe a half-built index.
 */
function buildIndex(
  container: HTMLElement,
  files: string[],
  roots: Record<string, string[]>,
  elements: Record<string, EditableNode[]>,
  totals: Record<string, Record<string, number>>
): { map: Map<Element, Addressable>; unsafe: string[] } {
  const map = new Map<Element, Addressable>();
  const unsafe = new Set<string>();

  // First class -> files that can begin with it. Reversed so the lookup during the
  // walk is a single Map hit rather than a scan of every file.
  const classToFiles = new Map<string, string[]>();
  // File -> the source classes it declares, for the membership test.
  const classesOf = new Map<string, Set<string>>();
  // File -> full address -> what can be edited there.
  //
  // Keyed by address rather than by position in a list: ordinals are assigned
  // over *every* element in the file, so the second editable `div.foo` in a file
  // where only `div.foo` #0 and #3 have text is address #3, not #1. Indexing a
  // filtered array by ordinal silently mismatches every element after the first
  // gap.
  const byNode = new Map<string, Map<string, Addressable>>();

  for (const file of files) {
    for (const cls of roots[file] ?? []) {
      const list = classToFiles.get(cls);
      if (list) list.push(file);
      else classToFiles.set(cls, [file]);
    }

    const rows = elements[file];
    if (!rows) continue;

    const classes = new Set<string>();
    const nodes = new Map<string, Addressable>();
    for (const row of rows) {
      const prefix = row.n.slice(0, row.n.lastIndexOf("|"));
      classes.add(prefix.slice(prefix.indexOf("|") + 1));
      nodes.set(row.n, { file, node: row.n, caps: row.c });
    }
    classesOf.set(file, classes);
    byNode.set(file, nodes);
  }

  const all = Array.from(container.querySelectorAll("*"));

  // Which elements are component roots. A class can be a root on more than one
  // file only across different routes, and `files` has already narrowed that.
  const rootFile = new Map<Element, string>();
  for (const el of all) {
    const candidates = classToFiles.get(firstClass(el));
    if (candidates) rootFile.set(el, candidates[0]);
  }

  // Group every element under its *nearest* ancestor-or-self root, so a component
  // nested in another is attributed to itself rather than to its container.
  const groups = new Map<Element, Element[]>();
  for (const el of all) {
    let owner: Element | null = el;
    while (owner && !rootFile.has(owner)) owner = owner.parentElement;
    if (!owner) continue; // outside every component: chrome, or a wrapper
    const list = groups.get(owner);
    if (list) list.push(el);
    else groups.set(owner, [el]);
  }

  for (const [root, group] of groups) {
    const file = rootFile.get(root);
    if (!file) continue;
    const classes = classesOf.get(file);
    const nodes = byNode.get(file);
    if (!classes || !nodes) continue;

    const counters = new Map<string, number>();

    for (const el of group) {
      // Match on any class the element carries, not just the first: Webflow's
      // runtime can prepend `gsap_split_*`, which would otherwise break the
      // identity. Source classes are distinctive, so the first hit is the right
      // one, and the count check below catches it if it is not.
      let cls: string | null = null;
      for (const candidate of el.classList) {
        if (classes.has(candidate)) {
          cls = candidate;
          break;
        }
      }
      // No class, or no source counterpart: a SplitText span, a bare wrapper.
      // Counting these would shift every ordinal after it.
      if (!cls) continue;

      const prefix = el.tagName.toLowerCase() + "|" + cls;
      const ordinal = counters.get(prefix) ?? 0;
      counters.set(prefix, ordinal + 1);

      // Counted whether or not it is editable: the ordinal has to match the one
      // the source scan assigned, which counts every element of this shape.
      const entry = nodes.get(prefix + "|" + ordinal);
      if (entry) map.set(el, entry);
    }

    // The DOM must account for exactly the elements the file declares. Anything
    // else means conditional rendering, and every ordinal after the divergence
    // would aim a save at the wrong element.
    const expected = totals[file] ?? {};
    for (const [prefix, count] of counters) {
      const declared = expected[prefix];
      if (declared !== undefined && declared !== count) {
        unsafe.add(file);
        break;
      }
    }
  }

  // A file that failed the check must not be offered at all.
  for (const el of Array.from(map.keys())) {
    if (unsafe.has(map.get(el)!.file)) map.delete(el);
  }

  return { map, unsafe: [...unsafe] };
}

function shortFile(file: string): string {
  const parts = file.split("/");
  return parts[parts.length - 1];
}

function truncate(value: string, limit = 42): string {
  const single = value.replace(/\s+/g, " ").trim();
  return single.length > limit ? single.slice(0, limit - 1) + "…" : single;
}

export default function Editor({
  route,
  files,
  roots,
  elements,
  totals,
  children,
}: {
  route: string;
  files: string[];
  roots: Record<string, string[]>;
  elements: Record<string, EditableNode[]>;
  totals: Record<string, Record<string, number>>;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef(0);

  const [pending, setPending] = useState<Pending[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [editMode, setEditMode] = useState(true);
  const [draftText, setDraftText] = useState("");
  const [draftSrc, setDraftSrc] = useState("");
  const [draftAlt, setDraftAlt] = useState("");
  const [draftHref, setDraftHref] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [hoverBadge, setHoverBadge] = useState<{
    x: number;
    y: number;
    label: string;
    where: string;
  } | null>(null);
  const [built, setBuilt] = useState<{
    map: Map<Element, Addressable>;
    unsafe: string[];
  }>({ map: new Map(), unsafe: [] });

  /**
   * Resolve the DOM against the source once per route.
   *
   * In an effect rather than a `useMemo` because it has to read
   * `containerRef.current`, and touching a ref during render is what React's
   * compiler lint rightly rejects — the children are not mounted yet at that
   * point, so the result would be an empty index anyway.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setBuilt(buildIndex(container, files, roots, elements, totals));
  }, [files, roots, elements, totals]);

  // Listeners read the table through a ref so a handler attached before the index
  // finished building never resolves against a stale one.
  const indexRef = useRef(built.map);
  useEffect(() => {
    indexRef.current = built.map;
  }, [built]);

  const publicUrl = route === "/" ? "/" : route;

  /* --------------------------------------------------------------- preview */

  const applyPreview = useCallback((element: HTMLElement, kind: EditKind, value: string) => {
    if (kind === "text") {
      // textContent replaces child nodes too, which is what clears the spans
      // SplitText created.
      element.textContent = value;
    } else if (kind === "src") {
      element.setAttribute("src", value);
    } else if (kind === "href") {
      element.setAttribute("href", value);
    } else if (kind === "alt") {
      element.setAttribute("alt", value);
    }
  }, []);

  const record = useCallback(
    (chosen: Selection, kind: EditKind, value: string, previous: string) => {
      const key = [chosen.file, chosen.node, kind].join("|");

      setPending((current) => {
        // Typing replaces the previous edit of the same field rather than
        // stacking one entry per keystroke.
        const without = current.filter((entry) => entry.key !== key);
        if (without.length >= MAX_PENDING) {
          setStatus({
            state: "error",
            message:
              "Too many unsaved edits (" +
              MAX_PENDING +
              "). Save or discard before continuing.",
          });
          return current;
        }
        if (value === previous) return without;
        return [
          ...without,
          {
            key,
            file: chosen.file,
            node: chosen.node,
            kind,
            from: previous,
            to: value,
            label:
              kind === "text"
                ? chosen.label
                : kind === "src"
                  ? "Image"
                  : kind === "href"
                    ? "Link"
                    : "Alt text",
          },
        ];
      });
    },
    []
  );

  /* --------------------------------------------------------------- discard */

  const discard = useCallback(() => {
    setPending([]);
    // A reload is the only fully faithful restore. Undoing each mutation by hand
    // would leave behind everything the site's runtime did in response to the
    // edited content: SplitText spans a text edit removed, a slider moved, a
    // marquee re-measured. Reloading rebuilds all of it.
    window.location.reload();
  }, []);

  /* ------------------------------------------------------------------ save */

  const save = useCallback(async () => {
    if (pending.length === 0) return;
    setStatus({ state: "saving" });

    try {
      const response = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changes: pending.map((entry) => ({
            file: entry.file,
            node: entry.node,
            kind: entry.kind,
            value: entry.to,
          })),
        }),
      });

      const body = (await response.json()) as {
        ok: boolean;
        error?: string;
        commitUrl?: string;
        filesChanged?: number;
        changes?: number;
        unchanged?: boolean;
      };

      if (!response.ok || !body.ok || body.unchanged) {
        setStatus({
          state: "error",
          message: body.error ?? "Nothing was published. Your edits are still here.",
        });
        return;
      }

      setPending([]);
      setStatus({
        state: "saved",
        commitUrl: body.commitUrl,
        files: body.filesChanged ?? 0,
        changes: body.changes ?? 0,
      });
    } catch {
      setStatus({
        state: "error",
        message:
          "Could not reach the server. Your edits are still here — check the connection and save again.",
      });
    }
  }, [pending]);

  /* ---------------------------------------------------------------- upload */

  const upload = useCallback(
    async (file: File) => {
      if (!selection) return;
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: form,
        });
        const body = (await response.json()) as {
          ok: boolean;
          path?: string;
          error?: string;
        };

        if (!response.ok || !body.ok || !body.path) {
          setStatus({
            state: "error",
            message: body.error ?? "The upload failed. Nothing was changed.",
          });
          return;
        }

        setDraftSrc(body.path);
        applyPreview(selection.element, "src", body.path);
        record(selection, "src", body.path, selection.src ?? "");
        setStatus({ state: "idle" });
      } catch {
        setStatus({
          state: "error",
          message: "The upload could not be sent.",
        });
      } finally {
        setUploading(false);
      }
    },
    [selection, applyPreview, record]
  );

  /* ------------------------------------------------------- DOM interaction */

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /** The nearest addressable ancestor-or-self of an event target. */
    const hit = (target: EventTarget | null): { el: HTMLElement; info: Addressable } | null => {
      let el = (target as HTMLElement | null) ?? null;
      while (el && container.contains(el)) {
        const info = indexRef.current.get(el);
        if (info) return { el, info };
        el = el.parentElement;
      }
      return null;
    };

    /** The link owner for a selection, if it sits inside one. */
    const linkFor = (el: HTMLElement): LinkOwner | undefined => {
      const anchor = el.closest("a");
      if (!anchor || anchor === el) return undefined;
      const info = indexRef.current.get(anchor);
      if (!info) return undefined;
      return {
        element: anchor,
        file: info.file,
        node: info.node,
        href: anchor.getAttribute("href") ?? "",
      };
    };

    const clearHover = () => {
      if (hoverRef.current) {
        hoverRef.current.removeAttribute("data-adm-hover");
        hoverRef.current = null;
      }
      setHoverBadge(null);
    };

    const onMove = (event: MouseEvent) => {
      if (!editMode) {
        clearHover();
        return;
      }
      const found = hit(event.target);
      if (!found) {
        clearHover();
        return;
      }

      if (hoverRef.current !== found.el) {
        hoverRef.current?.removeAttribute("data-adm-hover");
        hoverRef.current = found.el;
        found.el.setAttribute("data-adm-hover", "");
      }

      // The badge follows the pointer, so it is throttled to one update per
      // frame rather than one per mousemove event.
      if (frameRef.current) return;
      const x = event.clientX;
      const y = event.clientY;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = 0;
        setHoverBadge({
          x,
          y,
          label: found.info.caps.join(" + "),
          where: shortFile(found.info.file),
        });
      });
    };

    const onClick = (event: MouseEvent) => {
      if (!editMode) return;
      const found = hit(event.target);
      if (!found) return;

      // An edit-mode click selects; it must never follow a link.
      event.preventDefault();
      event.stopPropagation();

      const { el, info } = found;
      const split = el.closest(
        '[class*="gsap_split"], .button-normal-text, .text-button-normal-text'
      );

      const chosen: Selection = {
        element: el,
        file: info.file,
        node: info.node,
        caps: info.caps,
        label: split
          ? el.tagName.toLowerCase() + " · re-splits on reload"
          : el.tagName.toLowerCase(),
        text: el.tagName === "IMG" ? "" : (el.textContent ?? ""),
        src: el.getAttribute("src") ?? undefined,
        alt: el.getAttribute("alt") ?? undefined,
        link: linkFor(el),
      };

      selection?.element.removeAttribute("data-adm-selected");
      el.setAttribute("data-adm-selected", "");

      setSelection(chosen);
      setDraftText(chosen.text);
      setDraftSrc(chosen.src ?? "");
      setDraftAlt(chosen.alt ?? "");
      setDraftHref(chosen.link ? chosen.link.href : (el.getAttribute("href") ?? ""));
      clearHover();
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      selection?.element.removeAttribute("data-adm-selected");
      setSelection(null);
    };

    const onLeave = () => clearHover();

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("mouseleave", onLeave, true);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mouseleave", onLeave, true);
      document.removeEventListener("keydown", onKey);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [editMode, selection]);

  /* ------------------------------------------------------------ deselect */

  const deselect = useCallback(() => {
    selection?.element.removeAttribute("data-adm-selected");
    setSelection(null);
  }, [selection]);

  /* ------------------------------------------------------------------ view */

  const dirty = pending.length > 0;
  const saving = status.state === "saving";
  const editableCount = built.map.size;

  return (
    <div className="adm">
      <div className="adm-bar" role="toolbar" aria-label="Editor controls">
        <Link className="adm-back" href="/admin">
          All pages
        </Link>
        <span className="adm-route" title={route}>
          {route}
        </span>
        <a className="adm-live" href={publicUrl} target="_blank" rel="noreferrer">
          View live ↗
        </a>

        <span className="adm-spacer" />

        <button
          type="button"
          className={"adm-btn " + (editMode ? "adm-btn-on" : "adm-btn-ghost")}
          onClick={() => setEditMode((on) => !on)}
          aria-pressed={editMode}
          title={
            editMode
              ? "On: clicks select elements. Turn off to use the page normally."
              : "Off: the page behaves exactly as visitors see it."
          }
        >
          {editMode ? "Editing on" : "Editing off"}
        </button>

        {dirty && (
          <button
            type="button"
            className="adm-btn adm-btn-ghost"
            onClick={() => setShowChanges((open) => !open)}
            aria-expanded={showChanges}
          >
            {pending.length} unsaved {pending.length === 1 ? "edit" : "edits"}
          </button>
        )}

        <button
          type="button"
          className="adm-btn adm-btn-ghost"
          onClick={discard}
          disabled={!dirty || saving}
          title="Reload the page and throw away every unsaved edit"
        >
          Discard
        </button>
        <button
          type="button"
          className="adm-btn adm-btn-go"
          onClick={save}
          disabled={!dirty || saving}
        >
          {saving ? "Saving…" : "Save & publish"}
        </button>
      </div>

      <StatusLine status={status} />

      {built.unsafe.length > 0 && (
        <div className="adm-status adm-status-warn" role="status">
          {built.unsafe.length} section{built.unsafe.length === 1 ? "" : "s"} on this
          page are not editable because the rendered page does not match the
          source file ({shortFile(built.unsafe[0])}). Everything else still works.
        </div>
      )}

      {editMode && !selection && (
        <div className="adm-hint">
          {editableCount > 0 ? (
            <>
              <strong>Click</strong> any highlighted text, image or link to edit it.
              <span className="adm-hint-count">{editableCount} editable elements on this page</span>
            </>
          ) : (
            <>No editable elements were found on this page.</>
          )}
        </div>
      )}

      {showChanges && (
        <ul className="adm-changes">
          {pending.map((entry) => (
            <li key={entry.key}>
              <span className="adm-changes-what">{entry.label}</span>
              <span className="adm-changes-where">{shortFile(entry.file)}</span>
              <span className="adm-changes-values">
                <s>{truncate(entry.from) || "(empty)"}</s> &rarr; <b>{truncate(entry.to)}</b>
              </span>
            </li>
          ))}
        </ul>
      )}

      {hoverBadge && editMode && !selection && (
        <div
          className="adm-badge"
          style={{ left: hoverBadge.x + 14, top: hoverBadge.y + 18 }}
          aria-hidden="true"
        >
          <b>{hoverBadge.label}</b>
          <span>{hoverBadge.where}</span>
        </div>
      )}

      <div ref={containerRef} className={"adm-stage" + (editMode ? " adm-editing" : "")}>
        {children}
      </div>

      {selection && (
        <Inspector
          selection={selection}
          text={draftText}
          src={draftSrc}
          alt={draftAlt}
          href={draftHref}
          uploading={uploading}
          onText={(value) => {
            setDraftText(value);
            applyPreview(selection.element, "text", value);
            record(selection, "text", value, selection.text);
          }}
          onSrc={(value) => {
            setDraftSrc(value);
            applyPreview(selection.element, "src", value);
            record(selection, "src", value, selection.src ?? "");
          }}
          onAlt={(value) => {
            setDraftAlt(value);
            applyPreview(selection.element, "alt", value);
            record(
              { ...selection, label: "Alt text" },
              "alt",
              value,
              selection.alt ?? ""
            );
          }}
          onHref={(value, owner) => {
            setDraftHref(value);
            // The href belongs to the anchor, a different node in the source than
            // the text that was clicked.
            owner.element.setAttribute("href", value);
            record(
              { ...selection, element: owner.element, file: owner.file, node: owner.node },
              "href",
              value,
              owner.href
            );
          }}
          onUpload={upload}
          onClose={deselect}
        />
      )}
    </div>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.state === "idle") return null;

  if (status.state === "saved") {
    return (
      <div className="adm-status adm-status-ok" role="status">
        Published {status.changes} {status.changes === 1 ? "change" : "changes"} across{" "}
        {status.files} {status.files === 1 ? "file" : "files"}. Vercel is building the new
        version now — the live site updates in about a minute.
        {status.commitUrl && (
          <>
            {" "}
            <a href={status.commitUrl} target="_blank" rel="noreferrer">
              View commit
            </a>
          </>
        )}
      </div>
    );
  }

  if (status.state === "error") {
    return (
      <div className="adm-status adm-status-bad" role="alert">
        {status.message}
      </div>
    );
  }

  return (
    <div className="adm-status" role="status">
      Publishing…
    </div>
  );
}

function Inspector({
  selection,
  text,
  src,
  alt,
  href,
  uploading,
  onText,
  onSrc,
  onAlt,
  onHref,
  onUpload,
  onClose,
}: {
  selection: Selection;
  text: string;
  src: string;
  alt: string;
  href: string;
  uploading: boolean;
  onText: (value: string) => void;
  onSrc: (value: string) => void;
  onAlt: (value: string) => void;
  onHref: (value: string, owner: LinkOwner) => void;
  onUpload: (file: File) => void;
  onClose: () => void;
}) {
  const isImage = selection.caps.includes("src");

  const linkOwner: LinkOwner | null = selection.link
    ? selection.link
    : selection.element.tagName === "A"
      ? {
          element: selection.element,
          file: selection.file,
          node: selection.node,
          href: selection.element.getAttribute("href") ?? "",
        }
      : null;

  return (
    <aside className="adm-panel" aria-label="Element editor">
      <header className="adm-panel-head">
        <div>
          <span className="adm-panel-kind">{selection.label}</span>
          <span className="adm-panel-file">{shortFile(selection.file)}</span>
        </div>
        <button
          type="button"
          className="adm-panel-close"
          onClick={onClose}
          aria-label="Close editor"
        >
          &times;
        </button>
      </header>

      {selection.caps.includes("text") && (
        <label className="adm-field">
          <span>Text</span>
          <textarea
            value={text}
            rows={4}
            onChange={(event) => onText(event.target.value)}
            placeholder="Text content"
          />
        </label>
      )}

      {isImage && (
        <>
          <label className="adm-field">
            <span>Image address</span>
            <input
              type="text"
              value={src}
              onChange={(event) => onSrc(event.target.value)}
              placeholder="/sites/... or https://…"
            />
          </label>

          <label className="adm-field adm-field-file">
            <span>Or upload from this computer</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
                event.target.value = "";
              }}
            />
            {uploading && <em>Uploading…</em>}
          </label>

          {selection.caps.includes("alt") && (
            <label className="adm-field">
              <span>Alt text</span>
              <input
                type="text"
                value={alt}
                onChange={(event) => onAlt(event.target.value)}
                placeholder="Describe the image"
              />
            </label>
          )}
        </>
      )}

      {linkOwner && (
        <label className="adm-field">
          <span>Link address</span>
          <input
            type="text"
            value={href}
            onChange={(event) => onHref(event.target.value, linkOwner)}
            placeholder="/case-studies or https://…"
          />
        </label>
      )}

      {selection.caps.length === 0 && (
        <p className="adm-panel-note">This element has nothing editable on it.</p>
      )}

      <p className="adm-panel-note">
        Saves to <code>{selection.file}</code>
        <br />
        <code>{selection.node}</code>
        {linkOwner && linkOwner.node !== selection.node && (
          <>
            <br />
            <br />
            Link address saves to <code>{linkOwner.file}</code>
            <br />
            <code>{linkOwner.node}</code>
          </>
        )}
      </p>
    </aside>
  );
}