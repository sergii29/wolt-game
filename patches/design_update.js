// ============================================================
// --- PATCH v12: TOTAL WHITE THEME (MENU + TABS) ---
// ============================================================

(function() {
    console.log(">>> Patch v12: White Theme & Custom Bonuses Loaded");

    // 1. КОНФИГУРАЦИЯ БОНУСОВ (Твои настройки)
    window.bonusConfig = {
        active: [
            { id: 1, title: "🔥 SPEEDRUN: 50 заказов", reward: 500, target: 50, desc: "Успей за 20 минут!", endTime: Date.now() + 1200000 }, 
            { id: 2, title: "💀 GRIND GOD: 550 заказов", reward: 7000, target: 550, desc: "Цель для маньяков", endTime: new Date().setHours(23,59,59,999) }
        ],
        later: [
            { date: "Сегодня", time: "12:00-16:00", text: "Обеденный Раш: +150 PLN", target: "Сделай 100 заказов" },
            { date: "Сегодня", time: "18:00-22:00", text: "Вечерний Жор: +300 PLN", target: "Сделай 200 заказов" },
            { date: "Завтра", time: "Весь день", text: "Выходной Марафон", target: "1000 заказов" }
        ]
    };

    if(typeof window.startSessionOrders === 'undefined') window.startSessionOrders = (state.career.totalOrders || 0);

    // 2. СТИЛИ (PURE WHITE WOLT STYLE)
    const styles = `
        /* --- 1. КАРТА (ТЕМНАЯ - ОСТАВЛЯЕМ ДЛЯ КОНТРАСТА) --- */
        #map { background: #1a1a1a !important; filter: contrast(1.1) brightness(0.9); }

        /* --- 2. БОКОВОЕ МЕНЮ (БЕЛОЕ) --- */
        #side-menu {
            background: #ffffff !important;
            border-right: 1px solid #e0e0e0 !important;
            color: #202125 !important;
        }
        .menu-item {
            color: #202125 !important;
            border-bottom: 1px solid #f0f0f0 !important;
            font-weight: 500 !important;
        }
        .menu-item i { color: #555 !important; } /* Серые иконки по умолчанию */
        
        /* Цветные иконки в меню */
        .menu-item .fa-store { color: #009de0 !important; }
        .menu-item .fa-building-columns { color: #00c37b !important; }
        .menu-item .fa-scale-unbalanced-flip { color: #5e6d76 !important; }
        .menu-item .fa-clock-rotate-left { color: #202125 !important; }
        
        #player-name-display { color: #009de0 !important; font-weight: 800 !important; }
        #player-id-display { color: #999 !important; }
        .menu-section-title { color: #999 !important; }

        /* --- 3. ОКНА (БАНК, ПРАВИТЕЛЬСТВО) - БЕЛЫЕ --- */
        .custom-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
            z-index: 10000; display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.2s ease-out;
        }
        .custom-modal-box {
            background: #ffffff; /* БЕЛЫЙ ФОН */
            width: 90%; max-width: 380px; max-height: 85vh; overflow-y: auto;
            border-radius: 20px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
            padding: 25px; position: relative; 
            color: #202125; /* ТЕМНЫЙ ТЕКСТ */
            font-family: 'Segoe UI', Roboto, sans-serif;
        }
        .close-btn {
            position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
            background: #f0f0f0; border-radius: 50%; color: #333;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-weight: bold; transition: background 0.2s;
        }
        .close-btn:active { background: #e0e0e0; }

        /* Элементы внутри белых окон */
        .info-card {
            background: #f7f7f7; padding: 15px; border-radius: 12px; margin-bottom: 20px;
            border: 1px solid #eee;
        }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555; }
        .info-val { font-weight: bold; color: #202125; }
        .modal-h2 { text-align: center; margin: 5px 0 20px 0; font-size: 20px; font-weight: 800; color: #202125; }
        
        /* Кнопки действий */
        .action-btn {
            width: 100%; padding: 15px; margin-bottom: 10px; border: none; border-radius: 12px;
            font-weight: bold; font-size: 14px; cursor: pointer; 
            display: flex; justify-content: space-between; align-items: center;
            transition: transform 0.1s; color: white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .action-btn:active { transform: scale(0.98); }

        /* --- 4. НИЖНЯЯ ПАНЕЛЬ И GPS --- */
        .bottom-sheet {
            background: #ffffff !important; color: #202125 !important;
            border-top-left-radius: 20px !important; border-top-right-radius: 20px !important;
            box-shadow: 0 -5px 30px rgba(0,0,0,0.15) !important;
        }
        .rocket-banner {
            background: #f7f7f7; border-radius: 12px; padding: 12px 15px;
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 20px; cursor: pointer;
        }
        .rocket-text { font-size: 14px; font-weight: 700; color: #202125; }
        
        /* --- БОНУСНОЕ ОКНО --- */
        .bonus-modal-card {
            background: #f2f2f2; width: 100%; height: 92vh;
            border-top-left-radius: 20px; border-top-right-radius: 20px;
            overflow-y: auto; padding: 20px; position: relative;
            animation: slideUp 0.3s;
        }
        .active-card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .progress-track { height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden; margin: 15px 0; }
        .progress-fill { height: 100%; background: #00c37b; width: 0%; transition: width 0.5s; }
        
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    `;

    const styleSheet = document.createElement("style"); styleSheet.innerText = styles; document.head.appendChild(styleSheet);


    // 3. ФУНКЦИЯ ОТРИСОВКИ БЕЛЫХ ОКОН (BANK / GOV / TAXI)
    window.renderCustomModal = function(type) {
        const old = document.getElementById('active-custom-modal'); if(old) old.remove();
        const overlay = document.createElement('div');
        overlay.id = 'active-custom-modal';
        overlay.className = 'custom-modal-overlay';
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

        let content = '';
        const bal = state.balance; const debt = state.debt;

        // --- БАНК (БЕЛЫЙ) ---
        if(type === 'bank') {
            const limit = 1000 + (state.career.totalOrders * 50);
            const hasDebt = debt > 0;
            
            content = `
                <div class="close-btn" onclick="document.getElementById('active-custom-modal').remove()">✕</div>
                <h2 class="modal-h2">Варшава Банк</h2>
                
                <div class="info-card">
                    <div class="info-row"><span>Баланс</span><span class="info-val">${bal.toFixed(2)} PLN</span></div>
                    <div class="info-row"><span>Долг</span><span class="info-val" style="color:${hasDebt?'#ff4757':'#202125'}">${debt.toFixed(2)} PLN</span></div>
                    <div style="width:100%; height:1px; background:#eee; margin:10px 0;"></div>
                    <div class="info-row"><span style="color:#999">Лимит</span><span style="color:#00c37b; font-weight:bold">${limit} PLN</span></div>
                </div>

                <div style="font-size:12px; padding:12px; background:${hasDebt?'#fff0f0':'#e8f5e9'}; border-radius:8px; margin-bottom:20px; color:${hasDebt?'#d32f2f':'#2e7d32'}; display:flex; gap:10px; align-items:center;">
                    <i class="fa-solid ${hasDebt?'fa-triangle-exclamation':'fa-circle-check'}"></i>
                    <span>${hasDebt ? 'Часть дохода удерживается за долги.' : 'Кредитная история чиста.'}</span>
                </div>

                <button class="action-btn" onclick="wrapAction('loan')" style="background:#009de0;">
                    <span>Взять кредит</span> <span style="background:rgba(255,255,255,0.2); padding:2px 6px; border-radius:4px">+500</span>
                </button>
                <button class="action-btn" onclick="wrapAction('repay')" style="background:#00c37b;">
                    <span>Погасить долг</span> <span style="background:rgba(255,255,255,0.2); padding:2px 6px; border-radius:4px">-500</span>
                </button>
            `;
        }
        
        // --- ПРАВИТЕЛЬСТВО (БЕЛОЕ) ---
        else if(type === 'gov') {
             const levelSum = Object.values(state.repairs).reduce((a,b)=>a+b,0);
             const inflationRate = 0.1;
             const inf = (levelSum * inflationRate * 100).toFixed(0);
             const cost1 = 2700 * (1 + levelSum * inflationRate);
             
             let color = '#00c37b'; if(inf > 30) color = '#f1c40f'; if(inf > 80) color = '#ff4757';

             content = `
                <div class="close-btn" onclick="document.getElementById('active-custom-modal').remove()">✕</div>
                <h2 class="modal-h2">Министерство</h2>
                
                <div style="text-align:center; margin:30px 0;">
                    <div style="font-size:56px; font-weight:800; color:${color}; letter-spacing:-2px">${inf}%</div>
                    <div style="font-size:13px; color:#999; text-transform:uppercase; font-weight:bold; letter-spacing:1px">Текущая Инфляция</div>
                </div>

                <div style="background:#f7f7f7; padding:15px; border-radius:12px; color:#555; font-size:13px; margin-bottom:20px; text-align:center; line-height:1.5">
                    Высокая инфляция поднимает цены в магазине запчастей. Используйте связи для снижения.
                </div>

                <button class="action-btn" onclick="wrapGov(1, ${cost1})" style="background:#333;">
                    <span>📉 Лоббирование (-1 ур)</span> <span style="color:#f1c40f">-${cost1.toFixed(0)}</span>
                </button>
             `;
        }

        // --- ТАКСИ (БЕЛОЕ) ---
        else if(type === 'taxi') {
            const cars = [
                { id: 'skoda', name: 'Skoda Fabia', price: 15000, desc: 'Эконом', icon: 'fa-car-side', spd: 30 },
                { id: 'toyota', name: 'Toyota Prius', price: 45000, desc: 'Гибрид', icon: 'fa-leaf', spd: 50 },
                { id: 'tesla', name: 'Tesla Model 3', price: 120000, desc: 'Бизнес', icon: 'fa-bolt', spd: 90 }
            ];
            
            content = `<div class="close-btn" onclick="document.getElementById('active-custom-modal').remove()">✕</div><h2 class="modal-h2">Автосалон</h2>`;
            
            cars.forEach(car => {
                const isOwned = (state.taxi.vehicle === car.id);
                content += `
                <div style="background:white; border:1px solid ${isOwned?'#00c37b':'#eee'}; border-radius:12px; padding:15px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
                        <span style="font-weight:bold; font-size:16px"><i class="fa-solid ${car.icon}" style="color:#555"></i> ${car.name}</span>
                        ${isOwned ? '<i class="fa-solid fa-circle-check" style="color:#00c37b"></i>' : ''}
                    </div>
                    <div style="display:flex; align-items:center; margin-bottom:15px; gap:10px">
                        <span style="font-size:11px; color:#999">Скорость</span>
                        <div style="flex:1; height:6px; background:#f0f0f0; border-radius:3px"><div style="width:${car.spd}%; height:100%; background:#009de0; border-radius:3px"></div></div>
                    </div>
                    <button class="action-btn" onclick="${isOwned?'':`wrapTaxi('${car.id}',${car.price})`}" style="background:${isOwned?'#00c37b':'#333'}; margin-bottom:0; padding:10px">
                        ${isOwned ? 'В ГАРАЖЕ' : `КУПИТЬ ${car.price/1000}K PLN`}
                    </button>
                </div>`;
            });
        }

        overlay.innerHTML = `<div class="custom-modal-box">${content}</div>`;
        document.body.appendChild(overlay);
    };


    // 4. ОКНО БОНУСОВ (Тоже белое, код из v11 сохранен)
    window.renderBonusModal = function() {
        const sessionProgress = (state.career.totalOrders || 0) - window.startSessionOrders;
        let activeHtml = '';
        window.bonusConfig.active.forEach(b => {
            let safeProgress = Math.min(sessionProgress, b.target);
            let percent = (safeProgress / b.target) * 100;
            let diff = b.endTime - Date.now();
            let timeLeft = (diff > 0) ? Math.floor(diff/60000) + ' мин' : 'Завершено';

            activeHtml += `
            <div class="active-card">
                <div style="font-weight:800; font-size:16px; color:#202125">${b.title} <span style="color:#00c37b">(${b.reward} PLN)</span></div>
                <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#777">
                    <div><i class="fa-regular fa-clock"></i> ${timeLeft}</div>
                    <div><strong>${safeProgress}</strong> / ${b.target}</div>
                </div>
            </div>`;
        });

        const overlay = document.createElement('div');
        overlay.className = 'bonus-modal-overlay';
        overlay.id = 'bonus-modal';
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:20000; display:flex; align-items:flex-end;";
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `<div class="bonus-modal-card">
            <div class="close-circle" onclick="document.getElementById('bonus-modal').remove()">✕</div>
            <h1 style="font-size:26px; font-weight:800; color:#202125; margin:15px 0 25px 0">Зарабатывай дополнительно</h1>
            <div style="font-weight:700; color:#202125; margin-bottom:10px">Активные</div>
            ${activeHtml}
            <div style="text-align:center; margin-top:30px; color:#999; font-size:11px">Настройки симуляции обновлены</div>
        </div>`;
        document.body.appendChild(overlay);
    };

    // 5. ИНТЕГРАЦИЯ В МЕНЮ И GPS
    function forceGPS() {
        if (!navigator.geolocation || !window.map) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                window.map.setView([latitude, longitude], 16);
                window.map.eachLayer(l => { if(l instanceof L.Marker) l.setLatLng([latitude, longitude]); });
            }, null, { enableHighAccuracy: true }
        );
    }
    setTimeout(forceGPS, 2000);

    // 6. ХУКИ И ПЕРЕХВАТЧИКИ
    window.openModal = function(type) {
        if(type==='bank') window.renderCustomModal('bank');
        else if(type==='deflation') window.renderCustomModal('gov');
        else if(type==='taxi-shop') window.renderCustomModal('taxi');
        else { 
            toggleMenu(); 
            const m=document.getElementById('full-modal'); const b=document.getElementById('modal-body'); 
            m.classList.add('open'); 
            if(type==='shop'){document.getElementById('modal-title').textContent='Магазин';renderShop(b);}
            else{document.getElementById('modal-title').textContent='История';renderHistory(b);} 
        }
    };

    window.wrapAction = function(a) { if(a==='loan' && window.takeLoan) window.takeLoan(); if(a==='repay' && window.repayLoan) window.repayLoan(); setTimeout(()=>window.renderCustomModal('bank'), 100); }
    window.wrapGov = function(l, c) { if(window.buyDeflation) window.buyDeflation(l, c); setTimeout(()=>window.renderCustomModal('gov'), 100); }
    window.wrapTaxi = function(id, p) { if(window.buyVehicle) window.buyVehicle(id, p); setTimeout(()=>window.renderCustomModal('taxi'), 100); }

    // Вставка ракеты
    setInterval(() => {
        const offlineView = document.getElementById('offline-view');
        if(offlineView && !document.querySelector('.rocket-banner')) {
            const oldInfo = offlineView.querySelector('p'); if(oldInfo) oldInfo.style.display = 'none';
            const rocketHTML = `
                <div style="display:flex; gap:10px; font-size:14px; color:#555; margin-bottom:15px; font-weight:500;">
                    <i class="fa-solid fa-chart-simple" style="color:#00c37b"></i> <span>Dostępność: <strong>Wysoka</strong></span>
                </div>
                <div class="rocket-banner" onclick="window.renderBonusModal()">
                    <div><div class="rocket-text">🚀 Зарабатывай дополнительно</div><div style="font-size:11px; color:#666">Доступно 2 новых бонуса</div></div>
                    <i class="fa-solid fa-chevron-right" style="color:#ccc; font-size:12px"></i>
                </div>
            `;
            const slider = document.getElementById('offline-slider-box');
            if(slider) {
                const div = document.createElement('div'); div.innerHTML = rocketHTML;
                slider.parentNode.insertBefore(div, slider);
                slider.style.background = "#009de0";
                const txt = slider.querySelector('.slider-text'); if(txt) { txt.innerText = "Przejdź do trybu online"; txt.style.color="white"; }
                const knob = slider.querySelector('.slider-knob'); if(knob) { knob.style.background="white"; knob.style.color="#009de0"; }
            }
        }
        // Обновление GPS КМ
        const orderDestEl = document.getElementById('order-dest');
        if (typeof currentOrder !== 'undefined' && currentOrder && orderDestEl) {
            const totalDist = parseFloat(currentOrder.distance);
            const progress = currentOrder.progress || 0;
            let remaining = totalDist * (1 - (progress / 100)); if(remaining<0) remaining=0;
            let prefix = currentOrder.stage === 2 ? "К клиенту" : "Забрать";
            orderDestEl.innerHTML = `<strong>${prefix}:</strong> ${remaining.toFixed(1)} km <span style="font-size:10px; color:#aaa">(GPS)</span>`;
        }
    }, 200);

})();
