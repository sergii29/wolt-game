// PATCH v4 — события + выбор + последствия

(function () {

  function isTelegram() {
    return !!(window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe);
  }

  function show(text) {
    alert(text);
  }

  function choose(text) {
    return confirm(text);
  }

  if (!isTelegram()) {
    show(
      "⚠️ Полная версия игры доступна только в Telegram.\n\n" +
      "В Android-приложении прогресс может сбрасываться."
    );
    return;
  }

  setTimeout(startStory, 1200);

  function startStory() {

    const tgUser = Telegram.WebApp.initDataUnsafe.user;
    const tgId = tgUser.id;
    window.playerId = "tg_" + tgId;

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

    // === ДЕНЬ 1 — ВЫБОР ===
    once("day1_intro", () => {
      show(
        "День 1.\n" +
        "Ты выходишь на смену.\n" +
        "Первый заказ уже ждёт."
      );

      const helpClient = choose(
        "Клиент просит подождать 5 минут.\n\n" +
        "Подождать?"
      );

      if (helpClient) {
        show(
          "Ты ждёшь клиента.\n" +
          "Он благодарит и оставляет чаевые."
        );
        if (window.balance !== undefined) window.balance += 10;
        storyFlags.goodStart = true;
      } else {
        show(
          "Ты уезжаешь без ожидания.\n" +
          "Заказ закрыт, но осадок остался."
        );
        storyFlags.goodStart = false;
      }
    });

    // === ДЕНЬ 3 — ПОСЛЕДСТВИЕ ===
    if (gameDay === 3) {
      once("day3_result", () => {
        if (storyFlags.goodStart) {
          show(
            "День 3.\n" +
            "Тот самый клиент снова попадается.\n" +
            "Он узнаёт тебя и даёт хороший заказ."
          );
          if (window.balance !== undefined) window.balance += 20;
        } else {
          show(
            "День 3.\n" +
            "Поддержка пишет жалобу.\n" +
            "Кто-то вспомнил твой первый день."
          );
          if (window.energy !== undefined) window.energy -= 10;
        }
      });
    }

  }

})();
