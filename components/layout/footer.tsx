"use client";

import Link from "next/link";

const footerLinks = [
  { label: "FieldOS", href: "https://fieldos.adeelsayyad.tech" },
  { label: "App", href: "https://app.adeelsayyad.tech" },
  { label: "GitHub", href: "https://github.com/adeelsayyad" },
];

const seoLinks = [
  { label: "Blog", href: "/blog" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Glossary", href: "/glossary" },
  { label: "Compare", href: "/compare" },
];

export function Footer() {
  return (
    <footer className="relative w-full border-t border-black/[0.06] bg-[#f8f5ee]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Left */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">&#x2726;</span>
              <span className="font-lato text-[14px] font-bold tracking-[-0.42px] text-[#121212]">
                Sayyad Adeel
              </span>
            </div>
            <p className="font-tight text-[14px] text-black/40">
              Independent builder creating intelligent software for real-world work.
            </p>
          </div>

          {/* Right — Links */}
          <div className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-tight text-[14px] text-black/40 transition-colors hover:text-[#121212]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* SEO Links */}
        <div className="mt-6 flex items-center gap-6">
          {seoLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-tight text-[13px] text-black/30 transition-colors hover:text-[#121212]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-black/[0.04] pt-6 flex items-center justify-between">
          <p className="font-tight text-[12px] text-black/30">
            &copy; {new Date().getFullYear()} Sayyad Adeel. All rights reserved.
          </p>
          <p className="font-tight text-[12px] text-black/30">
            Built with care.
          </p>
        </div>
      </div>
    </footer>
  );
}
