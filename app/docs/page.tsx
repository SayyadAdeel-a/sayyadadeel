import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API docs — Sayyad Adeel Ahmad",
  robots: { index: false, follow: false },
};

/**
 * Human-readable documentation for the site's one public endpoint. This page
 * exists so the API catalog's `service-doc` link resolves to something real; it
 * is deliberately out of the index (noindex) because it is API reference
 * material, not a page worth surfacing in search results.
 */
export default function DocsPage() {
  return (
    <main className="docs-page" style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px", lineHeight: 1.6 }}>
      <h1>API documentation</h1>
      <p>
        This site exposes one public endpoint, <code>POST /api/contact</code>,
        which relays messages from the contact form. The machine-readable
        description is at <a href="/openapi.json">/openapi.json</a>.
      </p>

      <h2>POST /api/contact</h2>
      <p>Validates a submission and forwards it to Formspree for email delivery.</p>

      <h3>Request</h3>
      <p>JSON or form-encoded. Required fields: <code>name</code>, <code>email</code>, <code>message</code>. Optional: <code>phone</code>, <code>reason</code>.</p>
      <ul>
        <li><code>name</code> — up to 120 characters.</li>
        <li><code>email</code> — a valid address, up to 254 characters.</li>
        <li><code>phone</code> — optional, up to 40 characters.</li>
        <li><code>reason</code> — one of: Website / Project, Just Asking, Want To Connect, Something Else.</li>
        <li><code>message</code> — up to 4000 characters.</li>
      </ul>
      <p>The whole request body must stay under 16 KB.</p>

      <h3>Responses</h3>
      <ul>
        <li><strong>200</strong> — <code>{'{ "ok": true }'}</code>. Also returned for silently-dropped spam.</li>
        <li><strong>400</strong> — malformed body, or an <code>errors</code> object with per-field messages.</li>
        <li><strong>413</strong> — body too large.</li>
        <li><strong>502</strong> — the upstream email relay failed.</li>
        <li><strong>503</strong> — contact relay not configured; please email contact@adeelsayyad.tech instead.</li>
      </ul>

      <h3>Notes</h3>
      <p>
        No data is stored. Spam is rejected silently: a bot never learns from the
        response whether its payload was dropped.
      </p>
    </main>
  );
}
