import fs from 'node:fs';
import path from 'node:path';

const sectionsDir = 'docs/research/relab-0c02b053/root-8a5edab2/sections';
const compDir = 'src/components/sites/adeel-site/root-8a5edab2';
const map = JSON.parse(fs.readFileSync('docs/research/relab-0c02b053/root-8a5edab2/asset-map.json', 'utf8'));

if (!fs.existsSync(compDir)) {
  fs.mkdirSync(compDir, { recursive: true });
}

function parseStyleString(styleStr) {
  if (!styleStr) return null;
  const cleanedStr = styleStr.replaceAll('&quot;', '"').replaceAll('&amp;', '&');
  const styles = {};
  const rules = cleanedStr.split(';');
  for (const rule of rules) {
    const trimmed = rule.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = trimmed.slice(0, colonIdx).trim();
    let val = trimmed.slice(colonIdx + 1).trim();
    if (!prop || !val) continue;

    // convert kebab-case to camelCase
    const camelProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    styles[camelProp] = val;
  }
  return styles;
}

function convertHtmlToJsx(html) {
  let res = html;

  // Replace CDN URLs with local paths
  for (const [remote, local] of Object.entries(map)) {
    res = res.replaceAll(remote, local);
    // Also check URI encoded variants
    const enc = encodeURI(remote);
    if (enc !== remote) {
      res = res.replaceAll(enc, local);
    }
  }

  // Replace attributes
  res = res.replaceAll('class="', 'className="');
  res = res.replaceAll("class='", "className='");
  res = res.replaceAll('for="', 'htmlFor="');
  res = res.replaceAll('autocomplete="', 'autoComplete="');
  res = res.replaceAll('srcset="', 'srcSet="');
  res = res.replaceAll('playsinline=""', 'playsInline');
  res = res.replaceAll('autoplay=""', 'autoPlay');
  res = res.replaceAll('loop=""', 'loop');
  res = res.replaceAll('muted=""', 'muted');
  res = res.replaceAll('required=""', 'required');
  res = res.replaceAll('hidden=""', 'hidden');

  // Convert tabIndex="0" or tabIndex="-1" to tabIndex={0}
  res = res.replace(/tabindex="(-?\d+)"/gi, 'tabIndex={$1}');


  // Convert inline style="..." to style={{ ... }}
  res = res.replace(/style="([^"]*)"/g, (match, p1) => {
    const parsed = parseStyleString(p1);
    if (!parsed || Object.keys(parsed).length === 0) return '';
    return `style={${JSON.stringify(parsed)}}`;
  });

  // Remove noscript fallback blocks that break JSX
  res = res.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '');

  // Self close void elements: img, br, hr, input, source
  res = res.replace(/<(img|br|hr|input|source)([^>]*?)(?<!\/)>/gi, '<$1$2 />');

  // Clean html comments if any
  res = res.replace(/<!--[\s\S]*?-->/g, '');

  return res;
}

const list = [
  { file: 'sec0-header-section.html', name: 'HeaderSection' },
  { file: 'sec1-hero-section.html', name: 'HeroSection' },
  { file: 'sec2-hero-intro-section.html', name: 'HeroIntroSection' },
  { file: 'sec3-our-creators-section.html', name: 'OurCreatorsSection' },
  { file: 'sec4-selider-section.html', name: 'SolutionsSliderSection' },
  { file: 'sec5-meet-section.html', name: 'MeetSection' },
  { file: 'sec6-featured-work-section.html', name: 'FeaturedWorkSection' },
  { file: 'sec7-capabilities-section.html', name: 'CapabilitiesSection' },
  { file: 'sec8-our-process-section.html', name: 'OurProcessSection' },
  { file: 'sec9-our-clients-section.html', name: 'OurClientsSection' },
  { file: 'sec10-brands-section.html', name: 'BrandsMarqueeSection' },
  { file: 'sec11-worked-section.html', name: 'WorkedSection' },
  { file: 'sec12-pricing-section.html', name: 'PricingSection' },
  { file: 'sec13-our-clients-say-section.html', name: 'OurClientsSaySection' },
  { file: 'sec14-insights-ideas-section.html', name: 'InsightsIdeasSection' },
  { file: 'sec15-cta-section.html', name: 'CtaSection' },
  { file: 'sec16-footer-section.html', name: 'FooterSection' }
];

for (const item of list) {
  const rawHtml = fs.readFileSync(path.join(sectionsDir, item.file), 'utf8');
  const jsx = convertHtmlToJsx(rawHtml);
  
  const componentCode = `"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ${item.name}() {
  return (
    <>
      ${jsx}
    </>
  );
}
`;

  fs.writeFileSync(path.join(compDir, `${item.name}.tsx`), componentCode);
  console.log(`Generated JSX for ${item.name}`);
}
console.log('Conversion complete!');
