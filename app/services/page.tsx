import "./services.css";
import SiteHeader from "@/components/sites/adeel-site/shared/SiteHeader";
import SiteFooter from "@/components/sites/adeel-site/shared/SiteFooter";
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
        <div className="services-shell">
          <p className="services-eyebrow">Services</p>
          <h1>What I can build for you</h1>
          <p className="services-intro">
            Three areas I work in — websites, ecommerce and automation. Each page
            below spells out what is included, how the process works, and honest
            answers to the questions clients ask first.
          </p>

          <div className="services-grid two-col">
            {services.map((s) => (
              <div key={s.slug} className="services-card">
                <h2>{s.h1}</h2>
                <p>{s.intro}</p>
                <a
                  href={`/services/${s.slug}`}
                  style={{
                    color: "#fb8626",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Learn more →
                </a>
              </div>
            ))}
          </div>

          <div className="services-cta">
            <p>Not sure which one fits your project?</p>
            <a href="/contact">Talk it through</a>
          </div>
        </div>
      </main>
      <SiteFooter currentPath={"/services"} />
    </>
  );
}
