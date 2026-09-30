"use client";

import { Reveal, RevealGroup } from "@/components/hero/reveal";
import { GridRail } from "@/components/hero/grid-rail";

const CornerTicks = ({ size = 8.667, width = 0.722 }: { size?: number; width?: number }) => (
  <>
    {[
      "left-0 top-0 border-l border-t",
      "right-0 top-0 border-r border-t",
      "bottom-0 left-0 border-b border-l",
      "right-0 bottom-0 border-r border-b",
    ].map((position) => (
      <span
        key={position}
        aria-hidden
        className={`absolute border-black/20 ${position}`}
        style={{
          width: size,
          height: size,
          borderWidth: 0,
          borderTopWidth: position.includes("border-t") ? width : 0,
          borderBottomWidth: position.includes("border-b") ? width : 0,
          borderLeftWidth: position.includes("border-l") ? width : 0,
          borderRightWidth: position.includes("border-r") ? width : 0,
          margin: -width,
        }}
      />
    ))}
  </>
);

const ArrowIcon = ({ src }: { src: string }) => (
  <span className="relative block size-[22px] shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-[3px]">
    <span className="absolute inset-[28.66%_35.71%_23.78%_35.72%] block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="absolute inset-0 size-full max-w-none object-contain" />
    </span>
  </span>
);

export const Hero = () => (
  <main className="w-full bg-[#f5f5f2]">
    <div className="relative mx-auto flex min-h-dvh w-full flex-col items-center overflow-hidden ultrawide:max-w-[2000px]">
      <GridRail className="left-0" />
      <GridRail className="right-0" />

      <section className="relative z-10 mx-auto mt-[110px] flex w-full max-w-[402px] flex-col items-center gap-8 px-[43.5px] ipad:mt-[126px] ipad:max-w-[745px] ipad:px-[73px] desktop-sm:mt-[110px] desktop-sm:max-w-[640px] desktop-sm:px-0 full-hd:mt-[128px] full-hd:max-w-[780px] full-hd:gap-10 ultrawide:mt-[176px] ultrawide:max-w-[940px] ultrawide:gap-12">
        <RevealGroup className="flex flex-col items-center gap-5" delay={0.15}>
          {/* Badge */}
          <Reveal className="relative flex items-center justify-center gap-[7.222px] border-[0.722px] border-dashed border-[rgba(2,2,2,0.1)] px-4 py-3">
            <CornerTicks />
            <span
              aria-hidden
              className="absolute top-1/2 left-1/2 h-[44px] w-[222px] -translate-x-1/2 -translate-y-1/2 opacity-5"
              style={{
                backgroundImage: "url(/hero/diagonal-lines.png)",
                backgroundSize: "5.056px 5.056px",
              }}
            />
            <span className="relative flex items-center gap-[10px]">
              <span className="text-lg">&#x2726;</span>
              <span className="font-lato text-[14px] leading-[1.5] font-bold tracking-[-0.42px] text-[#121212]">
                Independent Builder &amp; Designer
              </span>
            </span>
          </Reveal>

          <div className="flex flex-col items-center gap-4">
            <Reveal>
              <h1 className="text-center font-instrument-serif text-[44px] leading-[1.1] tracking-[-1.32px] text-[#121212] ipad:text-[68px] ipad:leading-[74px] ipad:tracking-[-2.04px] full-hd:text-[86px] full-hd:leading-[93px] full-hd:tracking-[-2.58px] ultrawide:text-[106px] ultrawide:leading-[115px] ultrawide:tracking-[-3.18px]">
                I design and build
                <br />
                digital experiences
                <br />
                with AI
              </h1>
            </Reveal>

            <Reveal>
              <p className="w-[316px] text-center font-tight text-[16px] leading-[27px] tracking-[-0.32px] text-[#121212] opacity-60 ipad:w-[460px] ipad:text-[18px] ipad:tracking-[-0.36px] full-hd:w-[540px] full-hd:text-[21px] full-hd:leading-[32px] full-hd:tracking-[-0.42px] ultrawide:w-[660px] ultrawide:text-[25px] ultrawide:leading-[38px] ultrawide:tracking-[-0.5px]">
                Websites, products, and AI-assisted experiments —
                designed with taste, built fast with modern tools,
                and shipped until they feel right.
              </p>
            </Reveal>
          </div>
        </RevealGroup>

        {/* Buttons */}
        <Reveal className="flex items-center gap-4 px-2">
          <a
            href="#work"
            className="group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-[12px] border-t border-white/15 transition-transform duration-200 ease-out [@media(hover:hover)]:hover:-translate-y-[2px] py-[14px] pr-[14px] pl-[24px] shadow-[0px_63px_18px_0px_rgba(16,16,16,0),0px_40px_16px_0px_rgba(11,11,11,0.01),0px_23px_14px_0px_rgba(8,8,8,0.05),0px_10px_10px_0px_rgba(5,5,5,0.09),0px_3px_6px_0px_rgba(0,0,0,0.1)]"
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-[12px]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0.2) 4.0988%, rgba(255,255,255,0) 43.902%), linear-gradient(90deg, rgb(41,41,41) 0%, rgb(41,41,41) 100%)",
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.3)]"
            />
            <span className="relative font-lato text-[16px] leading-[1.5] font-bold tracking-[-0.32px] whitespace-nowrap text-white">
              View My Work
            </span>
            <span className="relative">
              <ArrowIcon src="/hero/arrow-light.svg" />
            </span>
          </a>

          <a
            href="#contact"
            className="group flex cursor-pointer items-center justify-center gap-[10px] self-stretch rounded-[10px] border border-black/10 bg-black/[0.02] py-[14px] pr-[14px] pl-[24px] transition-colors duration-200 ease-out [@media(hover:hover)]:hover:border-black/20 [@media(hover:hover)]:hover:bg-black/[0.05]"
          >
            <span className="font-lato text-[14px] leading-[1.5] font-bold tracking-[-0.42px] whitespace-nowrap text-[#121212]">
              Get in Touch
            </span>
            <ArrowIcon src="/hero/arrow-dark.svg" />
          </a>
        </Reveal>
      </section>

      {/* Scroll hint */}
      <div className="relative z-10 mb-10 mt-auto flex flex-col items-center gap-2 pt-16">
        <span className="font-lato text-[11px] font-bold uppercase tracking-[1.2px] text-black/30">
          Selected work below
        </span>
        <svg
          className="size-[16px] animate-bounce text-black/25"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25 12 15.75 4.5 8.25" />
        </svg>
      </div>
    </div>
  </main>
);
