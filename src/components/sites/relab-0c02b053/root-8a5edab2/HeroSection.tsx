export default function HeroSection() {
  return (
    <section className={"hero-section"}>
      <div className={"w-layout-blockcontainer container w-container"}>
        <div className={"hero-wrapper"}>
          <div className={"agency-hero-text-wrap"}>
            <div className={"agency-hero-fast-text-wrap"}>
              <div className={"agency-hero-image-wrap one"}>
                <img src={"/assets/home/02-hero/contain-size-image-image-297.svg"} loading={"lazy"} className={"contain-size-image"} />
              </div>
              <div className={"agency-hero-text"}>
                <h1 className={"h1"}>Influencer</h1>
              </div>
            </div>
            <div className={"agency-hero-secend-wrapper"}>
              <div className={"agency-hero-text-image-wrap"}>
                <div className={"agency-hero-text"}>
                  <div className={"h1"}>Short Video</div>
                </div>
                <div className={"agency-hero-image-wrap two"}>
                  <img src={"/assets/home/_shared/contain-size-image-image-278.svg"} loading={"lazy"} className={"contain-size-image"} />
                </div>
              </div>
              <div className={"agency-hero-text-samall-wrap"}>
                <div className={"text-default"}>
                  ® Est in 2023 -
                  <br />
                  Based in Montreal
                </div>
              </div>
              <div className={"agency-hero-box dectontes-text"}>
                <div className={"decorated-title"}>
                  <div className={"display-text-two"}>agency</div>
                </div>
                <div className={"decorated-title-style-wrap"}>
                  <div className={"decorated-title-style-image-wrap"}>
                    <img src={"/assets/home/_shared/contain-size-image-image-278.svg"} loading={"lazy"} className={"contain-size-image"} />
                  </div>
                  <div className={"decorated-title-style-text-wrap"}>
                    <div className={"text-small blold-meddle"}>
                      <span className={"spen-style"}>Trusted by</span>
                      <br />
                       80+ Influencers
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={"agency-dectlies-wrap"}>
            <div className={"text-default"}>We connect brands with high-performing creators to produce short-form content that drives awareness, engagement, and measurable growth.</div>
          </div>
          <div fade-up={"ture"} className={"bg-image-right-wrap"}>
            <img src={"/assets/home/02-hero/vector-3.svg"} loading={"lazy"} className={"bg-image"} />
          </div>
          <div fade-up={"true"} className={"bg-image-left-wrap"}>
            <img src={"/assets/home/02-hero/vector-4.svg"} loading={"lazy"} className={"bg-image"} />
          </div>
        </div>
      </div>
      <div className={"hero-bg-image-wrap"}>
        <img src={"/assets/home/02-hero/grid-1.svg"} loading={"lazy"} className={"cover-size-banner"} />
      </div>
    </section>
  );
}
