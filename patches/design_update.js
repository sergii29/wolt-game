(function() {
    console.log(">>> Penalty & Design Patch Loaded");

    // ГЛАВНЫЙ ЦИКЛ: ШТРАФЫ И ОБНОВЛЕНИЕ
    setInterval(() => {
        if (!window.state) return;

        const s = window.state;
        // Проверяем все 7 параметров (согласно твоей структуре)
        const checkPoints = [
            s.items.bike, s.items.bag, s.items.phone, s.items.gear,
            s.needs.energy, s.needs.water, s.needs.mood
        ];

        // Есть ли хоть один 0 или минус?
        const hasPenalty = checkPoints.some(val => val <= 0);
        let penaltyBox = document.getElementById('global-penalty');

        if (hasPenalty) {
            s.balance -= 1; // Списываем 1 PLN

            if (!penaltyBox) {
                penaltyBox = document.createElement('div');
                penaltyBox.id = 'global-penalty';
                penaltyBox.style.cssText = "position:fixed; top:0; left:0; width:100%; background:red; color:white; text-align:center; padding:15px; font-weight:bold; z-index:100000; border-bottom:3px solid black;";
                document.body.prepend(penaltyBox);
            }
            penaltyBox.innerHTML = "⚠️ ВНИМАНИЕ: СНАРЯЖЕНИЕ ИЛИ РЕСУРСЫ НА НУЛЕ!<br>ШТРАФ: -1 PLN / СЕК";
            penaltyBox.style.display = 'block';
        } else {
            if (penaltyBox) penaltyBox.style.display = 'none';
        }

        // Сохраняем состояние намертво
        localStorage.setItem("WARSZAWA_FOREVER", JSON.stringify(s));
        
        // Вызываем обновление интерфейса, если функция есть в index.html
        if (window.renderUI) window.renderUI();
    }, 1000);

    // Логика энергетика (Стоп энергии, Вода тратится)
    window.useEnergyDrink = function() {
        if (window.state.balance >= 30) {
            window.state.balance -= 30;
            window.state.isBoostActive = true; 
            setTimeout(() => { window.state.isBoostActive = false; }, 60000);
            alert("Энергетик активен! Силы не тратятся 1 минуту.");
        }
    };
})();
