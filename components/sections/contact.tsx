"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE_CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Contact() {
  const reducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const animateProps = (delay: number) =>
    reducedMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 12, filter: "blur(3px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { type: "tween" as const, duration: 0.5, ease: EASE_CUBIC, delay },
        };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("hello@adeelsayyad.tech");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the mailto link still works
    }
  };

  return (
    <section id="contact" className="relative w-full overflow-hidden bg-[#f8f5ee] py-24 md:py-32">
      {/* Subtle grid decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 71px, rgba(0,0,0,0.15) 71px, rgba(0,0,0,0.15) 72px), repeating-linear-gradient(90deg, transparent, transparent 71px, rgba(0,0,0,0.15) 71px, rgba(0,0,0,0.15) 72px)`,
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6">
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Badge */}
          <motion.div
            {...animateProps(0.04)}
            className="relative flex items-center gap-2 border border-dashed border-black/10 px-4 py-3"
          >
            <span className="absolute top-0 left-0 h-2 w-2 border-t border-l border-black/20" />
            <span className="absolute top-0 right-0 h-2 w-2 border-t border-r border-black/20" />
            <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-black/20" />
            <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-black/20" />
            <span className="text-lg">&#x2726;</span>
            <span className="font-lato text-[14px] font-bold tracking-[-0.42px] text-[#121212]">
              Get in Touch
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            {...animateProps(0.08)}
            className="max-w-2xl font-instrument-serif text-[32px] leading-[1.1] tracking-[-0.96px] text-[#121212] md:text-[48px] md:tracking-[-1.44px]"
          >
            Have a website or project in mind?
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            {...animateProps(0.12)}
            className="max-w-md font-tight text-[16px] leading-[1.6] tracking-[-0.32px] text-black/50 md:text-[18px] md:tracking-[-0.36px]"
          >
            I design and build digital experiences with AI. Email is the fastest
            way to reach me — about a project, a collaboration, or just to
            follow what I&apos;m making.
          </motion.p>

          {/* Email actions */}
          <motion.div
            {...animateProps(0.16)}
            className="flex flex-col items-center gap-3 sm:flex-row"
          >
            <a
              href="mailto:hello@adeelsayyad.tech"
              className="group inline-flex h-[46px] items-center gap-2 rounded-[36px] border border-black bg-[linear-gradient(180deg,#4d4d4d_0%,#0a0a0a_100%)] px-8 text-[15px] font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-opacity hover:opacity-90"
            >
              hello@adeelsayyad.tech
              <svg className="size-[14px] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="inline-flex h-[46px] items-center gap-2 rounded-[36px] border border-black/10 bg-white px-8 text-[15px] font-medium text-[#121212] transition-colors hover:border-black/20"
            >
              {copied ? "Copied ✓" : "Copy email"}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
