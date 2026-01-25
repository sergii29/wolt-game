// ============================================================
// --- PATCH v34: NO-GEO & PENALTY SUPPORT ---
// Key: WARSZAWA_FOREVER
// ============================================================

(function() {
    console.log(">>> Patch v34 Loaded: NO GEO TRACKING");

    // ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
    window.bonusData = [];
    window.isClaimingReward = false; 
    window.isQuestDataSynced = false; // Флаг: загрузились ли якоря из базы?
    
    // 0. ПОДКЛЮЧЕНИЕ К БД
    let patchDB = null;
    try {
        if(window.db) {
            patchDB = window.db;
        } else if(window.firebase) {
            patchDB = firebase.database();
            window.db = patchDB;
        }
    } catch(e) { console.error("Patch DB Error:", e); }

    // 1. СТИЛИ (Дизайн Wolt) - БЕЗ ИЗМЕНЕНИЙ
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
        
        /* SYNC INDICATOR */
        .sync-dot { position: absolute; top: 15px; right: 60px; width: 10px; height: 10px; background: #00c853; border-radius: 50%; z-index: 2000; box-shadow: 0 0 5px #00c853; transition: all 0.3s; }
        .sync-dot.syncing { background: #ffeb3b; box-shadow: 0 0 5px #ffeb3b; }

        @keyframes popIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
    `;
    const styleSheet = document.createElement("style"); styleSheet.innerText = styles; document.head.appendChild(styleSheet);


    // 2. СИНХРОНИЗАЦИЯ С БД
    if(patchDB) {
        // Загрузка списка бонусов
        patchDB.ref('bonuses/list').on('value', snap => {
            const data = snap.val() || {};
            window.bonusData = Object.entries(data).map(([key, val]) => ({id: key, ...val}));
            if(document.getElementById('bonus-modal')) window.renderBonusModal();
        });
        
        // Загрузка конфига
        patchDB.ref('config').on('value', snap => {
            const cfg = snap.val();
            if(cfg) {
                if(!window.gameConfig) window.gameConfig = {};
                Object.assign(window.gameConfig, cfg);
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
    }

    // --- MEGA SYNC FUNCTION (FIXED: ANCHOR PROTECTION) ---
    window.listenToCloud = function() {
        if (!window.db || !state.id) return;
        
        console.log(">>> IRONCLAD CLOUD LISTENER ATTACHED TO: " + state.id);

        let syncDot = document.getElementById('sync-dot');
        if(!syncDot) {
            syncDot = document.createElement('div');
            syncDot.id = 'sync-dot';
            syncDot.className = 'sync-dot';
            document.body.appendChild(syncDot);
        }

        window.db.ref('players/' + state.id).off(); 
        
        window.db.ref('players/' + state.id).on('value', (snap) => {
            const data = snap.val();
            if (!data) return;

            // --- МАРКЕР: ДАННЫЕ СИНХРОНИЗИРОВАНЫ ---
            window.isQuestDataSynced = true; 
            // ----------------------------------------

            syncDot.classList.add('syncing');
            setTimeout(() => syncDot.classList.remove('syncing'), 500);

            if (data.isBanned) {
                document.body.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100%;background:black;color:red;font-size:20px;font-weight:bold;">⛔ ДОСТУП ЗАПРЕЩЕН</div>`;
                return;
            }

            let uiNeedsUpdate = false;

            // --- БАЛАНС ---
            if (data.balance !== undefined) {
                const serverBal = parseFloat(data.balance);
                const localBal = parseFloat(state.balance);
                
                if (serverBal > localBal) {
                    state.balance = serverBal;
                    uiNeedsUpdate = true;
                }
                else if (window.isClaimingReward) {
                    // Игнорируем старый баланс пока идет начисление награды
                }
                else if (Math.abs(serverBal - localBal) > 0.01) {
                    state.balance = serverBal;
                    uiNeedsUpdate = true;
                }
            }
            
            // КАРЬЕРА
            if (data.career && JSON.stringify(data.career) !== JSON.stringify(state.career)) {
                state.career = data.career;
                uiNeedsUpdate = true;
            }

            // ИНВЕНТАРЬ/ПРЕДМЕТЫ
            if(data.inventory && JSON.stringify(data.inventory) !== JSON.stringify(state.inventory)) {
                state.inventory = data.inventory; uiNeedsUpdate = true;
            }
            if(data.items && JSON.stringify(data.items) !== JSON.stringify(state.items)) {
                state.items = data.items; uiNeedsUpdate = true;
            }
            if(data.stats) { state.needs = data.stats; uiNeedsUpdate = true; } 

            // ТАКСИ
            if(data.taxi && JSON.stringify(data.taxi) !== JSON.stringify(state.taxi)) {
                state.taxi = data.taxi; 
                if(window.updateMenuState) window.updateMenuState();
                uiNeedsUpdate = true;
            }

            // ЯКОРЯ КВЕСТОВ (Safe Merge)
            if(data.questAnchors) {
                if(!state.questAnchors) state.questAnchors = {};
                // Мы верим серверу больше, чем локальному "нулю"
                state.questAnchors = { ...state.questAnchors, ...data.questAnchors };
                uiNeedsUpdate = true;
            }

            // CLAIMED QUESTS (Safe Merge)
            if(data.claimedQuests) {
                if(!state.claimedQuests) state.claimedQuests = {};
                state.claimedQuests = { ...state.claimedQuests, ...data.claimedQuests };
                uiNeedsUpdate = true;
            }

            if(uiNeedsUpdate) {
                localStorage.setItem('WARSZAWA_FOREVER', JSON.stringify(state));
                if(window.updateUI) window.updateUI();
                if(document.getElementById('bonus-modal')) window.renderBonusModal();
            }
        });

        // INBOX
        window.db.ref('players/' + state.id + '/adminInbox').off();
        window.db.ref('players/' + state.id + '/adminInbox').on('child_added', (snap) => {
            const cmd = snap.val();
            if(window.handleAdminCommand) window.handleAdminCommand(cmd);
            snap.ref.remove();
        });
    };

    if(window.syncToCloud) {
        const oldSync = window.syncToCloud;
        window.syncToCloud = function(force) {
            if(window.db && state.id) {
                // Всегда отправляем квесты, чтобы не потерялись
                window.db.ref('players/' + state.id + '/claimedQuests').set(state.claimedQuests || {});
                window.db.ref('players/' + state.id + '/questAnchors').set(state.questAnchors || {});
            }
            oldSync(true); 
        }
    }

    setTimeout(() => { if(window.listenToCloud) window.listenToCloud(); }, 1000);

    // ------------------------------------------------------------------------

    // UI RENDERERS
    window.renderCustomModal = function(type) {
        const old = document.getElementById('active-custom-modal'); if(old) old.remove();
        const overlay = document.createElement('div');
        overlay.id = 'active-custom-modal';
        overlay.className = 'custom-modal-overlay';
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

        let content = '';
        const bal = state.balance; 
        const debt = state.debt;

        if(type === 'bank') {
            const limit = (window.gameConfig && window.gameConfig.bankLimitBase) ? (window.gameConfig.bankLimitBase + (state.career.totalOrders * window.gameConfig.bankLimitMulti)) : (1000 + (state.career.totalOrders * 50));
            const streak = state.loanStreak || 0;
            const comission = streak === 0 ? 0 : (streak === 1 ? 10 : 20);
            const comColor = comission > 0 ? '#ff3d00' : '#00c853';

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
                    <div class="bank-info-row">
                        <span>Кредитный уровень ${streak+1}</span> 
                        <span style="color:${comColor}; font-weight:bold">Комиссия: +${comission}%</span>
                    </div>
                </div>
                <input id="custom-loan-input" type="number" placeholder="Сумма кредита..." style="width:100%; padding:15px; border-radius:12px; border:1px solid #ddd; font-size:18px; margin-bottom:10px; box-sizing:border-box;">
                <button class="action-btn btn-green" onclick="wrapBankAction('loan')">ВЗЯТЬ</button>
                ${debt > 0 ? `<button class="action-btn btn-dark" onclick="wrapBankAction('repay')">ВЕРНУТЬ</button>` : ''}
            `;
        } else if(type === 'gov') {
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
        } else if(type === 'taxi') {
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

    window.renderBonusModal = function() {
        const old = document.getElementById('bonus-modal'); if(old) old.remove();
        
        const now = Date.now();
        const active = window.bonusData.filter(b => now >= b.startTime && now <= b.endTime);
        const future = window.bonusData.filter(b => now < b.startTime);
        
        active.sort((a,b) => a.endTime - b.endTime);
        future.sort((a,b) => a.startTime - b.startTime);

        let html = '';

        html += `<div class="section-label" style="font-weight:bold; color:#555; margin-bottom:10px">🔥 Активные сейчас</div>`;
        if (active.length === 0) {
            html += `<div style="text-align:center; padding:20px; color:#aaa; font-size:12px; background:#eee; border-radius:10px; margin-bottom:20px">Нет активных заданий</div>`;
        } else {
            // Если данные не синхронизированы, показываем лоадер, чтобы не создать кривой якорь
            if(!window.isQuestDataSynced && state.id) {
                 html += `<div style="text-align:center; padding:20px; color:#009de0;"><i class="fa-solid fa-spinner fa-spin"></i> Синхронизация прогресса...</div>`;
            } else {
                active.forEach(b => {
                    const isClaimed = state.claimedQuests && state.claimedQuests[b.id];
                    
                    let progress = 0;
                    const target = parseInt(b.target);

                    // --- ЛОГИКА ОТОБРАЖЕНИЯ (Fix v33) ---
                    if (isClaimed) {
                        // Если награда получена - ВСЕГДА показываем 100%, плевать на якоря
                        progress = target; 
                    } else {
                        // Если не получена - считаем математику
                        if(!state.questAnchors) state.questAnchors = {};
                        
                        // Создаем якорь, только если его нет
                        if(typeof state.questAnchors[b.id] === 'undefined') {
                            const currentTotal = state.career.totalOrders || 0;
                            state.questAnchors[b.id] = currentTotal;
                            // Сразу пишем в базу
                            if(patchDB && state.id) {
                                patchDB.ref('players/' + state.id + '/questAnchors/' + b.id).set(currentTotal);
                            }
                        }

                        const startCount = state.questAnchors[b.id];
                        const currentTotal = (state.career.totalOrders || 0);
                        progress = currentTotal - startCount;
                        if(progress < 0) progress = 0;
                    }

                    const current = Math.min(progress, target);
                    const pct = (current / target) * 100;
                    
                    const diff = b.endTime - now;
                    const h = Math.floor(diff/3600000);
                    const m = Math.floor((diff%3600000)/60000);
                    
                    const btnText = isClaimed ? '✅ ГОТОВО' : `+${b.reward} PLN`;
                    const btnColor = isClaimed ? '#ccc' : '#00c853';
                    const btnBg = isClaimed ? '#eee' : '#e8f5e9';

                    html += `
                    <div class="b-card active">
                        <div style="font-weight:bold; font-size:15px">${b.title} <span style="float:right; color:${btnColor}; background:${btnBg}; padding:2px 6px; border-radius:4px; font-size:11px">${btnText}</span></div>
                        <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
                        <div style="font-size:11px; color:#666; margin-top:5px; display:flex; justify-content:space-between">
                            <span>Осталось: ${h}ч ${m}м</span>
                            <span>${current} / ${target}</span>
                        </div>
                    </div>`;
                });
            }
        }

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

    window.performLogin = function() {
        const login = document.getElementById('auth-login').value.trim();
        const pass = document.getElementById('auth-pass').value.trim();
        if(!login || !pass) { alert("Введите логин и пароль!"); return; }
        if(!window.db) window.db = firebase.database();
        window.db.ref('users_lookup/' + login).once('value', snap => {
            if(!snap.exists()) { alert('Пользователь не найден. Сначала нажмите Регистрация.'); return; }
            const data = snap.val();
            if(data.pass !== pass) { alert('Неверный пароль!'); return; }
            const targetId = data.playerId;
            alert('Вход выполнен! Восстанавливаем данные...');
            window.db.ref('players/' + targetId).once('value', playerSnap => {
                let playerData = playerSnap.val();
                if (!playerData) playerData = { name: login, id: targetId, balance: 0 };
                state = { ...state, ...playerData };
                state.id = targetId;
                state.name = login;
                state.isAuth = true;
                localStorage.setItem('WARSZAWA_FOREVER', JSON.stringify(state));
                location.reload();
            });
        });
    };

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
        } else { alert("Введите сумму!"); }
    };

    window.wrapGov = function(l, c) { if(window.buyDeflation) window.buyDeflation(l, c); setTimeout(()=>window.renderCustomModal('gov'), 100); };
    window.wrapTaxi = function(id, p) { if(window.buyVehicle) window.buyVehicle(id, p); setTimeout(()=>window.renderCustomModal('taxi'), 100); };

    // --- NO GEOLOCATION BLOCK HERE ---

    // --- GAME LOOP ---
    setInterval(() => {
        const nameEl = document.getElementById('player-name-display');
        const idEl = document.getElementById('player-id-display');
        if(nameEl && typeof state !== 'undefined' && state.name && nameEl.textContent !== state.name) {
            nameEl.textContent = state.name;
            idEl.textContent = 'ID: ' + state.id;
            if(state.id && window.db && !window.listenerActive) {
                window.listenerActive = true;
                window.listenToCloud();
            }
        }

        if(typeof state !== 'undefined' && state.items) {
            const stats = { 'bike': state.items.bike, 'bag': state.items.bag, 'phone': state.items.phone, 'gear': state.items.gear, 'energy': state.needs.energy, 'water': state.needs.water, 'mood': state.needs.mood };
            for (let [key, val] of Object.entries(stats)) {
                const bar = document.getElementById(`bar-${key}`);
                if(bar) {
                    const parent = bar.parentElement.parentElement;
                    let num = parent.querySelector('.tiny-stat');
                    if(!num) { num = document.createElement('div'); num.className = 'tiny-stat'; parent.appendChild(num); }
                    num.textContent = Math.floor(val) + '%';
                    num.style.color = val < 20 ? '#ff3d00' : 'white';
                }
            }
        }

        // --- NEW: AUTO-CLAIM QUEST REWARDS (PATCH v33) ---
        if(window.bonusData && window.bonusData.length > 0 && state && state.career) {
            const now = Date.now();
            const active = window.bonusData.filter(b => now >= b.startTime && now <= b.endTime);
            
            active.forEach(b => {
                // Если данные не загружены, не пытаемся клеймить
                if(!window.isQuestDataSynced) return; 

                if(!state.questAnchors || typeof state.questAnchors[b.id] === 'undefined') return;

                const startCount = state.questAnchors[b.id];
                const currentTotal = (state.career.totalOrders || 0);
                const progress = currentTotal - startCount;
                const target = parseInt(b.target);

                // Если цель достигнута И еще не выплачено
                if (progress >= target) {
                    if(!state.claimedQuests) state.claimedQuests = {};
                    
                    if(!state.claimedQuests[b.id]) {
                        window.isClaimingReward = true; 
                        
                        const reward = parseFloat(b.reward);
                        state.balance = parseFloat(state.balance) + reward;
                        state.claimedQuests[b.id] = true; 
                        
                        if(document.getElementById('balance-val')) {
                             document.getElementById('balance-val').textContent = state.balance.toFixed(2) + ' PLN';
                        }
                        
                        if(window.syncToCloud) window.syncToCloud(true);
                        setTimeout(() => { window.isClaimingReward = false; }, 3000);
                        if(window.showToast) window.showToast(`🎯 Квест выполнен! +${reward} PLN`, 'success');
                    }
                }
            });
        }
        // ------------------------------------------------

        const slider = document.getElementById('offline-slider-box');
        if(slider && !document.querySelector('.rocket-banner')) {
            const div = document.createElement('div');
            div.className = 'rocket-banner';
            const now = Date.now();
            const count = window.bonusData ? window.bonusData.filter(b => now <= b.endTime).length : 0;
            div.innerHTML = `<div><div style="font-weight:bold;color:#333">🚀 Бонусы</div><div style="font-size:10px;color:#888">${count>0? count+' событий' : 'Проверь акции'}</div></div><i class="fa-solid fa-chevron-right" style="color:#aaa"></i>`;
            div.onclick = window.renderBonusModal;
            slider.parentNode.insertBefore(div, slider);
        }
    }, 3000); 

    window.openModal = function(type) { 
        if(type==='bank') window.renderCustomModal('bank'); 
        else if(type==='deflation') window.renderCustomModal('gov'); 
        else if(type==='taxi-shop') window.renderCustomModal('taxi'); 
        else { 
            toggleMenu(); 
            const m=document.getElementById('full-modal'); const b=document.getElementById('modal-body'); m.classList.add('open'); 
            if(type==='shop'){ document.getElementById('modal-title').textContent='Магазин'; renderShop(b); }
            else if(type==='taxi-licenses' || type==='taxi-licenses-btn') { document.getElementById('modal-title').textContent='Лицензии и Документы'; if(window.renderTaxiLicenses) window.renderTaxiLicenses(b); }
            else { document.getElementById('modal-title').textContent='История'; renderHistory(b); } 
        } 
    };

    window.updateTrack = function(p) {
        const fill = document.getElementById('track-fill');
        const icon = document.getElementById('track-icon');
        if(fill) fill.style.width = p + '%';
        if(icon) icon.style.left = p + '%';
        if(currentOrder && currentOrder.distance) {
            const destEl = document.getElementById('order-dest');
            if(destEl) {
                const totalDist = parseFloat(currentOrder.distance);
                let remaining = totalDist * (1 - (p / 100));
                if(remaining < 0) remaining = 0;
                const prefix = state.taxi.active ? 'Поездка' : 'Забрать';
                destEl.textContent = `${prefix}: ${remaining.toFixed(1)} km`;
            }
        }
    };

})();





// ============================================================
// --- PATCH v35: CYBER COLLECTOR (CRAFTING SYSTEM) ---
// Key: WARSZAWA_FOREVER (Integrity Protected)
// Description: Adds rare drops and crafting without altering core logic.
// ============================================================

(function() {
    console.log(">>> Patch v35 Loaded: LEGENDARY DROPS & CRAFTING");

    // 1. КОНФИГУРАЦИЯ РЕДКОСТИ
    // Шанс 0.03 = 3% при каждом заказе
    const DROP_CHANCE = 0.03; 
    
    // Новые предметы (Детали)
    const RARE_ITEMS = {
        'part_chip': { name: 'Квантовый Чип', icon: 'fa-microchip', desc: 'Редкая электроника для ИИ.', rarity: 'legendary' },
        'part_engine': { name: 'Ядро Реактора', icon: 'fa-radiation', desc: 'Нестабильный источник энергии.', rarity: 'legendary' },
        'part_alloy': { name: 'Титан-X', icon: 'fa-cube', desc: 'Сплав из космической программы.', rarity: 'legendary' }
    };

    // Уникальная награда (Машина)
    const CYBER_CAR = {
        id: 'cyber_x',
        name: 'Cyber-X Prototype',
        icon: 'fa-rocket',
        desc: 'Собран из украденных технологий. Неуловим для камер.',
        bonus: 'Выплата x5.0 | Нет штрафов за скорость'
    };

    // 2. РАСШИРЕНИЕ БАЗЫ ПРЕДМЕТОВ (БЕЗОПАСНО)
    // Мы добавляем их в ITEMS_DB, чтобы они корректно отображались в инвентаре, если там появятся
    setTimeout(() => {
        if(window.ITEMS_DB) {
            Object.assign(window.ITEMS_DB, {
                part_chip: { name: 'Квантовый Чип', type: 'part', icon: 'fa-microchip', desc: 'Деталь Cyber-X' },
                part_engine: { name: 'Ядро Реактора', type: 'part', icon: 'fa-radiation', desc: 'Деталь Cyber-X' },
                part_alloy: { name: 'Титан-X', type: 'part', icon: 'fa-cube', desc: 'Деталь Cyber-X' }
            });
        }
    }, 1000);

    // 3. СТИЛИ ДЛЯ ЛЕГЕНДАРОК
    const rareStyles = `
        .legendary-toast {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #222, #000);
            border: 2px solid #d500f9;
            box-shadow: 0 0 30px #d500f9;
            color: #fff; padding: 20px; border-radius: 16px;
            text-align: center; z-index: 9999;
            animation: popInLeg 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            min-width: 250px;
        }
        .leg-icon { font-size: 50px; color: #d500f9; margin-bottom: 10px; text-shadow: 0 0 10px #d500f9; }
        .leg-title { font-size: 20px; font-weight: 800; color: #e040fb; text-transform: uppercase; margin-bottom: 5px; }
        .leg-desc { font-size: 12px; color: #aaa; margin-bottom: 15px; }
        .leg-btn { background: #d500f9; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; }
        
        .craft-zone { background: #1a1a1a; padding: 15px; border-radius: 12px; margin-top: 20px; border: 1px dashed #444; }
        .craft-header { color: #d500f9; font-weight: bold; font-size: 14px; margin-bottom: 10px; display:flex; justify-content:space-between; align-items:center; }
        .part-slot { width: 50px; height: 50px; background: #333; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #555; font-size: 20px; position: relative; border: 1px solid #444; }
        .part-slot.filled { border-color: #d500f9; color: #d500f9; background: #2a0030; box-shadow: 0 0 10px rgba(213, 0, 249, 0.3); }
        .part-count { position: absolute; bottom: -5px; right: -5px; background: #d500f9; color: white; font-size: 9px; padding: 2px 4px; border-radius: 4px; }
        
        @keyframes popInLeg { from { opacity:0; transform:translate(-50%, -40%) scale(0.8); } to { opacity:1; transform:translate(-50%, -50%) scale(1); } }
    `;
    const styleSheet = document.createElement("style"); styleSheet.innerText = rareStyles; document.head.appendChild(styleSheet);


    // 4. ПЕРЕХВАТ ЗАВЕРШЕНИЯ ЗАКАЗА (MONKEY PATCH)
    // Мы сохраняем старую функцию и оборачиваем её в новую
    if (window.completeOrder) {
        const originalCompleteOrder = window.completeOrder;
        
        window.completeOrder = function() {
            // 1. Выполняем старую логику (деньги, опыт, чаевые - всё работает как раньше)
            originalCompleteOrder.apply(this, arguments);

            // 2. Добавляем новую механику дропа
            try {
                rollForLegendary();
            } catch(e) { console.error("Drop Error:", e); }
        };
    } else {
        console.warn("CRITICAL: completeOrder not found! Patch v35 may not work.");
    }

    // 5. ЛОГИКА ВЫПАДЕНИЯ
    function rollForLegendary() {
        if(Math.random() > DROP_CHANCE) return; // Не повезло

        const parts = Object.keys(RARE_ITEMS);
        const droppedKey = parts[Math.floor(Math.random() * parts.length)];
        const item = RARE_ITEMS[droppedKey];

        // Добавляем в инвентарь (безопасно для структуры state)
        if (!state.inventory[droppedKey]) state.inventory[droppedKey] = 0;
        state.inventory[droppedKey]++;

        // Сохраняем немедленно
        if(window.saveGame) window.saveGame();
        if(window.syncToCloud) window.syncToCloud(true);

        // Показываем "Вау" уведомление
        showLegendaryPopup(item, droppedKey);
    }

    function showLegendaryPopup(item, key) {
        const div = document.createElement('div');
        div.className = 'legendary-toast';
        div.innerHTML = `
            <div class="leg-icon"><i class="fa-solid ${item.icon}"></i></div>
            <div class="leg-title">РЕДКАЯ НАХОДКА!</div>
            <div class="leg-desc">Вы нашли: <span style="color:white; font-weight:bold">${item.name}</span><br>${item.desc}</div>
            <div style="font-size:11px; color:#888; margin-bottom:10px">Собери 3 разные детали в Автосалоне</div>
            <button class="leg-btn" onclick="this.parentElement.remove()">ЗАБРАТЬ</button>
        `;
        document.body.appendChild(div);
    }

    // 6. ПЕРЕХВАТ АВТОСАЛОНА (UI КРАФТА)
    // Мы подменяем функцию рендера автосалона, чтобы добавить вниз зону крафта
    if (window.renderTaxiShop) {
        const originalRenderTaxiShop = window.renderTaxiShop;

        window.renderTaxiShop = function(container) {
            // Рисуем старый магазин
            originalRenderTaxiShop(container);

            // Дорисовываем зону крафта
            const hasChip = (state.inventory['part_chip'] || 0);
            const hasEngine = (state.inventory['part_engine'] || 0);
            const hasAlloy = (state.inventory['part_alloy'] || 0);
            
            const isReady = (hasChip > 0 && hasEngine > 0 && hasAlloy > 0);
            const isOwned = (state.taxi.vehicle === CYBER_CAR.id);

            const craftHtml = `
                <div class="craft-zone">
                    <div class="craft-header">
                        <span><i class="fa-solid fa-screwdriver-wrench"></i> СБОРКА ПРОТОТИПА</span>
                        ${isOwned ? '<span style="color:#00c853">СОБРАНО</span>' : ''}
                    </div>
                    <div style="font-size:11px; color:#aaa; margin-bottom:15px">
                        Найдите 3 редкие детали в заказах, чтобы собрать <b>Cyber-X</b>.
                    </div>
                    
                    <div style="display:flex; justify-content:space-around; margin-bottom:20px">
                        <div class="part-slot ${hasChip?'filled':''}">
                            <i class="fa-solid ${RARE_ITEMS['part_chip'].icon}"></i>
                            ${hasChip > 0 ? `<div class="part-count">${hasChip}</div>` : ''}
                        </div>
                        <div class="part-slot ${hasEngine?'filled':''}">
                            <i class="fa-solid ${RARE_ITEMS['part_engine'].icon}"></i>
                            ${hasEngine > 0 ? `<div class="part-count">${hasEngine}</div>` : ''}
                        </div>
                        <div class="part-slot ${hasAlloy?'filled':''}">
                            <i class="fa-solid ${RARE_ITEMS['part_alloy'].icon}"></i>
                            ${hasAlloy > 0 ? `<div class="part-count">${hasAlloy}</div>` : ''}
                        </div>
                    </div>

                    ${isOwned 
                        ? `<button class="shop-btn bought" style="width:100%; background:#333; cursor:default">В ГАРАЖЕ</button>`
                        : `<button class="shop-btn ${isReady ? 'buy' : ''}" 
                            style="width:100%; border-color:#d500f9; color:${isReady?'white':'#666'}; background:${isReady?'#d500f9':'transparent'}"
                            ${isReady ? 'onclick="window.craftCyberCar()"' : 'disabled'}>
                            ${isReady ? 'СОБРАТЬ CYBER-X' : 'НЕ ХВАТАЕТ ДЕТАЛЕЙ'}
                           </button>`
                    }
                </div>
            `;
            
            // Вставляем HTML в конец контейнера
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = craftHtml;
            container.appendChild(tempDiv);
        };
    }

    // 7. ФУНКЦИЯ КРАФТА
    window.craftCyberCar = function() {
        if(state.inventory['part_chip'] > 0 && state.inventory['part_engine'] > 0 && state.inventory['part_alloy'] > 0) {
            // Списываем детали
            state.inventory['part_chip']--;
            state.inventory['part_engine']--;
            state.inventory['part_alloy']--;
            
            // Выдаем машину
            // Так как система такси проверяет только ID машины, мы просто ставим новый ID
            state.taxi.vehicle = CYBER_CAR.id;
            
            // Сохраняем
            if(window.saveGame) window.saveGame();
            if(window.syncToCloud) window.syncToCloud(true);
            
            // Обновляем UI
            if(window.showToast) window.showToast('🤖 CYBER-X СОБРАН! ТЫ ЛЕГЕНДА!', 'success');
            
            // Перерисовываем модалку
            const modalBody = document.getElementById('modal-body');
            if(modalBody && window.renderTaxiShop) window.renderTaxiShop(modalBody);
            
            // Обновляем главное меню (чтобы название машины обновилось, если нужно)
            if(window.updateMenuState) window.updateMenuState();
        }
    };

    // 8. ПОДДЕРЖКА НОВОЙ МАШИНЫ В ГЛАВНОМ МЕНЮ
    // Если игрок выберет Cyber-X, нам нужно чтобы в меню отображалось правильное название,
    // а не "undefined", так как в оригинальном массиве cars этой машины нет.
    // Мы перехватываем обновление UI, если активно такси и машина - наша кастомная.
    setInterval(() => {
        if(state && state.taxi && state.taxi.active && state.taxi.vehicle === CYBER_CAR.id) {
            const label = document.getElementById('city-label');
            if(label && !label.innerHTML.includes('CYBER')) {
                label.innerHTML = 'Night City <span style="font-size:10px; color:#d500f9; border:1px solid #d500f9; padding:0 3px; border-radius:3px">CYBER</span>';
            }
            
            // Если нужно поменять иконку на педали
            const pedal = document.getElementById('pedal-btn');
            if(pedal && !pedal.classList.contains('cyber-pedal')) {
                pedal.classList.add('cyber-pedal');
                pedal.style.boxShadow = "0 4px 0 #4a148c";
                pedal.style.background = "#d500f9";
                pedal.style.color = "white";
            }
            
            // Бонус: Cyber-X не тратит бензин (энергию) так быстро или вообще
            // Это можно реализовать, сбрасывая потребление, но мы обещали не менять код.
            // Поэтому мы просто будем чуть-чуть подлечивать энергию, компенсируя трату.
            // Это "Cheat-less" способ реализации бонуса.
            if(state.needs.energy < 100) state.needs.energy += 0.45; // Компенсация расхода 0.5
        }
    }, 1000);

})();

