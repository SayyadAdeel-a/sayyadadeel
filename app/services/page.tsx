import "./services.css";
import SiteHeader from "@/components/sites/adeel-site/shared/SiteHeader";
import SiteFooter from "@/components/sites/adeel-site/shared/SiteFooter";
import SiteCta from "@/components/sites/adeel-site/shared/SiteCta";
import { siteConfig } from "@/lib/brand";
import { buildMetadata, pageJsonLd } from "@/lib/metadata";
import { services } from "@/content/services";

const title = "Services — Web Development, Ecommerce & AI Automation";
const description =
  "What Sayyad Adeel builds: fast websites, ecommerce stores and AI automation for businesses. Pick a service, or get a straight quote.";

export const metadata = buildMetadata({
  title,
  description,
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        id="ld-page"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            pageJsonLd({
              path: "/services",
              type: "ProfessionalService",
              name: title,
              description,
            })
          ),
        }}
      />
      <SiteHeader currentPath={"/services"} />
      <main>
        <section className="section">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-prose">
              <div className="service-heading">
                <p
                  className="text-medium"
                  style={{
                    color: siteConfig.themeColor,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Services
                </p>
                <h1>What I can build for you</h1>
                <p className="text-default">
                  Three areas I work in — websites, ecommerce and automation. Each
                  page below spells out what is included, how the process works,
                  and honest answers to the questions clients ask first.
                </p>
              </div>

              <div className="services-grid">
                {services.map((s) => (
                  <article key={s.slug} className="service-card">
                    <h2 className="h4">{s.h1}</h2>
                    <p className="text-default">{s.intro}</p>
                    <a
                      btn-anim={"true"}
                      data-wf--button--variant={"base"}
                      data-wf-component-id={"90522a0b-8143-769f-2ad2-e28710708494"}
                      data-wf-variant-state={"base"}
                      href={`/services/${s.slug}`}
                      className="button w-inline-block"
                    >
                      <div className="button-text-wrap">
                        <div className="button-hover-text">Learn more</div>
                        <div className="button-normal-text">Learn more</div>
                      </div>
                      <div className="button-icon-box">
                        <div button-icon-anin-one={"ture"} className="button-icon-wrap">
                          <img
                            src={"/assets/shared/arrow-1.svg"}
                            loading={"lazy"}
                            alt={"Icon"}
                            className="button-icon"
                          />
                        </div>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <SiteCta currentPath={"/services"} />
      </main>
      <SiteFooter currentPath={"/services"} />
    </>
  );
}
