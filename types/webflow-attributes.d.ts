/**
 * Webflow drives its interactions through custom hook attributes on ordinary
 * elements — `fade="true"`, `group-fedup-move="ture"`, `menu-bar-toggle="true"`
 * and so on — which the reference stylesheet and the IX payload both select
 * with `[attr="value"]`.
 *
 * React renders unknown lowercase attributes verbatim, so the generated markup
 * works as-is; TypeScript just has no index signature for them on intrinsic
 * elements. This augmentation makes that explicit instead of casting at every
 * generated call site.
 */
import "react";

declare module "react" {
  interface HTMLAttributes<T> {
    [webflowHook: string]: unknown;
  }

  interface SVGAttributes<T> {
    [webflowHook: string]: unknown;
  }
}