/**
 * The Writing section: long-form guides written in the site's first-person
 * voice, aimed at people who are researching whether to hire a developer. They
 * rank for buyer-research queries and funnel to the contact page.
 *
 * ## Scheduling
 *
 * Every article carries a `status` and a `publishedAt` date. `isLive` is the
 * single source of truth for whether an article is publicly visible:
 *
 *   - `published` + a date in the past  -> live.
 *   - `scheduled` + a date in the future -> hidden (404) until that date.
 *   - `draft`                            -> always hidden.
 *
 * The `/writing` index, the article pages and the sitemap all read `isLive`,
 * so flipping `status`/`publishedAt` is all a schedule needs. Nothing is ever
 * visible before its date, and hidden articles return 404 so they are not
 * reachable by URL either.
 *
 * Keep articles people-first. These are honest, experience-based guides, not
 * keyword-stuffed landing pages; the keywords are the subjects the articles
 * genuinely answer.
 */

export type ArticleBlock =
  | { t: "p"; x: string }
  | { t: "h2"; x: string }
  | { t: "ul"; x: string[] }
  | { t: "quote"; x: string };

export type Article = {
  slug: string;
  title: string;
  /** Short, used on the index cards and as the meta description. */
  meta: string;
  cluster: "web" | "automation";
  tags: string[];
  /** ISO date string. */
  publishedAt: string;
  status: "published" | "scheduled" | "draft";
  readingMinutes: number;
  body: ArticleBlock[];
};

