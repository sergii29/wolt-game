(function() {
    console.log("Wolt Design Patch Loaded");

    // 1. ФИКСАЦИЯ ШТРАФА (Халява кончилась)
    setInterval(() => {
        let g = window.gameState;
        if (!g) return;

        // Проверяем 7 параметров на 0 или минус
        const stats = [g.bike, g.bag, g.phone, g.clothes, g.energy, g.water, g.mood];
        const hasPenalty = stats.some(s => s <= 0);

        let alertBox = document.getElementById('penalty-banner');

        if (hasPenalty) {
            g.balance -= 1; // Снимаем 1 зл в сек
            
            if (!alertBox) {
                alertBox = document.createElement('div');
                alertBox.id = 'penalty-banner';
                alertBox.style.cssText = "position:fixed; top:0; width:100%; background:red; color:white; text-align:center; padding:10px; z-index:9999; font-weight:bold;";
                document.body.prepend(alertBox);
            }
            alertBox.innerHTML = "⚠️ ХАЛЯВА КОНЧИЛАСЬ! ШТРАФ: -1 PLN/сек! Восстановите предметы!";
            alertBox.style.display = 'block';
        } else {
            if (alertBox) alertBox.style.display = 'none';
        }

        // Автосохранение
        localStorage.setItem("WARSZAWA_FOREVER", JSON.stringify(g));
        if (window.updateUI) window.updateUI();
    }, 1000);

    // 2. ЛОГИКА ЭНЕРГЕТИКА
    window.useEnergyDrink = function() {
        window.gameState.isEnergyDrinkActive = true;
        // Энергетик стопит расход энергии, но не воды
        setTimeout(() => { window.gameState.isEnergyDrinkActive = false; }, 60000);
    };
})();
