// PATCH v3 — Telegram главный, Android вторичный

(function () {

  function isTelegram() {
    return !!(window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe);
  }

  function show(text) {
    alert(text);
  }

  // === ЕСЛИ ЭТО НЕ TELEGRAM ===
  if (!isTelegram()) {
    show(
      "⚠️ Внимание\n\n" +
      "Полная версия игры работает только в Telegram.\n\n" +
      "В Android-приложении прогресс может сбрасываться.\n\n" +
      "Рекомендуем играть через Telegram."
    );
    return; // дальше ничего не запускаем
  }

  // === TELEGRAM РЕЖИМ ===
  const tgUser = Telegram.WebApp.initDataUnsafe.user;
  const tgId = tgUser.id;

  window.playerId = "tg_" + tgId;

  // базовые значения
  window.gameDay = window.gameDay || 1;
  window.energy = window.energy || 100;
  window.balance = window.balance || 0;
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
      "Это не просто подработка.\n" +
      "Это начало твоей истории."
    );
  });

  if (gameDay === 3) {
    once("rain", () => {
      show(
        "День 3.\n" +
        "Дождь льёт без остановки.\n" +
        "Заказы есть, но силы уходят быстрее."
      );
      energy -= 15;
    });
  }

  if (gameDay === 5) {
    once("conflict", () => {
      show(
        "День 5.\n" +
        "Клиент недоволен.\n" +
        "Поддержка молчит.\n" +
        "Ты впервые чувствуешь злость."
      );
      energy -= 20;
    });
  }

})();
