"use client";

import { useRef, useCallback, useEffect } from "react";
import type { Project } from "@/lib/projects";

const MAX_TILT = 4;

function useCardTilt() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    const w = wrapperRef.current;
    const c = cardRef.current;
    if (!w || !c) return;
    w.classList.remove("is-hover");
    c.classList.remove("is-tilting");
    c.style.setProperty("--tilt-rx", "0deg");
    c.style.setProperty("--tilt-ry", "0deg");
  }, []);

  const track = useCallback((e: PointerEvent) => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const w = wrapperRef.current;
    const c = cardRef.current;
    if (!w || !c) return;
    const r = w.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    w.classList.add("is-hover");
    c.classList.add("is-tilting");
    c.style.setProperty("--tilt-ry", ((px - 0.5) * MAX_TILT).toFixed(2) + "deg");
    c.style.setProperty("--tilt-rx", ((0.5 - py) * MAX_TILT).toFixed(2) + "deg");
    c.style.setProperty("--tilt-gx", (px * 100).toFixed(1) + "%");
    c.style.setProperty("--tilt-gy", (py * 100).toFixed(1) + "%");
  }, []);

  useEffect(() => {
    const w = wrapperRef.current;
    if (!w) return;
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse") reset();
    };
    const onLeave = (e: Event) => {
      if (e instanceof PointerEvent && e.pointerType === "mouse") reset();
    };
    w.addEventListener("pointermove", track);
    w.addEventListener("pointerup", onPointerUp);
    w.addEventListener("pointercancel", onPointerUp);
    w.addEventListener("pointerleave", onLeave);
    return () => {
      w.removeEventListener("pointermove", track);
      w.removeEventListener("pointerup", onPointerUp);
      w.removeEventListener("pointercancel", onPointerUp);
      w.removeEventListener("pointerleave", onLeave);
    };
  }, [track, reset]);

  return { wrapperRef, cardRef };
}

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

const GridBlocks = ({ cells }: { cells: string[] }) => (
  <div className="grid shrink-0 grid-cols-[repeat(2,34.996px)] grid-rows-[repeat(3,34.996px)] gap-[0.67px] ipad:grid-cols-[repeat(2,52px)] ipad:grid-rows-[repeat(3,52px)] ipad:gap-px">
    {cells.map((c) => (
      <span key={c} className={`bg-[#ededed] opacity-80 ${c}`} />
    ))}
  </div>
);

const MOBILE_GRID_POSITIONS = [
  "col-start-2 row-start-1",
  "col-start-1 row-start-2",
  "col-start-2 row-start-3",
];

const DESKTOP_GRID_POSITIONS = [
  "col-start-1 row-start-1 desktop-sm:col-start-2",
  "col-start-2 row-start-2 desktop-sm:col-start-1",
  "col-start-1 row-start-3 desktop-sm:col-start-2",
];

const CornerGrid = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute top-px left-[calc(50%-8.36px)] flex w-[872.99px] -translate-x-1/2 gap-[178.34px] pl-[286.42px] ipad:left-[calc(50%-0.29px)] ipad:w-[1296px] ipad:gap-[425px] ipad:pl-[319px] desktop-sm:top-[4px] desktop-sm:left-[72px] desktop-sm:w-auto desktop-sm:translate-x-0 desktop-sm:gap-[1008px] desktop-sm:pl-[54px]"
  >
    <GridBlocks cells={MOBILE_GRID_POSITIONS} />
    <GridBlocks cells={DESKTOP_GRID_POSITIONS} />
  </div>
);

const lineMask =
  "[mask-image:linear-gradient(to_bottom,#000_250px,transparent_330px)] " +
  "[-webkit-mask-image:linear-gradient(to_bottom,#000_250px,transparent_330px)] " +
  "ipad:[mask-image:linear-gradient(to_bottom,#000_260px,transparent_340px)] " +
  "ipad:[-webkit-mask-image:linear-gradient(to_bottom,#000_260px,transparent_340px)] " +
  "desktop-sm:[mask-image:linear-gradient(to_bottom,#000_300px,transparent_380px)] " +
  "desktop-sm:[-webkit-mask-image:linear-gradient(to_bottom,#000_300px,transparent_380px)]";

