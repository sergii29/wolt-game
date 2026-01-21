// PATCH GAME v1 — типы доставок + репутация (с сохранением)

(function () {

  if (!(window.Telegram && Telegram.WebApp)) return;

  // ждём state и функции сохранения
  const wait = setInterval(() => {
    if (window.state && typeof window.addMoney === "function") {
      clearInterval(wait);
      initPatch();
    }
  }, 300);

  function initPatch() {

    // === ИНИЦИАЛИЗАЦИЯ ПАМЯТИ ===
    state.reputation = state.reputation ?? 0;        // скрытая репутация
    state.jobsDone = state.jobsDone ?? 0;
    state.hardJobs = state.hardJobs ?? 0;

    // === ПЕРЕХВАТ ДОХОДА ===
    const originalAddMoney = window.addMoney;

    window.addMoney = function (amount) {

      // определяем тип доставки
      const roll = Math.random();
      let type = "normal";
      let bonus = 0;
      let repChange = 0;

      if (roll < 0.20 + state.reputation * 0.01) {
        type = "urgent";
        bonus = 8;
        repChange = 1;
      } else if (roll < 0.40) {
        type = "heavy";
        bonus = 4;
        repChange = 1;
      } else if (roll < 0.55) {
        type = "cheap";
        bonus = -2;
        repChange = -1;
      }

      // применяем эффекты
      state.jobsDone++;
      if (type !== "normal") state.hardJobs++;

      state.reputation += repChange;
      state.reputation = Math.max(-10, Math.min(10, state.reputation));

      // усиливаем эффект при плохой репутации
      const finalAmount = amount + bonus + Math.floor(state.reputation * 0.5);

      return originalAddMoney(finalAmount);
    };

    // === ПЕРЕХВАТ УСТАЛОСТИ ===
    const originalUseEnergy = window.useEnergy;

    if (typeof originalUseEnergy === "function") {
      window.useEnergy = function (amount) {

        let extra = 0;

        // если берёшь сложные заказы — быстрее устаёшь
        if (state.hardJobs > 5) extra += 2;
        if (state.hardJobs > 10) extra += 4;

        return originalUseEnergy(amount + extra);
      };
    }

    // === СО
