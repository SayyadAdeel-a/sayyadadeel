(() => {
  const out = {};
  for (const slider of document.querySelectorAll(".w-slider")) {
    const mask = slider.querySelector(".w-slider-mask");
    const slides = [...slider.querySelectorAll(".w-slide")];
    const cs = getComputedStyle(mask);
    const s0 = slides[0] ? getComputedStyle(slides[0]) : null;
    out[slider.className] = {
      parentW: Math.round(slider.getBoundingClientRect().width * 100) / 100,
      maskW: Math.round(mask.getBoundingClientRect().width * 100) / 100,
      maskX: Math.round(mask.getBoundingClientRect().x * 100) / 100,
      sliderX: Math.round(slider.getBoundingClientRect().x * 100) / 100,
      ml: cs.marginLeft,
      mr: cs.marginRight,
      slideW: s0 ? Math.round(slides[0].getBoundingClientRect().width * 100) / 100 : null,
      slideMr: s0 ? s0.marginRight : null,
      slideMl: s0 ? s0.marginLeft : null,
      slideTransforms: slides.map((s) => getComputedStyle(s).transform),
      count: slides.length,
      navClass: slider.querySelector(".w-slider-nav")?.className ?? null,
      firstDotClass: slider.querySelector(".w-slider-dot")?.className ?? null,
      arrows: [...slider.querySelectorAll(".w-slider-arrow-left, .w-slider-arrow-right")].map(
        (a) => a.className + " | " + getComputedStyle(a).display
      ),
    };
  }
  return JSON.stringify({ innerWidth: window.innerWidth, out }, null, 2);
})()