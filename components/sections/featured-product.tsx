"use client";

import { Fragment, useRef, useCallback, useEffect, type PointerEvent as ReactPointerEvent } from "react";
import { GridRail } from "@/components/originkit/ui/hero-20/grid-rail";

// ─── Card Tilt Hook (transitions.dev #19) ───────────────────────────────────

const MAX_TILT = 10;

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
    w.addEventListener("pointermove", track);
    w.addEventListener("pointerup", onPointerUp);
    w.addEventListener("pointercancel", onPointerUp);
    w.addEventListener("pointerleave", (e) => {
      if (e instanceof PointerEvent && e.pointerType === "mouse") reset();
    });
    return () => {
      w.removeEventListener("pointermove", track);
      w.removeEventListener("pointerup", onPointerUp);
      w.removeEventListener("pointercancel", onPointerUp);
    };
  }, [track, reset]);

  return { wrapperRef, cardRef };
}

// ─── Learn More Link (transitions.dev #24) ──────────────────────────────────

const LearnMoreLink = ({ href, label = "Learn more" }: { href: string; label?: string }) => (
  <a href={href} className="t-learn inline-flex items-center gap-1.5 text-[14px] font-medium text-white/80 transition-colors hover:text-white">
    {label}
    <span className="t-learn-chevron">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path className="t-learn-arm t-learn-arm-top" d="M6 4L10 8" />
        <path className="t-learn-arm t-learn-arm-bot" d="M10 8L6 12" />
      </svg>
    </span>
  </a>
);

// ─── CornerTicks (from Hero 20) ─────────────────────────────────────────────

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

// ─── Card Component (Originkit features-04 style) ───────────────────────────

const Card = ({ children, outerClassName = "", innerClassName = "" }: {
  children: React.ReactNode;
  outerClassName?: string;
  innerClassName?: string;
}) => (
  <div className={`flex flex-col rounded-[20px] bg-[#ebebeb] p-[8px] ${outerClassName}`}>
    <div className={`flex rounded-[16px] bg-[#f5f5f5] shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${innerClassName}`}>
      {children}
    </div>
  </div>
);

// ─── Card Content ───────────────────────────────────────────────────────────

const CardContent = ({ title, body }: { title: string; body: string }) => (
  <div className="flex w-full flex-col gap-[12px] font-tight leading-[1.2] text-black">
    <h3 className="text-[18px] font-medium desktop-sm:text-[20px]">{title}</h3>
    <p className="text-[14px] opacity-60 desktop-sm:text-[16px]">{body}</p>
  </div>
);

// ─── Feature Data ───────────────────────────────────────────────────────────

const featureData = {
  fieldVisits: {
    title: "Field Visits",
    body: "Plan visits with intelligent routing, real-time tracking, and automated scheduling that adapts to your team's workflow.",
    image: "/field-visits.webp",
    alt: "Field visit routing illustration",
  },
  evidence: {
    title: "Evidence Capture",
    body: "Photos, notes, GPS — all tagged and organized automatically. Never lose critical field data again.",
    image: "/evidence-capture.webp",
    alt: "Evidence capture illustration",
  },
  reports: {
    title: "Reports",
    body: "Generate professional PDF reports from your field data in seconds. From data to deliverables, instantly.",
    image: "/reports.webp",
    alt: "Report generation illustration",
  },
};

// ─── Mobile Card ────────────────────────────────────────────────────────────

const MobileCard = ({ title, body, image, alt }: {
  title: string;
  body: string;
  image: string;
  alt: string;
}) => {
  const { wrapperRef, cardRef } = useCardTilt();
  return (
    <div ref={wrapperRef} className="t-tilt">
      <div ref={cardRef} className="t-tilt-card">
        <Card
          outerClassName="ipad:h-[373px]"
          innerClassName="relative flex-col justify-end overflow-hidden p-[20px] ipad:min-h-px ipad:flex-1"
        >
          <img
            src={image}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="relative flex flex-col gap-[8px]">
            <h3 className="text-[18px] font-medium leading-[1.2] text-white desktop-sm:text-[20px]">{title}</h3>
            <p className="text-[14px] leading-[1.4] text-white/80 desktop-sm:text-[16px]">{body}</p>
            <LearnMoreLink href="#products" />
          </div>
          <div className="t-tilt-glare" />
        </Card>
      </div>
    </div>
  );
};

