import type { gsap as GSAP } from "gsap";
import type ScrollTriggerType from "gsap/ScrollTrigger";

import {
  BREAKPOINT_QUERIES,
  DEFAULT_DURATION,
  convertEaseConfigToGSAP,
  toSeconds,
} from "./ease";
import {
  CONTROL_TYPE,
  RELATIONSHIP,
  TWEEN_TYPE,
  type ChannelPair,
  type IxAction,
  type IxInteraction,
  type IxPayload,
  type IxTarget,
  type IxTimeline,
  type IxTrigger,
  type StaggerConfig,
} from "./types";

/** Structural aliases so this module does not depend on gsap's own types. */
type Gsap = typeof GSAP;
type ScrollTrigger = typeof ScrollTriggerType;

/** The subset of GSAP's SplitText this runtime uses. */
export interface SplitTextInstance {
  chars: Element[];
  lines: Element[];
  words: Element[];
  masks: Element[];
  revert(): void;
}

export interface SplitTextLike {
  new (
    target: Element | string | Element[],
    vars?: Record<string, unknown>
  ): SplitTextInstance;
}

export interface IxRuntime {
  dispose(): void;
}

export interface RunIxOptions {
  gsap: Gsap;
  ScrollTrigger: ScrollTrigger;
  SplitText: SplitTextLike;
  payload: IxPayload;
  /** Root the engine searches; defaults to `document`. */
  root?: Document;
}

/* ------------------------------------------------------------------ *
 * Selector resolution
 * ------------------------------------------------------------------ */

/**
 * Webflow encodes a class list as an array of fragments that are already
 * partial selectors (`["icon.icon-button-icon"]`, `["box-one"]`), so the array
 * is concatenated and any fragment that is not already a selector gets a
 * leading `.`. `wf:attribute` and `wf:selector` carry a bare selector string
 * instead, which arrives either as that string or as a single-element array.
 */
