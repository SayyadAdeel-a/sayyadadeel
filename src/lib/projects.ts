/**
 * The portfolio's project list.
 *
 * The homepage shows the same three projects in two places: the "Selected
 * Projects" slider (`#work`) and the first box of the Explore grid in the
 * pricing section. Both used to spell their own copy out in JSX, so adding a
 * project meant editing two components and keeping them in step by hand. This
 * file is that list, declared once; both components map over `projects`.
 *
 * ## Adding or updating a project
 *
 * Add an object to `projects` at the position it should appear in the slider.
 * Everything you must fill in is content; `layout` picks the card's visual
 * variant, described below.
 *
 * Two files must agree on the project's imagery, and both live in
 * `public/assets/home/05-solutions-slider/`:
 *
 *  - the screenshot, as `<slug>.avif` at full width **and** `<slug>-p-500.avif`
 *    at 500px. `sizes` is `100vw` in the component, so without the smaller
 *    variant every phone downloads the full-size file.
 *  - the two decorative cut-outs floating over the card.
 *
 * Run `npm run assets:doc` after adding them so `ASSETS.md` picks them up.
 *
 * ## What `layout` controls
 *
 * Each card variant was a hand-tuned set of CSS classes and background art, and
 * they are not interchangeable -- the modifiers position the cut-outs, size the
 * badge and shift the text block per variant. Rather than expose six unrelated
 * class names per project, `projectLayouts` maps one name to the whole set.
 * Reusing a variant across projects is fine; the classes carry no ordering.
 */

/** The card variants the slider was designed with. */
export type ProjectLayout = "one" | "two" | "three";

/**
 * The class names and art that make up one card variant.
 *
 * The empty strings are slots that this variant does not override: the base
 * markup still needs the class attribute, it just carries no extra token.
 * `leftWrapClass` and `rightWrapClass` nudge a floating cut-out; `textWrapClass`
 * nudges the whole text block, which only the third variant does.
 */
type ProjectLayoutSpec = {
  bgImage: string;
  loveIcon: string;
  textWrapClass: string;
  imageWrapClass: string;
  badgeClass: string;
  leftWrapClass: string;
  rightWrapClass: string;
  loveWrapClass: string;
};

export const projectLayouts: Record<ProjectLayout, ProjectLayoutSpec> = {
  one: {
    bgImage: "/assets/home/05-solutions-slider/contain-size-image-group-37388.svg",
    loveIcon: "/assets/home/_shared/contain-size-image-image-235.svg",
    textWrapClass: "",
    imageWrapClass: "card-one",
    badgeClass: "card-text-one",
    leftWrapClass: "",
    rightWrapClass: "",
    loveWrapClass: "love-text-one",
  },
  two: {
    bgImage: "/assets/home/05-solutions-slider/contain-size-image-group-37389.svg",
    loveIcon: "/assets/home/05-solutions-slider/contain-size-image-image-235.avif",
    textWrapClass: "",
    imageWrapClass: "card-two",
    badgeClass: "card-text-two",
    leftWrapClass: "",
    rightWrapClass: "slide-image-two",
    loveWrapClass: "love-text-two",
  },
  three: {
    bgImage: "/assets/home/05-solutions-slider/contain-size-image-group-37390.svg",
    loveIcon: "/assets/home/05-solutions-slider/contain-size-image-image-235.avif",
    textWrapClass: "card-three",
    imageWrapClass: "card-three",
    badgeClass: "card-text-three",
    leftWrapClass: "slide-image-left-three",
    rightWrapClass: "slide-image-right-three",
    loveWrapClass: "love-text-three",
  },
};

/** A screenshot and the widths it is offered at. */
type ProjectImage = {
  /** The full-width file, also the last candidate in `srcSet`. */
  src: string;
  /**
   * Written verbatim into `srcSet`, so it repeats `src` at the end on purpose.
   * Candidates go smallest-first, each as `<path> <width>w`.
   */
  srcSet: string;
  /**
   * Read by screen readers; the older entries still carry the template's
   * placeholder so their markup does not change. New projects should describe
   * what the image actually shows.
   */
  alt: string;
};

export type Project = {
  /** The two tag words above the title, rendered in order. */
  tags: [string, string];
  title: string;
  /**
   * Slug of a related Writing guide, surfaced as a small link on the card so
   * the projects and guides cross-link to each other.
   */
  guideSlug?: string;
  description: string;
  /**
   * Where "View Project" goes. All three currently jump to `#featured-work`,
   * because there are no per-project pages yet -- replace with a real URL as
   * soon as one exists.
   */
  href: string;
  /** The two lines on the card's floating badge; the first is set in bold. */
  note: [string, string];
  /** The label beside the heart icon. */
  loveLabel: string;
  image: ProjectImage;
  /** Cut-out art floating over the left and right edges of the card. */
  leftCutout: string;
  rightCutout: string;
  layout: ProjectLayout;
};

