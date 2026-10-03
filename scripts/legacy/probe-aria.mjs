(() => {
  const out = [...document.querySelectorAll(".w-slider-aria-label")].map((el) => ({
    html: el.outerHTML.slice(0, 200),
    parent: el.parentElement.className,
    position: getComputedStyle(el).position,
    clip: getComputedStyle(el).clip,
    w: el.getBoundingClientRect().width,
  }));
  const mask = document.querySelector(".services-mask");
  return JSON.stringify(
    { count: out.length, out, maskChildren: [...mask.children].map((c) => c.tagName + "." + c.className) },
    null,
    2
  );
})()