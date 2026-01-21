// --- PATCH: SMART BANK UI v3 (Fixed Closing) ---
// Исправлено: теперь при закрытии окна вы возвращаетесь в меню, а не в пустоту.
// Добавлено: можно закрыть, нажав на темный фон.

(function() {
    console.log(">>> Smart Bank Patch v3 Loaded");

    // 1. Функция отрисовки НОВОГО БАНКА
    window.openNewBank = function() {
        // МЫ БОЛЬШЕ НЕ СКРЫВАЕМ МЕНЮ (чтобы не ломать навигацию)
        // Вместо этого мы открываем окно ПОВЕРХ всего.

        // Берем данные
        const currentBalance = (typeof state !== 'undefined' && state.balance) ? state.balance : 0;
        const currentDebt = (typeof state !== 'undefined' && state.debt) ? state.debt : 0;
        const reputation = (typeof state !== 'undefined' && state.reputation) ? state.reputation : 0;
        const creditLimit = 2050 + (reputation * 10);
        
        const hasDebt = currentDebt > 0;
        const statusColor = hasDebt ? '#ff4757' : '#2ed573';
        const statusText = hasDebt 
            ? `⚠️ ВНИМАНИЕ: Часть дохода списывается в счет долга!` 
            : `✅ Кредитная история чиста. Доход 100%.`;

        // Удаляем старое окно если есть (чтобы не плодились)
        const existingModal = document.getElementById('custom-bank-modal');
        if (existingModal) existingModal.remove();

        // Создаем модальное окно
        let modal = document.createElement('div');
        modal.id = 'custom-bank-modal';
        // z-index 10001 чтобы точно перекрыть всё
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:10001; backdrop-filter: blur(8px); animation: fadeIn 0.2s;";
        
        // Добавляем закрытие по клику на фон
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeNewBank();
            }
        };

        // Вставляем HTML
        modal.innerHTML = `
            <style>
                @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
                @keyframes scaleUp { from { transform:scale(0.9); } to { transform:scale(1); } }
            </style>
            <div style="background: linear-gradient(145deg, #2f3542, #1e272e); width: 90%; max-width: 350px; padding: 25px; border-radius: 20px; color: white; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 40px rgba(0,0,0,0.5); text-align: center; font-family: sans-serif; position: relative; animation: scaleUp 0.2s;">
                
                <div onclick="closeNewBank()" style="position:absolute; top:15px; right:15px; width:30px; height:30px; background:rgba(255,255,255,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; color:#aaa;">✕</div>

                <h2 style="margin: 5px 0 20px 0; color: #ffa502; text-transform: uppercase; letter-spacing: 1px; font-size: 18px;">🏦 Варшава Банк</h2>
                
                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px; color:#a4b0be;">
                        <span>Баланс:</span>
                        <span style="color:white; font-weight:bold;">${currentBalance.toFixed(2)} PLN</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px; color:#a4b0be;">
                        <span>Долг:</span>
                        <span style="color:#ff6b6b; font-weight:bold;">${currentDebt.toFixed(2)} PLN</span>
                    </div>
                    <div style="width:100%; height:1px; background:rgba(255,255,255,0.1); margin:8px 0;"></div>
                    <div style="display:flex; justify-content:space-between; font-size:13px;">
                        <span style="color:#7bed9f;">Лимит:</span>
                        <span>${creditLimit} PLN</span>
                    </div>
                </div>

                <div style="font-size: 12px; line-height: 1.4; color: ${statusColor}; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid ${statusColor}; text-align: left;">
                    ${statusText}
                </div>

                <button id="btn-take-loan" style="width:100%; padding:14px; border:none; border-radius:12px; background: linear-gradient(90deg, #3742fa, #5352ed); color:white; font-weight:bold; margin-bottom:10px; cursor:pointer; font-size:15px; box-shadow: 0 4px 15px rgba(55, 66, 250, 0.3);">
                    Взять кредит (+500)
                </button>
                
                <button id="btn-repay-loan" style="width:100%; padding:14px; border:none; border-radius:12px; background: linear-gradient(90deg, #2ed573, #7bed9f); color:#2f3542; font-weight:bold; margin-bottom:15px; cursor:pointer; font-size:15px;">
                    Погасить долг (-500)
                </button>

                <div style="color:#777; font-size:11px;">Нажмите на фон, чтобы закрыть</div>
            </div>
        `;
        document.body.appendChild(modal);

        // Логика кнопок
        document.getElementById('btn-take-loan').onclick = function() {
            if(state.debt + 500 > creditLimit) {
                alert("Банк: Отказ! Превышен кредитный лимит.");
            } else {
                state.balance += 500;
                state.debt += 500;
                saveAndRefresh();
            }
        };

        document.getElementById('btn-repay-loan').onclick = function() {
            if(state.debt <= 0) return alert("У вас нет долгов!");
            if(state.balance < 500) return alert("Мало денег!");
            state.balance -= 500;
            state.debt -= 500;
            if(state.debt < 0) state.debt = 0;
            saveAndRefresh();
        };
    };

    // Функция закрытия (глобальная, чтобы работала из HTML)
    window.closeNewBank = function() {
        const modal = document.getElementById('custom-bank-modal');
        if (modal) modal.remove();
        // Мы ничего не скрывали, так что ничего и не нужно восстанавливать
        // Меню останется там, где было
    };

    function saveAndRefresh() {
        if(typeof updateUI === 'function') updateUI();
        // Просто перерисовываем окно банка с новыми цифрами
        window.openNewBank(); 
    }

    // 2. ПЕРЕХВАТЧИК (HIJACKER) - Тот же самый, он работает хорошо
    setInterval(() => {
        const menuItems = document.querySelectorAll('div, li, span, button, a');
        menuItems.forEach(item => {
            if (item.innerText && (item.innerText.includes('Банк / Кредит') || item.innerText.includes('Банк (Кредит)'))) {
                if (item.getAttribute('data-patched') !== 'true') {
                    item.setAttribute('data-patched', 'true');
                    item.addEventListener('click', function(e) {
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        e.stopImmediatePropagation(); 
                        window.openNewBank();
                    }, true);
                }
            }
        });
    }, 1000);

})();


