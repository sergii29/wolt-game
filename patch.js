// PATCH UI v4 — принудительное изменение окон доставки (MutationObserver)

(function () {

  function restyle(el) {
    if (!el || !el.style) return;

    // тёмная карточка
    el.style.background = "#121212";
    el.style.color = "#eaeaea";
    el.style.borderRadius = "18px 18px 0 0";
    el.style.boxShadow = "0 -12px 40px rgba(0,0,0,0.7)";

    // текст внутри
    el.querySelectorAll("*").forEach(child => {
      if (child.style) {
        child.style.color = "#eaeaea";
      }
    });

    // кнопки
    el.querySelectorAll("button, div[role='button']").forEach(btn => {
      btn.style.borderRadius = "14px";
      btn.style.fontWeight = "600";
    });
  }

  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;

        // нижнее окно (fixed снизу)
        const style = getComputedStyle(node);
        if (style.position === "fixed" && style.bottom === "0px") {
          restyle(node);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log("UI PATCH v4 активен (observer)");

})();
