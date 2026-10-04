export default function CtaSection() {
  return (
    <section className={"cta-section"}>
      <div className={"w-layout-blockcontainer container w-container"}>
        <div fade-up={"ture"} className={"cta-wrapper"}>
          <div fade-up={"true"} className={"cta-wrap"}>
            <div className={"cta-text-wrapper"}>
              <div className={"cta-text-wrap"}>
                <h2 className={"h4 white"}>Ready To Launch Next Campaign?</h2>
                <p className={"text-default rgb-5"}>Partner with Relab to connect with the right creators, produce authentic short-form content, and turn attention into measurable business growth.</p>
              </div>
              <div className={"cta-text-button-wrap"}>
                <a btn-anim={"true"} data-wf--button--variant={"base"} data-wf-component-id={"90522a0b-8143-769f-2ad2-e28710708494"} data-wf-variant-state={"base"} href={"/contact"} className={"button w-inline-block"}>
                  <div className={"button-text-wrap"}>
                    <div className={"button-hover-text"}>Schedule a Call</div>
                    <div className={"button-normal-text"}>Schedule a Call</div>
                  </div>
                  <div className={"button-icon-box"}>
                    <div button-icon-anin-one={"ture"} className={"button-icon-wrap"}>
                      <img src={"/assets/home/_shared/arrow-1.svg"} loading={"lazy"} alt={"Icon"} className={"button-icon"} />
                    </div>
                  </div>
                </a>
              </div>
            </div>
            <div className={"cta-image-wrap"}>
              <img sizes={"100vw"} srcSet={"/assets/home/_shared/image-2037-p-500.avif 500w, /assets/home/_shared/image-2037-p-800.avif 800w, /assets/home/_shared/image-2037-p-1080.avif 1080w, /assets/home/_shared/cover-size-image-image-2037.avif 1320w"} alt={"CTA Card Image"} src={"/assets/home/_shared/cover-size-image-image-2037.avif"} loading={"lazy"} className={"cover-size-image"} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
