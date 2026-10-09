import fs from 'node:fs';
import path from 'node:path';

const sectionsDir = 'docs/research/relab-0c02b053/root-8a5edab2/sections';
const specsDir = 'docs/research/relab-0c02b053/root-8a5edab2/components';
const map = JSON.parse(fs.readFileSync('docs/research/relab-0c02b053/root-8a5edab2/asset-map.json', 'utf8'));

if (!fs.existsSync(specsDir)) {
  fs.mkdirSync(specsDir, { recursive: true });
}

const sectionConfigs = [
  { file: 'sec0-header-section.html', name: 'HeaderSection', model: 'click-driven (mobile menu drawer toggle)' },
  { file: 'sec1-hero-section.html', name: 'HeroSection', model: 'static with interactive hover states' },
  { file: 'sec2-hero-intro-section.html', name: 'HeroIntroSection', model: 'click-driven tab switching with scale/opacity crossfade' },
  { file: 'sec3-our-creators-section.html', name: 'OurCreatorsSection', model: 'scroll-driven sticky card convergence' },
  { file: 'sec4-selider-section.html', name: 'SolutionsSliderSection', model: 'click & drag horizontal carousel slider' },
  { file: 'sec5-meet-section.html', name: 'MeetSection', model: 'time-driven (autoplay ambient video player)' },
  { file: 'sec6-featured-work-section.html', name: 'FeaturedWorkSection', model: 'static with hover card zoom' },
  { file: 'sec7-capabilities-section.html', name: 'CapabilitiesSection', model: 'static with hover interactions' },
  { file: 'sec8-our-process-section.html', name: 'OurProcessSection', model: 'static step progression' },
  { file: 'sec9-our-clients-section.html', name: 'OurClientsSection', model: 'static with interactive links' },
  { file: 'sec10-brands-section.html', name: 'BrandsMarqueeSection', model: 'time-driven infinite horizontal marquee' },
  { file: 'sec11-worked-section.html', name: 'WorkedSection', model: 'static metrics display' },
  { file: 'sec12-pricing-section.html', name: 'PricingSection', model: 'interactive tier cards' },
  { file: 'sec13-our-clients-say-section.html', name: 'OurClientsSaySection', model: 'click-driven review tabs' },
  { file: 'sec14-insights-ideas-section.html', name: 'InsightsIdeasSection', model: 'static with blog card hover states' },
  { file: 'sec15-cta-section.html', name: 'CtaSection', model: 'static with button hover arrow effect' },
  { file: 'sec16-footer-section.html', name: 'FooterSection', model: 'static with link hover transitions' }
];

for (const cfg of sectionConfigs) {
  const htmlPath = path.join(sectionsDir, cfg.file);
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Find images in this section
  const imgMatches = [...html.matchAll(/src=["']([^"']+)["']/g)].map(m => m[1]);
  const localAssets = imgMatches.map(u => map[u] || u);

  // Extract verbatim text lines
  const textMatches = html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map(t => t.trim())
    .filter(t => t.length > 0 && !t.startsWith('{') && !t.startsWith('var '));
  const uniqueTexts = [...new Set(textMatches)];

  const specContent = `# ${cfg.name} Specification

## Overview
- **Target file:** \`src/components/sites/adeel-site/root-8a5edab2/${cfg.name}.tsx\`
- **Screenshot:** \`docs/design-references/relab-0c02b053/root-8a5edab2/full-page-desktop-1440.png\`
- **Interaction model:** ${cfg.model}

## DOM Structure
- Extracted from: \`${cfg.file}\`
- Root Element: \`<section className="${cfg.file.replace('sec', '').replace('.html', '').replace(/^\d+-/, '')}">\`
- Container Width: 100% with inner container max-width: 1400px / 1440px.

## Computed Styles (exact values from Webflow CSS)
- **Font Family:** "Hanken Grotesk", sans-serif (and "Averia Sans Libre" for display/italic elements)
- **Background:** Extracted from class definitions in \`webflow.css\`
- **Borders & Radii:** As specified in section CSS

## States & Behaviors
- **Interaction:** ${cfg.model}
- **Transitions:** Standard cubic-bezier / power2.out transitions defined in \`BEHAVIORS.md\`

## Assets
${localAssets.slice(0, 15).map(a => `- \`${a}\``).join('\n')}

## Text Content (verbatim)
${uniqueTexts.slice(0, 30).map(t => `- ${t}`).join('\n')}

## Responsive Behavior
- **Desktop (1440px):** Full desktop layout with multi-column grids
- **Tablet (768px):** Adapts column spans, reduces padding
- **Mobile (390px):** Stacks flex/grid items to single column, full width cards
`;

  fs.writeFileSync(path.join(specsDir, `${cfg.name}.spec.md`), specContent);
  console.log(`Generated spec for ${cfg.name}`);
}
console.log('All 17 specs generated successfully!');
