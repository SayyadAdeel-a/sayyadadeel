(() => {
  const out = [];
  const els = document.querySelectorAll("img");
  for (const img of els) {
    const cs = getComputedStyle(img);
    out.push({
      cls: img.className,
      parentCls: img.parentElement?.className,
      nat: `${img.naturalWidth}x${img.naturalHeight}`,
      attr: img.getAttribute("width") ? `${img.getAttribute("width")}x${img.getAttribute("height")}` : null,
      rendered: `${Math.round(img.getBoundingClientRect().width * 100) / 100}x${Math.round(img.getBoundingClientRect().height * 100) / 100}`,
      objectFit: cs.objectFit,
      src: (img.currentSrc || img.src).slice(-70),
      sizes: img.getAttribute("sizes"),
      hasSrcset: img.hasAttribute("srcset"),
    });
  }
  return JSON.stringify({ count: out.length, out }, null, 2);
})()