// ─── Desktop Card ───────────────────────────────────────────────────────────

const DesktopCard = ({ title, body, image, alt }: {
  title: string;
  body: string;
  image: string;
  alt: string;
}) => {
  const { wrapperRef, cardRef } = useCardTilt();
  return (
    <div ref={wrapperRef} className="t-tilt">
      <div ref={cardRef} className="t-tilt-card h-full">
        <Card
          outerClassName="desktop-sm:h-full"
          innerClassName="relative flex-col justify-end overflow-hidden p-[20px] desktop-sm:min-h-px desktop-sm:flex-1 desktop-sm:p-[32px]"
        >
          <img
            src={image}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="relative flex flex-col gap-[8px]">
            <h3 className="text-[18px] font-medium leading-[1.2] text-white desktop-sm:text-[20px]">{title}</h3>
            <p className="text-[14px] leading-[1.4] text-white/80 desktop-sm:text-[16px]">{body}</p>
            <LearnMoreLink href="#products" />
          </div>
          <div className="t-tilt-glare" />
        </Card>
      </div>
    </div>
  );
};

// ─── Decorative Grid Blocks ─────────────────────────────────────────────────

const MOBILE_GRID_POSITIONS = [
  "col-start-2 row-start-1",
  "col-start-1 row-start-2",
  "col-start-2 row-start-3",
  "col-start-1 row-start-4",
];

const DESKTOP_GRID_POSITIONS = [
  "col-start-1 row-start-1 desktop-sm:col-start-2",
  "col-start-2 row-start-2 desktop-sm:col-start-1",
  "col-start-1 row-start-3 desktop-sm:col-start-2",
  "col-start-2 row-start-4 desktop-sm:col-start-1",
];

const GridBlocks = ({ cells }: { cells: string[] }) => (
  <div className="grid shrink-0 grid-cols-[repeat(2,34.996px)] grid-rows-[repeat(4,34.996px)] gap-[0.67px] ipad:grid-cols-[repeat(2,52px)] ipad:grid-rows-[repeat(4,52px)] ipad:gap-px">
    {cells.map((c) => (
      <span key={c} className={`bg-[#ededed] opacity-80 ${c}`} />
    ))}
  </div>
);

const CornerGrid = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute top-px left-[calc(50%-8.36px)] flex w-[872.99px] -translate-x-1/2 gap-[178.34px] pl-[286.42px] ipad:left-[calc(50%-0.29px)] ipad:w-[1296px] ipad:gap-[425px] ipad:pl-[319px] desktop-sm:top-[4px] desktop-sm:left-[72px] desktop-sm:w-auto desktop-sm:translate-x-0 desktop-sm:gap-[1008px] desktop-sm:pl-[54px]"
  >
    <GridBlocks cells={MOBILE_GRID_POSITIONS} />
    <GridBlocks cells={DESKTOP_GRID_POSITIONS} />
  </div>
);

// ─── Background Lines ───────────────────────────────────────────────────────

const lineMask =
  "[mask-image:linear-gradient(to_bottom,#000_250px,transparent_330px)] " +
  "[-webkit-mask-image:linear-gradient(to_bottom,#000_250px,transparent_330px)] " +
  "ipad:[mask-image:linear-gradient(to_bottom,#000_260px,transparent_340px)] " +
  "ipad:[-webkit-mask-image:linear-gradient(to_bottom,#000_260px,transparent_340px)] " +
  "desktop-sm:[mask-image:linear-gradient(to_bottom,#000_300px,transparent_380px)] " +
  "desktop-sm:[-webkit-mask-image:linear-gradient(to_bottom,#000_300px,transparent_380px)]";

const horizontalLinePos =
  "left-[calc(50%-8.36px)] -translate-x-1/2 ipad:left-[calc(50%-0.29px)] desktop-sm:left-[72px] desktop-sm:translate-x-0";

