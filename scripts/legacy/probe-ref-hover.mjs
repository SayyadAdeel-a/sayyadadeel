(() => {
  const btn = document.querySelector(".nav-button-wrap .button");
  const label = btn.querySelector(".button-normal-text");
  const before = {
    html: label.innerHTML.slice(0, 260),
    text: label.textContent,
    parentRect: btn.getBoundingClientRect().toJSON(),
  };
  btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
  return new Promise((res) =>
    setTimeout(() => {
      res(
        JSON.stringify(
          {
            before,
            afterHtml: label.innerHTML.slice(0, 400),
            afterText: label.textContent,
            afterLabelRect: label.getBoundingClientRect().toJSON(),
            charCount: label.querySelectorAll("div").length,
            firstCharStyle: (() => {
              const c = label.querySelector("div");
              return c ? getComputedStyle(c).display + "|" + getComputedStyle(c).position : null;
            })(),
          },
          null,
          2
        )
      );
    }, 500)
  );
})()