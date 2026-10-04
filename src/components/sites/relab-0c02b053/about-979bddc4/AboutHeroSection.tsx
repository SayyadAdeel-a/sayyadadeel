export default function AboutHeroSection() {
  return (
    <section className={"about-hero-section"}>
      <div className={"w-layout-blockcontainer container w-container"}>
        <div className={"about-hero-wrapper"}>
          <div group-secend-move={"ture"} className={"about-hero-image-wrap about-hero-image-one"}>
            <img src={"/assets/about/01-about-hero/ellipse-2470.avif"} loading={"lazy"} className={"cover-size-image"} />
          </div>
          <div group-fast-move={"ture"} className={"about-flex-one-part"}>
            <div className={"about-hero-image-wrap about-hero-image-two"}>
              <img src={"/assets/about/01-about-hero/ellipse-2472.avif"} loading={"lazy"} className={"cover-size-image"} />
            </div>
            <div className={"about-hero-image-wrap about-hero-image-five"}>
              <img src={"/assets/about/01-about-hero/vector.svg"} loading={"lazy"} alt={"Image"} className={"contain-size-image"} />
            </div>
          </div>
          <div group-fast-move={"ture"} className={"about-flex-twopart"}>
            <div className={"about-hero-image-wrap about-hero-image-three"}>
              <img src={"/assets/about/01-about-hero/ellipse-2471.avif"} loading={"lazy"} className={"cover-size-image"} />
            </div>
            <div className={"about-hero-image-wrap about-hero-image-six"}>
              <img src={"/assets/about/01-about-hero/vector.svg"} loading={"lazy"} alt={"Image"} className={"contain-size-image"} />
            </div>
          </div>
          <div group-secend-move={"ture"} className={"about-hero-image-wrap about-hero-image-four"}>
            <img src={"/assets/about/01-about-hero/ellipse-2473.avif"} loading={"lazy"} className={"cover-size-image"} />
          </div>
          <div className={"about-hero-text-wrapper"}>
            <div className={"about-hero-header-text-wrapper"}>
              <div className={"about-hero-header-text-wrap"}>
                <h1 className={"h1 hero-text-one"}>Where Brands</h1>
                <div className={"h1 hero-text-two"}>& Creators</div>
              </div>
              <div className={"decorated-title-text-wrap"}>
                <div className={"decorated-title"}>
                  <div className={"display-text-two"}>Grow Together</div>
                </div>
              </div>
            </div>
            <div className={"about-hero-text-dectlies-wrap"}>
              <p className={"text-default rbg8 center"}>We believe the best campaigns are built on trust, creativity, and collaboration. That's why we bring brands and creators together to produce content that drives lasting impact.</p>
            </div>
          </div>
        </div>
      </div>
      <div className={"hero-bg-image-wrap"}>
        <img src={"/assets/about/01-about-hero/grid-1.svg"} loading={"lazy"} alt={"BG Image"} className={"contain-size-image"} />
      </div>
    </section>
  );
}
