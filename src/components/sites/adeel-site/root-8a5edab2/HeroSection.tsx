export default function HeroSection() {
  return (
    <section className={"hero-section"}>
      <div className={"w-layout-blockcontainer container w-container"}>
        <div className={"hero-wrapper"}>
          <div className={"agency-hero-text-wrap"}>
            <div className={"agency-hero-fast-text-wrap"}>
              <div className={"agency-hero-image-wrap one"}>
                <img alt={""} src={"/assets/home/02-hero/contain-size-image-image-297.svg"} loading={"lazy"} className={"contain-size-image"} />
              </div>
              <div className={"agency-hero-text"}>
                <h1 className={"h1"}>Curious</h1>
              </div>
            </div>
            <div className={"agency-hero-secend-wrapper"}>
              <div className={"agency-hero-text-image-wrap"}>
                <div className={"agency-hero-text"}>
                  <div className={"h1"}>About New</div>
                </div>
                <div className={"agency-hero-image-wrap two"}>
                  <img alt={""} src={"/assets/home/_shared/contain-size-image-image-278.svg"} loading={"lazy"} className={"contain-size-image"} />
                </div>
              </div>
              <div className={"agency-hero-text-samall-wrap"}>
                <div className={"text-default"}>
                  ® Still figuring out
                  <br />
                  Based in Pakistan
                </div>
              </div>
              <div className={"agency-hero-box dectontes-text"}>
                <div className={"decorated-title"}>
                  <div className={"display-text-two"}>THINGS</div>
                </div>
                <div className={"decorated-title-style-wrap"}>
                  <div className={"decorated-title-style-image-wrap"}>
                    <img alt={""} src={"/assets/home/_shared/contain-size-image-image-278.svg"} loading={"lazy"} className={"contain-size-image"} />
                  </div>
                  <div className={"decorated-title-style-text-wrap"}>
                    <div className={"text-small blold-meddle"}>
                      <span className={"spen-style"}>Powered by</span>
                      <br />
                       Random Ideas
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={"agency-dectlies-wrap"}>
            <div className={"text-default"}>Just a student who keeps exploring ideas and experimenting. Some work, some don't; I keep learning anyway.</div>
          </div>
          <div fade-up={"ture"} className={"bg-image-right-wrap"}>
            <img alt={""} src={"/assets/home/02-hero/vector-3.svg"} loading={"lazy"} className={"bg-image"} />
          </div>
          <div fade-up={"true"} className={"bg-image-left-wrap"}>
            <img alt={""} src={"/assets/home/02-hero/vector-4.svg"} loading={"lazy"} className={"bg-image"} />
          </div>
        </div>
      </div>
      <div className={"hero-bg-image-wrap"}>
        <img alt={""} src={"/assets/home/02-hero/grid-1.svg"} loading={"lazy"} className={"cover-size-banner"} />
      </div>
    </section>
  );
}
