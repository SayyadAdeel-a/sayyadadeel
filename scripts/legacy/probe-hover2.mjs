(() => {
  const out = [];
  for (const el of document.querySelectorAll("[card-image-hover-child='ture']")) {
    const chain = [];
    let p = el.parentElement;
    for (let i = 0; i < 4 && p; i++) {
      chain.push({
        tag: p.tagName,
        cls: p.className,
        attrs: Array.from(p.attributes)
          .map((a) => a.name)
          .filter((n) => !n.startsWith("data-") && n !== "class" && n !== "style"),
      });
      p = p.parentElement;
    }
    out.push(chain);
  }
  const hoverHosts = [];
  for (const el of document.querySelectorAll("[hover-child='ture']")) {
    const p = el.closest("[hover-pfriend]") ?? el.closest("[hover-p]");
    hoverHosts.push({
      childCls: el.className,
      hostCls: p ? p.className : null,
      hostAttrs: p ? Array.from(p.attributes).map((a) => a.name).filter((n) => n.includes("hover") || n.includes("friend")) : null,
    });
  }
  return JSON.stringify({ cards: out, hoverHosts }, null, 2);
})()