// ============================================================
// --- PATCH: GOV & TAXI VISUAL UPDATE (APPEND THIS TO FILE) ---
// ============================================================

(function() {
    console.log(">>> Government & Taxi Patch Loaded");

    // --- 1. КРАСИВОЕ ОКНО ПРАВИТЕЛЬСТВА ---
    window.openNewGov = function() {
        const modal = document.getElementById('custom-bank-modal') || createBaseModal();
        
        // Расчет инфляции (берем логику из твоего index.html)
        const levelSum = Object.values(state.repairs).reduce((a,b)=>a+b,0);
        const inflationRate = (typeof gameConfig !== 'undefined' && gameConfig.inflationRate) ? gameConfig.inflationRate : 0.1;
        const currentInflation = levelSum * inflationRate; 
        const inflationPercent = (currentInflation * 100).toFixed(0);
        
        // Цены отката
        const mult = 1 + currentInflation;
        const cost1 = 2700 * mult;
        const cost2 = 5000 * mult;

        // Цвет опасности
        let color = '#2ecc71'; // Green
        if(currentInflation > 0.3) color = '#f1c40f'; // Yellow
        if(currentInflation > 0.8) color = '#e74c3c'; // Red

        modal.innerHTML = `
            <div style="position:relative; width: 90%; max-width: 380px; background: #1a1a1d; padding: 20px; border-radius: 15px; border: 1px solid #333; box-shadow: 0 0 30px rgba(0,0,0,0.8); font-family: 'Segoe UI', sans-serif; color: white;">
                <div onclick="closeNewBank()" style="position:absolute; top:15px; right:15px; width:30px; height:30px; background:rgba(255,255,255,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;">✕</div>
                
                <h2 style="text-align:center; color:#95a5a6; text-transform:uppercase; letter-spacing:2px; font-size:16px; margin-top:0"><i class="fa-solid fa-building-columns"></i> Министерство</h2>

                <div style="text-align:center; margin: 20px 0;">
                    <div style="font-size: 40px; font-weight: 800; color: ${color}; text-shadow: 0 0 10px ${color}40;">${inflationPercent}%</div>
                    <div style="font-size: 12px; color: #7f8c8d; text-transform:uppercase;">Уровень инфляции</div>
                </div>

                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; font-size: 13px; color: #bdc3c7; margin-bottom: 20px; border-left: 3px solid ${color};">
                    ${inflationPercent > 0 
                        ? `Из-за частого ремонта цены в магазинах выросли на <b>${inflationPercent}%</b>. Снизьте инфляцию, чтобы покупать дешевле.` 
                        : `Экономика стабильна. Цены на базовом уровне.`}
                </div>

                <button onclick="buyDeflationWrapper(1, ${cost1})" style="width:100%; padding:15px; margin-bottom:10px; background: linear-gradient(90deg, #2c3e50, #34495e); border: 1px solid #4a69bd; color: #ecf0f1; border-radius: 8px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
                    <span>📉 Лоббирование (-1 ур)</span>
                    <span style="color:#f1c40f">-${cost1.toFixed(0)} PLN</span>
                </button>

                <button onclick="buyDeflationWrapper(2, ${cost2})" style="width:100%; padding:15px; background: linear-gradient(90deg, #2c3e50, #34495e); border: 1px solid #6a89cc; color: #ecf0f1; border-radius: 8px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
                    <span>📉 Взятка министру (-2 ур)</span>
                    <span style="color:#f1c40f">-${cost2.toFixed(0)} PLN</span>
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    };

    // Обертка для покупки (чтобы обновить окно после клика)
    window.buyDeflationWrapper = function(lvl, cost) {
        // Вызываем оригинальную функцию игры
        if(typeof buyDeflation === 'function') {
            buyDeflation(lvl, cost);
            // Ждем чуть-чуть и перерисовываем наше окно
            setTimeout(() => window.openNewGov(), 200);
        }
    };


    // --- 2. КРАСИВЫЙ АВТОСАЛОН (NFS STYLE) ---
    window.openNewTaxiShop = function() {
        const modal = document.getElementById('custom-bank-modal') || createBaseModal();

        // Данные машин (копируем из index.html, чтобы красиво отрисовать)
        const cars = [
            { id: 'skoda', name: 'Skoda Fabia', price: 15000, desc: 'Надежная рабочая лошадка.', icon: 'fa-car-side', speed: 30, comfort: 20 },
            { id: 'toyota', name: 'Toyota Prius', price: 45000, desc: 'Гибрид. Экономия и чай.', icon: 'fa-leaf', speed: 50, comfort: 60 },
            { id: 'tesla', name: 'Tesla Model 3', price: 120000, desc: 'Престиж. VIP заказы.', icon: 'fa-bolt', speed: 90, comfort: 100 }
        ];

        let cardsHtml = '';
        cars.forEach(car => {
            const isOwned = (state.taxi.vehicle === car.id);
            const btnBg = isOwned ? '#27ae60' : '#2980b9';
            const btnText = isOwned ? 'В ГАРАЖЕ' : `КУПИТЬ ${car.price/1000}K`;
            const opacity = isOwned ? 1 : (state.balance >= car.price ? 1 : 0.6);
            
            cardsHtml += `
            <div style="background: #2d3436; border-radius: 12px; overflow: hidden; margin-bottom: 15px; border: ${isOwned ? '2px solid #f1c40f' : '1px solid #444'}; opacity: ${opacity}; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                <div style="background: #222; padding: 15px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:900; font-size:16px; color:white"><i class="fa-solid ${car.icon}"></i> ${car.name}</span>
                    ${isOwned ? '<i class="fa-solid fa-check-circle" style="color:#f1c40f"></i>' : ''}
                </div>
                <div style="padding: 15px;">
                    <div style="font-size:12px; color:#b2bec3; margin-bottom:10px;">${car.desc}</div>
                    
                    <div style="display:flex; align-items:center; margin-bottom:5px; font-size:10px; color:#aaa">
                        <span style="width:60px">Скорость</span>
                        <div style="flex:1; height:4px; background:#444; border-radius:2px;"><div style="width:${car.speed}%; height:100%; background:#3498db"></div></div>
                    </div>
                    <div style="display:flex; align-items:center; margin-bottom:15px; font-size:10px; color:#aaa">
                        <span style="width:60px">Комфорт</span>
                        <div style="flex:1; height:4px; background:#444; border-radius:2px;"><div style="width:${car.comfort}%; height:100%; background:#9b59b6"></div></div>
                    </div>

                    <button onclick="${isOwned ? '' : `buyVehicleWrapper('${car.id}', ${car.price})`}" 
                        style="width:100%; padding:10px; border:none; border-radius:6px; background:${btnBg}; color:white; font-weight:bold; font-size:12px;">
                        ${btnText}
                    </button>
                </div>
            </div>`;
        });

        modal.innerHTML = `
            <div style="position:relative; width: 90%; max-width: 380px; background: #1a1a1d; padding: 20px; border-radius: 15px; border: 1px solid #333; max-height: 85vh; overflow-y: auto;">
                <div onclick="closeNewBank()" style="position:absolute; top:15px; right:15px; width:30px; height:30px; background:rgba(255,255,255,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:white;">✕</div>
                <h2 style="text-align:center; color:#f1c40f; text-transform:uppercase; margin-top:0"><i class="fa-solid fa-car"></i> Автосалон</h2>
                ${cardsHtml}
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.buyVehicleWrapper = function(id, price) {
        if(typeof buyVehicle === 'function') {
            buyVehicle(id, price);
            setTimeout(() => window.openNewTaxiShop(), 200);
        }
    };

    // Вспомогательная функция для создания фона (если вдруг окно Банка не создало его)
    function createBaseModal() {
        let modal = document.createElement('div');
        modal.id = 'custom-bank-modal';
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); display:flex; align-items:center; justify-content:center; z-index:10001; backdrop-filter: blur(5px); animation: fadeIn 0.2s;";
        // Закрытие по клику на фон
        modal.onclick = function(e) { if (e.target === modal) closeNewBank(); };
        document.body.appendChild(modal);
        return modal;
    }

    // --- 3. ПЕРЕХВАТЧИК КНОПОК (HIJACKER) ---
    setInterval(() => {
        const menuItems = document.querySelectorAll('div, li, span, button, a');
        menuItems.forEach(item => {
            const txt = item.innerText || "";
            
            // Перехват Правительства
            if (txt.includes('Правительство') || txt.includes('Инфляция')) {
                if (item.getAttribute('data-gov-patched') !== 'true') {
                    item.setAttribute('data-gov-patched', 'true');
                    item.addEventListener('click', function(e) {
                        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
                        window.openNewGov();
                    }, true);
                }
            }

            // Перехват Автосалона
            if (txt.includes('Автосалон')) {
                if (item.getAttribute('data-taxi-patched') !== 'true') {
                    item.setAttribute('data-taxi-patched', 'true');
                    item.addEventListener('click', function(e) {
                        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
                        window.openNewTaxiShop();
                    }, true);
                }
            }
        });
    }, 1000);

})();