const linePos =
  "left-[calc(50%-8.36px)] -translate-x-1/2 ipad:left-[calc(50%-0.29px)] desktop-sm:left-[72px] desktop-sm:translate-x-0";

const HorizontalLines = () => (
  <div
    aria-hidden
    className={`pointer-events-none absolute top-0 flex w-[872.99px] flex-col gap-[35.027px] opacity-80 ipad:w-[1296px] ipad:gap-[52px] desktop-sm:-top-[50px] desktop-sm:right-[72px] desktop-sm:w-auto ${lineMask} ${linePos}`}
  >
    {Array.from({ length: 18 }, (_, i) => (
      <span
        key={`row-${i}`}
        className="h-[0.674px] w-full shrink-0 bg-[#e0e0e0] shadow-[0px_0.674px_0px_0px_#ffffff] ipad:h-px ipad:shadow-[0px_1px_0px_0px_#ffffff]"
      />
    ))}
  </div>
);

const VerticalLines = () => (
  <div
    aria-hidden
    className={`pointer-events-none absolute top-0 flex h-[615px] w-[872.99px] items-stretch gap-[35.027px] opacity-80 ipad:h-[913px] ipad:w-[1296px] ipad:gap-[52px] desktop-sm:-top-[50px] desktop-sm:right-[72px] desktop-sm:w-auto desktop-sm:overflow-hidden ${lineMask} ${linePos}`}
  >
    {Array.from({ length: 55 }, (_, i) => (
      <span
        key={`col-${i}`}
        className={`w-[0.674px] shrink-0 bg-[#e0e0e0] shadow-[0.674px_0px_0px_0px_#ffffff] ipad:w-px ipad:shadow-[1px_0px_0px_0px_#ffffff] ${i < 25 ? "" : "hidden desktop-sm:block"}`}
      />
    ))}
  </div>
);

