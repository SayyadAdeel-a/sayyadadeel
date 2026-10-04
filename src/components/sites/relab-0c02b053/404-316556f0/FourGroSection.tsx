export default function FourGroSection() {
  return (
    <section className={"four-gro-section"}>
      <div className={"w-layout-blockcontainer container w-container"}>
        <div group-fade-up-parent={"true"} className={"utility-page-wrap"}>
          <div className={"utility-page-content"}>
            <img group-fade-up-item={"true"} className={"four-gro-images"} src={"/assets/404/01-four-gro/404.avif"} sizes={"(max-width: 767px) 100vw, (max-width: 991px) 728px, 940px"} srcSet={"/assets/404/01-four-gro/404-p-500.avif 500w, /assets/404/01-four-gro/404.avif 981w"} />
            <div className={"four-gro-text-button-wrapper"}>
              <div className={"four-gro-text-wrapper"}>
                <div group-fade-up-item={"true"} className={"image-text-wrapper"}>
                  <img src={"/assets/404/01-four-gro/four-gro-smaill-image-image-216.avif"} loading={"lazy"} className={"four-gro-smaill-image"} />
                  <h1 className={"h6"}>Page Not Found</h1>
                </div>
                <div group-fade-up-item={"true"}>The link you followed may be broken, or the page may have been removed.</div>
              </div>
              <div group-fade-up-item={"true"} className={"four-gro-button-wrap"}>
                <a btn-anim={"true"} data-wf--button--variant={"base"} data-wf-component-id={"90522a0b-8143-769f-2ad2-e28710708494"} data-wf-variant-state={"base"} href={"/"} className={"button w-inline-block"}>
                  <div className={"button-text-wrap"}>
                    <div className={"button-hover-text"}>Back to Home</div>
                    <div className={"button-normal-text"}>Back to Home</div>
                  </div>
                  <div className={"button-icon-box"}>
                    <div button-icon-anin-one={"ture"} className={"button-icon-wrap"}>
                      <img src={"/assets/shared/arrow-1.svg"} loading={"lazy"} alt={"Icon"} className={"button-icon"} />
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