const HorizontalLines = () => (
  <div
    aria-hidden
    className={`pointer-events-none absolute top-0 flex w-[872.99px] flex-col gap-[35.027px] opacity-80 ipad:w-[1296px] ipad:gap-[52px] desktop-sm:-top-[50px] desktop-sm:right-[72px] desktop-sm:w-auto ${lineMask} ${horizontalLinePos}`}
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
    className={`pointer-events-none absolute top-0 flex h-[615px] w-[872.99px] items-stretch gap-[35.027px] opacity-80 ipad:h-[913px] ipad:w-[1296px] ipad:gap-[52px] desktop-sm:-top-[50px] desktop-sm:right-[72px] desktop-sm:w-auto desktop-sm:overflow-hidden ${lineMask} ${horizontalLinePos}`}
  >
    {Array.from({ length: 55 }, (_, i) => (
      <span
        key={`col-${i}`}
        className={`w-[0.674px] shrink-0 bg-[#e0e0e0] shadow-[0.674px_0px_0px_0px_#ffffff] ipad:w-px ipad:shadow-[1px_0px_0px_0px_#ffffff] ${i < 25 ? "" : "hidden desktop-sm:block"}`}
      />
    ))}
  </div>
);

// ─── Blur Decorations ───────────────────────────────────────────────────────

const MobileBlur = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute top-[56px] left-[calc(50%-0.43px)] h-[957px] w-[492px] -translate-x-1/2 rounded-[50%] bg-[#f8f8f8] blur-[26px] ipad:top-[27px] ipad:left-[calc(50%+15.21px)] ipad:w-[689px] desktop-sm:hidden"
  />
);

const DesktopBlurs = () => (
  <Fragment>
    <div
      aria-hidden
      className="pointer-events-none absolute top-[-17px] left-1/2 hidden h-[267px] w-[660px] -translate-x-1/2 rounded-[50%] bg-[#f8f8f8] blur-[26px] desktop-sm:block"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute top-[90px] left-[calc(50%+42px)] hidden h-[1052px] w-[calc(100%+298px)] -translate-x-1/2 rounded-[50%] bg-[#f8f8f8] blur-[26px] desktop-sm:block"
    />
  </Fragment>
);

// ─── Phone Corners (decorative) ─────────────────────────────────────────────

const phoneCornerSvg = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="453" height="725"><rect width="292" height="408" rx="42" fill="#000000" fill-opacity="0.1"/></svg>'
)}")`;

const PHONE_CORNER_CLASS =
  "pointer-events-none absolute bottom-0 w-[41px] bg-[length:4.5277px_7.2514px] ipad:w-[51px] ipad:bg-[length:4.5277px_6.2024px] desktop-sm:w-[71px] desktop-sm:bg-[length:4.5277px_5.1584px]";

const PhoneCorners = () => (
  <Fragment>
    <div
      aria-hidden
      className={`${PHONE_CORNER_CLASS} top-[-8.5px] left-[2.36px] ipad:left-[1.51px] desktop-sm:top-[-2.5px] desktop-sm:left-[1.5px]`}
      style={{ backgroundImage: phoneCornerSvg }}
    />
    <div
      aria-hidden
      className={`${PHONE_CORNER_CLASS} top-[-9.5px] right-[-1.36px] ipad:top-[-13.5px] ipad:right-[-0.5px] desktop-sm:top-[-2.5px] desktop-sm:right-[0.5px]`}
      style={{ backgroundImage: phoneCornerSvg, backgroundPosition: "0 3.6px" }}
    />
  </Fragment>
);

// ─── Avatar placeholder ─────────────────────────────────────────────────────

const AvatarPlaceholder = ({ index }: { index: number }) => {
  const colors = ["#c8ff00", "#121212", "#666666"];
  return (
    <div
      className="size-[32px] shrink-0 rounded-full desktop-sm:size-[42px] flex items-center justify-center text-[11px] font-bold text-white desktop-sm:text-[14px]"
      style={{ backgroundColor: colors[index % colors.length] }}
    >
      {["A", "M", "S"][index]}
    </div>
  );
};

// ─── Main Section ───────────────────────────────────────────────────────────

