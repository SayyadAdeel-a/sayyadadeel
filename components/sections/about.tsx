"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE_CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

const focusAreas = [
  "Web design",
  "AI-assisted development",
  "Automation",
  "Motion & interaction",
  "Rapid prototyping",
  "Digital products",
];

export function About() {
  const reducedMotion = useReducedMotion();

  const animateProps = (delay: number) =>
    reducedMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 12, filter: "blur(3px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { type: "tween" as const, duration: 0.5, ease: EASE_CUBIC, delay },
        };

  return (
    <section id="about" className="relative w-full overflow-hidden bg-[#f8f5ee] py-24 md:py-32">
      {/* Subtle grid decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 71px, rgba(0,0,0,0.15) 71px, rgba(0,0,0,0.15) 72px), repeating-linear-gradient(90deg, transparent, transparent 71px, rgba(0,0,0,0.15) 71px, rgba(0,0,0,0.15) 72px)`,
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6">
        <div className="flex flex-col items-center gap-12 text-center">
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
              About
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            {...animateProps(0.08)}
            className="max-w-2xl font-instrument-serif text-[32px] leading-[1.1] tracking-[-0.96px] text-[#121212] md:text-[42px] md:tracking-[-1.26px]"
          >
            I&apos;m Sayyad Adeel &mdash; I design, experiment, and build digital
            products.
          </motion.h2>

          {/* Body */}
          <motion.div
            {...animateProps(0.12)}
            className="flex max-w-xl flex-col gap-5 text-[16px] leading-[1.6] tracking-[-0.32px] text-black/50 md:text-[18px] md:tracking-[-0.36px]"
          >
            <p>
              My work combines design, AI tools, coding agents, automation, and constant
              iteration. I&apos;m currently building{" "}
              <a
                href="#studio"
                className="text-[#121212] underline decoration-black/20 underline-offset-4 transition-colors hover:decoration-black/60"
              >
                Sayyad Studio
              </a>{" "}
              — a studio focused on strong digital experiences — while working on websites
              and exploring how AI changes the way creative and technical work gets done.
            </p>
            <p>
              I care less about fitting into a traditional job title and more about being
              able to take an idea, learn whatever is needed, and turn it into something
              real. Most of my process lives at the intersection of concept, design
              decisions, prompting, building, and shipping — with AI doing a lot of the
              heavy lifting and me deciding what&apos;s actually good.
            </p>
            <p>
              The interesting question I&apos;m chasing: how far can one person go by
              combining taste, design, AI, and the ability to actually ship?
            </p>
          </motion.div>

          {/* Focus areas */}
          <motion.div
            {...animateProps(0.16)}
            className="flex max-w-xl flex-wrap items-center justify-center gap-2"
          >
            {focusAreas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 font-tight text-[13px] text-black/55"
              >
                {area}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
