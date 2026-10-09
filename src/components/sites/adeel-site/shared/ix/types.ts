/**
 * Types for the decoded Webflow IX (ix3) interaction payload.
 *
 * The shape mirrors `webflow-*.js` exactly: Webflow encodes target selectors
 * and property values as positional tuples/arrays, which is why the tuple
 * members are addressed by numeric index.
 */

/** Webflow's `TweenType` enum. */
export const TWEEN_TYPE = {
  TO: 0,
  FROM: 1,
  FROM_TO: 2,
  SET: 3,
} as const;

/** Webflow's `TimelineControlType` enum. */
export const CONTROL_TYPE = {
  STANDARD: "standard",
  SCROLL: "scroll",
  LOAD: "load",
  CONTINUOUS: "continuous",
} as const;

/** Webflow's `RELATIONSHIP_TYPES`. */
export const RELATIONSHIP = {
  NONE: "none",
  WITHIN: "within",
  DIRECT_CHILD_OF: "direct-child-of",
  CONTAINS: "contains",
  DIRECT_PARENT_OF: "direct-parent-of",
  NEXT_TO: "next-to",
  NEXT_SIBLING_OF: "next-sibling-of",
  PREV_SIBLING_OF: "prev-sibling-of",
} as const;

export type TargetKind =
  | "wf:class"
  | "wf:attribute"
  | "wf:inst"
  | "wf:trigger-only"
  | "wf:trigger-only-parent"
  | "wf:selector"
  | "wf:id"
  | "wf:body"
  | "wf:any-element"
  | "wf:viewport"
  | "wf:style";

export interface TargetMeta {
  relationship?: string;
  filterBy?: [string, string] | string[];
  firstMatchOnly?: boolean;
}

export type IxTarget = [
  kind: TargetKind,
  value: string[] | string,
  meta?: TargetMeta,
];

export interface StaggerConfig {
  each?: number | string;
  amount?: number | string;
  from?: "start" | "center" | "edges" | "random" | "end" | number;
  grid?: unknown;
  axis?: string;
  ease?: number | EaseObject;
}

export interface EaseObject {
  type:
    | "back"
    | "elastic"
    | "steps"
    | "rough"
    | "slowMo"
    | "expoScale"
    | "customWiggle"
    | "customBounce"
    | "customEase";
  curve?: string;
  power?: number;
  amplitude?: number;
  period?: number;
  stepCount?: number;
  [key: string]: unknown;
}

export interface ActionTiming {
  duration?: number | string;
  position?: number | string;
  ease?: number | EaseObject;
  stagger?: StaggerConfig;
  repeat?: number;
  repeatDelay?: number | string;
  yoyo?: boolean;
}

/** A transform channel is encoded as `[from, to]`; `null` means "unchanged". */
export type ChannelPair = [unknown, unknown];

export interface TransformProps {
  [channel: string]: ChannelPair | unknown;
}

export interface IxAction {
  id: string;
  targets?: IxTarget[];
  timing?: ActionTiming;
  /** TweenType: 0 to, 1 from, 2 fromTo, 3 set. */
  tt?: number;
  properties?: {
    "wf:transform"?: TransformProps;
    [key: string]: unknown;
  };
  splitText?: { type: string; mask?: string } | "none";
  classes?: unknown;
  variables?: unknown;
}

export interface IxTimeline {
  id: string;
  deleted?: boolean;
  actions?: IxAction[];
  settings?: { repeat?: number; yoyo?: boolean };
  canvasDuration?: number | null;
  triggerMetadata?: {
    role?: string;
    distance?: number | null;
    axes?: string | null;
    pluginConfig?: unknown;
  };
}

export interface ScrollTriggerConfig {
  clamp?: boolean;
  start?: string;
  end?: string;
  scrub?: number | null;
  enter?: string;
  leave?: string;
  enterBack?: string;
  leaveBack?: string;
}

export type TriggerName =
  | "wf:load"
  | "wf:hover"
  | "wf:click"
  | "wf:scroll"
  | "wf:mouse-move"
  | "wf:focus"
  | "wf:blur"
  | "wf:change"
  | "wf:navbar"
  | "wf:dropdown";

export type ControlName =
  | "restart"
  | "play"
  | "reverse"
  | "reverseFlipEase"
  | "pause"
  | "resume"
  | "togglePlayReverse"
  | "togglePlayReverseFlipEase"
  | "stop"
  | "none";

export interface TriggerConfig {
  control?: ControlName;
  controlType?: string;
  scrollTriggerConfig?: ScrollTriggerConfig;
  pluginConfig?: {
    type?: string;
    hover?: string;
    restingState?: { x?: number; y?: number };
    smoothness?: number;
    [key: string]: unknown;
  };
}

export type IxTrigger = [
  name: TriggerName,
  config: TriggerConfig,
  /** A trigger binds to exactly one element, so it carries one target tuple. */
  target?: IxTarget,
];

export interface ConditionalPlayback {
  type: "breakpoint" | "prefers-reduced-motion";
  behavior?: string;
  breakpoints?: string[];
}

export interface IxInteraction {
  id: string;
  scope?: { type: string; componentId?: string };
  triggers?: IxTrigger[];
  timelineIds?: string[];
  deleted?: boolean;
  conditionalPlayback?: ConditionalPlayback[] | null;
}

export interface IxPayload {
  interactions: IxInteraction[];
  timelines: IxTimeline[];
}

/**
 * The decoded payload arrives as a JSON module import, so TypeScript infers
 * plain arrays where the wire format uses positional tuples. It is validated
 * and narrowed once, at the boundary, by `parseIxPayload`.
 */
export function parseIxPayload(input: unknown): IxPayload {
  if (
    typeof input !== "object" ||
    input === null ||
    !Array.isArray((input as IxPayload).interactions) ||
    !Array.isArray((input as IxPayload).timelines)
  ) {
    throw new Error("IX payload: expected { interactions: [], timelines: [] }");
  }
  return input as IxPayload;
}