export function FeaturesSection() {
  return (
    <section id="products" className="relative w-full overflow-hidden bg-[#f5f5f2]">
      {/* GridRail on edges — matches Hero 20 */}
      <GridRail className="left-0" />
      <GridRail className="right-0" />

      <div className="relative mx-auto w-full pt-[81px] pb-[81px] ipad:pt-[127px] ipad:pb-[104px] desktop-sm:pt-[63px] desktop-sm:pb-[62px] ultrawide:max-w-[2000px]">
        <HorizontalLines />
        <VerticalLines />
        <CornerGrid />
        <MobileBlur />
        <DesktopBlurs />
        <PhoneCorners />

        <div className="relative mx-auto flex w-[71.22%] max-w-[286.301px] flex-col items-center gap-[32px] ipad:w-[80.51%] ipad:max-w-[599px] ipad:gap-[52px] desktop-sm:w-[82.78%] desktop-sm:max-w-[1192px] desktop-sm:gap-[72px]">
          {/* Header — matches Hero 20 badge style */}
          <header className="flex w-full flex-col items-center gap-[20px] ipad:w-[502px]">
            {/* Badge with CornerTicks — same as Hero 20 */}
            <div className="relative flex items-center justify-center gap-[8px] border-[0.722px] border-dashed border-[rgba(2,2,2,0.1)] px-4 py-3">
              <CornerTicks />
              <span className="flex items-center gap-[10px]">
                <svg className="size-[16px] ipad:size-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span className="font-lato text-[14px] leading-[1.5] font-bold tracking-[-0.42px] text-[#121212]">
                  Why FieldOS
                </span>
              </span>
            </div>

            <div className="flex w-full flex-col items-center gap-[12px] text-center leading-[1.2] text-[#121212]">
              <h2 className="max-w-[282px] font-instrument-serif text-[24px] tracking-[-0.48px] ipad:max-w-none ipad:text-[32px] ipad:tracking-[-0.64px] desktop-sm:text-[42px] desktop-sm:tracking-[-0.84px] ultrawide:text-[52px] ultrawide:tracking-[-1.04px]">
                Built for Environmental Fieldwork.
              </h2>
              <p className="max-w-[238px] font-tight text-[16px] tracking-[-0.32px] opacity-60 ipad:max-w-none ipad:text-[18px] ipad:tracking-[-0.36px] ipad:whitespace-nowrap desktop-sm:text-[21px] desktop-sm:tracking-[-0.42px] ultrawide:text-[25px] ultrawide:tracking-[-0.5px]">
                Plan visits, capture evidence, and generate reports.
              </p>
            </div>
          </header>

          {/* Cards Grid */}
          <div className="flex w-full flex-col gap-[12px] ipad:gap-[16px] desktop-sm:grid desktop-sm:grid-cols-3 desktop-sm:items-stretch">
            {/* Column 1: Trust badge + Field Visits card */}
            <div className="flex flex-col gap-[12px] ipad:flex-row ipad:items-center ipad:gap-[16px] desktop-sm:contents">
              <div className="flex flex-col gap-[12px] ipad:w-[286px] ipad:shrink-0 ipad:gap-[16px] desktop-sm:w-auto">
                <Card innerClassName="h-[76px] items-center gap-[10px] px-[20px] py-[12px]">
                  <div className="flex shrink-0 items-center">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`size-[32px] shrink-0 rounded-full desktop-sm:size-[42px] ${i < 2 ? "mr-[-15.238px] desktop-sm:mr-[-20px]" : ""}`}
                      >
                        <AvatarPlaceholder index={i} />
                      </div>
                    ))}
                  </div>
                  <p className="w-[154px] font-tight text-[16px] leading-[1.2] font-medium text-black desktop-sm:w-auto desktop-sm:text-[18px] desktop-sm:whitespace-nowrap">
                    Built for Consultants
                  </p>
                </Card>
                <MobileCard {...featureData.fieldVisits} />
              </div>
              {/* Column 2 */}
              <div className="flex flex-col gap-[12px] ipad:flex-1 ipad:gap-[16px]">
                <MobileCard {...featureData.evidence} />
                <Card innerClassName="h-[76px] items-center gap-[12px] px-[20px] py-[12px]">
                  <svg className="size-[24px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                  </svg>
                  <p className="font-tight text-[16px] leading-[1.2] font-medium whitespace-nowrap text-black desktop-sm:text-[18px]">
                    99.9% Uptime
                  </p>
                </Card>
              </div>
            </div>
            {/* Column 3: Reports card */}
            <DesktopCard {...featureData.reports} />
          </div>
        </div>
      </div>
    </section>
  );
}
