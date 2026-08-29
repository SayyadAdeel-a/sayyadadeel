"use client";

import { BuildingParticles } from "@/components/originkit/ui/hero-20/building-particles";
import { GridRail } from "@/components/originkit/ui/hero-20/grid-rail";
import { Reveal, RevealGroup } from "@/components/originkit/ui/hero-20/reveal";

function asset(file: string) {
  return `/originkit/hero-20/${file}`;
}

const CornerTicks = ({ size = 8.667, width = 0.722 }) => (
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
      <img src={src} alt="" className="absolute inset-0 size-full max-w-none object-contain" />
    </span>
  </span>
);

export const Section24Hero = () => (
  <main className="w-full bg-[#f5f5f2]">
    <div className="relative mx-auto flex min-h-dvh w-full flex-col items-center overflow-hidden ultrawide:max-w-[2000px]">
      <GridRail className="left-0" />
      <GridRail className="right-0" />

      {/* Hero */}
      <section className="relative z-10 mx-auto mt-[113px] flex w-full max-w-[402px] flex-col items-center gap-8 px-[43.5px] ipad:mt-[126px] ipad:max-w-[745px] ipad:px-[73px] desktop-sm:mt-[95.5px] desktop-sm:max-w-[599px] desktop-sm:px-0 full-hd:mt-[128px] full-hd:max-w-[760px] full-hd:gap-10 ultrawide:mt-[176px] ultrawide:max-w-[940px] ultrawide:gap-12">
        <RevealGroup className="flex flex-col items-center gap-5" delay={0.15}>
          {/* Badge */}
          <Reveal className="relative flex items-center justify-center gap-[7.222px] border-[0.722px] border-dashed border-[rgba(2,2,2,0.1)] px-4 py-3">
            <CornerTicks />
            <span
              aria-hidden
              className="absolute top-1/2 left-1/2 h-[44px] w-[222px] -translate-x-1/2 -translate-y-1/2 opacity-5"
              style={{
                backgroundImage: `url(${asset("diagonal-lines.png")})`,
                backgroundSize: "5.056px 5.056px",
              }}
            />
            <span className="relative flex items-center gap-[10px]">
              <span className="text-lg">&#x2726;</span>
              <span className="font-lato text-[14px] leading-[1.5] font-bold tracking-[-0.42px] text-[#121212]">
                Independent Builder &amp; AI Engineer
              </span>
            </span>
          </Reveal>

          <div className="flex flex-col items-center gap-4">
            <Reveal>
              <h1 className="text-center font-instrument-serif text-[44px] leading-[1.1] tracking-[-1.32px] text-[#121212] ipad:text-[68px] ipad:leading-[77px] ipad:tracking-[-2.04px] full-hd:text-[86px] full-hd:leading-[97px] full-hd:tracking-[-2.58px] ultrawide:text-[106px] ultrawide:leading-[120px] ultrawide:tracking-[-3.18px]">
                I build AI-powered software<br />
                for real-world problems
              </h1>
            </Reveal>

            <Reveal>
              <p className="w-[316px] text-center font-tight text-[16px] leading-[27px] tracking-[-0.32px] text-[#121212] opacity-60 ipad:w-[415px] ipad:text-[18px] ipad:tracking-[-0.36px] full-hd:w-[520px] full-hd:text-[21px] full-hd:leading-[32px] full-hd:tracking-[-0.42px] ultrawide:w-[640px] ultrawide:text-[25px] ultrawide:leading-[38px] ultrawide:tracking-[-0.5px]">
                From environmental field operations to intelligent
                workflows &mdash; I design and build tools that
                turn complicated work into simple systems.
              </p>
            </Reveal>
          </div>
        </RevealGroup>

        {/* Buttons */}
        <Reveal className="flex items-center gap-4 px-2">
          <a
            href="https://fieldos.adeelsayyad.tech"
            target="_blank"
            rel="noopener noreferrer"
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
              Explore FieldOS
            </span>
            <span className="relative">
              <ArrowIcon src={asset("arrow-light.svg")} />
            </span>
          </a>

          <a
            href="#contact"
            className="group flex cursor-pointer items-center justify-center gap-[10px] self-stretch rounded-[10px] border border-black/10 bg-black/[0.02] py-[14px] pr-[14px] pl-[24px] transition-colors duration-200 ease-out [@media(hover:hover)]:hover:border-black/20 [@media(hover:hover)]:hover:bg-black/[0.05]"
          >
            <span className="font-lato text-[14px] leading-[1.5] font-bold tracking-[-0.42px] whitespace-nowrap text-[#121212]">
              Get in Touch
            </span>
            <ArrowIcon src={asset("arrow-dark.svg")} />
          </a>
        </Reveal>
      </section>

      {/* Building render */}
      <div
        className="absolute top-125 left-1/2 aspect-753/571 w-[calc(100%-64px)] -translate-x-1/2 ipad:aspect-1383/942 ipad:top-[60%] ipad:w-[calc(100%-104px)] ipad:translate-y-12 desktop-sm:translate-y-0 desktop-sm:top-[100px] desktop-sm:w-[calc(100%-144px)] ultrawide:top-[350px] ultrawide:max-w-[calc(2000px-144px)] [--fade-start:72%] [--fade-mid:88%] ultrawide:[--fade-start:48%] ultrawide:[--fade-mid:72%]"
        style={{
          maskImage:
            "linear-gradient(to bottom, #000 0%, #000 var(--fade-start), rgba(0,0,0,0.55) var(--fade-mid), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, #000 0%, #000 var(--fade-start), rgba(0,0,0,0.55) var(--fade-mid), transparent 100%)",
        }}
      >
        <img
          src={asset("mobile-hero.webp")}
          alt="Sayyad Adeel — AI-powered environmental fieldwork platform"
          width={753}
          height={571}
          className="size-full object-contain ipad:hidden"
          style={{
            maskImage: [
              "linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%)",
              "linear-gradient(to bottom, #000 0%, #000 62%, rgba(0,0,0,0.5) 82%, transparent 100%)",
            ].join(", "),
            WebkitMaskImage: [
              "linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%)",
              "linear-gradient(to bottom, #000 0%, #000 62%, rgba(0,0,0,0.5) 82%, transparent 100%)",
            ].join(", "),
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        />
        <div className="hidden size-full ipad:block">
          <BuildingParticles />
        </div>
      </div>
    </div>
  </main>
);
