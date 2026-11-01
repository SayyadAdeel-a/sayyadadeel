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
                {/* The display word is decoration -- it is not what this page is
                    about, and leaving it as the only <h1> meant the page's single
                    top-level heading read "Curious" while the name sat below as an
                    <h2>. The tag stays because swapping it for a <div> would pick up
                    `h1 { margin: .67em 0 }` from webflow.css: `.h1` specifies size,
                    line-height, weight and letter-spacing but not margin, so the
                    heading would move. The context goes in an out-of-flow span
                    instead, which clips to 1x1 and contributes nothing to layout. */}
                <h1 className={"h1"}>
                  Curious
                  <span className={"sr-only"}>
                    {" — Sayyad Adeel Ahmad, a student who learns by building"}
                  </span>
                </h1>
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
        <img alt={""} src={"/assets/home/02-hero/grid-1.svg"} loading={"eager"} fetchPriority={"high"} className={"cover-size-banner"} />
      </div>
    </section>
  );
}