export const articles: Article[] = [
  {
    slug: "how-much-to-hire-web-developer",
    title: "How much does it cost to hire a web developer in 2026?",
    meta:
      "A realistic guide to web developer pricing in 2026 — hourly rates, project quotes, what they include, and where costs quietly hide.",
    cluster: "web",
    tags: ["web development", "pricing", "hiring"],
    publishedAt: "2026-10-25T09:00:00Z",
    status: "published",
    readingMinutes: 6,
    body: [
      { t: "p", x: "If you are reading this, you are probably trying to put a number on something that does not have an obvious price tag. You are not alone. \"How much does it cost to hire a web developer?\" is one of the first questions every business asks, and it is one of the hardest to answer cleanly, because the honest answer is: it depends on what you actually need." },
      { t: "h2", x: "The three ways developers charge" },
      { t: "p", x: "Most developers price their work one of three ways, and each suits a different situation." },
      { t: "ul", x: [
        "Hourly. Common for maintenance, small fixes, and projects where the scope is genuinely unknown. Rates vary widely, but you are paying for their time and attention, not for a finished thing.",
        "Fixed project price. You agree on a deliverable and a price before work starts. This is usually the best fit for a defined project like a marketing site or a store — you know what you are buying, and they carry the risk of the scope staying put.",
        "Retainer. A monthly fee for an ongoing relationship — a set number of hours, or standing availability for changes and support. This works well once a site is built and needs a long-term caretaker.",
      ] },
      { t: "h2", x: "What the range actually looks like" },
      { t: "p", x: "Ballpark figures are useful only as a floor. A simple one-page or three-page brochure site might fall at the low end. A full ecommerce store with payments, inventory, and a custom admin panel lives at the high end. The difference is not the developer being expensive; it is the amount of moving parts." },
      { t: "p", x: "The cheapest quote is rarely the cheapest project. If a price looks too good to be true, ask what it does not include — hosting setup, copy, images, training, or fixes after launch are common things that get quoted separately." },
      { t: "h2", x: "Where the costs quietly hide" },
      { t: "ul", x: [
        "Scope creep. The project that grew from \"three pages\" to \"and can it do this too\" is the classic cause of a quote being exceeded. A good developer writes down what is included so that \"this too\" costs extra in the open.",
        "Ongoing costs. Domains, hosting, email, payment processing, third-party tools — these are recurring and are usually separate from the build itself.",
        "Content. You or someone needs to write the words, take the photos, and supply the products. That time is real even though no developer bills for it.",
        "Support after launch. A site is never really finished. Ask what happens a month after launch, and budget for looking after it.",
      ] },
      { t: "quote", x: "What you are really buying is not a website. It is the certainty that the website works, looks the way you want, and can be changed when your business changes." },
      { t: "h2", x: "How to get a useful number" },
      { t: "p", x: "Send the same brief to two or three developers and compare what they ask. A good brief says what the site must do, who it is for, and what success looks like — not which colours you like. You will learn more from the questions they ask back than from their prices." },
      { t: "p", x: "If you want a feel for what a project like yours involves and what it should cost, I have built a range of projects — from storefronts to fully custom platforms — and I am happy to look at your brief and give you a straight answer, including whether it is a one-person project at all. Reach me through the contact page." },
    ],
  },
  {
    slug: "what-does-a-nextjs-developer-do",
    title: "What does a Next.js developer actually do?",
    meta:
      "What a Next.js developer does day to day, why companies hire them, and how to tell a strong one from someone who just knows React.",
    cluster: "web",
    tags: ["next.js", "react", "web development"],
    publishedAt: "2026-11-02T09:00:00Z",
    status: "scheduled",
    readingMinutes: 5,
    body: [
      { t: "p", x: "Next.js has become one of the most common answers to \"what should we build our website with?\" — and once you hear that, the natural question is what the person who works in it actually does all day. This is a plain-language answer." },
      { t: "h2", x: "Next.js in one sentence" },
      { t: "p", x: "Next.js is a framework built on top of React, a JavaScript library for building user interfaces. It adds the plumbing that React leaves up to you: routing between pages, server-rendering so content is fast and crawlable, image optimisation, and the ability to run parts of your app on the server." },
      { t: "h2", x: "What the developer actually does" },
      { t: "ul", x: [
        "Turn a design into working pages. They take a design — or an idea — and build the real, interactive product: layouts, components, navigation, forms, and the logic that ties them together.",
        "Make it fast. A Next.js developer thinks about how fast a page appears, how much data it loads, and how images are served. Speed is part of the job, not a bonus.",
        "Connect the data. Almost every real site needs to read and write data — products, blog posts, profiles, bookings. A big part of the work is wiring the site to a database or a third-party service, and keeping that secure.",
        "Handle the moving parts. Authentication, payments, emails, search — these are all integrations that someone has to build and maintain.",
        "Keep it working. Fixing bugs, updating dependencies, and adding features over time is the long tail of the job. Most developers spend more time maintaining than building.",
      ] },
      { t: "h2", x: "How to tell a strong one from someone who just knows React" },
      { t: "ul", x: [
        "They can explain trade-offs. Anyone can write code that works on their own machine. A strong developer can tell you why a page is slow and what the options are — not just that they will \"make it better\".",
        "They care about how it loads. Ask them how they would make a slow page faster. Their answer tells you whether they think about real users.",
        "They ask about your goals. A developer who asks who the site is for and what it needs to do is building for you, not for themselves.",
        "They can show work. Real projects, with real constraints, are the best signal. Anyone can talk; a portfolio shows how they think.",
      ] },
      { t: "p", x: "I build with Next.js and React, and this very site is a Next.js project. If you are evaluating a developer and want to see how one thinks, the projects here are a good starting point — and I am happy to talk through what your project would involve." },
    ],
  },
  {
    slug: "ecommerce-website-development-how-much",
    title: "Ecommerce website development: what it really costs and takes",
    meta:
      "The pieces that go into building an online store — platforms, payments, admin, and the costs that surprise people — and how to scope it.",
    cluster: "web",
    tags: ["ecommerce", "web development", "online store"],
    publishedAt: "2026-11-03T09:00:00Z",
    status: "scheduled",
    readingMinutes: 7,
    body: [
      { t: "p", x: "An online store is not a website, it is a small logistics company that happens to live in a browser. Before you think about design, it is worth knowing what a store actually has to do, because that is what drives both the cost and the timeline." },
      { t: "h2", x: "The pieces of a store" },
      { t: "ul", x: [
        "Product catalogue. How products are organised, searched, and filtered. This feels simple until you have 200 products and every customer wants a different filter.",
        "Cart and checkout. Where customers add, review, and pay. Even a small store touches payment processing, tax, shipping options, and failed payment recovery.",
        "Payments. Card payments, sometimes wallets, and the compliance that goes with handling money. This is usually a third-party integration, but it still has to be built and tested.",
        "Admin and inventory. Where you add products, see orders, and manage stock. If a store is easy for customers but painful for you, it will not survive.",
        "Emails and notifications. Order confirmations, shipping updates, abandoned-cart nudges. These are part of the experience.",
        "Speed and security. A slow or shaky store loses sales. Security is non-negotiable when you are handling payments and customer data.",
      ] },
      { t: "h2", x: "Platforms: buy the parts, not the whole factory" },
      { t: "p", x: "You do not need to build all of this from scratch. Most stores sit on a platform — Shopify is the most common, with plenty of others — and the work becomes tailoring it, integrating it, and making it look and behave the way you want. Fully custom stores exist, but they are the exception, not the rule, and they are dramatically more expensive." },
      { t: "h2", x: "Where the cost actually goes" },
      { t: "ul", x: [
        "The build. The setup, design, integrations, and testing. This is the one-off price you see quoted.",
        "The platform. Monthly fees for the software that runs your store.",
        "Payment processing. A percentage of every sale, not a build cost, but it matters to your margin.",
        "Products and content. Photos, descriptions, and the data behind each product are a real time cost that is usually on you.",
        "Maintenance. Stores change — new products, new promotions, new season — and someone has to do that.",
      ] },
      { t: "quote", x: "The most expensive store is the one that launches with no plan for how you will actually manage it day to day." },
      { t: "p", x: "I have built storefronts and full commerce-adjacent platforms, so I know where the effort really goes. If you are thinking about selling online, tell me a little about what you sell and I will give you an honest read on the simplest path that actually works for you." },
    ],
  },
  {
    slug: "freelance-web-developer-vs-agency",
    title: "Freelance web developer vs agency: how to choose",
    meta:
      "When a freelancer makes sense over an agency — and when it doesn't. A practical decision framework for hiring web help.",
    cluster: "web",
    tags: ["freelance", "agency", "hiring"],
    publishedAt: "2026-11-04T09:00:00Z",
    status: "scheduled",
    readingMinutes: 5,
    body: [
      { t: "p", x: "When you need a website, the two most common options are a freelance developer or an agency. Neither is universally better — they are different tools for different jobs. Here is how to decide which you actually need." },
      { t: "h2", x: "What an agency gives you" },
      { t: "p", x: "Agencies bring a team: designers, developers, project managers, sometimes copywriters and marketers. That means you get more hands, more specialism, and usually a more polished, multi-disciplinary process. You are buying capacity and coverage." },
      { t: "h2", x: "What a freelancer gives you" },
      { t: "p", x: "A freelancer is one person who does the whole job. You get a direct line to the person doing the work, often lower overhead, and a single point of ownership. For a defined project, that can be exactly right." },
      { t: "h2", x: "When a freelancer is the better call" },
      { t: "ul", x: [
        "The project is well-defined. A brochure site, a landing page, a store, a specific build with a clear scope.",
        "You want to talk directly to the builder — not through a project manager.",
        "Budget is a real constraint and you are comfortable being more hands-on yourself.",
        "You need one skill, not a whole marketing department.",
      ] },
      { t: "h2", x: "When an agency is the better call" },
      { t: "ul", x: [
        "You need a campaign, not just a site — design plus content plus SEO plus ongoing marketing.",
        "You need several people working in parallel on a tight, large deadline.",
        "You want a single partner to own a long, evolving relationship with a bigger surface area.",
        "A brand refresh where design is as important as engineering.",
      ] },
      { t: "h2", x: "The honest middle ground" },
      { t: "p", x: "A good freelancer can sometimes feel like a mini-agency, and a small agency can feel like a freelancer with a bigger invoice. The real question is whether you are buying one person's focused work or a team's breadth — and paying accordingly." },
      { t: "p", x: "I work as a solo developer, which suits projects where you want one person who owns the result end to end. If that sounds like your situation, I am happy to look at your project and tell you honestly whether it is a good fit for a freelancer — or whether you would be better served by a team." },
    ],
  },
  {
    slug: "website-builder-vs-freelance-developer",
    title: "Website builder or a developer? What to pick for your business",
    meta:
      "Should you use Wix, Squarespace, or a similar builder — or hire a developer? Honest, practical criteria for small businesses.",
    cluster: "web",
    tags: ["small business", "website builders", "web development"],
    publishedAt: "2026-11-05T09:00:00Z",
    status: "scheduled",
    readingMinutes: 5,
    body: [
      { t: "p", x: "If you run a small business, the smartest tool for your website might be a drag-and-drop builder — or it might be a developer. The answer depends on what the site has to do, not on which one feels more impressive." },
      { t: "h2", x: "When a builder is the right choice" },
      { t: "ul", x: [
        "You just need a credible online presence — a few pages that tell people who you are and how to reach you.",
        "You want to edit it yourself, often, without waiting for anyone.",
        "Your needs are standard: booking, simple ecommerce, a contact form, a gallery.",
        "The cost and speed of a builder outweigh the flexibility a custom build gives you.",
      ] },
      { t: "h2", x: "When you should hire a developer" },
      { t: "ul", x: [
        "You need something a builder fights you on — custom behaviour, unusual integrations, a specific experience for your users.",
        "Performance matters and the site needs to be built to be fast and scalable.",
        "You need to handle data — members, bookings, listings, orders — with rules that a template cannot express.",
        "You are building something that is part of your actual product, not just a brochure.",
      ] },
      { t: "h2", x: "The trap in the middle" },
      { t: "p", x: "The most common mistake is choosing a builder, hitting its limits six months later, and paying twice — once for the builder, once for the move. The reverse mistake is paying for a custom build for a brochure that a template would have handled perfectly. Neither is wrong; they are just mismatched." },
      { t: "quote", x: "Ask what the site must do in a year, not what it must look like today. That is what decides builder versus developer." },
      { t: "h2", x: "A way to decide" },
      { t: "p", x: "Write down the three things the site absolutely has to do. If all three are standard, start with a builder. If any of them makes you wonder how you would do it in a template, talk to a developer before you invest in the template. I am happy to take a quick look and tell you which side you are really on." },
    ],
  },
  {
    slug: "when-to-hire-python-automation-developer",
    title: "Business automation: when it's time to hire a Python developer",
    meta:
      "Signs your manual processes are costing more than a developer would, and what automation projects realistically involve.",
    cluster: "automation",
    tags: ["python", "automation", "ai"],
    publishedAt: "2026-11-06T09:00:00Z",
    status: "scheduled",
    readingMinutes: 6,
    body: [
      { t: "p", x: "Most businesses do not need an automation developer until the day they do. The work is quiet until you notice it: copying data between spreadsheets, re-typing the same numbers, checking pages manually, sending the same emails. Across a year, that quiet work is a real cost. This guide is about spotting when it is time to stop doing it by hand." },
      { t: "h2", x: "Why Python" },
      { t: "p", x: "Python is the most common language for this kind of glue work because it has a library for almost everything — pulling from websites, talking to APIs, processing documents, sending messages, and working with data. It is also readable, which matters when a person has to maintain the automation after the original developer is gone." },
      { t: "h2", x: "Signs it is time" },
      { t: "ul", x: [
        "A task takes a person hours, every week, and follows the same steps each time.",
        "You are copying data from one system into another by hand — the kind of copy that introduces typos.",
        "You need to monitor something — prices, competitors, availability, uptime — that you can only check by looking at it.",
        "Updating records, generating reports, or sending routine messages eats the time you would rather spend on the work that makes money.",
        "You have a rule that is always applied the same way, but people apply it inconsistently.",
      ] },
      { t: "h2", x: "What automation projects actually look like" },
      { t: "ul", x: [
        "Data moving. Pulling data from one place and putting it somewhere structured — a spreadsheet, a database, a report.",
        "Monitoring and alerts. Checking a source on a schedule and telling you (via email, chat, or a dashboard) when something changes or crosses a threshold.",
        "Document processing. Turning incoming documents, emails, or forms into clean, usable records.",
        "Reporting. Assembling numbers into a report you can rely on, without someone spending an afternoon building it by hand.",
      ] },
      { t: "h2", x: "What it costs and how to scope it" },
      { t: "p", x: "Automation is usually a fixed project or a small retainer, and the price tracks the complexity of what is being automated. A simple, well-defined script can be quick; a system that has to be reliable, monitored, and resilient is a bigger commitment. Start with one painful, boring task and automate it well before thinking about everything at once." },
      { t: "quote", x: "A good automation is one you forget about because it just works — not one that needs a babysitter." },
      { t: "p", x: "I build exactly this kind of system — I have shipped monitoring and market-intelligence tools that watch sources around the clock and alert on what matters. If you have a task you are tired of doing by hand, tell me what it is and I will give you an honest take on whether it is worth automating, and what it would take." },
    ],
  },
];

/** True when an article is publicly visible right now. */
export function isLive(article: Article): boolean {
  return article.status === "published" && Date.parse(article.publishedAt) <= Date.now();
}

export function liveArticles(): Article[] {
  return articles.filter(isLive);
}

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticleBySlugList(): string[] {
  return articles.map((a) => a.slug);
}
