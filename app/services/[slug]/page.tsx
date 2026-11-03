import { notFound } from "next/navigation";
import "../services.css";
import SiteHeader from "@/components/sites/adeel-site/shared/SiteHeader";
import SiteFooter from "@/components/sites/adeel-site/shared/SiteFooter";
import { siteConfig } from "@/lib/brand";
import { buildMetadata, pageJsonLd } from "@/lib/metadata";
import { serviceBySlug, services } from "@/content/services";

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
        <div className="services-shell">
          <p className="services-eyebrow">Services</p>
          <h1>{service.h1}</h1>
          <p className="services-intro">{service.intro}</p>

          <div className="services-grid">
            {service.sections.map((sec) => (
              <div key={sec.heading} className="services-section">
                <h2>{sec.heading}</h2>
                <p>{sec.body}</p>
              </div>
            ))}
          </div>

          <div className="services-card">
            <h2>What you get</h2>
            <p>Every {service.h1.toLowerCase()} project includes:</p>
            <ul className="services-check">
              {service.deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <div className="services-cta">
              <p>{service.cta}</p>
              <a href="/contact">Start the conversation</a>
            </div>
          </div>

          <div className="services-faq">
            <h2>Common questions</h2>
            {service.faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>

          <p style={{ marginTop: 48, color: "#8a8a8a" }}>
            Serving clients worldwide. You can also{" "}
            <a
              href="/contact"
              style={{ color: siteConfig.themeColor, textDecoration: "underline" }}
            >
              get in touch
            </a>{" "}
            directly to talk through your project.
          </p>
        </div>
      </main>
      <SiteFooter currentPath={path} />
    </>
  );
}
