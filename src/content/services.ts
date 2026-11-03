/**
 * Service pages data.
 *
 * Drives the data-driven `/services/[slug]` pages. Each record becomes one
 * indexable page; the object is the single source the page, its metadata and
 * its structured data read from, so the <title>, the meta description, the H1
 * and the JSON-LD cannot describe different services.
 *
 * Copy is written in the site owner's honest voice: what he builds, how he
 * works, and what a client gets. No invented clients, metrics or promises.
 */

export type ServiceFaq = {
  q: string;
  a: string;
};

export type ServiceSection = {
  heading: string;
  body: string;
};

export type Service = {
  /** URL slug, used as the route path `/services/<slug>`. */
  slug: string;
  /** <title>, 40-65 characters. */
  title: string;
  /** Meta description, 50-160 characters. */
  description: string;
  /** The single H1. */
  h1: string;
  /** Lead paragraph under the H1. */
  intro: string;
  /** Body sections. */
  sections: ServiceSection[];
  /** Deliverables list, rendered as a checklist. */
  deliverables: string[];
  /** FAQ, rendered and emitted as FAQPage structured data. */
  faqs: ServiceFaq[];
  /** CTA button label. */
  cta: string;
};

export const services: Service[] = [
  {
    slug: "ecommerce-development",
    title: "Ecommerce Website Development for Businesses",
    description:
      "Ecommerce website development that helps you sell: clean storefronts, smooth checkout and modern tooling from scoping to launch.",
    h1: "Ecommerce Website Development",
    intro:
      "You need an online store that sells — not a template that stops at pretty. I build custom ecommerce storefronts on modern stacks, scoped around your products and your checkout, and shipped with a clear process.",
    sections: [
      {
        heading: "What a store build includes",
        body:
          "Every ecommerce project starts with what actually matters: product structure, how customers find what they need, and a checkout that feels effortless. I work from a clear scope so the store ships on time and does what you asked for — not more, not less.",
      },
      {
        heading: "The stack I build with",
        body:
          "I develop with modern JavaScript frameworks and headless or server-rendered approaches that keep store pages fast. For shops that need a proven admin, I also work with Shopify. The right choice depends on your catalog size and how you expect to manage it day to day.",
      },
      {
        heading: "How we get there",
        body:
          "One clear process: we plan the store structure and requirements, I build it in focused stages, and you review as we go. You get live previews along the way instead of a surprise on launch day.",
      },
    ],
    deliverables: [
      "Custom storefront built to your catalog and brand",
      "Fast, mobile-first page experience",
      "Checkout and cart flow that reduces friction",
      "Clean product structure and navigation",
      "Integration with the payments and tools you already use",
      "QA, launch support and a handover you can operate",
    ],
    faqs: [
      {
        q: "How much does ecommerce website development cost?",
        a:
          "It depends on the scope: catalog size, custom features, and integrations. I give a fixed quote at scoping rather than an hourly guess, so you know the number before work starts.",
      },
      {
        q: "Do you build on Shopify, or from scratch?",
        a:
          "Both. If you want a managed admin with built-in payments and apps, Shopify is a strong fit. If you need a highly custom store or a specific stack, I build a bespoke storefront instead.",
      },
      {
        q: "How long does a store build take?",
        a:
          "A focused store typically ships in a few weeks depending on scope. We agree on milestones at the start so you can see progress and plan around launch.",
      },
      {
        q: "Do you handle payments and security?",
        a:
          "I integrate secure, PCI-compliant payment providers and make sure proper checkout guardrails are in place as part of the build.",
      },
    ],
    cta: "Get a quote for your store",
  },
  {
    slug: "ai-automation",
    title: "AI Automation Services for Businesses & Teams",
    description:
      "AI automation services for businesses: Python automation and AI integrations that remove repetitive manual work from your team.",
    h1: "AI Automation Services",
    intro:
      "Repetitive manual work is the quiet tax on every business. I build Python automation and AI integrations that take those tasks off your team — data pipelines, monitoring, document handling and the glue between the tools you already use.",
    sections: [
      {
        heading: "What automation removes",
        body:
          "Automation pays for itself when it removes a task a person does the same way every week. I start by mapping where your time is going, then build a script or integration that handles it reliably — and alert you when it needs attention.",
      },
      {
        heading: "Where AI fits",
        body:
          "Not everything needs a chat interface. The useful AI work is the invisible kind: extracting structure from documents, summarizing incoming data, classifying messages, and drafting the repetitive responses your team edits anyway.",
      },
      {
        heading: "Built to be maintainable",
        body:
          "Automation fails when it is a black box. I leave readable, documented workflows and clear error handling, so when a data source changes you are not stuck calling a mystery script.",
      },
    ],
    deliverables: [
      "Python automation for repetitive workflows",
      "AI integrations that slot into existing tools",
      "Data extraction, monitoring and alerting",
      "Marketplace and web data collection",
      "Clear documentation and error handling",
      "A handover your team can run without me",
    ],
    faqs: [
      {
        q: "What kinds of tasks can you automate?",
        a:
          "Anything with a repeatable rule: file and data handling, web and marketplace data collection, report generation, notifications, and workflows that span tools that do not talk to each other natively.",
      },
      {
        q: "Does AI require retraining my team?",
        a:
          "No. I design integrations around how your team already works and document them in plain language. The point is less busywork, not a new tool to learn.",
      },
      {
        q: "Is my data safe with AI automation?",
        a:
          "Workflows run with your data handled on your terms and the providers you approve. I keep automation scoped to what you authorize and avoid needless third-party data sharing.",
      },
      {
        q: "How do you scope an automation project?",
        a:
          "We start with the task you want gone. I estimate how much of it is rule-based and what it takes to handle the edge cases, then quote a fixed scope before any work begins.",
      },
    ],
    cta: "Discuss your automation",
  },
  {
    slug: "web-development",
    title: "Freelance Web Developer — Custom Websites & Apps",
    description:
      "Hire a freelance web developer for fast, custom websites and web apps. Clear process, real projects and a straight answer on what your build takes.",
    h1: "Freelance Web Development",
    intro:
      "A website is not a brochure — it is your most visited employee. I build fast, custom websites and web apps that communicate what you do and move visitors toward a next step, without bloated templates or scope creep.",
    sections: [
      {
        heading: "What I build",
        body:
          "Marketing and business websites, custom web applications, and the tools behind them. Whether it is a site that has to load fast or an internal platform with roles and dashboards, the build is scoped, planned and shipped in stages.",
      },
      {
        heading: "Why custom",
        body:
          "A custom build means the site is shaped around your content and your goals rather than the limits of a template. You own the result, and there is no rental fee baked into your pages.",
      },
      {
        heading: "A transparent process",
        body:
          "You get a clear plan, live previews as work progresses, and a straight answer on what something takes before you commit. No agencies, no guesswork, no surprise invoices.",
      },
    ],
    deliverables: [
      "Fast, responsive website or web app",
      "Clean information architecture and copy structure",
      "Core web vitals considered from the start",
      "Built to be easy to update",
      "Search visibility fundamentals (metadata, indexing)",
      "QA, launch support and a handover you can use",
    ],
    faqs: [
      {
        q: "How fast will my website load?",
        a:
          "Performance is a requirement, not an afterthought. I build for fast first paint and minimal JavaScript, and I test the result rather than assume it.",
      },
      {
        q: "Can you help with content and copy?",
        a:
          "I structure pages and metadata so search engines understand them, and I work with whatever copy and assets you have. If you need written content, I can guide the structure and voice.",
      },
      {
        q: "What do you charge?",
        a:
          "Projects are quoted as a fixed scope rather than an open-ended hourly meter. Tell me what you need and I will give you a straight number and timeline.",
      },
      {
        q: "Do you work with existing sites or only new builds?",
        a:
          "Both. I can rebuild an underperforming site, add a section, or take over and improve an existing codebase — as long as it is code I can work on cleanly.",
      },
    ],
    cta: "Start your project",
  },
  {
    slug: "shopify-development",
    title: "Shopify Website Development & Custom Store Builds",
    description:
      "Shopify website development by a freelance developer: custom storefronts, theme and app work that help your store convert.",
    h1: "Shopify Development",
    intro:
      "Shopify handles the plumbing — payments, inventory, hosting. What it does not hand you is a store that looks and converts like yours. I build custom Shopify storefronts and refine themes so your store reflects your brand instead of the default template.",
    sections: [
      {
        heading: "What I do on Shopify",
        body:
          "Custom theme work, app integration, and store setup that is scoped to your catalog. I focus on the parts that decide whether a visitor buys: product pages, navigation and a checkout flow without roadblocks.",
      },
      {
        heading: "Custom storefronts, not just theme tweaks",
        body:
          "When the default themes are too limiting, I build a headless or custom storefront that talks to Shopify's backend. You keep Shopify's admin and payments, but the store looks and behaves exactly how you want.",
      },
      {
        heading: "Built to keep converting",
        body:
          "I optimise for speed and clarity rather than piling on features. A faster store keeps customers on the page, and a clear path to checkout turns that attention into sales.",
      },
    ],
    deliverables: [
      "Custom Shopify theme or storefront development",
      "Product page and category layout that sells",
      "Apps and integrations set up correctly",
      "Migration or redesign of an existing store",
      "Checkout and conversion polish",
      "QA, launch support and a handover you can operate",
    ],
    faqs: [
      {
        q: "Can you build a store on my existing Shopify plan?",
        a:
          "Yes. Custom theme and storefront work stays within Shopify's platform, so you keep the admin and payment setup you already have. I work within what your plan supports and flag anything that needs an upgrade.",
      },
      {
        q: "Do you build custom apps too?",
        a:
          "When a store needs behaviour no app provides, I build a custom integration or app that fits your workflow. This is usually scoped separately once the store structure is clear.",
      },
      {
        q: "Will my store still be fast with apps installed?",
        a:
          "Apps add JavaScript and requests, which can slow a store down. I review what you actually need and keep performance in mind when choosing and wiring integrations.",
      },
      {
        q: "Can you migrate my store from another platform?",
        a:
          "Yes. I plan the migration to preserve your products, SEO and customer history, then rebuild the storefront on Shopify so nothing is lost in the move.",
      },
    ],
    cta: "Get a Shopify quote",
  },
  {
    slug: "python-automation",
    title: "Python Automation, Web Scraping & Data Services",
    description:
      "Python automation and web data services: scraping, monitoring, alerting and reporting that remove repetitive work from your team.",
    h1: "Python Automation & Web Data",
    intro:
      "Some of the most valuable work is invisible: a script that watches a marketplace, collects data on schedule, and alerts you the moment something changes. I build Python automation and data pipelines that remove repetitive work and give you a reliable, current view of your data.",
    sections: [
      {
        heading: "Data collection done right",
        body:
          "Pulling data from websites, marketplaces or internal tools is easy to start and hard to keep reliable. I build collectors that handle pagination, changes in page structure, and polite rate limits — so the data stays accurate after the first run.",
      },
      {
        heading: "Monitoring and alerting",
        body:
          "Automation is most useful when it tells you something you would otherwise miss. I build workflows that watch for changes — prices, availability, competitors — and notify you only when there is something worth acting on.",
      },
      {
        heading: "Reports your team can use",
        body:
          "Raw data is only useful if it reaches the right people in the right shape. I pipe collected data into clean, scheduled reports and dashboards your team can read without engineering help.",
      },
    ],
    deliverables: [
      "Custom Python automation scripts and workflows",
      "Web and marketplace data collection",
      "Scheduled monitoring and alerting",
      "Data cleaning and scheduled reporting",
      "Integrations between tools that do not talk natively",
      "Documentation and error handling you can maintain",
    ],
    faqs: [
      {
        q: "Is web scraping okay to use?",
        a:
          "Automation must respect the site's terms, robots rules and the law. I scope scraping projects within those limits and prefer official APIs where they exist.",
      },
      {
        q: "How do you keep automation from breaking?",
        a:
          "Websites change, so I build with change in mind: clear structure, error handling, and monitoring that flags when a collector needs attention before you notice it is stale.",
      },
      {
        q: "Can you integrate with the tools we already use?",
        a:
          "Yes. Most of the value is connecting what you already have — spreadsheets, CRMs, notifications — so the output lands where your team already works.",
      },
      {
        q: "How is this different from AI automation?",
        a:
          "AI automation handles judgment tasks like summarizing and classifying. Python automation handles the deterministic work: moving, transforming and monitoring data at scale. Many projects use both.",
      },
    ],
    cta: "Discuss your automation",
  },
];

export const serviceBySlug = (slug: string): Service | undefined =>
  services.find((s) => s.slug === slug);
