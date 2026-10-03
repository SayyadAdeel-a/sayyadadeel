(() => {
  const out = [];
  for (const el of document.querySelectorAll(".meet-creators-wrapper")) {
    const cs = getComputedStyle(el);
    out.push({
      count: 1,
      inline: el.getAttribute("style"),
      width: cs.width,
      maxWidth: cs.maxWidth,
      marginLeft: cs.marginLeft,
      marginRight: cs.marginRight,
      display: cs.display,
      parentCls: el.parentElement.className,
      parentW: el.parentElement.getBoundingClientRect().width,
      rectW: el.getBoundingClientRect().width,
    });
  }
  return JSON.stringify({ innerWidth: window.innerWidth, els: out }, null, 2);
})()