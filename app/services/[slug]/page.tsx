import { notFound } from "next/navigation";
import Link from "next/link";
import "../services.css";
import SiteHeader from "@/components/sites/adeel-site/shared/SiteHeader";
import SiteFooter from "@/components/sites/adeel-site/shared/SiteFooter";
import SiteCta from "@/components/sites/adeel-site/shared/SiteCta";
import { serviceBySlug, services } from "@/content/services";
import { buildMetadata, pageJsonLd } from "@/lib/metadata";
import SectionLabel from "@/components/sites/adeel-site/shared/SectionLabel";

// The service pages are static: one page per record in `services`, no runtime
// data, so the set of paths is known at build time.
export const dynamic = "force-static";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) return {};
  return buildMetadata({
    title: service.title,
    description: service.description,
    path: `/services/${service.slug}`,
  });
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) return notFound();

  const path = `/services/${service.slug}`;
  const faqLd = service.faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: service.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        id="ld-page"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            pageJsonLd({
              path,
              type: "ProfessionalService",
              name: service.title,
              description: service.description,
            })
          ),
        }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          id="ld-faq"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      <SiteHeader currentPath={path} />
      <main>
        <section className="section">
          <div className="w-layout-blockcontainer container w-container">
            <div className="services-prose">
              <div className="service-heading">
                <SectionLabel>Services</SectionLabel>
                <h1>{service.h1}</h1>
                <p className="text-default">{service.intro}</p>
              </div>

              {service.sections.map((sec) => (
                <div key={sec.heading} className="service-block">
                  <h2 className="h4">{sec.heading}</h2>
                  <p className="text-default">{sec.body}</p>
                </div>
              ))}

              <div className="service-card">
                <h2 className="h4">What you get</h2>
                <p className="text-default">
                  Every {service.h1.toLowerCase()} project includes:
                </p>
                <ul className="service-check">
                  {service.deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <a
                  btn-anim={"true"}
                  data-wf--button--variant={"base"}
                  data-wf-component-id={"90522a0b-8143-769f-2ad2-e28710708494"}
                  data-wf-variant-state={"base"}
                  href={"/contact"}
                  className="button w-inline-block"
                >
                  <div className="button-text-wrap">
                    <div className="button-hover-text">{service.cta}</div>
                    <div className="button-normal-text">{service.cta}</div>
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
              </div>

              <div className="service-faq">
                <h2 className="h4">Common questions</h2>
                {service.faqs.map((f) => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>

              <div className="service-related">
                <h2 className="h4">Related services</h2>
                <div className="service-related-links">
                  {services
                    .filter((s) => s.slug !== service.slug)
                    .map((s) => (
                      <a key={s.slug} href={`/services/${s.slug}`} className="service-related-link">
                        {s.h1}
                      </a>
                    ))}
                  <Link href="/services" className="service-related-link">
                    All services
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SiteCta currentPath={path} />
      </main>
      <SiteFooter currentPath={path} />
    </>
  );
}
