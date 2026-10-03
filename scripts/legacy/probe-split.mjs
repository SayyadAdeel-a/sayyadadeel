(() => {
  const pick = (el) => el ? el.innerHTML.slice(0, 500) : null;
  return JSON.stringify(
    {
      menuText: document.querySelector(".menu-one")?.textContent?.slice(0, 120),
      firstTextButton: pick(document.querySelector(".text-button-normal-text")),
      h2: pick(document.querySelector(".our-creators-text-wrap h2")),
      brandTab: pick(document.querySelector(".tab-pane.w--tab-active .featured-brands-autor-declies-wrap")),
    },
    null,
    2
  );
})()