// ============================================================
// --- MEGA PATCH v4: BANK + GOV + TAXI (ALL IN ONE) ---
// ============================================================

(function() {
    console.log(">>> Mega Patch v4 Loaded: All Systems Active");

    // 1. ВНЕДРЕНИЕ СТИЛЕЙ (CSS)
    // Добавляем красивые стили один раз для всех окон
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        /* Анимация появления */
        @keyframes modalFadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        
        /* Общий стиль модального окна */
        .custom-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            animation: modalFadeIn 0.2s ease-out;
        }
        
        .custom-modal-box {
            background: linear-gradient(145deg, #1e1e24, #25252b);
            width: 90%; max-width: 380px;
            max-height: 85vh; overflow-y: auto;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            padding: 20px;
            position: relative;
            color: #fff;
            font-family: 'Segoe UI', Roboto, sans-serif;
        }

        /* Кнопка закрытия (крестик) */
        .close-btn {
            position: absolute; top: 15px; right: 15px;
            width: 32px; height: 32px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-weight: bold; color: #bbb;
            transition: background 0.2s;
        }
        .close-btn:active { background: rgba(255, 255, 255, 0.2); }

        /* Заголовки */
        .modal-title {
            text-align: center; margin: 5px 0 20px 0;
            font-size: 18px; text-transform: uppercase; letter-spacing: 1px;
            font-weight: 800;
        }

        /* Кнопки внутри окон */
        .action-btn {
            width: 100%; padding: 14px; margin-bottom: 10px;
            border: none; border-radius: 10px;
            font-weight: bold; font-size: 14px;
            cursor: pointer; display: flex; justify-content: space-between; align-items: center;
            transition: transform 0.1s;
        }
        .action-btn:active { transform: scale(0.98); }
    `;
    document.head.appendChild(styleSheet);


    // 2. ГЛАВНАЯ ФУНКЦИЯ ОТКРЫТИЯ ОКОН
    window.openGameModal = function(type) {
        // Удаляем старое окно если есть
        closeGameModal();

        // Данные игры
        const bal = (typeof state !== 'undefined') ? state.balance : 0;
        const debt = (typeof state !== 'undefined') ? state.debt : 0;
        
        // Создаем контейнер
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';
        overlay.id = 'active-custom-modal';
        
        // Закрытие по клику на фон
        overlay.onclick = (e) => { if(e.target === overlay) closeGameModal(); };

        let contentHTML = '';

        // --- ЛОГИКА ДЛЯ РАЗНЫХ ОКОН ---
        
        if (type === 'bank') {
            // === БАНК ===
            const limit = 1000 + (state.career.totalOrders * 50);
            const hasDebt = debt > 0;
            const statusColor = hasDebt ? '#ff4757' : '#2ed573';
            
            contentHTML = `
                <div class="close-btn" onclick="closeGameModal()">✕</div>
                <h2 class="modal-title" style="color:#f1c40f"><i class="fa-solid fa-building-columns"></i> Варшава Банк</h2>
                
                <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:12px; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#aaa; font-size:13px;"><span>Баланс:</span><span style="color:white; font-weight:bold">${bal.toFixed(2)} PLN</span></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#aaa; font-size:13px;"><span>Долг:</span><span style="color:${hasDebt?'#ff6b6b':'white'}; font-weight:bold">${debt.toFixed(2)} PLN</span></div>
                    <div style="width:100%; height:1px; background:rgba(255,255,255,0.1); margin:8px 0;"></div>
                    <div style="display:flex; justify-content:space-between; font-size:12px;"><span>Кред. Лимит:</span><span style="color:#7bed9f">${limit} PLN</span></div>
                </div>

                <div style="font-size:12px; padding:10px; background:rgba(255,255,255,0.05); border-left:3px solid ${statusColor}; border-radius:6px; margin-bottom:20px; color:${statusColor}">
                    ${hasDebt ? '⚠️ С активным долгом часть дохода списывается автоматически!' : '✅ Кредитная история чиста.'}
                </div>

                <button class="action-btn" onclick="execBank('loan')" style="background:linear-gradient(90deg, #3742fa, #5352ed); color:white;">
                    <span>Взять кредит</span> <span>+500 PLN</span>
                </button>
                <button class="action-btn" onclick="execBank('repay')" style="background:linear-gradient(90deg, #2ed573, #7bed9f); color:#1e272e;">
                    <span>Погасить долг</span> <span>-500 PLN</span>
                </button>
            `;
        } 
        else if (type === 'gov') {
            // === ПРАВИТЕЛЬСТВО ===
            const levelSum = Object.values(state.repairs).reduce((a,b)=>a+b,0);
            const inflationRate = (typeof gameConfig !== 'undefined' && gameConfig.inflationRate) ? gameConfig.inflationRate : 0.1;
            const currentInflation = levelSum * inflationRate; 
            const infPercent = (currentInflation * 100).toFixed(0);
            const cost1 = 2700 * (1 + currentInflation);
            
            let infColor = '#2ecc71';
            if(currentInflation > 0.3) infColor = '#f1c40f';
            if(currentInflation > 0.8) infColor = '#e74c3c';

            contentHTML = `
                <div class="close-btn" onclick="closeGameModal()">✕</div>
                <h2 class="modal-title" style="color:#95a5a6"><i class="fa-solid fa-scale-unbalanced-flip"></i> Министерство</h2>
                
                <div style="text-align:center; margin:20px 0;">
                    <div style="font-size:48px; font-weight:800; color:${infColor}; text-shadow:0 0 15px ${infColor}40">${infPercent}%</div>
                    <div style="font-size:12px; color:#7f8c8d; letter-spacing:1px">ТЕКУЩАЯ ИНФЛЯЦИЯ</div>
                </div>

                <div style="font-size:13px; color:#bdc3c7; margin-bottom:20px; text-align:center; padding:0 10px;">
                    Высокая инфляция увеличивает цены в магазинах. Используйте связи, чтобы снизить её.
                </div>

                <button class="action-btn" onclick="execGov(1, ${cost1})" style="background:#34495e; color:#ecf0f1; border:1px solid #4a69bd;">
                    <span>📉 Лоббирование (-1 ур)</span> <span style="color:#f1c40f">-${cost1.toFixed(0)}</span>
                </button>
            `;
        }
        else if (type === 'taxi') {
            // === АВТОСАЛОН ===
            const cars = [
                { id: 'skoda', name: 'Skoda Fabia', price: 15000, desc: 'Эконом', icon: 'fa-car-side', spd: 30, cmf: 20 },
                { id: 'toyota', name: 'Toyota Prius', price: 45000, desc: 'Гибрид', icon: 'fa-leaf', spd: 50, cmf: 60 },
                { id: 'tesla', name: 'Tesla Model 3', price: 120000, desc: 'Бизнес', icon: 'fa-bolt', spd: 90, cmf: 100 }
            ];

            let carsList = '';
            cars.forEach(car => {
                const isOwned = (state.taxi.vehicle === car.id);
                const btnCol = isOwned ? '#27ae60' : '#2980b9';
                const btnTxt = isOwned ? 'В ГАРАЖЕ' : `КУПИТЬ ${car.price/1000}K`;
                
                carsList += `
                <div style="background:#2d3436; border-radius:12px; margin-bottom:12px; border:${isOwned ? '2px solid #f1c40f' : '1px solid #444'}; overflow:hidden;">
                    <div style="padding:12px; display:flex; justify-content:space-between; background:#222; align-items:center">
                        <span style="font-weight:bold"><i class="fa-solid ${car.icon}"></i> ${car.name}</span>
                        ${isOwned ? '<i class="fa-solid fa-check" style="color:#f1c40f"></i>' : ''}
                    </div>
                    <div style="padding:12px;">
                        <div style="display:flex; align-items:center; margin-bottom:4px; font-size:10px; color:#aaa">
                            <span style="width:50px">Скор.</span>
                            <div style="flex:1; height:4px; background:#444; border-radius:2px"><div style="width:${car.spd}%; height:100%; background:#3498db"></div></div>
                        </div>
                        <div style="display:flex; align-items:center; margin-bottom:10px; font-size:10px; color:#aaa">
                            <span style="width:50px">Комф.</span>
                            <div style="flex:1; height:4px; background:#444; border-radius:2px"><div style="width:${car.cmf}%; height:100%; background:#9b59b6"></div></div>
                        </div>
                        <button onclick="${isOwned?'':`execTaxi('${car.id}', ${car.price})`}" style="width:100%; padding:8px; border:none; border-radius:6px; background:${btnCol}; color:white; font-weight:bold; font-size:12px;">${btnTxt}</button>
                    </div>
                </div>`;
            });

            contentHTML = `
                <div class="close-btn" onclick="closeGameModal()">✕</div>
                <h2 class="modal-title" style="color:#00d2d3"><i class="fa-solid fa-car"></i> Таксопарк</h2>
                ${carsList}
            `;
        }

        // Вставляем HTML внутрь коробки
        overlay.innerHTML = `<div class="custom-modal-box">${contentHTML}</div>`;
        document.body.appendChild(overlay);
    };

    // 3. ФУНКЦИИ ДЕЙСТВИЙ (Logic)
    window.closeGameModal = function() {
        const m = document.getElementById('active-custom-modal');
        if(m) m.remove();
    };

    window.execBank = function(action) {
        if(action === 'loan') {
            if(typeof takeLoan === 'function') takeLoan(); // Вызываем родную функцию игры
            else { state.balance += 500; state.debt += 550; } // Fallback
        }
        if(action === 'repay') {
            if(typeof repayLoan === 'function') repayLoan(); // Вызываем родную функцию игры (она у тебя в index.html была переписана патчем, но если нет - сработает эта)
            else if(state.debt > 0 && state.balance >= 500) { state.balance -= 500; state.debt -= 500; } 
        }
        if(typeof updateUI === 'function') updateUI();
        window.openGameModal('bank'); // Обновляем окно
    };

    window.execGov = function(lvl, cost) {
        if(typeof buyDeflation === 'function') buyDeflation(lvl, cost);
        setTimeout(() => window.openGameModal('gov'), 200);
    };

    window.execTaxi = function(id, price) {
        if(typeof buyVehicle === 'function') buyVehicle(id, price);
        setTimeout(() => window.openGameModal('taxi'), 200);
    };


    // 4. УМНЫЙ ПЕРЕХВАТЧИК КНОПОК (HIJACKER)
    // Один цикл для всех типов кнопок
    setInterval(() => {
        const allElements = document.querySelectorAll('div, li, span, button, a');
        
        allElements.forEach(el => {
            const txt = (el.innerText || "").toLowerCase();
            if(txt.length < 3) return; // Пропускаем мусор

            // Определяем тип кнопки по тексту
            let type = null;
            
            if (txt.includes('банк') || txt.includes('кредит')) type = 'bank';
            else if (txt.includes('правительство') || txt.includes('инфляция')) type = 'gov';
            else if (txt.includes('автосалон')) type = 'taxi';

            // Если нашли совпадение и еще не патчили эту кнопку
            if (type && el.getAttribute('data-patch-v4') !== 'true') {
                el.setAttribute('data-patch-v4', 'true');
                console.log(`Patched button: [${type}] "${txt}"`);
                
                // Вешаем свой обработчик
                el.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    console.log(`Opening custom modal: ${type}`);
                    window.openGameModal(type);
                }, true); // true = перехват в фазе capture (самый сильный)
            }
        });
    }, 1000); // Проверка каждую секунду

})();