export const projects: Project[] = [
  {
    tags: ["Automation", "Market Intelligence"],
    title: "Cardmarket Intelligence",
    guideSlug: "when-to-hire-python-automation-developer",
    description:
      "A sophisticated Python-based marketplace monitoring and market intelligence system built for continuous Cardmarket listing surveillance. Features advanced browser automation, Cloudflare challenge handling, intelligent listing extraction, historical price tracking, and instant Discord/Slack alerts when listings match configured price thresholds.",
    href: "https://github.com/SayyadAdeel-a/Cardmarket-scraper",
    note: ["24/7 Monitoring", "Real-Time Price Alerts"],
    loveLabel: "Automation",
    image: {
      src: "/assets/home/05-solutions-slider/cardmarket-intelligence.avif",
      srcSet:
        "/assets/home/05-solutions-slider/cardmarket-intelligence-p-500.avif 500w, /assets/home/05-solutions-slider/cardmarket-intelligence.avif 652w",
      alt: "Cardmarket Intelligence market price trend chart and TCG order book",
    },
    leftCutout: "/assets/home/05-solutions-slider/ring-al-photoroom-1.avif",
    rightCutout: "/assets/home/05-solutions-slider/tknot-3-photoroom-1.avif",
    layout: "two",
  },
  {
    tags: ["Logistics", "Full-Stack"],
    title: "Nexus Logistics",
    guideSlug: "what-does-a-nextjs-developer-do",
    description:
      "A comprehensive full-stack last-mile courier and parcel delivery platform that connects customers, dispatchers, drivers, and administrators through five specialized role-based portals. Features shipment management, real-time consignment tracking, automated invoicing, mobile driver workflows, secure document storage, and operational analytics.",
    href: "https://nexusogisticss.vercel.app/",
    note: ["5 Role Portals", "35 Application Routes"],
    loveLabel: "Logistics Platform",
    image: {
      src: "/assets/home/05-solutions-slider/nexus-logistics.avif",
      srcSet:
        "/assets/home/05-solutions-slider/nexus-logistics-p-500.avif 500w, /assets/home/05-solutions-slider/nexus-logistics.avif 652w",
      alt: "Nexus Logistics platform showing shipment and consignment tracking",
    },
    leftCutout: "/assets/home/05-solutions-slider/noodle-al-photoroom-1.avif",
    rightCutout: "/assets/home/05-solutions-slider/tknot-3-photoroom-1.avif",
    layout: "three",
  },
  {
    tags: ["E-commerce", "Design"],
    title: "Donut Website",
    guideSlug: "ecommerce-website-development-how-much",
    description:
      "A playful storefront experiment focused on colorful visuals, products, and a simple shopping experience.",
    href: "#featured-work",
    note: ["Sweet UI ", "Fun Build"],
    loveLabel: "Store Design",
    image: {
      src: "/assets/home/05-solutions-slider/donut-website.avif",
      srcSet:
        "/assets/home/05-solutions-slider/donut-website-p-500.avif 500w, /assets/home/05-solutions-slider/donut-website.avif 652w",
      alt: "Slider Image",
    },
    leftCutout: "/assets/home/05-solutions-slider/noodle-al-photoroom-1.avif",
    rightCutout: "/assets/home/05-solutions-slider/ring-al-photoroom-1.avif",
    layout: "one",
  },
  {
    tags: ["Storefront", "Web"],
    title: "E-commerce Website",
    guideSlug: "ecommerce-website-development-how-much",
    description:
      "An online store project exploring product presentation, browsing, and a clean shopping experience.",
    href: "#featured-work",
    note: ["Clean Layout ", "Store Flow"],
    loveLabel: "Product Grid",
    image: {
      src: "/assets/home/05-solutions-slider/ecommerce-website.avif",
      srcSet:
        "/assets/home/05-solutions-slider/ecommerce-website-p-500.avif 500w, /assets/home/05-solutions-slider/ecommerce-website.avif 652w",
      alt: "Slider Image",
    },
    leftCutout: "/assets/home/05-solutions-slider/ring-al-photoroom-1.avif",
    rightCutout: "/assets/home/05-solutions-slider/tknot-3-photoroom-1.avif",
    layout: "two",
  },
  {
    tags: ["AI Agents", "Experiment"],
    title: "AgentOS",
    guideSlug: "when-to-hire-python-automation-developer",
    description:
      "An experiment exploring how multiple coding agents can plan, divide tasks, and work together.",
    href: "#featured-work",
    note: ["Multi-Agent ", "WIP"],
    loveLabel: "CLI Tool",
    image: {
      src: "/assets/home/05-solutions-slider/agentos.avif",
      srcSet:
        "/assets/home/05-solutions-slider/agentos-p-500.avif 500w, /assets/home/05-solutions-slider/agentos.avif 652w",
      alt: "Slider Image",
    },
    leftCutout: "/assets/home/05-solutions-slider/noodle-al-photoroom-1.avif",
    rightCutout: "/assets/home/05-solutions-slider/tknot-3-photoroom-1.avif",
    layout: "three",
  },
];
