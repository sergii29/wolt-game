// PATCH v2 — сюжет + события + жизнь

(function () {

  // === БАЗА ===
  window.gameDay = window.gameDay || 1;
  window.energy = window.energy || 100;
  window.balance = window.balance || 0;
  window.storyFlags = window.storyFlags || {};

  function show(text) {
    alert(text);
  }

  function once(key, fn) {
    if (window.storyFlags[key]) return;
    window.storyFlags[key] = true;
    fn();
  }

  // === СЮЖЕТНЫЕ СОБЫТИЯ ===

  // День 1 — старт
  once("day1_start", () => {
    show(
      "День 1.\n" +
      "Ты выходишь на смену.\n" +
      "Город шумит, заказы идут.\n" +
      "Это только начало."
    );
  });

  // День 3 — дождь
  if (gameDay === 3) {
    once("day3_rain", () => {
      show(
        "День 3.\n" +
        "С самого утра льёт дождь.\n" +
        "Руки мёрзнут, заказы реже.\n" +
        "Ты устаёшь быстрее."
      );
      energy -= 15;
    });
  }

  // День 5 — конфликт
  if (gameDay === 5) {
    once("day5_conflict", () => {
      show(
        "День 5.\n" +
        "Клиент орёт из-за холодной еды.\n" +
        "Поддержка молчит.\n" +
        "Настроение падает."
      );
      energy -= 20;
    });
  }

  // День 7 — вопрос смысла
  if (gameDay === 7) {
    once("day7_question", () => {
      show(
        "День 7.\n" +
        "Ты ловишь себя на мысли:\n" +
        "«Я реально хочу этим заниматься дальше?»"
      );
    });
  }

  // === ЗАЩИТА ОТ ДИЧИ ===
  const _balance = balance;
  Object.defineProperty(window, "balance", {
    get() { return _balance; },
    set(v) {
      console.warn("Баланс нельзя менять напрямую");
    }
  });

})();
