// PATCH v3.1 — ждём инициализацию игры (FIX)

(function () {

  function isTelegram() {
    return !!(window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe);
  }

  function show(text) {
    alert(text);
  }

  // === ЕСЛИ НЕ TELEGRAM ===
  if (!isTelegram()) {
    show(
      "⚠️ Внимание\n\n" +
      "Полная версия игры работает только в Telegram.\n\n" +
      "В Android-приложении прогресс может сбрасываться.\n\n" +
      "Рекомендуем играть через Telegram."
    );
    return;
  }

  // ⏳ ЖДЁМ, ПОКА ИГРА ЗАГРУЗИТСЯ
  setTimeout(startStory, 1200);

  function startStory() {

    // Telegram user
    const tgUser = Telegram.WebApp.initDataUnsafe.user;
    const tgId = tgUser.id;
    window.playerId = "tg_" + tgId;

    // если игра использует state — берём оттуда
    const gameDay =
      window.gameDay ??
      window.state?.day ??
      1;

    window.storyFlags = window.storyFlags || {};

    function once(key, fn) {
      if (storyFlags[key]) return;
      storyFlags[key] = true;
      fn();
    }

    // === СЮЖЕТ ===

    once("day1", () => {
      show(
        "День 1.\n" +
        "Ты выходишь на смену в Варшаве.\n" +
        "Город шумит.\n" +
        "Это начало твоей истории."
      );
    });

    if (gameDay === 3) {
      once("rain", () => {
        show(
          "День 3.\n" +
          "Дождь льёт без остановки.\n" +
          "Работать тяжелее."
        );
        if (window.energy !== undefined) window.energy -= 15;
      });
    }

    if (gameDay === 5) {
      once("conflict", () => {
        show(
          "День 5.\n" +
          "Клиент недоволен.\n" +
          "Поддержка молчит.\n" +
          "Ты чувствуешь злость."
        );
        if (window.energy !== undefined) window.energy -= 20;
      });
    }

  }

})();
