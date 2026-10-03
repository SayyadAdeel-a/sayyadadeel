import type { EaseObject } from "./types";

/**
 * Webflow's ease-index table, transcribed from the interaction engine bundle
 * (`EASING_NAMES` in `webflow.schunk.*.js`):
 *
 *   let h = ["none", "power1.in", "power1.out", "power1.inOut", ...]
 *
 * `timing.ease` in the payload is a numeric index into this table; object
 * easings are rendered to their GSAP equivalent by `convertEaseConfigToGSAP`.
 */
export const EASING_NAMES = [
  "none",
  "power1.in",
  "power1.out",
  "power1.inOut",
  "power2.in",
  "power2.out",
  "power2.inOut",
  "power3.in",
  "power3.out",
  "power3.inOut",
  "power4.in",
  "power4.out",
  "power4.inOut",
  "back.in",
  "back.out",
  "back.inOut",
  "bounce.in",
  "bounce.out",
  "bounce.inOut",
  "circ.in",
  "circ.out",
  "circ.inOut",
  "elastic.in",
  "elastic.out",
  "elastic.inOut",
  "expo.in",
  "expo.out",
  "expo.inOut",
  "sine.in",
  "sine.out",
  "sine.inOut",
] as const;

/** Port of Webflow's `convertEaseConfigToGSAP`. */
export function convertEaseConfigToGSAP(
  ease: number | EaseObject | null | undefined
): string | null {
  if (ease === null || ease === undefined) return "none";
  if (typeof ease === "number") return EASING_NAMES[ease] ?? "none";
  switch (ease.type) {
    case "back":
      return `back.${ease.curve}(${ease.power})`;
    case "elastic":
      return `elastic.${ease.curve}(${ease.amplitude}, ${ease.period})`;
    case "steps":
      return `steps(${ease.stepCount})`;
    case "slowMo":
      return `slow(${ease.linearRatio}, ${ease.power}, ${ease.yoyoMode})`;
    case "expoScale":
      return `expoScale(${ease.startingScale}, ${ease.endingScale}, ${ease.templateCurve})`;
    // CustomEase-based easings need plugins the site never registers; Webflow's
    // own fallback for them is "none" too.
    case "rough":
    case "customWiggle":
    case "customBounce":
    case "customEase":
    default:
      return "none";
  }
}

/**
 * Webflow's breakpoint media queries, verbatim from
 * `ConditionalPlaybackManager` in the engine bundle.
 */
export const BREAKPOINT_QUERIES: Record<string, string> = {
  tiny: "(max-width: 479px) and (min-width: 0px)",
  small: "(max-width: 767px) and (min-width: 480px)",
  medium: "(max-width: 991px) and (min-width: 768px)",
  main: "(min-width: 992px)",
};

/** `DEFAULTS.DURATION` from the engine's constants module. */
export const DEFAULT_DURATION = 0.5;

/** `toSeconds` — Webflow accepts either a number of seconds or a "ms" string. */
export function toSeconds(value: number | string | undefined | null): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.endsWith("ms")) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n / 1000 : undefined;
  }
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}