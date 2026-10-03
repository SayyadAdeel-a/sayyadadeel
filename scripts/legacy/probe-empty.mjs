(() => {
  const sels = [
    ".agency-hero-text-wrap",
    ".agency-dectlies-wrap",
    ".hero-intro-section",
    "#a60822b7-681c-457d-a15c-849d10517aee",
    "#e7772b2d-210f-27fe-e69f-61db8be74d89",
    ".bg-image-left-wrap",
    ".bg-image-right-wrap",
    "[contain-left-move-child='ture']",
    "[contain-right-move-child='ture']",
    "[love-child='ture']",
    "[text-box-child='ture']",
    "[marku-slide='ture']",
    "[move-opacty='ture']",
    "[group-fast-move='ture']",
    "[group-secend-move='ture']",
    ".agency-hero-image-wrap.one",
    ".agency-hero-image-wrap.two",
    ".hero-intro-meddle-bg-image",
    "[zome-in-zom-out='ture']",
    "[move-left-right='ture']",
    "[group-fedup-move='ture']",
    "[fade='true']",
    "[fade-up='true']",
    "[origin-fade-up='true']",
    "[group-fedup-phone='ture']",
    "[move-scroll-card-box='ture']",
    "[card-image-hover-child='ture']",
    "[card-image-hover-p]",
    "[hover-child='ture']",
    "[hover-priend]",
    "[slider-click-btn='true']",
    "[icon-btn-anim]",
    ".w-form",
    ".template-buttons-wrapper > *",
  ];
  const out = {};
  for (const s of sels) {
    const n = document.querySelectorAll(s).length;
    if (n === 0) out[s] = 0;
  }
  return JSON.stringify({ emptySelectors: out }, null, 2);
})()