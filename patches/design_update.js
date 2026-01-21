// ============================================================
// --- PATCH v5: SYSTEM OVERRIDE (NO MORE BUGS) ---
// ============================================================

(function() {
    console.log(">>> Patch v5 Loaded: System Override Active");

    // 1. СТИЛИ (CSS) - Тот же красивый дизайн
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .custom-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(5px);
            z-index: 10000; display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.2s ease-out;
        }
        .custom-modal-box {
            background: linear-gradient(145deg, #1e1e24, #25252b);
            width: 90%; max-width: 380px; max-height: 85vh; overflow-y: auto;
            border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 60px rgba(0,0,0,0.8); padding: 25px;
            position: relative; color: #fff; font-family: 'Segoe UI', Roboto, sans-serif;
        }
        .close-btn {
            position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
            background: rgba(255, 255, 255, 0.1); border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-weight: bold; color: #bbb;
        }
        .action-btn {
            width: 100%; padding: 15px; margin-bottom: 10px; border: none; border-radius: 12px;
            font-weight: bold; font-size: 14px; cursor: pointer; 
            display: flex; justify-content: space-between; align-items: center;
            transition: transform 0.1s;
        }
        .action-btn:active { transform: scale(0.98); }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    `;
    document.head.appendChild(styleSheet);


    // 2. ОТРИСОВКА ОКОН (РЕНДЕР)
    window.renderCustomModal = function(type) {
        // Удаляем старое окно если есть
        const old = document.getElementById('active-custom-modal');
        if(old) old.remove();

        const bal = state.balance;
        const debt = state.debt;

        let html = '';
        
        // --- БАНК ---
        if(type === 'bank') {
            const limit = 1000 + (state.career.totalOrders * 50);
            const hasDebt = debt > 0;
            html = `
                <h2 style="color:#f1c40f; text-align:center; margin-top:0"><i class="fa-solid fa-building-columns"></i> Варшава Банк</h2>
                <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:12px; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#aaa;"><span>Баланс:</span><span style="color:white; font-weight:bold">${bal.toFixed(2)} PLN</span></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#aaa;"><span>Долг:</span><span style="color:${hasDebt?'#ff6b6b':'white'}; font-weight:bold">${debt.toFixed(2)} PLN</span></div>
                    <div style="width:100%; height:1px; background:rgba(255,255,255,0.1); margin:8px 0;"></div>
                    <div style="display:flex; justify-content:space-between; font-size:12px;"><span>Кред. Лимит:</span><span style="color:#7bed9f">${limit} PLN</span></div>
                </div>
                <div style="font-size:12px; padding:10px; background:rgba(255,255,255,0.05); border-left:3px solid ${hasDebt?'#ff4757':'#2ed573'}; border-radius:6px; margin-bottom:20px; color:${hasDebt?'#ff4757':'#2ed573'}">
                    ${hasDebt ? '⚠️ С активным долгом часть дохода списывается автоматически!' : '✅ Кредитная история чиста.'}
                </div>
                <button class="action-btn" onclick="wrapAction('loan')" style="background:linear-gradient(90deg, #3742fa, #5352ed); color:white;"><span>Взять кредит</span> <span>+500 PLN</span></button>
                <button class="action-btn" onclick="wrapAction('repay')" style="background:linear-gradient(90deg, #2ed573, #7bed9f); color:#1e272e;"><span>Погасить долг</span> <span>-500 PLN</span></button>
            `;
        }
        
        // --- ПРАВИТЕЛЬСТВО ---
        else if(type === 'gov') {
            const levelSum = Object.values(state.repairs).reduce((a,b)=>a+b,0);
            const inflationRate = (gameConfig && gameConfig.inflationRate) ? gameConfig.inflationRate : 0.1;
            const currentInflation = levelSum * inflationRate; 
            const infPercent = (currentInflation * 100).toFixed(0);
            const cost1 = 2700 * (1 + currentInflation);
            const cost2 = 5000 * (1 + currentInflation);
            
            let color = '#2ecc71';
            if(currentInflation > 0.3) color = '#f1c40f';
            if(currentInflation > 0.8) color = '#e74c3c';

            html = `
                <h2 style="color:#95a5a6; text-align:center; margin-top:0"><i class="fa-solid fa-scale-unbalanced-flip"></i> Министерство</h2>
                <div style="text-align:center; margin:20px 0;">
                    <div style="font-size:48px; font-weight:800; color:${color}; text-shadow:0 0 15px ${color}40">${infPercent}%</div>
                    <div style="font-size:12px; color:#7f8c8d; letter-spacing:1px">ТЕКУЩАЯ ИНФЛЯЦИЯ</div>
                </div>
                <div style="font-size:13px; color:#bdc3c7; margin-bottom:20px; text-align:center;">Высокая инфляция увеличивает цены в магазинах.</div>
                <button class="action-btn" onclick="wrapGov(1, ${cost1})" style="background:#34495e; color:#ecf0f1; border:1px solid #4a69bd;"><span>📉 Лоббирование (-1 ур)</span> <span style="color:#f1c40f">-${cost1.toFixed(0)}</span></button>
                <button class="action-btn" onclick="wrapGov(2, ${cost2})" style="background:#2c3e50; color:#ecf0f1; border:1px solid #6a89cc;"><span>📉 Взятка (-2 ур)</span> <span style="color:#f1c40f">-${cost2.toFixed(0)}</span></button>
            `;
        }

        // --- АВТОСАЛОН ---
        else if(type === 'taxi') {
            const cars = [
                { id: 'skoda', name: 'Skoda Fabia', price: 15000, desc: 'Эконом', icon: 'fa-car-side', spd: 30, cmf: 20 },
                { id: 'toyota', name: 'Toyota Prius', price: 45000, desc: 'Гибрид', icon: 'fa-leaf', spd: 50, cmf: 60 },
                { id: 'tesla', name: 'Tesla Model 3', price: 120000, desc: 'Бизнес', icon: 'fa-bolt', spd: 90, cmf: 100 }
            ];
            html = `<h2 style="color:#00d2d3; text-align:center; margin-top:0"><i class="fa-solid fa-car"></i> Таксопарк</h2>`;
            
            cars.forEach(car => {
                const isOwned = (state.taxi.vehicle === car.id);
                const btnCol = isOwned ? '#27ae60' : '#2980b9';
                const btnTxt = isOwned ? 'В ГАРАЖЕ' : `КУПИТЬ ${car.price/1000}K`;
                html += `
                <div style="background:#2d3436; border-radius:12px; margin-bottom:12px; border:${isOwned ? '2px solid #f1c40f' : '1px solid #444'}; padding:12px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-weight:bold;">
                        <span><i class="fa-solid ${car.icon}"></i> ${car.name}</span>
                        ${isOwned ? '<i class="fa-solid fa-check" style="color:#f1c40f"></i>' : ''}
                    </div>
                    <div style="display:flex; align-items:center; margin-bottom:5px; font-size:10px; color:#aaa"><span style="width:40px">Speed</span><div style="flex:1; height:4px; background:#444; border-radius:2px"><div style="width:${car.spd}%; height:100%; background:#3498db"></div></div></div>
                    <div style="display:flex; align-items:center; margin-bottom:10px; font-size:10px; color:#aaa"><span style="width:40px">Comfort</span><div style="flex:1; height:4px; background:#444; border-radius:2px"><div style="width:${car.cmf}%; height:100%; background:#9b59b6"></div></div></div>
                    <button onclick="${isOwned?'':`wrapTaxi('${car.id}', ${car.price})`}" style="width:100%; padding:8px; border:none; border-radius:6px; background:${btnCol}; color:white; font-weight:bold;">${btnTxt}</button>
                </div>`;
            });
        }

        // Создаем и показываем окно
        const overlay = document.createElement('div');
        overlay.id = 'active-custom-modal';
        overlay.className = 'custom-modal-overlay';
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `<div class="custom-modal-box"><div class="close-btn" onclick="document.getElementById('active-custom-modal').remove()">✕</div>${html}</div>`;
        document.body.appendChild(overlay);
    };


    // 3. ПЕРЕХВАТЧИК СИСТЕМНОЙ ФУНКЦИИ (ХИРУРГИЧЕСКИЙ МЕТОД)
    // Сохраняем оригинальную функцию игры
    const originalOpenModal = window.openModal;

    // Подменяем её своей (умной)
    window.openModal = function(type) {
        console.log("Opening Modal Type:", type);

        // Если это наши клиенты - перехватываем
        if (type === 'bank') {
            toggleMenu(); // Закрываем меню (как обычно)
            window.renderCustomModal('bank');
        } 
        else if (type === 'deflation') {
            toggleMenu();
            window.renderCustomModal('gov');
        } 
        else if (type === 'taxi-shop') {
            toggleMenu();
            window.renderCustomModal('taxi');
        } 
        else {
            // Для всех остальных (Магазин, История и т.д.) запускаем старую логику
            if(typeof originalOpenModal === 'function') originalOpenModal(type);
        }
    };


    // 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (Чтобы кнопки внутри окон работали)
    window.wrapAction = function(act) {
        if(act === 'loan') {
            if(window.takeLoan) window.takeLoan(); 
            else { state.balance += 500; state.debt += 550; }
        }
        if(act === 'repay') {
            if(window.repayLoan) window.repayLoan();
            else if(state.balance>=500) { state.balance-=500; state.debt-=500; }
        }
        setTimeout(() => window.renderCustomModal('bank'), 100); // Обновить окно
    };

    window.wrapGov = function(l, c) {
        if(window.buyDeflation) window.buyDeflation(l, c);
        setTimeout(() => window.renderCustomModal('gov'), 200);
    };

    window.wrapTaxi = function(id, p) {
        if(window.buyVehicle) window.buyVehicle(id, p);
        setTimeout(() => window.renderCustomModal('taxi'), 200);
    };

})();
