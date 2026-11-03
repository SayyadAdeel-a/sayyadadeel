/**
 * section-label / eyebrow — the small pill that introduces sections across the
 * site (black rounded border, uppercase label, an accent dot tucked into a
 * black icon box). Mirrors the reference homepage's `section-label` block so
 * the hand-authored service and writing pages carry the same visual cue.
 *
 * The reference relies on the IX runtime to size `.text-icon-box`; here that
 * sizing is provided statically by the page stylesheets that import this
 * component. The ellipse is the site's shared accent mark.
 */
export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-wf--section-label--variant={"base"}
      data-wf-component-id={"baea7480-3228-dedc-fd06-20620fd6c93a"}
      data-wf-variant-state={"base"}
      className="section-label"
    >
      <div className="text-icon-box">
        <img
          src="/assets/home/_shared/ellipse-2469.svg"
          loading="lazy"
          alt=""
          className="text-icon"
        />
      </div>
      <div className="text-block-name">{children}</div>
    </div>
  );
}
