"use client";

/**
 * The visual editor.
 *
 * ## How a click becomes a source edit
 *
 * The page rendered here is the real page — the same components the public route
 * renders, with no props overridden and no markup rewritten. That is what keeps
 * the preview honest, and it means the DOM has to be mapped back to source by
 * hand when something is clicked:
 *
 *   1. Walk up from the clicked element until an ancestor's **first** CSS class
 *      matches a component root. That names the file that owns it. First class,
 *      because Webflow's runtime appends `w--current`, `w--tab-active` and
 *      `gsap_split_*`, and the first class is the only part that stays stable.
 *   2. Within that component's subtree, count preceding elements with the same
 *      tag and first class. That count is the ordinal.
 *
 * Together they form the same `tag|class|ordinal` key the server-side codemod
 * builds from the file, so the editor and the patcher agree on what "this
 * headline" means.
 *
 * ## Where this can still be wrong
 *
 * If React rendered conditionally, the DOM ordinal will not match the source
 * ordinal and the patch would be aimed at the wrong element. The codemod
 * re-resolves against the real file and fails loudly rather than writing
 * silently, and that error reaches the operator — but the honest summary is
 * that a conditionally rendered element is not safely editable today.
 *
 * ## Why the preview is done by mutating the DOM
 *
 * The generated components hard-code their copy as literal JSX; there is no prop
 * to push a new headline through. React cannot update it, so the only way to
 * show a change immediately is to write to the node directly. Every mutation
 * records the value it replaced, which is what makes the change list exact and
 * what the server uses to detect a no-op save.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { EditKind } from "@/lib/admin/codemod";

/** Elements worth clicking. Deliberately narrow: a generic div is a container. */
const EDITABLE_SELECTOR = "h1,h2,h3,h4,h5,h6,p,li,a,img,span,blockquote";

interface Pending {
  key: string;
  file: string;
  node: string;
  kind: EditKind;
  /** Value currently on screen. */
  to: string;
  /** Value before this session's edits, for the change list. */
  from: string;
  label: string;
}

interface Selection {
  element: HTMLElement;
  file: string;
  node: string;
  kind: EditKind;
  label: string;
  text: string;
  src?: string;
  href?: string;
  /**
   * The enclosing link, when there is one.
   *
   * A Webflow button is `<a class="button"><div class="nav-button-wrap">…`. Clicking
   * the label selects the label — that is what you want for changing the words —
   * but the `href` lives on the ancestor. Rather than making the operator hunt for
   * an invisible target, the panel offers the link whenever the selection sits
   * inside one. It carries its own file and address, because the anchor is a
   * different node in the source than the text inside it.
   */
  link?: { element: HTMLElement; file: string; node: string; href: string };
}

/** The element an `href` edit should be recorded against. */
interface LinkOwner {
  element: HTMLElement;
  file: string;
  node: string;
  href: string;
}

type Status =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; commitUrl?: string; files: number; changes: number }
  | { state: "error"; message: string };

const MAX_PENDING = 400;

function firstClass(element: Element): string {
  return element.classList.length > 0 ? element.classList[0] : "";
}

/**
 * Which file owns this element, searching only the files on the current route.
 *
 * Restricting to the route matters: several pages ship a section with the same
 * root class — every blog post has its own `BlogDetailSection` — so a global
 * search could attribute an element to a sibling page's file.
 */
function owningFile(
  element: Element,
  allowed: string[],
  roots: Record<string, string[]>
): string | null {
  const allowedSet = new Set(allowed);
  let node: Element | null = element;
  while (node && node !== document.body && node !== document.documentElement) {
    const cls = firstClass(node);
    if (cls) {
      for (const [file, classes] of Object.entries(roots)) {
        if (allowedSet.has(file) && classes.includes(cls)) return file;
      }
    }
    node = node.parentElement;
  }
  return null;
}

/** The `tag|class|ordinal` key, counting matching elements earlier in the subtree. */
function elementKey(element: Element, root: Element): string | null {
  const tag = element.tagName.toLowerCase();
  const cls = firstClass(element);
  if (!cls) return null;

  let ordinal = 0;
  const candidates = [root, ...Array.from(root.querySelectorAll("*"))];
  for (const candidate of candidates) {
    if (candidate === element) break;
    if (candidate.tagName.toLowerCase() === tag && firstClass(candidate) === cls) {
      ordinal += 1;
    }
  }
  return tag + "|" + cls + "|" + ordinal;
}

