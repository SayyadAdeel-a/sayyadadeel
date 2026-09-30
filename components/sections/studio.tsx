"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE_CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

const practices = [
  {
    title: "AI-assisted, human-directed",
    body: "Coding agents and AI tools do the heavy lifting. Taste, product decisions, and the final call stay human — mine.",
  },
  {
    title: "Built to be shipped",
    body: "Ideas move to working products fast. Modern frameworks, automation, and iteration loops instead of long roadmaps.",
  },
  {
    title: "Design that carries the work",
    body: "Typography, motion, and interaction are treated as the product, not decoration applied at the end.",
  },
];

export function StudioSection() {
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
    <section id="studio" className="relative w-full overflow-hidden bg-[#121212] py-24 text-[#f5f5f2] md:py-32">
      {/* Subtle grid decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 71px, rgba(255,255,255,0.35) 71px, rgba(255,255,255,0.35) 72px), repeating-linear-gradient(90deg, transparent, transparent 71px, rgba(255,255,255,0.35) 71px, rgba(255,255,255,0.35) 72px)`,
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6">
        <div className="flex flex-col items-center gap-12 text-center">
          {/* Badge */}
          <motion.div
            {...animateProps(0.04)}
            className="relative flex items-center gap-2 border border-dashed border-white/15 px-4 py-3"
          >
            <span className="absolute top-0 left-0 h-2 w-2 border-t border-l border-white/30" />
            <span className="absolute top-0 right-0 h-2 w-2 border-t border-r border-white/30" />
            <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-white/30" />
            <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-white/30" />
            <span className="text-lg">&#x2726;</span>
            <span className="font-lato text-[14px] font-bold tracking-[-0.42px] text-white">
              Now
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            {...animateProps(0.08)}
            className="max-w-2xl font-instrument-serif text-[32px] leading-[1.1] tracking-[-0.96px] md:text-[42px] md:tracking-[-1.26px]"
          >
            Currently building Sayyad Studio.
          </motion.h2>

          {/* Body */}
          <motion.div
            {...animateProps(0.12)}
            className="flex max-w-xl flex-col gap-5 text-[16px] leading-[1.6] tracking-[-0.32px] text-white/55 md:text-[18px] md:tracking-[-0.36px]"
          >
            <p>
              A studio focused on creating strong digital experiences — especially
              websites and AI-assisted creative and product work. It&apos;s where the
              client work, experiments, and products I&apos;m making now come together.
            </p>
            <p className="text-white/40">
              The studio&apos;s own site is on its way. Until then, everything I&apos;m
              building shows up here first.
            </p>
          </motion.div>

          {/* Practices */}
          <motion.div
            {...animateProps(0.16)}
            className="grid w-full max-w-3xl gap-3 text-left md:grid-cols-3"
          >
            {practices.map((p) => (
              <div
                key={p.title}
                className="flex flex-col gap-2 rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-5"
              >
                <h3 className="font-tight text-[15px] font-medium tracking-[-0.2px] text-white">
                  {p.title}
                </h3>
                <p className="font-tight text-[13.5px] leading-[1.6] text-white/45">
                  {p.body}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
