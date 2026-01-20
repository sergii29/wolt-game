// === PATCH v1 ===
// простой сюжет + события

(function () {
  console.log("PATCH подключен");

  // если нет глобальных переменных — создаём
  window.gameDay = window.gameDay || 1;
  window.energy = window.energy || 100;
  window.balance = window.balance || 0;

  function show(text) {
    alert(text);
  }

  // событие на 3-й день
  if (window.gameDay === 3) {
    show("День 3. Пошёл дождь. Работать стало тяжелее.");
    window.energy -= 10;
  }

  // событие на 5-й день
  if (window.gameDay === 5) {
    show("День 5. Клиент устроил скандал. Настроение на нуле.");
    window.energy -= 15;
  }

  // защита от тупой накрутки
  const realBalance = window.balance;
  Object.defineProperty(window, "balance", {
    get() {
      return realBalance;
    },
    set(v) {
      console.warn("Нельзя менять баланс напрямую");
    }
  });

})();
