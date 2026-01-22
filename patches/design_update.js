(function() {
    console.log("Система штрафов активна. Ключ: WARSZAWA_FOREVER");

    setInterval(() => {
        // Проверяем наличие объекта state (он в твоем index.html)
        if (typeof state !== 'undefined' && state.items && state.needs) {
            
            // Твои 7 параметров: вел, сумка, связь, одежда + силы, вода, настроение
            const penaltyStats = [
                state.items.bike, state.items.bag, state.items.phone, state.items.gear,
                state.needs.energy, state.needs.water, state.needs.mood
            ];

            // Проверка на 0 или минус
            const isPenalty = penaltyStats.some(v => v !== undefined && v <= 0);
            let banner = document.getElementById('penalty-banner');

            if (isPenalty) {
                state.balance -= 1; // Списываем 1 PLN
                
                if (!banner) {
                    banner = document.createElement('div');
                    banner.id = 'penalty-banner';
                    banner.style.cssText = "position:fixed; top:0; left:0; width:100%; background:red; color:white; text-align:center; padding:15px; z-index:999999; font-weight:bold;";
                    document.body.appendChild(banner);
                }
                banner.innerHTML = "⚠️ ХАЛЯВА КОНЧИЛАСЬ! Ресурсы на нуле! Штраф: -1 PLN/сек";
                banner.style.display = 'block';
            } else {
                if (banner) banner.style.display = 'none';
            }

            // Сохраняем и обновляем
            localStorage.setItem("WARSZAWA_FOREVER", JSON.stringify(state));
            if (typeof updateStats === 'function') updateStats();
        }
    }, 1000);
})();
