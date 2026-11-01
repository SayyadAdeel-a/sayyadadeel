import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Markdown content negotiation.
 *
 * An agent that requests a page with `Accept: text/markdown` gets a Markdown
 * rendering of that page at the *same canonical URL*; a browser keeps getting
 * HTML. The `Vary: Accept` header keeps the two representations' cache entries
 * separate, exactly as the agent-readiness guidance (e.g. Cloudflare's
 * "Markdown for agents") prescribes.
 *
 * The Markdown is authored to mirror the page's real content. It is a parallel
 * representation, not a second page: robots and sitemaps see the same single
 * URL either way. Requests that do not ask for Markdown pass straight through to
 * Next's normal HTML rendering.
 *
 * Only the two public pages are covered; API and asset routes are untouched.
 */

const HOMEPAGE_MD = `# Sayyad Adeel Ahmad

Personal portfolio of Sayyad Adeel Ahmad — a student who learns by building.
Projects, experiments, notes and the curiosity that connects them. Everything
here is his own work; there is no agency and no client list behind it.

## What he does

- Builds things in public and writes about the process
- Focuses on full-stack web development, automation, and AI-assisted building
- Documents what he learns rather than only the finished results

## Selected projects

- **Cardmarket Intelligence** — a Python-based marketplace monitoring and market
  intelligence system for continuous Cardmarket listing surveillance. Advanced
  browser automation, Cloudflare challenge handling, listing extraction,
  historical price tracking, and instant Discord/Slack alerts when listings
  match configured price thresholds.
- **Nexus Logistics** — a full-stack last-mile courier and parcel delivery
  platform connecting customers, dispatchers, drivers, and administrators
  through five role-based portals: shipment management, real-time consignment
  tracking, automated invoicing, mobile driver workflows, secure document
  storage, and operational analytics.
- **Donut Website** — a playful storefront experiment focused on colorful
  visuals, products, and a simple shopping experience.
- **E-commerce Website** — an online store project exploring product
  presentation, browsing, and a clean shopping experience.
- **AgentOS** — an experiment exploring how multiple coding agents can plan,
  divide tasks, and work together.

## Notes from the rabbit hole

Short first-person write-ups from building things — why he keeps building things
he does not fully understand, and what building with almost no budget taught
him.

## The process

Curiosity, research, build, experiment, refine, learn.

## Contact

- Contact form: https://adeelsayyad.tech/contact
- Email: contact@adeelsayyad.tech
- GitHub: https://github.com/SayyadAdeel-a
- LinkedIn: https://www.linkedin.com/in/adeelsayyad/
- Instagram: https://www.instagram.com/adeelsayyad.a/
`;

const CONTACT_MD = `# Contact — Sayyad Adeel Ahmad

How to get in touch.

## The contact form

The form at this URL posts to /api/contact, which validates the submission and
relays it as an email. No data is stored.

Fields:

- **Name** — required
- **Reason** — optional: Website / Project, Just Asking, Want To Connect,
  Something Else
- **Phone** — optional
- **Email** — required
- **Message** — required
- **Send Message** — submits the form

## Direct contact

- Email: contact@adeelsayyad.tech
- GitHub: https://github.com/SayyadAdeel-a
- LinkedIn: https://www.linkedin.com/in/adeelsayyad/
- Instagram: https://www.instagram.com/adeelsayyad.a/
`;

const MARKDOWN: Record<string, string> = {
  "/": HOMEPAGE_MD,
  "/contact": CONTACT_MD,
};

export function proxy(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  if (!accept.includes("text/markdown")) return;

  const markdown = MARKDOWN[request.nextUrl.pathname];
  if (markdown === undefined) return;

  return new NextResponse(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      vary: "Accept",
    },
  });
}

export const config = {
  matcher: ["/", "/contact"],
};
