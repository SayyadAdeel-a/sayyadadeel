import type { gsap as GSAP } from "gsap";

/**
 * The Webflow widget behaviour the cloned pages rely on, reimplemented from
 * what Webflow's own runtime does to the markup at DOMContentLoaded.
 *
 * Only the widgets actually present on the inner pages are covered: `w-tabs`
 * (/case-studies), `w-slider` (/about) and `w-form` (footer newsletter on every
 * page). The homepage's richer widgets stay in its own runtime.
 */

type Gsap = typeof GSAP;

export interface WidgetLayer {
  dispose(): void;
}

export interface WidgetOptions {
  gsap: Gsap;
  root?: Document;
}

/** Webflow's slider easing names -> CSS timing functions. */
function sliderEasing(name: string | undefined): string {
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
    default:
      return "ease";
  }
}

export function runWidgets({ root = document }: WidgetOptions): WidgetLayer {
  const disposers: (() => void)[] = [];
  const track = (fn: () => void) => {
    disposers.push(fn);
  };

  /* ---------------------------------------------------------------- *
   * w-tabs
   *
   * Webflow fades the incoming pane in and the outgoing one out, then drops
   * `w--tab-active` (which is what the stylesheet keys `display` off) and
   * clears the pane's inline transition. It does not touch `data-current`.
   * ---------------------------------------------------------------- */
  let tabsIndex = 0;
  for (const tabs of Array.from(
    root.querySelectorAll<HTMLElement>(".w-tabs")
  )) {
    const links = Array.from(tabs.querySelectorAll<HTMLElement>(".w-tab-link"));
    const panes = Array.from(tabs.querySelectorAll<HTMLElement>(".w-tab-pane"));
    // Webflow's tab runtime stamps ids of the form
    // `w-tabs-<set>-data-w-tab-<n>` / `w-tabs-<set>-data-w-pane-<n>`.
    links.forEach((link, i) => {
      link.id = `w-tabs-${tabsIndex}-data-w-tab-${i}`;
    });
    panes.forEach((pane, i) => {
      pane.id = `w-tabs-${tabsIndex}-data-w-pane-${i}`;
    });
    tabsIndex += 1;

    const durationIn = Number(tabs.dataset.durationIn ?? 300);
    const durationOut = Number(tabs.dataset.durationOut ?? 100);

    const show = (pane: HTMLElement) => {
      pane.style.transition = `all, opacity ${durationIn}ms`;
      pane.classList.add("w--tab-active");
      const frame = root.defaultView!.requestAnimationFrame(() => {
        pane.style.opacity = "1";
      });
      track(() => root.defaultView!.cancelAnimationFrame(frame));
    };

    const hide = (pane: HTMLElement) => {
      pane.style.transition = `all, opacity ${durationOut}ms`;
      pane.style.opacity = "0";
      const timer = root.defaultView!.setTimeout(() => {
        pane.classList.remove("w--tab-active");
        pane.style.transition = "";
        pane.style.opacity = "";
      }, durationOut);
      track(() => root.defaultView!.clearTimeout(timer));
    };

    const onClick = (event: Event) => {
      const link = event.currentTarget as HTMLElement;
      const value = link.dataset.wTab;
      if (!value || link.classList.contains("w--current")) return;
      event.preventDefault();
      for (const item of links) {
        item.classList.toggle("w--current", item.dataset.wTab === value);
      }
      for (const pane of panes) {
        if (pane.dataset.wTab === value) show(pane);
        else hide(pane);
      }
    };
    for (const link of links) link.addEventListener("click", onClick);
    track(() => {
      for (const link of links) link.removeEventListener("click", onClick);
    });
  }

  /* ---------------------------------------------------------------- *
   * w-slider
   * ---------------------------------------------------------------- */
  let sliderIndex = 0;
  for (const slider of Array.from(
    root.querySelectorAll<HTMLElement>(".w-slider")
  )) {
    const mask = slider.querySelector<HTMLElement>(".w-slider-mask");
    if (!mask) continue;
    const slides = Array.from(mask.querySelectorAll<HTMLElement>(".w-slide"));
    if (!slides.length) continue;

    slider.setAttribute("role", "region");
    slider.setAttribute("aria-label", "carousel");
    mask.id = `w-slider-mask-${sliderIndex}`;
    sliderIndex += 1;

    // Webflow's slider runtime appends this screen-reader live region to every
    // mask; it is part of the reference DOM.
    const ariaLabel = root.createElement("div");
    ariaLabel.setAttribute("aria-live", "off");
    ariaLabel.setAttribute("aria-atomic", "true");
    ariaLabel.className = "w-slider-aria-label";
    ariaLabel.setAttribute("data-wf-ignore", "");
    mask.appendChild(ariaLabel);

    const duration = Number(slider.dataset.duration ?? 500);
    const easing = sliderEasing(slider.dataset.easing);
    const navSpacing = Number(slider.dataset.navSpacing ?? 3);
    const autoplay = slider.dataset.autoplay === "true";
    const autoplayLimit = Number(slider.dataset.autoplayLimit ?? 0);
    const delay = Number(slider.dataset.delay ?? 0);
    const infinite = slider.dataset.infinite === "true";
    const disableSwipe = slider.dataset.disableSwipe === "true";
    const hideArrows = slider.dataset.hideArrows === "true";

    const nav = slider.querySelector<HTMLElement>(".w-slider-nav");
    const left = slider.querySelector<HTMLElement>(".w-slider-arrow-left");
    const right = slider.querySelector<HTMLElement>(".w-slider-arrow-right");

    let index = 0;
    let animating = false;

    const stride = () => {
      const first = slides[0];
      if (!first) return 0;
      const style = root.defaultView!.getComputedStyle(first);
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
      ariaLabel.textContent = `Slide ${index + 1} of ${slides.length}.`;
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
      root.defaultView!.setTimeout(() => {
        animating = false;
      }, duration);
    };

    if (nav) {
      const numeric = nav.classList.contains("w-num");
      nav.textContent = "";
      slides.forEach((_, i) => {
        const dot = root.createElement("div");
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
      for (const el of [left, right]) el?.style.setProperty("display", "none");
    }

    apply(false);

    const onLeft = () => goTo(index - 1);
    const onRight = () => goTo(index + 1);
    left?.addEventListener("click", onLeft);
    right?.addEventListener("click", onRight);
    track(() => {
      left?.removeEventListener("click", onLeft);
      right?.removeEventListener("click", onRight);
    });

    if (!disableSwipe) {
      let startX = 0;
      let dragging = false;
      const onDown = (event: Event) => {
        if (animating) return;
        dragging = true;
        startX = (event as PointerEvent).clientX;
      };
      const onUp = (event: Event) => {
        if (!dragging) return;
        dragging = false;
        const delta = (event as PointerEvent).clientX - startX;
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
      const timer = root.defaultView!.setInterval(() => {
        if (autoplayLimit && ticks >= autoplayLimit) {
          root.defaultView!.clearInterval(timer);
          return;
        }
        ticks += 1;
        goTo(index + 1);
      }, Math.max(delay, 0.1) * 1000);
      track(() => root.defaultView!.clearInterval(timer));
    }

    const onResize = () => apply(false);
    root.defaultView!.addEventListener("resize", onResize);
    track(() => root.defaultView!.removeEventListener("resize", onResize));
  }

  /* ---------------------------------------------------------------- *
   * w-background-video (only the homepage carries these; harmless here)
   * ---------------------------------------------------------------- */
  for (const wrap of Array.from(
    root.querySelectorAll<HTMLElement>(".w-background-video")
  )) {
    const video = wrap.querySelector<HTMLVideoElement>("video");
    const button = wrap.querySelector<HTMLButtonElement>(
      ".w-backgroundvideo-backgroundvideoplaypausebutton"
    );
    if (!video || !button) continue;
    const playState = button.querySelector<HTMLElement>(".play-state");
    const pauseState = button.querySelector<HTMLElement>(".pause-state");
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

  /* ---------------------------------------------------------------- *
   * w-form — demo-only submit handler.
   *
   * The reference hosts a real Webflow form endpoint; submitting from the
   * clone cannot reach it, so the observable end state is reproduced locally:
   * the <form> is hidden and the success message is shown, which is exactly
   * what Webflow's runtime does after a successful POST.
   * ---------------------------------------------------------------- */
  for (const wrapper of Array.from(
    root.querySelectorAll<HTMLElement>(".w-form")
  )) {
    const form = wrapper.querySelector<HTMLFormElement>("form");
    if (!form) continue;
    const done = (wrapper.parentElement ?? root).querySelector<HTMLElement>(
      ".w-form-done"
    );
    const onSubmit = (event: SubmitEvent) => {
      event.preventDefault();
      if (done) done.style.display = "block";
      form.style.display = "none";
    };
    form.addEventListener("submit", onSubmit);
    track(() => {
      form.removeEventListener("submit", onSubmit);
      form.style.removeProperty("display");
    });
  }

  return {
    dispose() {
      for (const fn of disposers) fn();
    },
  };
}