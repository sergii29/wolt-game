// ============================================================
// --- PATCH v22: GPS FIX & ROCKET RELOAD ---
// Key: WARSZAWA_FOREVER
// ============================================================

(function() {
    console.log(">>> Patch v22 Loaded: GPS Silent & DB Fix");

    // ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
    window.bonusData = [];
    
    // 0. ВАЖНО: ПОДКЛЮЧЕНИЕ К БД (Fix для пустой вкладки)
    let patchDB = null;
    try {
        if(window.db) {
            patchDB = window.db;
        } else if(window.firebase) {
            // Если window.db нет, берем напрямую из инстанса
            patchDB = firebase.database();
            window.db = patchDB; // Чиним глобально
        }
    } catch(e) { console.error("Patch DB Error:", e); }

    // 1. СТИЛИ (БЕЛАЯ ТЕМА WOLT)
    const styles = `
        /* MENU & UI */
        #side-menu { background: #ffffff !important; border-right: 1px solid #eee !important; color: #333 !important; }
        .menu-item { color: #333 !important; border-bottom: 1px solid #f5f5f5 !important; font-weight: 500 !important; }
        .menu-item i { color: #555 !important; width: 25px; text-align: center; }
        .menu-section-title { color: #aaa !important; margin-top: 15px !important; }
        #player-name-display { color: #009de0 !important; font-weight: 800 !important; }
        #player-id-display { color: #999 !important; }

        /* ICONS PERCENT */
        .equip-item { position: relative; padding-bottom: 12px !important; }
        .tiny-stat { position: absolute; bottom: 2px; left: 0; right: 0; text-align: center; font-size: 9px; font-weight: 800; color: #fff; text-shadow: 0 1px 2px black; }

        /* MODALS (WHITE) */
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(3px); }
        .custom-modal-box { background: #ffffff; width: 90%; max-width: 380px; max-height: 85vh; overflow-y: auto; border-radius: 24px; box-shadow: 0 15px 50px rgba(0,0,0,0.2); padding: 25px; position: relative; color: #333; font-family: 'Segoe UI', sans-serif; animation: popIn 0.2s; }
        .close-btn { position: absolute; top: 15px; right: 15px; width: 32px; height: 32px; background: #f0f0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer; color: #555; }
        
        .bank-card { background: #f8f9fa; padding: 20px; border-radius: 16px; text-align: center; margin-bottom: 15px; }
        .bank-val { font-size: 32px; font-weight: 800; color: #2d3436; margin: 5px 0; }
        .bank-sub { font-size: 13px; color: #00c853; font-weight: bold; }
        .bank-limit { font-size: 11px; color: #aaa; margin-top: 5px; }
        .bank-info-row { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 5px; }
        
        .action-btn { width: 100%; padding: 15px; margin-bottom: 10px; border: none; border-radius: 12px; font-weight: bold; font-size: 14px; cursor: pointer; color: white; display: flex; justify-content: center; align-items: center; transition: transform 0.1s; }
        .action-btn:active { transform: scale(0.98); }
        .btn-green { background: #00c853; }
        .btn-blue { background: #009de0; }
        .btn-dark { background: #2d3436; }

        /* ROCKET MODAL (BOTTOM SHEET) */
        .rocket-overlay { align-items: flex-end; }
        .rocket-box { background: #f4f6f8; width: 100%; height: 85vh; border-radius: 20px 20px 0 0; padding: 0; display: flex; flex-direction: column; }
        .rk-header { background: white; padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .rk-scroll { padding: 20px; overflow-y: auto; flex: 1; }
        
        .b-card { background: white; padding: 15px; border-radius: 12px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.03); border-left: 5px solid #ccc; }
        .b-card.active { border-left-color: #00c853; }
        .b-card.future { border-left-color: #ff9800; }
        .prog-bar { height: 6px; background: #eee; border-radius: 3px; margin-top: 10px; overflow: hidden; }
        .prog-fill { height: 100%; background: #00c853; width: 0%; }

        @keyframes popIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
    `;
    const styleSheet = document.createElement("style"); styleSheet.innerText = styles; document.head.appendChild(styleSheet);


    // 2. СИНХРОНИЗАЦИЯ (ИСПРАВЛЕНО ЧТЕНИЕ ДАННЫХ)
    if(patchDB) {
        console.log(">>> Patch connected to DB");
        patchDB.ref('bonuses/list').on('value', snap => {
            const data = snap.val() || {};
            window.bonusData = Object.entries(data).map(([key, val]) => ({id: key, ...val}));
            // Если модалка открыта, обновляем её в реальном времени
            if(document.getElementById('bonus-modal')) window.renderBonusModal();
        });
        
        patchDB.ref('config').on('value', snap => {
            const cfg = snap.val();
            if(cfg) {
                if(!window.gameConfig) window.gameConfig = {};
                Object.assign(window.gameConfig, cfg);
                // Обновляем цены
                if(cfg.itemPrices && window.ITEMS_DB) {
                    const p = cfg.itemPrices;
                    if(window.ITEMS_DB.water) window.ITEMS_DB.water.cost = p.water;
                    if(window.ITEMS_DB.bar) window.ITEMS_DB.bar.cost = p.bar;
                    if(window.ITEMS_DB.energy_drink) window.ITEMS_DB.energy_drink.cost = p.energy_drink;
                    if(window.ITEMS_DB.coffee) window.ITEMS_DB.coffee.cost = p.coffee;
                    if(window.ITEMS_DB.gas) window.ITEMS_DB.gas.cost = p.gas;
                    
                    window.DYNAMIC_PRICES = {
                        cars: { skoda: p.car_skoda, toyota: p.car_toyota, tesla: p.car_tesla },
                        lic: { driver: p.lic_driver, insurance: p.lic_insurance, taxi: p.lic_taxi }
                    };
                }
            }
        });
    } else {
        console.error(">>> Patch DB Connection FAILED. Bonuses won't load.");
    }

    if(typeof window.startSessionOrders === 'undefined') window.startSessionOrders = (state.career.totalOrders || 0);


    // 3. ОТРИСОВКА ОКОН
    window.renderCustomModal = function(type) {
        const old = document.getElementById('active-custom-modal'); if(old) old.remove();
        const overlay = document.createElement('div');
        overlay.id = 'active-custom-modal';
        overlay.className = 'custom-modal-overlay';
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

        let content = '';
        const bal = state.balance; 
        const debt = state.debt;

        // --- БАНК ---
        if(type === 'bank') {
            const limit = (window.gameConfig && window.gameConfig.bankLimitBase) ? (window.gameConfig.bankLimitBase + (state.career.totalOrders * window.gameConfig.bankLimitMulti)) : (1000 + (state.career.totalOrders * 50));
            const streak = state.loanStreak || 0;
            const comission = streak === 0 ? 0 : (streak === 1 ? 10 : 20);
            
            content = `
                <div class="close-btn" onclick="document.getElementById('active-custom-modal').remove()">✕</div>
                <h2 style="text-align:center; margin-top:0">Банк (Кредит)</h2>
                
                <div class="bank-card">
                    <div style="font-size:12px; color:#666">Текущий долг</div>
                    <div class="bank-val">${debt.toFixed(2)} PLN</div>
                    <div class="bank-sub">${debt > 0 ? 'Есть задолженность' : 'Нет долгов'}</div>
                    <div class="bank-limit">Ваш кредитный лимит: ${limit} PLN</div>
                </div>

                <div style="margin-bottom:20px; padding:0 10px">
                    <div class="bank-info-row"><span>УСЛОВИЯ КРЕДИТА:</span></div>
                    <div class="bank-info-row"><span>Попытка №${streak+1}</span> <span style="color:#00c853; font-weight:bold">Комиссия: +${comission}%</span></div>
                </div>

                <input id="custom-loan-input" type="number" placeholder="Сумма кредита..." style="width:100%; padding:15px; border-radius:12px; border:1px solid #ddd; font-size:18px; margin-bottom:10px; box-sizing:border-box;">
                
                <button class="action-btn btn-green" onclick="wrapBankAction('loan')">ВЗЯТЬ</button>
                ${debt > 0 ? `<button class="action-btn btn-dark" onclick="wrapBankAction('repay')">ВЕРНУТЬ</button>` : ''}
            `;
        }
        
        // --- ПРАВИТЕЛЬСТВО ---
        else if(type === 'gov') {
             const levelSum = Object.values(state.repairs).reduce((a,b)=>a+b,0);
             const ir = (window.gameConfig && window.gameConfig.inflationRate) || 0.1;
             const inf = (levelSum * ir * 100).toFixed(0);
             const cost = 2700 * (1 + levelSum * ir);
             content = `
                <div class="close-btn" onclick="document.getElementById('active-custom-modal').remove()">✕</div>
                <h2 style="text-align:center">Борьба с инфляцией</h2>
                <div style="text-align:center; padding:20px;">
                    <i class="fa-solid fa-scale-unbalanced-flip" style="font-size:40px; color:#90a4ae; margin-bottom:10px"></i>
                    <h1 style="margin:0; font-size:40px; color:#333">Инфляция: ${inf}%</h1>
                    <p style="color:#666; font-size:12px">Снижение инфляции уменьшает цены в магазинах, но стоит больших денег.</p>
                </div>
                <div class="b-card" style="display:flex; justify-content:space-between; align-items:center">
                    <div><b>Откат (-1 уровень)</b><br><span style="font-size:11px; color:#666">Снижает цены на шаг назад</span></div>
                    <button style="background:#333; color:white; padding:8px 12px; border-radius:6px; border:none" onclick="wrapGov(1, ${cost})">-${cost.toFixed(0)}</button>
                </div>
             `;
        }

        // --- ТАКСИ ---
        else if(type === 'taxi') {
            const p = window.DYNAMIC_PRICES ? window.DYNAMIC_PRICES.cars : { skoda: 15000, toyota: 45000, tesla: 120000 };
            const cars = [
                { id: 'skoda', name: 'Skoda Fabia', price: p.skoda||15000, icon:'fa-car-side' }, 
                { id: 'toyota', name: 'Toyota Prius', price: p.toyota||45000, icon:'fa-leaf' }, 
                { id: 'tesla', name: 'Tesla Model 3', price: p.tesla||120000, icon:'fa-bolt' }
            ];
            content = `<div class="close-btn" onclick="document.getElementById('active-custom-modal').remove()">✕</div><h2 style="text-align:center">Автосалон</h2>`;
            cars.forEach(car => {
                const isOwned = (state.taxi.vehicle === car.id);
                content += `<div class="b-card" style="display:flex; justify-content:space-between; align-items:center"><div><b>${car.name}</b></div><button onclick="${isOwned?'':`wrapTaxi('${car.id}',${car.price})`}" style="padding:8px; border-radius:5px; border:none; background:${isOwned?'green':'#333'}; color:white">${isOwned?'ЕСТЬ':car.price}</button></div>`;
            });
        }

        overlay.innerHTML = `<div class="custom-modal-box">${content}</div>`;
        document.body.appendChild(overlay);
    };

    // 4. ОКНО РАКЕТЫ
    window.renderBonusModal = function() {
        const old = document.getElementById('bonus-modal'); if(old) old.remove();
        
        const now = Date.now();
        // ВАЖНО: Active = уже началось (startTime <= now) и еще не кончилось (endTime >= now)
        const active = window.bonusData.filter(b => now >= b.startTime && now <= b.endTime);
        // ВАЖНО: Future = начнется в будущем (startTime > now)
        const future = window.bonusData.filter(b => now < b.startTime);
        
        active.sort((a,b) => a.endTime - b.endTime);
        future.sort((a,b) => a.startTime - b.startTime);

        let html = '';

        // ACTIVE SECTION
        html += `<div class="section-label" style="font-weight:bold; color:#555; margin-bottom:10px">🔥 Активные сейчас</div>`;
        if (active.length === 0) {
            html += `<div style="text-align:center; padding:20px; color:#aaa; font-size:12px; background:#eee; border-radius:10px; margin-bottom:20px">Нет активных заданий</div>`;
        } else {
            const sessionOrders = (state.career.totalOrders || 0) - window.startSessionOrders;
            active.forEach(b => {
                const target = parseInt(b.target);
                const current = Math.min(sessionOrders, target);
                const pct = (current / target) * 100;
                
                const diff = b.endTime - now;
                const h = Math.floor(diff/3600000);
                const m = Math.floor((diff%3600000)/60000);

                html += `
                <div class="b-card active">
                    <div style="font-weight:bold; font-size:15px">${b.title} <span style="float:right; color:#00c853; background:#e8f5e9; padding:2px 6px; border-radius:4px; font-size:11px">+${b.reward} PLN</span></div>
                    <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
                    <div style="font-size:11px; color:#666; margin-top:5px; display:flex; justify-content:space-between">
                        <span>Осталось: ${h}ч ${m}м</span>
                        <span>${current} / ${target}</span>
                    </div>
                </div>`;
            });
        }

        // FUTURE SECTION
        html += `<div class="section-label" style="font-weight:bold; color:#555; margin-bottom:10px; margin-top:20px">⏳ Скоро (Анонсы)</div>`;
        if (future.length === 0) {
            html += `<div style="text-align:center; padding:20px; color:#aaa; font-size:12px;">Нет запланированных акций</div>`;
        } else {
            future.forEach(b => {
                const start = new Date(b.startTime);
                const dateStr = start.toLocaleDateString();
                const timeStr = start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                const diff = b.startTime - now;
                const h = Math.floor(diff/3600000); 
                
                html += `
                <div class="b-card future">
                    <div style="font-weight:bold; font-size:15px; color:#555">${b.title} <span style="float:right; color:#ff9800; font-size:11px">СКОРО</span></div>
                    <div style="font-size:12px; color:#666; margin-top:5px">Цель: <b>${b.target}</b> | Награда: <b>${b.reward}</b></div>
                    <div style="font-size:11px; color:#888; border-top:1px solid #eee; margin-top:5px; padding-top:5px">
                        Старт: ${dateStr} ${timeStr} (Через ${h}ч)
                    </div>
                </div>`;
            });
        }

        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay rocket-overlay';
        overlay.id = 'bonus-modal';
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
        
        overlay.innerHTML = `
            <div class="custom-modal-box rocket-box">
                <div class="rk-header">
                    <h2 style="margin:0; font-size:22px">Зарабатывай</h2>
                    <div class="close-btn" onclick="document.getElementById('bonus-modal').remove()">✕</div>
                </div>
                <div class="rk-scroll">
                    ${html}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    };

    // 5. ВРАППЕРЫ ДЕЙСТВИЙ
    window.wrapBankAction = function(type) {
        const input = document.getElementById('custom-loan-input');
        const val = input ? parseFloat(input.value) : 0;
        
        if(val > 0) {
            let hiddenInput = document.getElementById('loan-amount');
            if(!hiddenInput) {
                hiddenInput = document.createElement('input');
                hiddenInput.id = 'loan-amount';
                hiddenInput.style.display = 'none';
                document.body.appendChild(hiddenInput);
            }
            hiddenInput.value = val;
            
            if(type === 'loan') { if(window.takeLoan) window.takeLoan(); }
            if(type === 'repay') { if(window.repayLoan) window.repayLoan(); }
            
            setTimeout(() => window.renderCustomModal('bank'), 200);
        } else {
            alert("Введите сумму!");
        }
    };

    window.wrapGov = function(l, c) { if(window.buyDeflation) window.buyDeflation(l, c); setTimeout(()=>window.renderCustomModal('gov'), 100); };
    window.wrapTaxi = function(id, p) { if(window.buyVehicle) window.buyVehicle(id, p); setTimeout(()=>window.renderCustomModal('taxi'), 100); };

    // --- FIX GPS: Запуск вне цикла ---
    if(navigator.geolocation) {
        console.log(">>> Init GPS (Watch Mode)");
        navigator.geolocation.watchPosition(pos => {
            const { latitude, longitude } = pos.coords;
            if(window.map) {
                let found = false;
                window.map.eachLayer(l => { if(l instanceof L.Marker) { l.setLatLng([latitude, longitude]); found=true; }});
                if(!found) L.marker([latitude, longitude]).addTo(window.map);
            }
        }, err => {
            console.warn("GPS Access Denied or Error:", err);
            // Ошибки игнорируем, чтобы не спамить
        }, {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000
        });
    }

    // 6. ЦИКЛ (Только UI, без GPS вызова)
    setInterval(() => {
        // A. ПРОЦЕНТЫ ПОД ИКОНКАМИ
        if(typeof state !== 'undefined' && state.items) {
            const stats = {
                'bike': Math.floor(state.items.bike||0),
                'bag': Math.floor(state.items.bag||0),
                'phone': Math.floor(state.items.phone||0),
                'gear': Math.floor(state.items.gear||0),
                'energy': Math.floor(state.needs.energy||0),
                'water': Math.floor(state.needs.water||0),
                'mood': Math.floor(state.needs.mood||0)
            };
            for (let [key, val] of Object.entries(stats)) {
                const bar = document.getElementById(`bar-${key}`);
                if(bar) {
                    const parent = bar.parentElement.parentElement;
                    let num = parent.querySelector('.tiny-stat');
                    if(!num) { num = document.createElement('div'); num.className = 'tiny-stat'; parent.appendChild(num); }
                    num.textContent = val + '%';
                    num.style.color = val < 20 ? '#ff3d00' : 'white';
                }
            }
        }

        // B. РАКЕТА В МЕНЮ
        const slider = document.getElementById('offline-slider-box');
        if(slider && !document.querySelector('.rocket-banner')) {
            const div = document.createElement('div');
            div.className = 'rocket-banner';
            const now = Date.now();
            // Считаем и активные и будущие для бейджика
            const count = window.bonusData ? window.bonusData.filter(b => now <= b.endTime).length : 0;
            div.innerHTML = `<div><div style="font-weight:bold;color:#333">🚀 Бонусы</div><div style="font-size:10px;color:#888">${count>0? count+' событий' : 'Проверь акции'}</div></div><i class="fa-solid fa-chevron-right" style="color:#aaa"></i>`;
            div.onclick = window.renderBonusModal;
            slider.parentNode.insertBefore(div, slider);
        }

    }, 3000); 

    // OVERRIDE OPEN
    window.openModal = function(type) { 
        if(type==='bank') window.renderCustomModal('bank'); 
        else if(type==='deflation') window.renderCustomModal('gov'); 
        else if(type==='taxi-shop') window.renderCustomModal('taxi'); 
        else { 
            toggleMenu(); 
            const m=document.getElementById('full-modal'); const b=document.getElementById('modal-body'); m.classList.add('open'); 
            if(type==='shop'){document.getElementById('modal-title').textContent='Магазин';renderShop(b);}
            else{document.getElementById('modal-title').textContent='История';renderHistory(b);} 
        } 
    };

})();
