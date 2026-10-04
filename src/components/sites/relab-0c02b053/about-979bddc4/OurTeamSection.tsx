export default function OurTeamSection() {
  return (
    <section className={"our-team-section"}>
      <div className={"w-layout-blockcontainer container w-container"}>
        <div className={"our-team-wrapper"}>
          <div className={"our-team-text-wrapper"}>
            <div fade-up={"true"} className={"section-labbal-text-wrap"}>
              <div data-wf--section-label--variant={"base"} data-wf-component-id={"baea7480-3228-dedc-fd06-20620fd6c93a"} data-wf-variant-state={"base"} className={"section-label"}>
                <div className={"text-icon-box"}>
                  <img src={"/assets/shared/ellipse-2469.svg"} loading={"lazy"} move-opacty={"ture"} alt={"Icon"} className={"text-icon"} />
                </div>
                <div className={"text-block-name"}>Our Team</div>
              </div>
            </div>
            <h2 fade-up={"true"} className={"h3"}>Meet The Minds  Behind Relab</h2>
          </div>
          <div fade-up={"true"} className={"our-team-image-text-wrapper"}>
            <div className={"our-team-image-carkel-wrapper"}>
              <div className={"our-team-carkel-image-wrap"}>
                <img src={"/assets/about/03-our-team/cover-size-image-frame-2147262849.svg"} loading={"lazy"} alt={"Image"} className={"cover-size-image"} />
                <div className={"bg-grdden-wrap"} />
              </div>
              <div className={"our-team-member-image-wrap our-team-member-one"}>
                <img src={"/assets/about/03-our-team/ellipse-1763.avif"} loading={"lazy"} className={"cover-size-image"} />
              </div>
              <div className={"our-team-member-image-wrap our-team-member-two"}>
                <img src={"/assets/about/03-our-team/ellipse-1764.avif"} loading={"lazy"} className={"cover-size-image"} />
              </div>
              <div className={"our-team-member-image-wrap our-team-member-three"}>
                <img src={"/assets/about/_shared/ellipse-1761.avif"} loading={"lazy"} className={"cover-size-image"} />
              </div>
            </div>
            <div className={"our-team-image-text-wrap"}>
              <div group-fedup-move={"ture"} className={"our-team-image-text-box"}>
                <div className={"our-team-image-text-name-wrap"}>
                  <div className={"our-team-image-wrap"}>
                    <img src={"/assets/about/03-our-team/cover-size-image-image-19219.avif"} loading={"lazy"} sizes={"(max-width: 602px) 100vw, 602px"} srcSet={"/assets/about/03-our-team/image-19219-p-500.avif 500w, /assets/about/03-our-team/cover-size-image-image-19219.avif 602w"} alt={"Team Member Images"} className={"cover-size-image"} />
                  </div>
                  <div className={"our-team-text-name-wrap"}>
                    <div className={"text-medium blold-meddle"}>Alex Carter</div>
                    <div className={"text-default"}>Founder & Creative Director</div>
                  </div>
                </div>
                <div className={"our-team-image-text-dectlies-wrap"}>
                  <p className={"text-default rbg10"}>Alex leads Relab's creative vision, shaping creator-first campaigns that blend storytelling, strategy.</p>
                </div>
              </div>
              <div group-fedup-move={"ture"} className={"our-team-image-text-box"}>
                <div className={"our-team-image-text-name-wrap"}>
                  <div className={"our-team-image-wrap"}>
                    <img src={"/assets/about/03-our-team/image-19219-1.avif"} loading={"lazy"} sizes={"(max-width: 602px) 100vw, 602px"} srcSet={"/assets/about/03-our-team/image-19219-1-p-500.avif 500w, /assets/about/03-our-team/image-19219-1.avif 602w"} alt={"Team Member Card Images"} className={"cover-size-image"} />
                  </div>
                  <div className={"our-team-text-name-wrap"}>
                    <div className={"text-medium blold-meddle"}>John Bennett</div>
                    <div className={"text-default"}>Co-Founder & Campaign Director</div>
                  </div>
                </div>
                <div className={"our-team-image-text-dectlies-wrap"}>
                  <p className={"text-default rbg10"}>Mia oversees creator partnerships and campaign execution, ensuring every collaboration is thoughtfully managed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