function describe(element: HTMLElement): { label: string } {
  const tag = element.tagName.toLowerCase();

  // SplitText rewrites some labels into per-character spans at runtime, so what
  // is on screen is not what is in the source. The edit is still valid — the
  // source element sits one level up — but the preview only looks right after a
  // reload, so say so rather than let it look broken.
  const split = element.closest(
    '[class*="gsap_split"], .button-normal-text, .text-button-normal-text'
  );

  return { label: split ? tag + " · re-splits on reload" : tag };
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
  children,
}: {
  route: string;
  /** Source files this route is built from — passed in, not imported. */
  files: string[];
  /** Root CSS class per file — passed in, not imported. */
  roots: Record<string, string[]>;
  children: ReactNode;
}) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [hoverBox, setHoverBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftSrc, setDraftSrc] = useState("");
  const [draftHref, setDraftHref] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showChanges, setShowChanges] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

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
            label: kind === "text" ? chosen.label : kind.toUpperCase(),
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

    const address = (element: Element, files: string[], roots: Record<string, string[]>) => {
      const file = owningFile(element, files, roots);
      if (!file) return null;

      // The owner is the nearest ancestor that introduced this file's root class.
      let root: HTMLElement = element as HTMLElement;
      while (
        root.parentElement &&
        owningFile(root.parentElement, files, roots) !== file
      ) {
        root = root.parentElement;
      }

      const node = elementKey(element, root);
      return node ? { file, node } : null;
    };

    const resolve = (element: HTMLElement): Selection | null => {
      if (files.length === 0) return null;
      const self = address(element, files, roots);
      if (!self) return null;

      const anchor = element.closest("a");
      const anchorAddress = anchor && anchor !== element ? address(anchor, files, roots) : null;

      return {
        element,
        file: self.file,
        node: self.node,
        kind: "text",
        label: describe(element).label,
        text: element.tagName === "IMG" ? "" : element.textContent ?? "",
        src: element.getAttribute("src") ?? undefined,
        href: element.getAttribute("href") ?? undefined,
        link:
          anchor && anchorAddress
            ? {
                element: anchor,
                file: anchorAddress.file,
                node: anchorAddress.node,
                href: anchor.getAttribute("href") ?? "",
              }
            : undefined,
      };
    };

    const nearest = (target: EventTarget | null): HTMLElement | null => {
      const element = (target as HTMLElement | null)?.closest(
        EDITABLE_SELECTOR
      ) as HTMLElement | null;
      return element && container.contains(element) ? element : null;
    };

    const onMove = (event: MouseEvent) => {
      const element = nearest(event.target);
      if (!element) {
        setHoverBox(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      setHoverBox({ x: rect.left, y: rect.top, w: rect.width, h: rect.height });
    };

    const onClick = (event: MouseEvent) => {
      const element = nearest(event.target);
      if (!element) return;

      const found = resolve(element);
      if (!found) return;

      // An edit-mode click selects; it must never follow a link.
      event.preventDefault();
      event.stopPropagation();

      setSelection(found);
      setDraftText(found.text);
      setDraftSrc(found.src ?? "");
      setDraftHref(found.link ? found.link.href : (found.href ?? ""));
      setHoverBox(null);
    };

    const clearHover = () => setHoverBox(null);

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("scroll", clearHover, true);
    window.addEventListener("resize", clearHover);

    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", clearHover, true);
      window.removeEventListener("resize", clearHover);
    };
  }, [files, roots]);

  /* ------------------------------------------------------------------ view */

  const dirty = pending.length > 0;
  const saving = status.state === "saving";

  return (
    <div className="adm">
      <div className="adm-bar" role="toolbar" aria-label="Editor controls">
        <Link className="adm-back" href="/admin">
          All pages
        </Link>
        <span className="adm-route" title={route}>
          {route}
        </span>

        <span className="adm-spacer" />

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

      {hoverBox && !selection && (
        <div
          className="adm-hover"
          style={{ left: hoverBox.x, top: hoverBox.y, width: hoverBox.w, height: hoverBox.h }}
          aria-hidden="true"
        />
      )}

      {/*
        The real page, untouched. No props are overridden and no markup is
        rewritten, so what is on screen is exactly what the public route renders —
        which is the whole point of editing it in place.
      */}
      <div ref={containerRef} className="adm-stage">
        {children}
      </div>

      {selection && (
        <Inspector
          selection={selection}
          text={draftText}
          src={draftSrc}
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
          onHref={(value, owner) => {
            setDraftHref(value);
            // The href belongs to the anchor, which is a different node in the
            // source than the text that was clicked.
            owner.element.setAttribute("href", value);
            record(
              {
                element: owner.element,
                file: owner.file,
                node: owner.node,
                kind: "text",
                label: "a",
                text: owner.element.textContent ?? "",
              },
              "href",
              value,
              owner.href
            );
          }}
          onUpload={upload}
          onClose={() => setSelection(null)}
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
  href,
  uploading,
  onText,
  onSrc,
  onHref,
  onUpload,
  onClose,
}: {
  selection: Selection;
  text: string;
  src: string;
  href: string;
  uploading: boolean;
  onText: (value: string) => void;
  onSrc: (value: string) => void;
  onHref: (value: string, owner: LinkOwner) => void;
  onUpload: (file: File) => void;
  onClose: () => void;
}) {
  const isImage = selection.element.tagName === "IMG";
  // Offered whenever the selection is, or sits inside, a link. For a Webflow
  // button the text is the visible target but the `href` is on the ancestor, so
  // without this the field would be unreachable for anything but a bare `<a>`.
  const linkTarget = selection.link;
  const linkOwner = linkTarget
    ? { element: linkTarget.element, file: linkTarget.file, node: linkTarget.node, href: linkTarget.href }
    : selection.element.tagName === "A"
      ? { element: selection.element, file: selection.file, node: selection.node, href: selection.href ?? "" }
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
        </>
      )}

      {!isImage && (
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

      {linkOwner && (
        <label className="adm-field">
          <span>Link address</span>
          <input
            type="text"
            value={href}
            onChange={(event) => onHref(event.target.value, linkOwner!)}
            placeholder="/case-studies or https://…"
          />
        </label>
      )}

      <p className="adm-panel-note">
        Saves to <code>{selection.file}</code>
        <br />
        <code>{selection.node}</code>
      </p>
    </aside>
  );
}