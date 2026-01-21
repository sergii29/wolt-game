// PATCH v5 — новые услуги и изменение процесса доставки (без окон)

(function () {

  if (!(window.Telegram && Telegram.WebApp)) return;

  // === НАСТРОЙКИ ===
  window.deliveryModifiers = {
    urgentChance: 0.25,      // шанс срочного заказа
    waitChance: 0.30,        // шанс ожидания клиента
    nightPenalty: 1.3,       // усталость ночью
    tipChance: 0.4           // шанс чаевых
  };

  // === ПЕРЕХВАТ ЗАВЕРШЕНИЯ ЗАКАЗА ===
  const originalCompleteOrder = window.completeOrder;

  if (typeof originalCompleteOrder === "function") {

    window.completeOrder = function (order) {

      let bonus = 0;
      let energyCost = 0;

      // Срочная доставка
      if (Math.random() < deliveryModifiers.urgentChance) {
        bonus += 8;
        energyCost += 5;
      }

      // Ожидание клиента
      if (Math.random() < deliveryModifiers.waitChance) {
        energyCost += 3;

        if (Math.random() < deliveryModifiers.tipChance) {
          bonus += 5;
        }
      }

      // Ночная усталость
      const hour = new Date().getHours();
      if (hour >= 22 || hour < 6) {
        energyCost *= deliveryModifiers.nightPenalty;
      }

      // применяем эффекты
      if (window.balance !== undefined) window.balance += bonus;
      if (window.energy !== undefined) window.energy -= energyCost;

      // вызываем оригинальную логику
      return originalCompleteOrder.apply(this, arguments);
    };
  }

})();
