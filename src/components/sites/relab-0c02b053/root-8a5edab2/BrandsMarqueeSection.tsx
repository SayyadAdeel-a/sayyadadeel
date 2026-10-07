export default function BrandsMarqueeSection() {
  return (
    <section className={"brands-section"}>
      <div className={"w-layout-blockcontainer container w-container"}>
        <div fade-up={"true"} className={"our-projects-wrapper"}>
          <div className={"our-projects-wrap"}>
            <div className={"our-projects-text-wrap"}>
              <div className={"our-projects-name-text display-five"}>adeel.</div>
              <div className={"our-projects-text-declies-wrap"}>
                <div className={"display-02 white"}>
                  {"Got A Weird Idea "}
                  <br />
                  To Share?
                </div>
              </div>
              <div className={"our-projects-text-button-wrap"}>
                <a btn-anim={"true"} data-wf--button--variant={"base"} data-wf-component-id={"90522a0b-8143-769f-2ad2-e28710708494"} data-wf-variant-state={"base"} href={"/contact"} className={"button w-inline-block"}>
                  <div className={"button-text-wrap"}>
                    <div className={"button-hover-text"}>Send A Message</div>
                    <div className={"button-normal-text"}>Send A Message</div>
                  </div>
                  <div className={"button-icon-box"}>
                    <div button-icon-anin-one={"ture"} className={"button-icon-wrap"}>
                      <img src={"/assets/home/_shared/arrow-1.svg"} loading={"lazy"} alt={"Icon"} className={"button-icon"} />
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <div className={"our-projects-bg-wrap"} />
        </div>
      </div>
    </section>
  );
}