function selectorFor(value: string[] | string): string {
  const fragments = Array.isArray(value) ? value : [value];
  return fragments
    .map((fragment) => {
      const trimmed = String(fragment).trim();
      if (!trimmed) return "";
      return /^[.#[]/.test(trimmed) ? trimmed : `.${trimmed}`;
    })
    .join("");
}

/** The raw selector a target kind carries, as a string. */
function rawSelectorFor(value: string[] | string): string {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function queryAll(selector: string, scope: ParentNode): Element[] {
  if (!selector) return [];
  try {
    return Array.from(scope.querySelectorAll(selector));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Transform channels
 * ------------------------------------------------------------------ */

/**
 * Webflow transform channel -> GSAP property. Channels GSAP already exposes
 * under the same name pass straight through; values keep their original form
 * because GSAP understands `"-100%"`, `"225deg"`, `"auto"` and plain numbers.
 */
const CHANNEL_ALIASES: Record<string, string> = {
  x: "x",
  y: "y",
  xPercent: "xPercent",
  yPercent: "yPercent",
  z: "z",
  rotation: "rotation",
  rotationX: "rotationX",
  rotationY: "rotationY",
  rotationZ: "rotationZ",
  skewX: "skewX",
  skewY: "skewY",
  scale: "scale",
  scaleX: "scaleX",
  scaleY: "scaleY",
  opacity: "opacity",
  transformOrigin: "transformOrigin",
  display: "display",
  height: "height",
  width: "width",
  zIndex: "zIndex",
  backgroundColor: "backgroundColor",
  color: "color",
  filter: "filter",
  fontSize: "fontSize",
  letterSpacing: "letterSpacing",
  lineHeight: "lineHeight",
  padding: "padding",
  borderRadius: "borderRadius",
};

/**
 * Webflow treats a value as "special" (and leaves it untouched) when it is a
 * function or a relative/random expression such as `"+=10"`.
 */
function isSpecialValue(value: unknown): boolean {
  if (typeof value === "function") return true;
  if (typeof value !== "string") return false;
  return (
    value.startsWith("+=") ||
    value.startsWith("-=") ||
    value.startsWith("random(")
  );
}

/**
 * Port of the engine's `transform` action `createTweenConfig`. A channel is
 * `[from, to]`, either side of which may be `null` ("not specified"). Only
 * `opacity`/`autoAlpha` and `xPercent`/`yPercent` are normalised — everything
 * else is handed to GSAP verbatim, because GSAP already understands values
 * like `"-100%"`, `"225deg"` and `"auto"`.
 */
function toVars(
  props: Record<string, unknown> | undefined
): { from: Record<string, unknown>; to: Record<string, unknown> } {
  const from: Record<string, unknown> = {};
  const to: Record<string, unknown> = {};
  if (!props) return { from, to };

  const percentOfHundred = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;
    if (typeof value !== "string" || isSpecialValue(value)) return value;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed / 100 : value;
  };
  const plainNumber = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;
    if (typeof value !== "string" || isSpecialValue(value)) return value;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : value;
  };

  for (const [channel, pair] of Object.entries(props)) {
    const key = CHANNEL_ALIASES[channel] ?? channel;
    const isPair = Array.isArray(pair);
    let toValue: unknown = isPair ? (pair as ChannelPair)[1] : pair;
    let fromValue: unknown = isPair ? (pair as ChannelPair)[0] : undefined;

    if (key === "opacity" || key === "autoAlpha") {
      toValue = percentOfHundred(toValue);
      fromValue = percentOfHundred(fromValue);
    } else if (key === "xPercent" || key === "yPercent") {
      toValue = plainNumber(toValue);
      fromValue = plainNumber(fromValue);
    } else if (key === "transformOrigin") {
      // A bare string is the origin itself; an array pins one side of the pair.
      if (!isPair) {
        fromValue = toValue;
      } else if (typeof fromValue === "string") {
        toValue = fromValue;
      } else if (typeof toValue === "string") {
        fromValue = toValue;
      }
    }

    if (toValue !== null && toValue !== undefined) to[key] = toValue;
    if (fromValue !== null && fromValue !== undefined) from[key] = fromValue;
  }
  return { from, to };
}

const numeric = (value: unknown): number =>
  typeof value === "number" ? value : parseFloat(String(value)) || 0;

/* ------------------------------------------------------------------ *
 * Runtime
 * ------------------------------------------------------------------ */

export function runInteractions({
  gsap: g,
  ScrollTrigger: ST,
  SplitText,
  payload,
  root = document,
}: RunIxOptions): IxRuntime {
  const disposers: (() => void)[] = [];
  const track = (fn: () => void) => {
    disposers.push(fn);
  };
  const timelines: gsap.core.Animation[] = [];
  const scrollTriggers: ScrollTriggerType[] = [];
  const matchMedias: gsap.MatchMedia[] = [];

  const timelineById = new Map<string, IxTimeline>(
    (payload.timelines ?? []).map((t) => [t.id, t])
  );

  /** SplitText instances, keyed by the element that was split. */
  const splits = new Map<Element, SplitTextInstance>();

  function resolveTarget(target: IxTarget, trigger: Element | null): Element[] {
    const [kind, rawValue, meta] = target;
    if (kind === "wf:trigger-only") return trigger ? [trigger] : [];
    if (kind === "wf:body") return root.body ? [root.body] : [];

    const relationship = meta?.relationship ?? RELATIONSHIP.NONE;
    const scope: ParentNode =
      relationship === RELATIONSHIP.WITHIN && trigger ? trigger : root;

    let selector: string;
    if (kind === "wf:class") {
      selector = selectorFor(rawValue as string[]);
    } else if (kind === "wf:attribute" || kind === "wf:selector") {
      selector = rawSelectorFor(rawValue as string[] | string);
    } else if (kind === "wf:inst" || kind === "wf:id") {
      // An "instance" target names Webflow's own node ids. Nodes that carry a
      // DOM id are found by it; the rest are matched through the
      // `data-wf-target` attribute Webflow stamps onto them, whose value
      // embeds the same id list — the same mechanism the reference's critical
      // stylesheet uses to hide IX-driven elements before it initialises.
      const ids = (Array.isArray(rawValue) ? rawValue : [rawValue]).map(
        (id) => String(id)
      );
      const quoted = ids.map((id) => JSON.stringify(id)).join(",");
      const parts: string[] = [];
      if (ids.length === 1) parts.push(`#${CSS.escape(ids[0])}`);
      parts.push(`[data-wf-target*='${quoted}']`);
      selector = parts.join(",");
    } else {
      return [];
    }

    const found = queryAll(selector, scope);
    if (!found.length) return [];
    return meta?.firstMatchOnly ? [found[0]] : found;
  }

  function resolveTargets(action: IxAction, trigger: Element | null): Element[] {
    const out: Element[] = [];
    for (const target of action.targets ?? []) {
      out.push(...resolveTarget(target, trigger));
    }
    return out;
  }

  /**
   * Turn Webflow's `splitText` config into the sub-elements the tween animates,
   * **one group per split element**.
   *
   * `chars` always implies `words` — the engine adds word wrappers so characters
   * can be laid out and measured per word.
   *
   * The grouping is load-bearing, not cosmetic. Webflow builds one tween per
   * split element, so a `stagger` on a split-text action is applied *within each
   * element's own characters*, not across the union of every element the selector
   * matched. The `.button` hover is the case that matters: its target is
   * `.button-normal-text` document-wide with `stagger: { each: 0.018 }`, and the
   * page has ~500 split characters. Applied to the union that is a nine-second
   * cascade, so hovering any button past the first few animates nothing at all
   * for many seconds. The reference gives each label its own stagger sequence, so
   * every button on the page rolls when hovered. Measured against the reference,
   * the clone left characters 406-417 completely still where the reference moved
   * them a full 100% of their height.
   */
  function splitElements(elements: Element[], action: IxAction): Element[][] {
    const config = action.splitText;
    if (!config || config === "none" || typeof config !== "object") {
      // Not a split action: one group holding every target, so it still becomes
      // a single tween. Emitting one group per target here would replace one
      // tween over N targets with N tweens, which changes how a `stagger` is
      // distributed and was enough to leave a `[fade-up]` element revealed on
      // load at 390 on `/pricing` where the reference keeps it hidden.
      return [elements];
    }
    const type = config.type.split(",").includes("chars")
      ? "words,chars"
      : config.type;

    const groups: Element[][] = [];
    for (const element of elements) {
      if (element === root.body) continue;
      let instance = splits.get(element);
      if (!instance) {
        /**
         * Splitting an element that is not laid out — the off-canvas mobile nav
         * is `display: none` on a phone — has no meaningful output and, on some
         * builds, throws. One such element must not be allowed to abort the whole
         * runtime: `buildTimeline` runs inside the interaction loop, so an
         * uncaught throw here leaves every *later* interaction unbound and the
         * page quietly loses animations while still looking correct.
         */
        try {
          instance = new SplitText(element, {
            type,
            tag: "span",
            linesClass: "gsap_split_line++",
            wordsClass: "gsap_split_word++",
            charsClass: "gsap_split_letter++",
          });
        } catch {
          continue;
        }
        splits.set(element, instance);
        for (const node of [
          ...instance.lines,
          ...instance.words,
          ...instance.chars,
        ] as HTMLElement[]) {
          node.style.position = "relative";
          node.style.display = "inline-block";
        }
      }
      const produced =
        type === "words,chars"
          ? instance.chars
          : (instance as unknown as Record<string, Element[]>)[
              type.split(",")[0].trim()
            ] ?? [];
      if (produced.length) groups.push([...produced]);
    }
    return groups;
  }

  /** Webflow's stagger config, seconds-normalised. */
  function buildStagger(stagger: StaggerConfig | undefined) {
    if (!stagger) return null;
    const config: Record<string, unknown> = {};
    const amount = toSeconds(stagger.amount);
    const each = toSeconds(stagger.each);
    if (amount !== undefined) config.amount = amount;
    if (each !== undefined) config.each = each;
    if (stagger.from !== undefined) config.from = stagger.from;
    if (stagger.grid !== undefined) config.grid = stagger.grid;
    if (stagger.axis !== undefined) config.axis = stagger.axis;
    if (stagger.ease !== undefined) {
      const ease = convertEaseConfigToGSAP(stagger.ease);
      if (ease !== null) config.ease = ease;
    }
    return Object.keys(config).length ? config : null;
  }

  /**
   * Webflow computes a per-action `immediateRender` flag: when two actions in
   * the same timeline write the same property for the same target set, the
   * later ones must not render at build time, or they would fight over the
   * recorded start value. The engine only ever forces it to `false` — an
   * unflagged action keeps GSAP's own default, which is what keeps a `set()`
   * from applying itself before the menu is ever opened.
   */
  function immediateRenderFlags(def: IxTimeline) {
    const seen = new Map<string, Set<string>>();
    const flags = new Map<string, boolean>();
    for (const action of def.actions ?? []) {
      // Keyed per action: two actions of one timeline share a target key, and
      // only the later one is suppressed.
      const key = action.id ?? actionKey(action);
      const groupKey = actionKey(action);
      let channels = seen.get(groupKey);
      if (!channels) {
        channels = new Set<string>();
        seen.set(groupKey, channels);
      }
      let immediate = true;
      for (const props of Object.values(action.properties ?? {})) {
        for (const channel of Object.keys((props ?? {}) as object)) {
          if (channels.has(channel) && (action.tt ?? 0) !== TWEEN_TYPE.TO) {
            immediate = false;
          }
          channels.add(channel);
        }
      }
      flags.set(key, immediate);
    }
    return flags;
  }

  function actionKey(action: IxAction): string {
    return JSON.stringify([
      (action.targets ?? []).map((t) => [t[0], t[1], t[2]]),
      action.splitText ?? null,
    ]);
  }

  interface BuiltTimeline {
    timeline: gsap.core.Timeline;
    /** The trigger element this instance is bound to, when element-scoped. */
    trigger: Element | null;
  }

  function buildTimeline(
    def: IxTimeline,
    trigger: Element | null,
    flipEase: boolean
  ): BuiltTimeline | null {
    const settings = def.settings ?? {};
    const timeline = g.timeline({
      paused: true,
      repeat: settings.repeat ?? 0,
      yoyo: settings.yoyo ?? false,
    });
    const flags = immediateRenderFlags(def);
    let built = 0;

    for (const action of def.actions ?? []) {
      const props = action.properties?.["wf:transform"];
      if (!props) continue;

      const targets = resolveTargets(action, trigger);
      if (!targets.length) continue;
      // One group per split element; a non-split action is a single group.
      const groups = splitElements(targets, action);
      if (!groups.length) continue;

      const tt = action.tt ?? TWEEN_TYPE.TO;
      const timing = action.timing ?? {};
      const stagger = buildStagger(timing.stagger);
      let duration =
        tt === TWEEN_TYPE.SET
          ? undefined
          : (toSeconds(timing.duration) ?? DEFAULT_DURATION);
      if (stagger && !duration) duration = 0.001;

      const config: gsap.TweenVars = { force3D: true };
      if (flags.get(action.id ?? actionKey(action)) === false) {
        config.immediateRender = false;
      }
      if (duration !== undefined) config.duration = duration;
      if (timing.repeat !== null && timing.repeat !== undefined) {
        // A negative repeat is meaningless on a scrubbed timeline; the engine
        // clamps it to zero there.
        config.repeat =
          def.canvasDuration != null && timing.repeat < 0 ? 0 : timing.repeat;
      }
      const repeatDelay = toSeconds(timing.repeatDelay);
      if (repeatDelay !== undefined) config.repeatDelay = repeatDelay;
      if (timing.yoyo !== null && timing.yoyo !== undefined) {
        config.yoyo = timing.yoyo;
      }
      if (stagger) config.stagger = stagger as gsap.TweenVars["stagger"];
      if (timing.ease !== null && timing.ease !== undefined) {
        const ease = convertEaseConfigToGSAP(timing.ease);
        if (ease !== null) config.ease = ease;
      }
      if (flipEase) config.easeReverse = true;

      const { from, to } = toVars(props as Record<string, unknown>);
      const hasFrom = Object.keys(from).length > 0;
      const hasTo = Object.keys(to).length > 0;

      if (tt === TWEEN_TYPE.FROM && !hasFrom) continue;
      if (tt === TWEEN_TYPE.FROM_TO && !hasFrom && !hasTo) continue;
      if ((tt === TWEEN_TYPE.SET || tt === TWEEN_TYPE.TO) && !hasTo) continue;

      const position = toSeconds(timing.position) ?? 0;

      // Each group becomes its own tween so that a `stagger` restarts per
      // element rather than running once across every matched element. See
      // `splitElements`.
      for (const group of groups) {
        if (!group.length) continue;
        if (tt === TWEEN_TYPE.FROM) {
          timeline.from(group, { ...config, ...from }, position);
        } else if (tt === TWEEN_TYPE.FROM_TO) {
          timeline.fromTo(group, from, { ...config, ...to }, position);
        } else if (tt === TWEEN_TYPE.SET) {
          timeline.set(group, { ...config, ...to }, position);
        } else {
          timeline.to(group, { ...config, ...to }, position);
        }
        built += 1;
      }
    }

    if (!built) {
      timeline.kill();
      return null;
    }
    timelines.push(timeline);
    return { timeline, trigger };
  }

  /* ---------------------------------------------------------------- *
   * Controls
   * ---------------------------------------------------------------- */

  function applyControl(
    timeline: gsap.core.Timeline,
    control: string | undefined
  ) {
    switch (control) {
      case "reverse":
      case "reverseFlipEase":
        timeline.reverse();
        break;
      case "pause":
        timeline.pause();
        break;
      case "resume":
        timeline.resume();
        break;
      case "stop":
        timeline.pause(0);
        break;
      case "none":
        break;
      case "togglePlayReverse":
      case "togglePlayReverseFlipEase":
        // Webflow's `AnimationCoordinator.togglePlayReverse`, verbatim.
        if (timeline.progress() === 0) timeline.play();
        else if (timeline.progress() === 1) timeline.reverse();
        else if (timeline.reversed()) timeline.play();
        else timeline.reverse();
        break;
      case "play":
        timeline.play();
        break;
      case "restart":
      default:
        timeline.restart();
        break;
    }
  }

  /* ---------------------------------------------------------------- *
   * Triggers
   * ---------------------------------------------------------------- */

  const loadQueue: (() => void)[] = [];

  interface MouseChannel {
    role: string;
    property: "x" | "y";
    from: number;
    to: number;
    duration: number;
    ease: string;
    elements: Element[];
  }

  function bindContinuous(
    interaction: IxInteraction,
    trigger: IxTrigger,
    el: Element
  ) {
    const resting = trigger[1]?.pluginConfig?.restingState ?? { x: 50, y: 50 };
    const channels: MouseChannel[] = [];

    for (const id of interaction.timelineIds ?? []) {
      const def = timelineById.get(id);
      const action = def?.actions?.[0];
      const props = action?.properties?.["wf:transform"] as
        | Record<string, ChannelPair>
        | undefined;
      if (!action || !props) continue;
      const channel = Object.keys(props)[0];
      const pair = props[channel];
      const elements = resolveTargets(action, el);
      if (!pair || !elements.length) continue;
      channels.push({
        role: def?.triggerMetadata?.role ?? channel,
        property: channel === "y" ? "y" : "x",
        from: numeric(pair[0]),
        to: numeric(pair[1]),
        duration: toSeconds(action.timing?.duration) ?? DEFAULT_DURATION,
        ease: convertEaseConfigToGSAP(action.timing?.ease) ?? "none",
        elements,
      });
    }
    if (!channels.length) return;

    const restX = (resting.x ?? 50) / 100;
    const restY = (resting.y ?? 50) / 100;

    // The reference writes the resting position as an explicit transform, so
    // the icon starts at `translate(0, 0)` rather than at the channel's start
    // value.
    for (const channel of channels) {
      const ratio = channel.property === "y" ? restY : restX;
      g.set(channel.elements, {
        [channel.property]: g.utils.interpolate(
          channel.from,
          channel.to,
          ratio
        ),
      });
    }

    // The reference measures the pointer against the animated element rather than
    // against the trigger it listens on, and holds that box for the duration of
    // the hover, so a tracked icon stays locked to the pointer.
    let hoverBox: DOMRect | null = null;
    const measure = () => {
      const target = channels[0]?.elements[0] ?? el;
      const rect = target.getBoundingClientRect();
      hoverBox = rect.width && rect.height ? rect : el.getBoundingClientRect();
    };
    const applyRest = () => {
      for (const channel of channels) {
        const ratio = channel.property === "y" ? restY : restX;
        g.to(channel.elements, {
          [channel.property]: g.utils.interpolate(
            channel.from,
            channel.to,
            ratio
          ),
          duration: channel.duration,
          ease: channel.ease,
          overwrite: "auto",
        });
      }
    };

    const onEnter = () => {
      measure();
      applyRest();
    };

    const onMove = (event: Event) => {
      const pointer = event as MouseEvent;
      if (!hoverBox) measure();
      const box = hoverBox ?? el.getBoundingClientRect();
      if (!box.width || !box.height) return;
      for (const channel of channels) {
        const px = (pointer.clientX - box.left) / box.width;
        const py = (pointer.clientY - box.top) / box.height;
        const ratio = channel.property === "y" ? py : px;
        g.to(channel.elements, {
          [channel.property]: g.utils.interpolate(
            channel.from,
            channel.to,
            ratio
          ),
          duration: channel.duration,
          ease: channel.ease,
          overwrite: "auto",
        });
      }
    };
    const onLeave = () => {
      hoverBox = null;
      applyRest();
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    const onResize = () => {
      if (hoverBox) measure();
    };
    root.defaultView?.addEventListener("resize", onResize);
    track(() => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      root.defaultView?.removeEventListener("resize", onResize);
    });
  }

  function bindTrigger(
    interaction: IxInteraction,
    trigger: IxTrigger,
    built: BuiltTimeline,
    element: Element | null
  ) {
    const [name, config] = trigger;
    const timeline = built.timeline;
    const el = element;
    const control = config.control;

    switch (name) {
      case "wf:load":
        loadQueue.push(() => applyControl(timeline, control ?? "play"));
        break;

      case "wf:hover":
      case "wf:click": {
        const eventName =
          name === "wf:hover"
            ? config.pluginConfig?.type === "mouseleave"
              ? "mouseleave"
              : "mouseenter"
            : "click";
        const handler = () => applyControl(timeline, control ?? "restart");
        /**
         * A trigger with no bound element — one whose interaction is *not*
         * element-scoped — has to listen on **every** element it matches, not
         * just the first.
         *
         * `.button` is the case that matters. Its hover targets
         * `.button-normal-text` document-wide (`relationship: "none"`), so the
         * interaction is built once around a single shared timeline, and
         * resolving the trigger to one element left the listener on whichever
         * `.button` came first in the document. At 390 that first button is the
         * off-canvas mobile nav's — it has no bounding box at all — so hovering
         * any visible button did nothing: the label's characters never moved.
         * Measured against the reference, the hovered label reached a full 100%
         * of its height there and stayed at exactly 0 in the clone.
         *
         * Element-scoped interactions never reach this: they pass a bound
         * element and get one timeline per trigger element, which is what the
         * `relationship: "within"` actions need.
         */
        const target = trigger[2];
        const elements = el ? [el] : target ? resolveTarget(target, null) : [];
        for (const element of elements) {
          element.addEventListener(eventName, handler);
          track(() => element.removeEventListener(eventName, handler));
        }
        break;
      }

      case "wf:scroll": {
        if (!el) break;
        const st = config.scrollTriggerConfig ?? {};
        if (st.scrub !== null && st.scrub !== undefined) {
          // A scrubbed interaction is driven by scroll position rather than by
          // the enter/leave callbacks.
          scrollTriggers.push(
            ST.create({
              animation: timeline,
              trigger: el,
              start: st.start,
              end: st.end,
              scrub: st.scrub,
              invalidateOnRefresh: true,
            })
          );
          break;
        }
        const instance = ST.create({
          trigger: el,
          start: st.start,
          end: st.end,
          onEnter: () => applyControl(timeline, st.enter ?? "play"),
          onLeave: () => applyControl(timeline, st.leave ?? "none"),
          onEnterBack: () => applyControl(timeline, st.enterBack ?? "none"),
          onLeaveBack: () => applyControl(timeline, st.leaveBack ?? "none"),
        });
        scrollTriggers.push(instance);
        break;
      }

      default:
        break;
    }
  }

  /* ---------------------------------------------------------------- *
   * Interaction setup
   * ---------------------------------------------------------------- */

  /** All elements an interaction's triggers point at, for per-element binding. */
  function triggerElements(interaction: IxInteraction): Element[] {
    const out: Element[] = [];
    for (const trigger of interaction.triggers ?? []) {
      const target = trigger[2];
      if (target) out.push(...resolveTarget(target, null));
    }
    return out;
  }

  /**
   * The element a single trigger listens on. Element-scoped interactions bind
   * one timeline per trigger element, so the element they were built with wins;
   * otherwise the trigger's own target is resolved.
   */
  function triggerElementFor(
    trigger: IxTrigger,
    bound: Element | null
  ): Element | null {
    if (bound) return bound;
    const target = trigger[2];
    return target ? (resolveTarget(target, null)[0] ?? null) : null;
  }

  /** True when an action resolves its targets relative to a trigger element. */
  function isElementScoped(interaction: IxInteraction): boolean {
    return (interaction.timelineIds ?? []).some((id) =>
      (timelineById.get(id)?.actions ?? []).some((action) =>
        (action.targets ?? []).some((target) => {
          const meta = target[2];
          return (
            target[0] === "wf:trigger-only" ||
            (meta?.relationship !== undefined &&
              meta.relationship !== RELATIONSHIP.NONE) ||
            Boolean(meta?.filterBy)
          );
        })
      )
    );
  }

  function controlFlipsEase(interaction: IxInteraction): boolean {
    return (interaction.triggers ?? []).some(([, config]) => {
      const control = config.control;
      return (
        control === "reverseFlipEase" ||
        control === "togglePlayReverseFlipEase"
      );
    });
  }

  /**
   * `conditionalPlayback` evaluation, ported from
   * `ConditionalPlaybackManager.evaluateConditions`. A `dont-animate` match
   * does not skip the interaction — it makes the engine jump straight to the
   * end state.
   */
  function conditionalBehavior(
    interaction: IxInteraction,
    conditions: Record<string, boolean>
  ): string | null {
    const rules = interaction.conditionalPlayback;
    if (!rules?.length) return null;
    const matched = rules.filter((condition) => {
      if (condition.type === "prefers-reduced-motion") {
        return Boolean(conditions.prefersReduced);
      }
      if (condition.type === "breakpoint") {
        return (condition.breakpoints ?? []).some((bp) =>
          Boolean(conditions[`breakpoint_${bp}`])
        );
      }
      return false;
    });
    if (!matched.length) return null;
    const dontAnimate = matched.find((c) => c.behavior === "dont-animate");
    return dontAnimate ? "dont-animate" : (matched[0].behavior ?? null);
  }

  function setupInteraction(interaction: IxInteraction) {
    const flipEase = controlFlipsEase(interaction);
    const rules = interaction.conditionalPlayback;

    /** Build every timeline this interaction needs for one trigger element. */
    const buildFor = (triggerElement: Element | null, behavior: string | null) => {
      // A continuous (mouse-move) interaction is driven by its channel
      // timelines, not by playing them: building them would render their
      // start values instead of the resting position the reference shows.
      const continuousOnly = (interaction.triggers ?? []).every(
        (trigger) => trigger[1]?.controlType === CONTROL_TYPE.CONTINUOUS
      );

      const built: BuiltTimeline[] = [];
      if (!continuousOnly) {
        for (const id of interaction.timelineIds ?? []) {
          const def = timelineById.get(id);
          if (!def) continue;
          const result = buildTimeline(def, triggerElement, flipEase);
          if (!result) continue;
          built.push(result);
        }
      }
      if (behavior === "dont-animate") {
        for (const item of built) item.timeline.progress(1).pause();
        return;
      }
      if (continuousOnly) {
        for (const trigger of interaction.triggers ?? []) {
          const element = triggerElementFor(trigger, triggerElement);
          if (element) bindContinuous(interaction, trigger, element);
        }
        return;
      }
      // Every timeline of one interaction shares a trigger element, so the
      // first successfully built timeline drives each of its triggers.
      const driver = built[0];
      if (!driver) return;
      for (const trigger of interaction.triggers ?? []) {
        bindTrigger(
          interaction,
          trigger,
          driver,
          triggerElementFor(trigger, triggerElement)
        );
      }
    };

    if (!rules?.length) {
      if (isElementScoped(interaction)) {
        for (const element of triggerElements(interaction)) {
          buildFor(element, null);
        }
      } else {
        buildFor(null, null);
      }
      return;
    }

    const queries: Record<string, string> = {};
    for (const condition of rules) {
      if (condition.type === "prefers-reduced-motion") {
        queries.prefersReduced = "(prefers-reduced-motion: reduce)";
      }
      if (condition.type === "breakpoint") {
        for (const bp of condition.breakpoints ?? []) {
          const query = BREAKPOINT_QUERIES[bp];
          if (query) queries[`breakpoint_${bp}`] = query;
        }
      }
    }

    const mm = g.matchMedia();
    matchMedias.push(mm);
    let firstRun = true;
    mm.add({ ...queries, fallback: "(min-width: 0px)" }, (context) => {
      const isLoad = (interaction.triggers ?? []).some(
        ([, config]) => config.controlType === CONTROL_TYPE.LOAD
      );
      if (isLoad && !firstRun) return () => {};
      firstRun = false;
      const behavior = conditionalBehavior(
        interaction,
        (context.conditions ?? {}) as Record<string, boolean>
      );
      if (isElementScoped(interaction)) {
        for (const element of triggerElements(interaction)) {
          buildFor(element, behavior);
        }
      } else {
        buildFor(null, behavior);
      }
      return () => {};
    });
  }

  for (const interaction of payload.interactions ?? []) {
    if (interaction.deleted) continue;
    setupInteraction(interaction);
  }

  for (const run of loadQueue) run();
  ST.refresh();

  return {
    dispose() {
      for (const fn of disposers) fn();
      for (const timeline of timelines) timeline.kill();
      for (const instance of scrollTriggers) instance.kill();
      for (const mm of matchMedias) mm.revert();
      for (const instance of splits.values()) instance.revert();
      splits.clear();
    },
  };
}