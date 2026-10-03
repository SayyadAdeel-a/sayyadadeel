"use client";

import { useEffect } from "react";
import type { gsap as GSAP } from "gsap";
import type ScrollTriggerType from "gsap/ScrollTrigger";

/**
 * Faithful re-implementation of the reference site's runtime behaviour.
 *
 * The source page is a Webflow export driven by Webflow's IX (ix3) engine plus
 * GSAP 3.15 (core, ScrollTrigger, SplitText), a Lenis smooth-scroll loop, and
 * one hand-written script for the hero intro tabs. Every interaction below is
 * transcribed from the interaction/timeline payload extracted from
 * `webflow.a3e096e3.*.js` — see
 * docs/research/relab-0c02b053/root-8a5edab2/IX2-READABLE.md.
 *
 * Selector naming follows the extracted payload:
 *   `wf:class`      -> `.className`
 *   `wf:attribute`  -> `[attr="value"]`
 *   `wf:inst`       -> `[id="..."]`
 *   `wf:trigger-only` -> descendants of the element carrying the hook
 *
 * The page's Webflow breakpoints are `main` (>=992px), `medium`, `small` and
 * `tiny`; `conditionalPlayback: dont-animate` entries are honoured with an
 * explicit 992px check.
 */
export default function InteractionsRuntime() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("gsap/SplitText"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger, SplitText);
      const g = gsap as unknown as typeof GSAP;
      const ST = ScrollTrigger as unknown as typeof ScrollTriggerType;

      const disposers: (() => void)[] = [];
      const track = (fn: () => void) => disposers.push(fn);
      const tweens: gsap.core.Animation[] = [];
      const triggers: ScrollTriggerType[] = [];

      const $ = <T extends Element = HTMLElement>(
        selector: string,
        scope: ParentNode | null | undefined = document
      ) => Array.from((scope ?? document).querySelectorAll<T>(selector));
      const $1 = <T extends Element = HTMLElement>(
        selector: string,
        scope: ParentNode | null | undefined = document
      ) => (scope ?? document).querySelector<T>(selector);
      const desktop = () => window.innerWidth >= 992;

      /* ================================================================ *
       * 0. Webflow global init classes
       * ================================================================ */
      document.documentElement.classList.add("w-mod-js");
      document.documentElement.classList.add("w-mod-touch");

      /* ================================================================ *
       * 1. i-c8a0a373 / t-a4a0eafc — navbar mobile menu
       * ================================================================ */
      for (const wrap of $("[menu-bar-toggle]")) {
        const wrapper = $1<HTMLElement>(".menu-wrapper", wrap);
        const burger = $1<HTMLElement>(".menu-button", document);
        if (!wrapper || !burger) continue;

        const lineTop = $1<HTMLElement>(".hamburger-line-top", burger);
        const lineMiddle = $1<HTMLElement>(".hamburger-line-middle", burger);
        const lineBottom = $1<HTMLElement>(".hamburger-line-bottom", burger);

        // Closed state, matching the reference's inline styles.
        wrap.style.display = "none";
        g.set(wrapper, { opacity: 0, y: 50 });
        g.set([lineTop, lineBottom].filter(Boolean) as Element[], {
          x: 0,
          y: 0,
          rotation: 0,
        });

        let open = false;
        const onClick = () => {
          if (!desktop() && open) {
            open = false;
            burger.classList.remove("open");
            g.set(wrap, { display: "none" });
            g.set(wrapper, { opacity: 0, y: 50 });
            if (lineTop) g.set(lineTop, { x: 0, y: 0, rotation: 0 });
            if (lineBottom) g.set(lineBottom, { x: 0, y: 0, rotation: 0 });
            if (lineMiddle) g.set(lineMiddle, { opacity: 1 });
            return;
          }
          open = true;
          burger.classList.add("open");
          g.set(wrap, { display: "block" });
          if (lineTop) g.set(lineTop, { x: 0, y: 6, rotation: 45 });
          if (lineBottom) g.set(lineBottom, { x: 0, y: -10, rotation: -45 });
          if (lineMiddle) g.set(lineMiddle, { opacity: 0 });
          g.to(wrapper, { opacity: 1, y: 0, duration: 0.5, ease: "power1.out" });
        };
        burger.addEventListener("click", onClick);
        track(() => burger.removeEventListener("click", onClick));
      }

      /* ================================================================ *
       * 2. `.w-tabs` — our-clients-section
       * ================================================================ */
      let tabsIndex = 0;
      for (const tabs of $<HTMLElement>(".w-tabs")) {
        const links = $<HTMLElement>(".w-tab-link", tabs);
        const panes = $<HTMLElement>(".w-tab-pane", tabs);
        const menu = $1<HTMLElement>(".w-tab-menu", tabs);
        // Webflow's tab runtime stamps ids of the form
        // `w-tabs-<set>-data-w-tab-<n>` / `w-tabs-<set>-data-w-pane-<n>`.
        links.forEach((link, i) => {
          link.id = `w-tabs-${tabsIndex}-data-w-tab-${i}`;
        });
        panes.forEach((pane, i) => {
          pane.id = `w-tabs-${tabsIndex}-data-w-pane-${i}`;
        });
        tabsIndex += 1;
        const currentName = links.find((l) =>
          l.classList.contains("w--current")
        )?.dataset.wTab;
        const durationIn = Number(tabs.dataset.durationIn ?? 300) / 1000;
        const durationOut = Number(tabs.dataset.durationOut ?? 100) / 1000;

        const onClick = (e: Event) => {
          const link = e.currentTarget as HTMLElement;
          const value = link.dataset.wTab;
          if (!value || link.classList.contains("w--current")) return;
          e.preventDefault();
          menu?.setAttribute("data-current", value);
          links.forEach((l) =>
            l.classList.toggle("w--current", l.dataset.wTab === value)
          );
          panes.forEach((pane) => {
            const active = pane.dataset.wTab === value;
            if (active) {
              pane.style.transition = `all, opacity ${durationIn * 1000}ms`;
              pane.style.opacity = "1";
              pane.classList.add("w--tab-active");
            } else {
              pane.style.transition = `all, opacity ${durationOut * 1000}ms`;
              pane.style.opacity = "0";
              pane.classList.remove("w--tab-active");
            }
          });
        };
        links.forEach((l) => l.addEventListener("click", onClick));
        track(() =>
          links.forEach((l) => l.removeEventListener("click", onClick))
        );
        void currentName;
      }

      /* ================================================================ *
       * 3. Hero intro tabs — the page's own hand-written script
       * ================================================================ */
      {
        const cards = $<HTMLElement>(".hero-intro-card-box");
        const images = $<HTMLElement>(".single-image-wrap");
        if (cards.length && images.length) {
          $1<HTMLElement>(".hero-intro-meddle-image-wrap")?.style.removeProperty(
            "height"
          );

          let currentIndex = 0;
          let transitionId = 0;

          images.forEach((image, index) =>
            image.classList.toggle("is-tab-hidden", index !== 0)
          );

          const updateActiveCard = (index: number) => {
            cards.forEach((card, i) =>
              card.classList.toggle("is-active", i === index)
            );
          };

          const changeTab = (targetIndex: number) => {
            if (targetIndex === currentIndex || !images[targetIndex]) return;
            const currentImage = images[currentIndex];
            const nextImage = images[targetIndex];
            transitionId += 1;
            const thisTransition = transitionId;

            g.killTweensOf(images);
            nextImage.classList.remove("is-tab-hidden");
            g.set(nextImage, { opacity: 0, scale: 0.97, x: 0, y: 0, zIndex: 3 });

            g.to(currentImage, {
              opacity: 0,
              scale: 1.02,
              duration: 0.35,
              ease: "power2.inOut",
            });
            g.to(nextImage, {
              opacity: 1,
              scale: 1,
              duration: 0.35,
              ease: "power2.out",
              onComplete: () => {
                if (thisTransition !== transitionId) return;
                currentImage.classList.add("is-tab-hidden");
                g.set(currentImage, {
                  opacity: 0,
                  scale: 1,
                  x: 0,
                  y: 0,
                  zIndex: 1,
                });
                nextImage.classList.remove("is-tab-hidden");
                g.set(nextImage, { opacity: 1, scale: 1, x: 0, y: 0, zIndex: 2 });
              },
            });

            currentIndex = targetIndex;
            updateActiveCard(targetIndex);
          };

          cards.forEach((card, index) => {
            const onClick = () => changeTab(index);
            card.addEventListener("click", onClick);
            track(() => card.removeEventListener("click", onClick));
          });

          updateActiveCard(0);
        }
      }

      /* ================================================================ *
       * 4. i-00a50fa3 / t-235027ae — text-button character roll
       *     SplitText is configured to reproduce the DOM Webflow's engine
       *     creates: `<span class="gsap_split_wordN">` word wrappers holding
       *     `<span class="gsap_split_letterN">` letters, all positioned and
       *     displayed as inline-block.
       * ================================================================ */
      const splitText = (el: Element) => {
        const s = new SplitText(el, {
          type: "words,chars",
          tag: "span",
          wordsClass: "gsap_split_word++",
          charsClass: "gsap_split_letter++",
        });
        for (const node of [...s.words, ...s.chars] as HTMLElement[]) {
          node.style.position = "relative";
          node.style.display = "inline-block";
        }
        return s;
      };

      {
        const splits = new WeakMap<Element, InstanceType<typeof SplitText>>();
        const splitOf = (el: Element) => {
          let s = splits.get(el);
          if (!s) {
            s = splitText(el);
            splits.set(el, s);
          }
          return s;
        };
        for (const button of $(".text-button")) {
          const normal = $1<HTMLElement>(".text-button-normal-text", button);
          const hover = $1<HTMLElement>(".text-button-hover-text", button);
          if (!normal || !hover) continue;
          const normalChars = splitOf(normal).chars;
          const hoverChars = splitOf(hover).chars;

          /**
           * Both layers roll *upwards* by 100% of their own height on enter, and
           * back down on leave.
           *
           * The payload (i-00a50fa3 / t-235027ae) is two `fromTo` actions on the
           * same channel:
           *
           *   .text-button-normal-text  y ["0%","-100"]  scale [1,   0.4]
           *   .text-button-hover-text   y ["0%","-100"]  scale [0.4, 1  ]
           *
           * so the normal label leaves through the top of its clipped wrapper
           * while the hover label — which the stylesheet parks one line-height
           * *below* via `top: 100%` — rises into the vacated slot. They travel the
           * same way; only the scale differs.
           *
           * This was previously modelled with the hover layer inverted (parked at
           * `-100%` and tweened to `0`), which sent the two labels in opposite
           * directions. Measured against the reference, the hover characters moved
           * -44.8px where the clone moved +44.8px: a roll in the wrong direction on
           * every text button on the page. See `scripts/audit-hover.mjs`.
           *
           * The reference's `fromTo` actions never write a resting transform,
           * because its engine leaves `immediateRender` unset on them — the
           * from-state is applied when the hover first plays. So the resting
           * state here is written explicitly, and matches those from-values.
           */
          const REST_NORMAL = { yPercent: 0, scale: 1 } as const;
          const REST_HOVER = { yPercent: 0, scale: 0.4 } as const;
          g.set(normalChars, REST_NORMAL);
          g.set(hoverChars, REST_HOVER);

          const roll = (
            chars: Element[],
            from: { yPercent: number; scale: number },
            to: { yPercent: number; scale: number }
          ) =>
            g.fromTo(chars, from, {
              ...to,
              duration: 0.36,
              ease: "power1.out",
              stagger: { each: 0.02, from: "start" },
              overwrite: "auto",
            });

          const onEnter = () => {
            roll(normalChars, REST_NORMAL, { yPercent: -100, scale: 0.4 });
            roll(hoverChars, REST_HOVER, { yPercent: -100, scale: 1 });
          };
          const onLeave = () => {
            // `reverseFlipEase`: the timeline runs backwards with a mirrored
            // ease, which lands both layers exactly on their from-values.
            roll(normalChars, { yPercent: -100, scale: 0.4 }, REST_NORMAL);
            roll(hoverChars, { yPercent: -100, scale: 1 }, REST_HOVER);
          };
          button.addEventListener("mouseenter", onEnter);
          button.addEventListener("mouseleave", onLeave);
          track(() => {
            button.removeEventListener("mouseenter", onEnter);
            button.removeEventListener("mouseleave", onLeave);
          });
        }
      }

      /* ================================================================ *
       * 5. i-34e05c93 / t-7b5113cd — button label roll + arrow rotation
       * ================================================================ */
      {
        const splits = new WeakMap<Element, InstanceType<typeof SplitText>>();
        for (const button of $(".button")) {
          const label = $1<HTMLElement>(".button-normal-text", button);
          if (!label) continue;
          let s = splits.get(label);
          if (!s) {
            s = splitText(label);
            splits.set(label, s);
          }
          const icons = $<HTMLElement>("[button-icon-anin-one]", button);
          const iconsTwo = $<HTMLElement>("[button-icon-anin-two]", button);

          // Webflow's engine writes the timeline's start state at registration.
          g.set(s.chars, { yPercent: 0 });
          g.set([...icons, ...iconsTwo], { x: 0, y: 0, rotation: 0 });

          /**
           * The reference timeline drives `.button-normal-text` with two
           * `fromTo` actions on the same channel, both at position 0:
           *
           *   y ["0%",  "-100%"]   duration 0.25  stagger each 0.018
           *   y ["100%", "0%"]     duration 0.25  stagger each 0.018
           *
           * GSAP renders same-position children in insertion order, so the second
           * action wins every frame and the net effect is the label rolling *up*
           * out of a position one line-height below its slot — a peak of ~100% of
           * its height, then settled at rest.
           *
           * This was previously built as two `to()` tweens, which drops the
           * `from` values. Both tweens then ran 0 -> 0 and the label barely
           * moved: measured against the reference, characters peaked 1-3px in the
           * clone where the reference reached a full 100% (21-24px). The
           * `fromTo` form is what carries the second action's `from: 100%`.
           *
           * The stagger is per-label: each `.button` gets its own sequence, so
           * every button on the page rolls when hovered.
           */
          const roll = g.timeline({ paused: true });
          const ROLL = {
            duration: 0.25,
            ease: "power1.out",
            stagger: { each: 0.018, from: "start" },
            /**
             * The second action's from-state must not be written when the
             * timeline is built. GSAP renders a `fromTo` immediately by default,
             * which parks every button label at `translate(0%, 100%)` — one
             * line-height below its slot, clipped by the label's
             * `overflow: hidden` wrapper, i.e. invisible on page load.
             *
             * The reference's engine never writes it either: its `fromTo`
             * actions leave `immediateRender` unset, so the from-state is applied
             * when the hover first plays. Measured against the reference, the
             * clone's resting labels sat at +100% while the reference's sat at 0
             * and only reached ~+92% mid-hover.
             */
            immediateRender: false,
          } as const;
          roll
            .fromTo(s.chars, { yPercent: 0 }, { yPercent: -100, ...ROLL }, 0)
            .fromTo(s.chars, { yPercent: 100 }, { yPercent: 0, ...ROLL }, 0);
          tweens.push(roll);

          const onEnter = () => {
            roll.play(0);
            icons.forEach((i) =>
              g.to(i, { rotation: 45, duration: 0.25, ease: "power1.out" })
            );
            iconsTwo.forEach((i) =>
              g.to(i, { rotation: -45, duration: 0.25, ease: "power1.out" })
            );
          };
          const onLeave = () => {
            // `reverseFlipEase` control: the timeline is re-primed at rest.
            roll.pause(0);
            g.set(s.chars, { yPercent: 0 });
            icons.forEach((i) =>
              g.to(i, { rotation: 0, duration: 0.25, ease: "power1.out" })
            );
            iconsTwo.forEach((i) =>
              g.to(i, { rotation: 0, duration: 0.25, ease: "power1.out" })
            );
          };
          button.addEventListener("mouseenter", onEnter);
          button.addEventListener("mouseleave", onLeave);
          track(() => {
            button.removeEventListener("mouseenter", onEnter);
            button.removeEventListener("mouseleave", onLeave);
          });
        }
      }

      /* ================================================================ *
       * 6. FAQ / accordion toggles
       *    i-e07f66d1 (faq-*) and i-7c519911 (accordion-item-*)
       * ================================================================ */
      for (const trigger of $(".faq-toggle, [accordion-item-title]")) {
        const scope = trigger.parentElement ?? document;
        const content =
          $1<HTMLElement>(".faq-toggle-content", scope) ??
          $1<HTMLElement>(".accordion-item-body-wrapper", scope);
        const icon =
          $1<HTMLElement>(".faq-item-icon", trigger) ??
          $1<HTMLElement>(".accordion-item-title-icon", trigger);
        if (!content) continue;
        let open = false;
        const onClick = () => {
          open = !open;
          if (open) {
            g.to(content, { height: "auto", duration: 0.35, ease: "power1.out" });
            if (icon)
              g.to(icon, { rotation: 225, duration: 0.35, ease: "power1.out" });
          } else {
            g.to(content, { height: 0, duration: 0.35, ease: "power2.inOut" });
            if (icon)
              g.to(icon, { rotation: 0, duration: 0.35, ease: "power1.out" });
          }
        };
        trigger.addEventListener("click", onClick);
        track(() => trigger.removeEventListener("click", onClick));
      }

      /* ================================================================ *
       * 7. `.w-slider` — services, process and promotional sliders
       * ================================================================ */
      let sliderIndex = 0;
      for (const slider of $<HTMLElement>(".w-slider")) {
        sliderIndex += 1;
        const mask = $1<HTMLElement>(".w-slider-mask", slider);
        if (!mask) continue;
        const slides = $<HTMLElement>(".w-slide", mask);
        if (!slides.length) continue;

        slider.setAttribute("role", "region");
        slider.setAttribute("aria-label", "carousel");
        mask.id = `w-slider-mask-${sliderIndex - 1}`;
        // Webflow's slider runtime appends this screen-reader live region to
        // every mask; it is part of the reference DOM.
        const ariaLabel = document.createElement("div");
        ariaLabel.setAttribute("aria-live", "off");
        ariaLabel.setAttribute("aria-atomic", "true");
        ariaLabel.className = "w-slider-aria-label";
        ariaLabel.setAttribute("data-wf-ignore", "");
        mask.appendChild(ariaLabel);

        const duration = Number(slider.dataset.duration ?? 500);
        const easing = easingFor(slider.dataset.easing);
        const navSpacing = Number(slider.dataset.navSpacing ?? 3);
        const autoplay = slider.dataset.autoplay === "true";
        const autoplayLimit = Number(slider.dataset.autoplayLimit ?? 0);
        const delay = Number(slider.dataset.delay ?? 0);
        const infinite = slider.dataset.infinite === "true";
        const disableSwipe = slider.dataset.disableSwipe === "true";
        const hideArrows = slider.dataset.hideArrows === "true";

        const nav = $1<HTMLElement>(".w-slider-nav", slider);
        const left = $1<HTMLElement>(".w-slider-arrow-left", slider);
        const right = $1<HTMLElement>(".w-slider-arrow-right", slider);

        let index = 0;
        let animating = false;

        const stride = () => {
          const first = slides[0];
          if (!first) return 0;
          const style = getComputedStyle(first);
          const gap =
            (parseFloat(style.marginRight) || 0) +
            (parseFloat(style.marginLeft) || 0);
          return first.getBoundingClientRect().width + gap;
        };

        const apply = (withTransition: boolean) => {
          const offset = stride() * index;
          for (const slide of slides) {
            slide.style.transition = withTransition
              ? `all, transform ${duration}ms ${easing}`
              : "all";
            slide.style.transform = `translateX(${-offset}px)`;
            slide.style.opacity = "1";
          }
          if (ariaLabel) {
            ariaLabel.textContent = `Slide ${index + 1} of ${slides.length}.`;
          }
          if (nav) {
            Array.from(nav.children).forEach((dot, i) => {
              dot.classList.toggle("w-active", i === index);
              dot.setAttribute("aria-pressed", i === index ? "true" : "false");
            });
          }
        };

        const goTo = (next: number) => {
          const target = infinite
            ? (next + slides.length) % slides.length
            : Math.max(0, Math.min(slides.length - 1, next));
          if (target === index) return;
          index = target;
          apply(true);
          animating = true;
          window.setTimeout(() => {
            animating = false;
          }, duration);
        };

        // Nav dots, generated the way Webflow does.
        if (nav) {
          const numeric = nav.classList.contains("w-num");
          nav.textContent = "";
          slides.forEach((_, i) => {
            const dot = document.createElement("div");
            dot.className = "w-slider-dot";
            if (numeric) dot.textContent = String(i + 1);
            dot.setAttribute("data-wf-ignore", "");
            dot.setAttribute("aria-label", `Show slide ${i + 1} of ${slides.length}`);
            dot.setAttribute("aria-pressed", i === 0 ? "true" : "false");
            dot.setAttribute("role", "button");
            dot.setAttribute("tabindex", "-1");
            dot.style.marginLeft = `${navSpacing}px`;
            dot.style.marginRight = `${navSpacing}px`;
            dot.addEventListener("click", () => goTo(i));
            nav.appendChild(dot);
          });
        }

        if (hideArrows) {
          [left, right].forEach((el) => {
            if (el) el.style.display = "none";
          });
        }

        apply(false);

        left?.addEventListener("click", () => goTo(index - 1));
        right?.addEventListener("click", () => goTo(index + 1));
        track(() => {
          left?.removeEventListener("click", () => goTo(index - 1));
          right?.removeEventListener("click", () => goTo(index + 1));
        });

        // Swipe / drag, matching `data-disable-swipe="false"`.
        if (!disableSwipe) {
          let startX = 0;
          let dragging = false;
          const onDown = (e: PointerEvent) => {
            if (animating) return;
            dragging = true;
            startX = e.clientX;
          };
          const onUp = (e: PointerEvent) => {
            if (!dragging) return;
            dragging = false;
            const delta = e.clientX - startX;
            if (Math.abs(delta) > 40) goTo(index + (delta < 0 ? 1 : -1));
          };
          slider.addEventListener("pointerdown", onDown);
          slider.addEventListener("pointerup", onUp);
          track(() => {
            slider.removeEventListener("pointerdown", onDown);
            slider.removeEventListener("pointerup", onUp);
          });
        }

        if (autoplay) {
          let ticks = 0;
          const timer = window.setInterval(() => {
            if (autoplayLimit && ticks >= autoplayLimit) {
              window.clearInterval(timer);
              return;
            }
            ticks += 1;
            goTo(index + 1);
          }, Math.max(delay, 0.1) * 1000);
          track(() => window.clearInterval(timer));
        }

        const onResize = () => apply(false);
        window.addEventListener("resize", onResize);
        track(() => window.removeEventListener("resize", onResize));
      }

      /* ================================================================ *
       * 8. `.w-background-video` play/pause control
       * ================================================================ */
      for (const wrap of $<HTMLElement>(".w-background-video")) {
        const video = $1<HTMLVideoElement>("video", wrap);
        const button = $1<HTMLButtonElement>(
          ".w-backgroundvideo-backgroundvideoplaypausebutton",
          wrap
        );
        if (!video || !button) continue;
        const playState = $1<HTMLElement>(".play-state", button);
        const pauseState = $1<HTMLElement>(".pause-state", button);
        const sync = () => {
          const playing = !video.paused;
          if (playState) playState.hidden = !playing;
          if (pauseState) pauseState.hidden = playing;
        };
        const onClick = () => {
          if (video.paused) void video.play();
          else video.pause();
          sync();
        };
        button.addEventListener("click", onClick);
        video.addEventListener("play", sync);
        video.addEventListener("pause", sync);
        if (wrap.dataset.autoplay === "true") void video.play().catch(() => {});
        sync();
        track(() => {
          button.removeEventListener("click", onClick);
          video.removeEventListener("play", sync);
          video.removeEventListener("pause", sync);
        });
      }

      /* ================================================================ *
       * 9. wf:load timelines — ambient loops
       * ================================================================ */
      const loop = (
        selector: string,
        from: gsap.TweenVars,
        to: gsap.TweenVars & { duration: number }
      ) => {
        const targets = $(selector);
        if (!targets.length) return;
        tweens.push(g.fromTo(targets, from, { ...to, repeat: -1, ease: "none" }));
      };

      // t-b6a25db9 — services slide decorations
      loop("[contain-left-move-child='ture']", { y: 0 }, { y: 40, duration: 4, yoyo: true });
      loop("[contain-right-move-child='ture']", { y: 0 }, { y: -40, duration: 4, yoyo: true });
      loop("[love-child='ture']", { scale: 0.8 }, { scale: 1, duration: 1.8, yoyo: true });
      loop("[text-box-child='ture']", { rotation: 7 }, { rotation: 0, duration: 4, yoyo: true });

      // t-0e4da051 — brands marquee
      loop("[marku-slide='ture']", { xPercent: 0 }, { xPercent: -100, duration: 18 });

      // t-0552a309 / t-ece8992f / t-54083a40 — section label icons
      loop(
        "[move-opacty='ture']",
        { opacity: 1, scale: 1 },
        { opacity: 0, scale: 0.5, duration: 2, yoyo: true }
      );
      loop(
        "[group-fast-move='ture']",
        { scale: 0.7 },
        { scale: 1, duration: 3, yoyo: true }
      );
      loop(
        "[group-secend-move='ture']",
        { scale: 1 },
        { scale: 0.7, duration: 3, yoyo: true }
      );

      // t-41c4b10c — hero image float
      loop(".agency-hero-image-wrap.one", { rotation: 0 }, { rotation: 20, duration: 3, yoyo: true });
      loop(".agency-hero-image-wrap.two", { y: 0 }, { y: -20, duration: 3, yoyo: true });

      // t-b1014af3 — hero intro background ring
      loop(".hero-intro-meddle-bg-image", { rotation: -360 }, { rotation: 0, duration: 4 });

      // t-79a8569c — meet section badges
      loop("[zome-in-zom-out='ture']", { scale: 0.8 }, { scale: 1.1, duration: 1.5, yoyo: true });

      // t-10e0cf06 — meet section side icons
      loop("[move-left-right='ture']", { x: 0 }, { x: 40, duration: 3, yoyo: true });

      /* ================================================================ *
       * 10. t-70ca57e5 — page intro reveal
       * ================================================================ */
      {
        const tl = g.timeline({ delay: 0.05 });
        tweens.push(tl);

        const fromTo = (
          targets: Element[],
          from: gsap.TweenVars,
          to: gsap.TweenVars,
          at: number
        ) => {
          if (!targets.length) return;
          tl.fromTo(targets, from, to, at);
        };

        fromTo(
          $(".agency-hero-text-wrap"),
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.45, ease: "power1.out" },
          0
        );
        fromTo(
          $(".agency-dectlies-wrap"),
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.45, ease: "power1.out" },
          0.16
        );
        fromTo(
          $(".hero-intro-section"),
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.45, ease: "power1.out" },
          0.26
        );
        fromTo(
          $('#a60822b7-681c-457d-a15c-849d10517aee'),
          { scale: 0.5, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, ease: "power1.out" },
          0.36
        );
        fromTo(
          $('#e7772b2d-210f-27fe-e69f-61db8be74d89'),
          { scale: 0.5, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, ease: "power1.out" },
          0.36
        );
        fromTo(
          $(".bg-image-left-wrap"),
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.51,
            ease: "power1.out",
            transformOrigin: "0% 100%",
          },
          0.4
        );
        fromTo(
          $(".bg-image-right-wrap"),
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.51,
            ease: "power1.out",
            transformOrigin: "100% 0%",
          },
          0.4
        );
      }

      /* ================================================================ *
       * 11. Scroll-into-view reveals
       *     scrollTriggerConfig: start "top 92%" unless noted,
       *     enter "play", leave/enterBack/leaveBack "none" (play once).
       * ================================================================ */
      const reveal = (
        selector: string,
        from: gsap.TweenVars,
        to: gsap.TweenVars,
        start = "top 92%"
      ) => {
        const targets = $(selector);
        if (!targets.length) return;
        g.set(targets, from);
        // batch() gives every element its own ScrollTrigger, which is what
        // Webflow's per-element `wf:scroll` bindings do.
        ST.batch(targets, {
          start,
          once: true,
          onEnter: (batch) =>
            g.to(batch, {
              ...to,
              stagger: { each: 0.08, from: "start" },
              overwrite: "auto",
            }),
        });
      };

      // i-6994eb39
      reveal("[group-fedup-move='ture']", { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 });
      // i-179b06d0
      reveal("[fade='true']", { opacity: 0 }, { opacity: 1, duration: 0.45 });
      // i-372c70f6
      reveal("[fade-up='true']", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.45 });
      // i-7963fecb
      reveal(
        "[origin-fade-up='true']",
        { opacity: 0, scale: 0, transformOrigin: "100% 0%" },
        { opacity: 1, scale: 1, duration: 0.51 }
      );

      /* ================================================================ *
       * 12. Breakpoint-scoped scroll behaviour
       * ================================================================ */
      const mm = g.matchMedia();

      // i-612af6c6 — dont-animate on the `main` breakpoint
      mm.add("(max-width: 991px)", () => {
        reveal("[group-fedup-phone='ture']", { y: 100 }, { y: 0, duration: 0.7 }, "top bottom");
      });

      /* ================================================================ *
       * 12b. i-edb34fd9 / t-47bfa973 — sticky creators convergence
       *      start "top top", end "bottom bottom", scrub 0.8,
       *      dont-animate below `main`.
       * ================================================================ */
      mm.add("(min-width: 992px)", () => {
        const section = $1<HTMLElement>(".our-creators-section");
        if (!section) return;
        const tl = g.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        tweens.push(tl);
        // Webflow's engine applies its default `power1.out` easing to timeline
        // tweens that declare none.
        const ease = "power1.out";
        tl.fromTo($(".box-one", section), { x: 500, y: 200 }, { x: 100, y: 0, ease, duration: 1 }, 0)
          .fromTo($(".box-two", section), { x: -500, y: 200 }, { x: -100, y: 0, ease, duration: 1 }, 0)
          .fromTo($(".box-three", section), { x: 450, y: -200 }, { x: 200, y: 0, ease, duration: 1 }, 0)
          .fromTo($(".box-four", section), { x: -500, y: -150 }, { x: -200, y: 0, ease, duration: 1 }, 0);
      });

      /* ================================================================ *
       * 13. i-80217074 / t-5bfbc4bc — capabilities title stack
       *     scrollTriggerConfig: start "top bottom", end "bottom top", clamp.
       * ================================================================ */
      {
        const OFFSETS: Record<string, number> = {
          "item-one": -100,
          "item-two": -100,
          "item-three": -150,
          "item-four": -230,
          "item-five": -230,
        };
        for (const box of $("[move-scroll-card-box='ture']")) {
          const tl = g.timeline({
            scrollTrigger: {
              trigger: box,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
          tweens.push(tl);
          for (const item of $<HTMLElement>(".text-title-box", box)) {
            const key = [...item.classList].find((c) => OFFSETS[c]);
            if (!key) continue;
            tl.fromTo(
              item,
              { y: OFFSETS[key] },
              { y: 0, ease: "power1.out", duration: 1 },
              0
            );
          }
        }
      }

      /* ================================================================ *
       * 14. Hover states
       *     i-230919d6 (card image zoom) and i-07015591 (hover child scale)
       * ================================================================ */
      const hoverScale = (
        selector: string,
        scale: number,
        hostSelector: string
      ) => {
        for (const el of $(selector)) {
          const host = el.closest(hostSelector);
          if (!host) continue;
          const onEnter = () =>
            g.to(el, { scale, duration: 0.6, ease: "power1.out", overwrite: "auto" });
          const onLeave = () =>
            g.to(el, { scale: 1, duration: 0.6, ease: "power1.out", overwrite: "auto" });
          host.addEventListener("mouseenter", onEnter);
          host.addEventListener("mouseleave", onLeave);
          track(() => {
            host.removeEventListener("mouseenter", onEnter);
            host.removeEventListener("mouseleave", onLeave);
          });
        }
      };
      hoverScale(
        "[card-image-hover-child='ture']",
        1.15,
        "[card-image-hover-priend]"
      );
      hoverScale("[hover-child='ture']", 0.8, "[hover-priend]");

      /* ================================================================ *
       * 15. i-8181fa36 / t-e78f85d1 — slider arrow press
       * ================================================================ */
      for (const el of $("[slider-click-btn='true']")) {
        const onDown = () =>
          g.to(el, { scale: 0.9, duration: 0.2, ease: "power1.out" });
        const onUp = () =>
          g.to(el, { scale: 1, duration: 0.2, ease: "power1.out" });
        el.addEventListener("click", onDown);
        el.addEventListener("mouseup", onUp);
        el.addEventListener("mouseleave", onUp);
        track(() => {
          el.removeEventListener("click", onDown);
          el.removeEventListener("mouseup", onUp);
          el.removeEventListener("mouseleave", onUp);
        });
      }

      /* ================================================================ *
       * 16. i-fef9e431 / t-d4136326 + t-b461b434 — cursor-tracked icon
       * ================================================================ */
      for (const trigger of $("[icon-btn-anim]")) {
        const icon = $1<HTMLElement>(".icon.icon-button-icon", trigger);
        if (!icon) continue;
        const onMove = (e: MouseEvent) => {
          const rect = trigger.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          g.to(icon, {
            x: g.utils.interpolate(-8, 8, px),
            y: g.utils.interpolate(-8, 8, py),
            duration: 1,
            ease: "power1.out",
            overwrite: "auto",
          });
        };
        const onLeave = () =>
          g.to(icon, { x: 0, y: 0, duration: 1, ease: "power1.out" });
        trigger.addEventListener("mousemove", onMove);
        trigger.addEventListener("mouseleave", onLeave);
        track(() => {
          trigger.removeEventListener("mousemove", onMove);
          trigger.removeEventListener("mouseleave", onLeave);
        });
      }

      /* ================================================================ *
       * 17. Footer newsletter form — demo-only submit handler
       * ================================================================ */
      for (const form of $<HTMLFormElement>(".w-form")) {
        const done = $1<HTMLElement>(
          ".w-form-done",
          form.parentElement ?? document
        );
        const onSubmit = (e: SubmitEvent) => {
          e.preventDefault();
          if (done) done.style.display = "block";
          form.style.display = "none";
        };
        form.addEventListener("submit", onSubmit);
        track(() => {
          form.removeEventListener("submit", onSubmit);
          form.style.removeProperty("display");
        });
      }

      /* ================================================================ *
       * 18. Webflow marketplace template bar (hover pop)
       * ================================================================ */
      for (const el of $(".template-buttons-wrapper > *")) {
        const onEnter = () =>
          g.to(el, { scale: 0.8, duration: 0.6, ease: "power1.out" });
        const onLeave = () =>
          g.to(el, { scale: 1, duration: 0.6, ease: "power1.out" });
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
        track(() => {
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
        });
      }

      ST.refresh();
      triggers.push(...ST.getAll());

      cleanup = () => {
        for (const fn of disposers) fn();
        for (const t of tweens) t.kill();
        for (const t of triggers) t.kill();
        mm.revert();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}

function easingFor(name?: string): string {
  switch (name) {
    case "ease-out-cubic":
      return "cubic-bezier(0.215, 0.61, 0.355, 1)";
    case "ease-in-cubic":
      return "cubic-bezier(0.55, 0.055, 0.675, 0.19)";
    case "ease-in-out-cubic":
      return "cubic-bezier(0.645, 0.045, 0.355, 1)";
    case "ease-out-quart":
      return "cubic-bezier(0.165, 0.84, 0.44, 1)";
    case "ease":
      return "ease";
    default:
      return "ease";
  }
}