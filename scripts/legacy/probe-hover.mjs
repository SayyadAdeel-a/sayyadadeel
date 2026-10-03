(() =>
  JSON.stringify(
    {
      cardImageChild: document.querySelectorAll("[card-image-hover-child='ture']")
        .length,
      cardImageHost: document.querySelectorAll("[card-image-hover-pfriend]").length,
      hoverChild: document.querySelectorAll("[hover-child='ture']").length,
      hoverHost: document.querySelectorAll("[hover-priend]").length,
    },
    null,
    2
  ))()