"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE_CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

const socialLinks = [
  {
    name: "GitHub",
    href: "https://github.com/adeelsayyad",
    icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>,
  },
  {
    name: "Email",
    href: "mailto:hello@adeelsayyad.tech",
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>,
  },
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
            I&apos;m Sayyad Adeel &mdash; an independent builder creating intelligent software for real-world work.
          </motion.h2>

          {/* Body */}
          <motion.div
            {...animateProps(0.12)}
            className="flex max-w-xl flex-col gap-5 text-[16px] leading-[1.6] tracking-[-0.32px] text-black/50 md:text-[18px] md:tracking-[-0.36px]"
          >
            <p>
              I focus on building tools that solve actual problems &mdash; not just demo-ware. From environmental field operations to AI-powered workflows, I design systems that turn complicated work into simple, repeatable processes.
            </p>
            <p>
              My flagship product is FieldOS, an environmental field operations platform that connects site visits, evidence capture, QA review, and reporting into one seamless workflow.
            </p>
            <p>
              When I&apos;m not building products, I&apos;m exploring new AI capabilities, experimenting with emerging technologies, and thinking about how software can make physical-world work more efficient.
            </p>
          </motion.div>

          {/* Social Links */}
          <motion.div
            {...animateProps(0.16)}
            className="flex items-center gap-3 pt-4"
          >
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-black/[0.02] text-black/40 transition-all duration-200 hover:border-black/20 hover:text-[#121212]"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