// ─── Project Card ───────────────────────────────────────────────────────────

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { wrapperRef, cardRef } = useCardTilt();
  const videoRef = useRef<HTMLVideoElement>(null);
  const number = String(index + 1).padStart(2, "0");

  const play = () => videoRef.current?.play().catch(() => {});
  const pause = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };

  return (
    <div ref={wrapperRef} className="t-tilt group">
      <div ref={cardRef} className="t-tilt-card">
        <article className="relative overflow-hidden rounded-[20px] border border-black/[0.07] bg-[#efefec] shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-colors [@media(hover:hover)]:group-hover:border-black/15">
          {/* Media */}
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} — open live site`}
            className="relative block aspect-[16/10] w-full overflow-hidden bg-[#e4e4e0]"
            onMouseEnter={play}
            onMouseLeave={pause}
          >
            {project.video ? (
              <video
                ref={videoRef}
                className="size-full object-cover"
                src={project.video}
                poster={project.poster}
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : project.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.image} alt={`${project.title} website preview`} className="size-full object-cover" />
            ) : null}
            {/* Watch hint */}
            <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex size-[7px]">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#c8ff00] opacity-75" />
                <span className="relative inline-flex size-[7px] rounded-full bg-[#c8ff00]" />
              </span>
              <span className="font-tight text-[12px] font-medium tracking-[-0.12px] text-white/90">
                Watch the site in action
              </span>
            </div>
          </a>

          {/* Meta */}
          <div className="flex flex-col gap-[14px] p-6 desktop-sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[12px] text-black/30">{number}</span>
                <h3 className="font-instrument-serif text-[24px] leading-[1.1] tracking-[-0.72px] text-[#121212] desktop-sm:text-[28px] desktop-sm:tracking-[-0.84px]">
                  {project.title}
                </h3>
              </div>
              {project.year && (
                <span className="shrink-0 font-tight text-[13px] text-black/40">{project.year}</span>
              )}
            </div>

            <p className="max-w-[60ch] font-tight text-[14px] leading-[1.65] tracking-[-0.14px] text-black/55 desktop-sm:text-[15px]">
              {project.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
              {project.role.map((r) => (
                <span key={r} className="font-lato text-[11px] font-bold uppercase tracking-[0.5px] text-black/40">
                  {r}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
              {project.stack && project.stack.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {project.stack.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-black/[0.08] bg-white px-2.5 py-1 font-tight text-[12px] text-black/50"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-2 font-tight text-[14px] font-medium text-[#121212] transition-opacity hover:opacity-70"
              >
                Open live site
                <svg className="size-[13px]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>
          </div>

          <div className="t-tilt-glare" />
        </article>
      </div>
    </div>
  );
}

// ─── Section ────────────────────────────────────────────────────────────────

export function WorkSection({ projects }: { projects: Project[] }) {
  return (
    <section id="work" className="relative w-full overflow-hidden bg-[#f5f5f2]">
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden justify-between px-8 desktop-sm:flex">
        <CornerGrid />
      </div>
      <HorizontalLines />
      <VerticalLines />

      <div className="relative mx-auto w-full py-24 desktop-sm:py-32 ultrawide:max-w-[2000px]">
        <div className="mx-auto flex w-[85%] max-w-[900px] flex-col items-center gap-[32px] desktop-sm:w-[82.78%] desktop-sm:max-w-[1000px] desktop-sm:gap-[56px]">
          {/* Header */}
          <header className="flex w-full flex-col items-center gap-[20px]">
            <div className="relative flex items-center justify-center gap-[8px] border-[0.722px] border-dashed border-[rgba(2,2,2,0.1)] px-4 py-3">
              <CornerTicks />
              <span className="flex items-center gap-[10px]">
                <span className="text-base">&#x2726;</span>
                <span className="font-lato text-[14px] leading-[1.5] font-bold tracking-[-0.42px] text-[#121212]">
                  Selected Work
                </span>
              </span>
            </div>

            <div className="flex w-full flex-col items-center gap-[12px] text-center leading-[1.2] text-[#121212]">
              <h2 className="font-instrument-serif text-[30px] tracking-[-0.9px] ipad:text-[38px] ipad:tracking-[-1.14px] desktop-sm:text-[46px] desktop-sm:tracking-[-1.38px] ultrawide:text-[54px] ultrawide:tracking-[-1.62px]">
                Websites I&apos;ve designed &amp; built.
              </h2>
              <p className="max-w-[420px] font-tight text-[16px] leading-[1.5] tracking-[-0.32px] opacity-60 desktop-sm:max-w-none desktop-sm:text-[20px] desktop-sm:tracking-[-0.4px]">
                Hover a preview to watch it move. Click through to see it live.
              </p>
            </div>
          </header>

          {/* Cards */}
          {projects.length > 0 ? (
            <div className="flex w-full flex-col gap-10 desktop-sm:gap-14">
              {projects.map((project, i) => (
                <ProjectCard key={project.slug} project={project} index={i} />
              ))}
            </div>
          ) : (
            <div className="w-full rounded-[20px] border border-dashed border-black/10 bg-white/50 px-8 py-16 text-center">
              <p className="mb-2 font-instrument-serif text-[24px] tracking-[-0.72px] text-[#121212]">
                New work is being added.
              </p>
              <p className="mx-auto max-w-md text-[15px] leading-[1.6] text-black/50">
                Recent website projects are being prepared for this section. Want
                to see something sooner?{" "}
                <a
                  href="#contact"
                  className="text-[#121212] underline decoration-black/20 underline-offset-4 transition-colors hover:decoration-black/60"
                >
                  Ask me directly
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
