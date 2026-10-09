"use client";

import { useEffect } from "react";

import { runInteractions, type SplitTextLike } from "./ix/runtime";
import { runWidgets } from "./ix/widgets";
import { parseIxPayload } from "./ix/types";

/**
 * Replays a page's Webflow IX (ix3) payload on top of the cloned markup.
 *
 * The reference site is driven by Webflow's interaction engine: GSAP 3.15 with
 * ScrollTrigger and SplitText, a Lenis smooth-scroll loop and the Webflow
 * widget scripts. This component runs the decoded payload that was extracted
 * from the reference's own runtime bundle, so the animation of every page is
 * reproduced from the same source data rather than hand-transcribed.
 *
 * See `docs/research/relab-0c02b053/<page-key>/webflow-ix2.json` for the input
 * and `scripts/ix-dump-page.mjs` for a readable rendering of it.
 *
 * The homepage is intentionally not wired through here: it already ships its own
 * runtime (`shared/InteractionsRuntime.tsx`), which must not be rebuilt.
 */
export default function PageInteractions({
  payload,
  route,
}: {
  payload: unknown;
  route: string;
}) {
  useEffect(() => {
    let cancelled = false;
    let disposeInteractions: (() => void) | undefined;
    let disposeWidgets: (() => void) | undefined;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("gsap/SplitText"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger, SplitText);

      // Webflow's global init flags. `w-mod-ix3` is what releases the
      // page's critical stylesheet, which keeps IX-driven elements hidden
      // until their animation is ready to play.
      const root = document.documentElement;
      root.classList.add("w-mod-js");
      root.classList.add("w-mod-ix");
      root.classList.add("w-mod-ix3");

      const widgets = runWidgets({ gsap, root: document });
      disposeWidgets = () => widgets.dispose();

      const ix = runInteractions({
        gsap,
        ScrollTrigger,
        SplitText: SplitText as unknown as SplitTextLike,
        payload: parseIxPayload(payload),
        root: document,
      });
      disposeInteractions = () => ix.dispose();

      void route;
    })();

    return () => {
      cancelled = true;
      disposeInteractions?.();
      disposeWidgets?.();
    };
  }, [payload, route]);

  return null;
}