(() => {
  const out = {};
  const b1 = document.querySelector(".box-one");
  out.boxOne = {
    inline: b1?.getAttribute("style"),
    transform: b1 ? getComputedStyle(b1).transform : null,
    parent: b1?.parentElement.className,
    grandParent: b1?.parentElement?.parentElement.className,
  };
  out.allBoxes = [...document.querySelectorAll(".box-one, .box-two, .box-three, .box-four")].map((b) => ({
    cls: b.className,
    t: getComputedStyle(b).transform,
    p: b.parentElement.className,
  }));
  out.bgLeft = (() => {
    const el = document.querySelector(".bg-image-left-wrap");
    return el
      ? { inline: el.getAttribute("style"), transform: getComputedStyle(el).transform, opacity: getComputedStyle(el).opacity, w: el.getBoundingClientRect().width }
      : null;
  })();
  out.bgRight = (() => {
    const el = document.querySelector(".bg-image-right-wrap");
    return el
      ? { inline: el.getAttribute("style"), transform: getComputedStyle(el).transform, opacity: getComputedStyle(el).opacity, w: el.getBoundingClientRect().width }
      : null;
  })();
  const mask = document.querySelector(".services-mask");
  out.mask = {
    inline: mask?.getAttribute("style"),
    ml: mask ? getComputedStyle(mask).marginLeft : null,
    x: mask?.getBoundingClientRect().x,
    parentW: mask?.parentElement.getBoundingClientRect().width,
    w: mask?.getBoundingClientRect().width,
  };
  out.gsapLoaded = typeof window.gsap !== "undefined";
  out.stCount = window.ScrollTrigger ? "global" : "module";
  return JSON.stringify(out, null, 2);
})()