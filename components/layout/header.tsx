"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Blog", href: "/blog" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Glossary", href: "/glossary" },
  { label: "Compare", href: "/compare" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#f5f5f2]/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg">&#x2726;</span>
          <span className="font-sans text-[16px] font-semibold tracking-[-0.32px] text-[#121212]">
            Sayyad Adeel
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-[8px] px-3 py-1.5 font-tight text-[14px] transition-colors ${
                  isActive
                    ? "bg-black/[0.05] text-[#121212] font-medium"
                    : "text-black/50 hover:text-[#121212]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
