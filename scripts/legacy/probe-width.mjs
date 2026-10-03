(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      rectW: Math.round(el.getBoundingClientRect().width * 1000) / 1000,
      width: cs.width,
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      letterSpacing: cs.letterSpacing,
      text: el.textContent,
      html: el.innerHTML.slice(0, 320),
    };
  };
  return JSON.stringify(
    {
      innerWidth: window.innerWidth,
      btnWrap: pick(".slide-creators-button-wrap"),
      btnNormal: pick(".slide-creators-button-wrap .button-normal-text"),
      btnHover: pick(".slide-creators-button-wrap .button-hover-text"),
      btnIconBox: pick(".slide-creators-button-wrap .button-icon-box"),
      textMedium: pick(".box-three .text-medium"),
      navLink: pick(".nav-link"),
      fontThree: pick(".font-three"),
    },
    null,
    2
  );
})()