"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE_CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Contact() {
  const reducedMotion = useReducedMotion();
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const animateProps = (delay: number) =>
    reducedMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 12, filter: "blur(3px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { type: "tween" as const, duration: 0.5, ease: EASE_CUBIC, delay },
        };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResult("Sending...");

    const formData = new FormData(event.currentTarget);
    formData.append("access_key", "e9696aee-dc97-4bfe-baae-256bd6797673");

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      setResult("Thanks! I'll be in touch soon.");
      event.currentTarget.reset();
    } else {
      setResult("Something went wrong. Try again.");
    }
    setIsSubmitting(false);
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
              Stay Updated
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            {...animateProps(0.08)}
            className="max-w-2xl font-instrument-serif text-[32px] leading-[1.1] tracking-[-0.96px] text-[#121212] md:text-[48px] md:tracking-[-1.44px]"
          >
            Get early access to what I&apos;m building.
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            {...animateProps(0.12)}
            className="max-w-md font-tight text-[16px] leading-[1.6] tracking-[-0.32px] text-black/50 md:text-[18px] md:tracking-[-0.36px]"
          >
            Join the inner circle. Be the first to know about new products, features, and updates.
          </motion.p>

          {/* Email Form */}
          <motion.form
            {...animateProps(0.16)}
            onSubmit={onSubmit}
            className="flex w-full max-w-[440px] flex-col items-center gap-4"
          >
            <div className="flex w-full items-center gap-2 rounded-[36px] border border-black/10 bg-white px-2 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-shadow focus-within:shadow-[0_2px_16px_rgba(0,0,0,0.08)] focus-within:border-black/20">
              <input
                type="email"
                name="email"
                required
                placeholder="Enter your email"
                className="h-[40px] flex-1 bg-transparent px-4 font-tight text-[15px] text-[#121212] outline-none placeholder:text-black/30"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex h-[40px] items-center gap-2 overflow-hidden rounded-[32px] border border-black bg-[linear-gradient(180deg,#4d4d4d_0%,#0a0a0a_100%)] px-6 text-[14px] font-medium leading-none tracking-[-0.42px] text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-[opacity,transform] duration-200 ease hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="relative z-[1] whitespace-nowrap">
                  {isSubmitting ? "Sending..." : "Get Updates"}
                </span>
                {!isSubmitting && (
                  <svg className="relative z-[1] size-[14px] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                )}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_4px_5px_rgba(0,0,0,0.25)]"
                />
              </button>
            </div>

            {/* Status message */}
            {result && (
              <p className={`font-tight text-[13px] ${result.includes("Thanks") ? "text-green-600" : result.includes("Sending") ? "text-black/40" : "text-red-500"}`}>
                {result}
              </p>
            )}
          </motion.form>

          {/* Social proof */}
          <motion.div
            {...animateProps(0.2)}
            className="flex items-center gap-2 pt-1"
          >
            <div className="flex -space-x-1.5">
              {[
                "bg-[#c8ff00]",
                "bg-[#121212]",
                "bg-[#666666]",
              ].map((bg, i) => (
                <div
                  key={i}
                  className={`size-[20px] rounded-full border-2 border-[#f8f5ee] ${bg} flex items-center justify-center text-[8px] font-bold text-white`}
                >
                  {["A", "M", "S"][i]}
                </div>
              ))}
            </div>
            <span className="font-tight text-[13px] text-black/40">
              Join other builders &amp; early testers
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
