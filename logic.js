const SAVE_KEY = 'WARSZAWA_FOREVER';

// ПОЛУЧЕНИЕ ID ИГРОКА (ВАЖНО ДЛЯ АДМИНКИ)
let tg = window.Telegram.WebApp;
tg.expand(); // На весь экран
let userId = (tg.initDataUnsafe && tg.initDataUnsafe.user) 
    ? tg.initDataUnsafe.user.id.toString() 
    : (localStorage.getItem('wolt_user_id') || 'user_' + Math.floor(Math.random()*100000));

if (!tg.initDataUnsafe.user) localStorage.setItem('wolt_user_id', userId);

// ГЛОБАЛЬНЫЕ НАСТРОЙКИ (Синхронизируются с Админкой)
let GLOBAL = {
    basePay: 12,
    inflationRate: 0.05,
    penaltyLate: 5.00
};

const ITEMS_DB = {
    bike: { name: 'Велосипед', type: 'repair', baseCost: 5, icon: 'fa-bicycle' },
    bag: { name: 'Сумка', type: 'repair', baseCost: 2, icon: 'fa-box-open' },
    phone: { name: 'Связь', type: 'repair', baseCost: 1, icon: 'fa-mobile-screen' },
    gear: { name: 'Одежда', type: 'repair', baseCost: 3, icon: 'fa-shirt' },
    water: { name: 'Вода (0.5л)', type: 'buy', cost: 2.0, effect: {water:35, energy:5}, icon: 'fa-bottle-water', target:'water' },
    bar: { name: 'Сникерс', type: 'buy', cost: 4.5, effect: {energy:20, mood:15}, icon: 'fa-cookie-bite', target:'energy' },
    energy_drink: { name: 'Red Bull', type: 'buy', cost: 7.0, effect: {energy:50, mood:5, water:-5}, icon: 'fa-bolt', target:'energy' },
    coffee: { name: 'Латте', type: 'buy', cost: 9.0, effect: {mood:30, energy:10}, icon: 'fa-mug-hot', target:'mood' }
};

let state = {
    name: (tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user.first_name : "Гость",
    balance: 0, debt: 0, debtTimer: 0, debtOverdue: false, isBanned: false,
    isOnline: false, isSearching: false, scheduledOffline: false,
    items: { bike: 100, bag: 100, phone: 100, gear: 100 },
    needs: { energy: 100, water: 100, mood: 100 },
    inventory: { water: 0, bar: 0, energy_drink: 0, coffee: 0 },
    repairs: { bike: 0, bag: 0, phone: 0, gear: 0 },
    history: []
};

const restaurants = [
    { name: "McDonald's", icon: "🍔" }, { name: "KFC", icon: "🍗" },
    { name: "Pasibus", icon: "🍔" }, { name: "Kebab King", icon: "🌯" },
    { name: "Sushi Master", icon: "🍣" }, { name: "Pizza Hut", icon: "🍕" }
];

let currentOrder = null;
let acceptTimeout, orderInterval, map;

function init() {
    map = L.map('map', { zoomControl: false, attributionControl: false }).setView([52.2297, 21.0122], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
    L.marker([52.2297, 21.0122]).addTo(map);

    loadGame();
    initSliders();
    document.getElementById('pedal-btn').addEventListener('click', pedal);
    setInterval(checkDebt, 1000);

    // ПОДКЛЮЧЕНИЕ К БАЗЕ (АДМИНКА)
    if (window.db) {
        // 1. Слушаем свои данные (Админ может изменить баланс или забанить)
        db.ref('users/' + userId).on('value', snap => {
            const val = snap.val();
            if (val) {
                if (val.isBanned) {
                    alert("⛔ ВЫ ЗАБЛОКИРОВАНЫ АДМИНИСТРАТОРОМ");
                    localStorage.clear(); location.reload();
                }
                // Если админ поменял баланс "руками"
                if (val.adminEdit && val.balance !== state.balance) {
                    state.balance = val.balance;
                    showToast('Администратор изменил баланс!', 'warn');
                    db.ref('users/' + userId + '/adminEdit').set(false); // Сброс флага
                }
            }
        });

        // 2. Слушаем глобальные настройки экономики
        db.ref('config').on('value', snap => {
            const conf = snap.val();
            if (conf) GLOBAL = { ...GLOBAL, ...conf };
        });

        // 3. Отправляем себя в базу
        syncToCloud();
        setInterval(syncToCloud, 5000);
    }
}

function loadGame() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) state = { ...state, ...JSON.parse(saved) };
    state.scheduledOffline = false;
    updateUI();
}

function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    syncToCloud();
}

function syncToCloud() {
    if (window.db) {
        db.ref('users/' + userId).update({
            name: state.name,
            balance: state.balance,
            debt: state.debt,
            items: state.items,
            needs: state.needs,
            isOnline: state.isOnline,
            lastActive: Date.now()
        });
    }
}

// === ВСЯ ЛОГИКА ИГРЫ ===

function checkDebt() {
    if (state.debt > 0 && !state.debtOverdue) {
        if (Date.now() > state.debtTimer) {
            state.debtOverdue = true; showToast('СРОК КРЕДИТА ИСТЕК! ШТРАФ 20%', 'warn'); updateUI();
            if(document.getElementById('full-modal').classList.contains('open')) renderBank(document.getElementById('modal-body'));
        } else {
            if(document.getElementById('full-modal').classList.contains('open')) renderBank(document.getElementById('modal-body'));
        }
    }
}

function updateUI() {
    document.getElementById('balance-val').textContent = state.balance.toFixed(2) + ' PLN';
    ['bike','bag','phone','gear'].forEach(k => document.getElementById(`bar-${k}`).style.width = state.items[k] + '%');
    ['energy','water','mood'].forEach(k => document.getElementById(`bar-${k}`).style.width = state.needs[k] + '%');
    
    const totalInv = Object.values(state.inventory).reduce((a,b)=>a+b, 0);
    const bagBadge = document.getElementById('bag-count');
    bagBadge.textContent = totalInv;
    bagBadge.style.display = totalInv ? 'flex' : 'none';

    const warn = document.getElementById('debt-warning');
    const garnInfo = document.getElementById('garnishment-info');
    if (state.debtOverdue && state.debt > 0) { warn.style.display = 'inline'; garnInfo.style.display = 'block'; }
    else { warn.style.display = 'none'; garnInfo.style.display = 'none'; }
}

function showToast(msg, type='info') {
    const t = document.getElementById('toast');
    t.innerHTML = msg;
    t.className = 'game-toast show ' + (type === 'warn' ? 'toast-warn' : (type==='success' ? 'toast-success' : ''));
    setTimeout(() => t.className = 'game-toast', 3000);
}

function startOrderLoop() {
    if (orderInterval) clearInterval(orderInterval);
    orderInterval = setInterval(() => {
        if (!currentOrder || !currentOrder.accepted) return;
        currentOrder.timeLeft--;
        document.getElementById('delivery-timer').textContent = `⏱ ${currentOrder.timeLeft}с`;
        if (currentOrder.timeLeft <= 0) { failOrder("time"); return; }

        let decay = 0.5 * (1 + ((100 - state.items.bag) / 100));
        currentOrder.foodTemp -= decay;
        if (currentOrder.foodTemp < 50 && !currentOrder.tempWarned) { showToast('❄️ Еда остыла! Поторопись!', 'warn'); currentOrder.tempWarned = true; }
        document.getElementById('temp-val').textContent = Math.floor(currentOrder.foodTemp) + '%';
        if (currentOrder.foodTemp <= 0) { failOrder("cold"); return; }
    }, 1000);
}

function stopOrderLoop() {
    if (orderInterval) clearInterval(orderInterval);
    orderInterval = null;
    document.getElementById('delivery-timer').textContent = '';
}

function failOrder(reason) {
    stopOrderLoop();
    let msg = reason === "time" ? "⏰ Время вышло!" : "❄️ Еда испорчена!";
    showToast(`${msg} Штраф -${GLOBAL.penaltyLate} PLN`, 'warn');
    state.balance -= GLOBAL.penaltyLate;
    currentOrder = null;
    saveGame(); updateUI();
    startSearching();
}

function pedal() {
    if (!currentOrder) return;
    if (!currentOrder.accepted) { acceptOrder(); return; }

    let fatigue = Math.max(0.3, state.needs.energy / 100);
    if (state.needs.energy <= 5 || state.needs.water <= 5) { showToast('Сил нет! Открой рюкзак!', 'warn'); openQuickInv(true); return; }

    state.needs.energy -= GLOBAL.energyCost; 
    state.needs.water -= 0.10; state.needs.mood -= 0.05;
    state.items.bike -= 0.1; state.items.phone -= 0.05;
    
    currentOrder.progress += (5 * fatigue);
    updateTrack(currentOrder.progress);
    
    if (Math.random() < 0.1 && currentOrder.stage === 2) triggerRandomEvent();
    if (currentOrder.progress >= 100) nextStage();
    saveGame(); updateUI();
}

function triggerRandomEvent() {
    const btn = document.getElementById('pedal-btn');
    const events = [{ text: "🚧 ПРОБКА!", time: 3000 }, { text: "🚦 СВЕТОФОР", time: 2000 }, { text: "🚕 ОБЪЕЗД", time: 4000 }];
    const ev = events[Math.floor(Math.random()*events.length)];
    
    btn.disabled = true; btn.classList.add('blocked'); btn.textContent = ev.text;
    showToast('Задержка! Еда остывает!', 'warn');
    setTimeout(() => { if (currentOrder) { btn.disabled = false; btn.classList.remove('blocked'); btn.textContent = 'ЖМИ ГАЗ (PEDAL)'; } }, ev.time);
}

function acceptOrder() {
    currentOrder.accepted = true;
    clearTimeout(acceptTimeout);
    document.getElementById('accept-timer').style.display = 'none';
    document.getElementById('pedal-btn').textContent = 'ЖМИ ГАЗ (PEDAL)';
    startOrderLoop();
}

function missOrder() {
    state.isSearching = true; currentOrder = null;
    state.balance -= 0.10; showToast('Заказ упущен! Штраф -0.10 PLN', 'warn');
    saveGame(); updateUI(); startSearching();
}

function nextStage() {
    currentOrder.stage++; currentOrder.progress = 0; updateTrack(0);
    if (currentOrder.stage === 1) {
        const btn = document.getElementById('pedal-btn'); btn.disabled = true; btn.textContent = 'ЖДЕМ ЗАКАЗ...';
        document.getElementById('status-label').textContent = 'Ресторан готовит...';
        setTimeout(() => { btn.disabled = false; btn.textContent = 'ЖМИ ГАЗ (PEDAL)'; document.getElementById('status-label').textContent = 'Везем клиенту'; currentOrder.stage = 2; }, 2000);
    } else if (currentOrder.stage === 3) completeOrder();
}

function completeOrder() {
    stopOrderLoop();
    const totalRepairs = Object.values(state.repairs).reduce((a,b)=>a+b,0);
    const inflationMult = 1 + (totalRepairs * GLOBAL.inflationRate);
    
    let pay = (GLOBAL.basePay + (Math.random() * 6)) * inflationMult;
    let tip = 0;

    if (currentOrder.foodTemp > 60) { if (Math.random() > 0.5) tip += (2 + Math.random() * 3) * inflationMult; }
    if (state.needs.mood > 80 && currentOrder.foodTemp > 40) { if (Math.random() > 0.3) tip += 3 * inflationMult; }

    if (tip > 0) {
        pay += tip;
        let msg = (state.needs.mood > 80 && currentOrder.foodTemp > 70) ? `🔥 Быстро и весело! +${tip.toFixed(2)} чай!` : `👍 Клиент доволен! +${tip.toFixed(2)} чай`;
        showToast(msg, 'success');
    } else if (currentOrder.foodTemp < 50) showToast('Еда остыла... Без чаевых.', 'warn');

    state.items.bag -= 1.5; state.items.gear -= 0.8;

    if (state.debtOverdue && state.debt > 0) {
        let penalty = pay * 0.20;
        if (penalty > state.debt) penalty = state.debt;
        state.debt -= penalty; pay -= penalty;
        showToast(`Долг: -${penalty.toFixed(2)} PLN`, 'warn');
    }
    
    state.balance += pay;
    state.history.push({ rest: currentOrder.rest.name, earn: pay.toFixed(2) });
    setTimeout(() => { showToast(`Заказ: +${pay.toFixed(2)} PLN`, 'success'); }, 500);
    
    if (state.scheduledOffline) { goOffline(); } else { startSearching(); }
    saveGame(); updateUI();
}

function startSearching() {
    stopOrderLoop();
    state.isSearching = true;
    document.getElementById('active-order-view').style.display = 'flex';
    document.getElementById('rest-name').textContent = 'Поиск...';
    document.getElementById('rest-icon').textContent = '🔍';
    document.getElementById('status-label').textContent = 'Ищем заказ...';
    document.getElementById('order-dest').textContent = 'Ожидание...';
    document.getElementById('accept-timer').style.display = 'none';
    document.getElementById('delivery-timer').textContent = '';
    
    resetSlider('online');
    const box = document.getElementById('online-slider-box');
    const txt = document.getElementById('online-slider-text');
    box.classList.remove('scheduled');
    txt.textContent = "СВАЙП ДЛЯ ОФЛАЙНА";
    
    document.getElementById('pedal-btn').disabled = true;
    document.getElementById('pedal-btn').textContent = 'ПОИСК...';
    document.getElementById('pedal-btn').className = 'pedal-btn btn-blue';
    
    updateTrack(0);
    setTimeout(() => { if (state.isOnline && state.isSearching) createOrder(); }, 2000);
}

function createOrder() {
    state.isSearching = false;
    const r = restaurants[Math.floor(Math.random() * restaurants.length)];
    currentOrder = { rest: r, progress: 0, stage: 0, foodTemp: 100, accepted: false, timeLeft: 60, tempWarned: false };
    
    document.getElementById('rest-name').textContent = `Едем в ${r.name}`;
    document.getElementById('rest-icon').textContent = r.icon;
    document.getElementById('status-label').textContent = '🔥 ПРИМИ ЗАКАЗ! 🔥';
    document.getElementById('order-dest').textContent = 'Забрать: 2.5 km';
    document.getElementById('pedal-btn').textContent = 'ПРИНЯТЬ ЗАКАЗ';
    document.getElementById('pedal-btn').disabled = false;

    const bar = document.getElementById('accept-timer');
    const fill = document.getElementById('accept-timer-fill');
    bar.style.display = 'block';
    fill.classList.remove('animate-timer');
    void fill.offsetWidth;
    fill.classList.add('animate-timer');

    acceptTimeout = setTimeout(missOrder, 15000); 

    resetSlider('online');
    const box = document.getElementById('online-slider-box');
    const txt = document.getElementById('online-slider-text');
    box.classList.remove('scheduled');
    txt.textContent = "ЗАПЛАНИРОВАТЬ ОФЛАЙН";
}

function goOffline() {
    state.isOnline = false; state.isSearching = false; state.scheduledOffline = false;
    stopOrderLoop();
    if (acceptTimeout) clearTimeout(acceptTimeout);
    document.getElementById('active-order-view').style.display = 'none';
    document.getElementById('offline-view').style.display = 'block';
    resetSlider('offline');
    saveGame();
}

function initSliders() {
    setupSlider('offline', () => { state.isOnline = true; document.getElementById('offline-view').style.display = 'none'; startSearching(); });
    setupSlider('online', () => {
        if (state.isSearching) { goOffline(); }
        else {
            state.scheduledOffline = true;
            const box = document.getElementById('online-slider-box');
            const txt = document.getElementById('online-slider-text');
            box.classList.add('scheduled');
            txt.textContent = "ОФЛАЙН ПОСЛЕ ЗАКАЗА";
            resetSlider('online');
        }
    });
}

function setupSlider(prefix, callback) {
    const knob = document.getElementById(`${prefix}-slider-knob`);
    const box = document.getElementById(`${prefix}-slider-box`);
    const fill = document.getElementById(`${prefix}-slider-fill`);
    let isDragging = false, startX = 0;
    knob.addEventListener('mousedown', start); knob.addEventListener('touchstart', start);
    function start(e) { isDragging = true; startX = (e.type === 'mousedown') ? e.clientX : e.touches[0].clientX; document.addEventListener('mousemove', move); document.addEventListener('touchmove', move); document.addEventListener('mouseup', end); document.addEventListener('touchend', end); }
    function move(e) { if (!isDragging) return; const clientX = (e.type === 'mousemove') ? e.clientX : e.touches[0].clientX; let x = clientX - startX; let max = box.offsetWidth - knob.offsetWidth - 8; x = Math.max(0, Math.min(x, max)); knob.style.transform = `translateX(${x}px)`; fill.style.width = `${(x / max) * 100}%`; if (x >= max * 0.95) { isDragging = false; end(); callback(); } }
    function end() { isDragging = false; document.removeEventListener('mousemove', move); document.removeEventListener('touchmove', move); document.removeEventListener('mouseup', end); document.removeEventListener('touchend', end); knob.style.transform = 'translateX(0)'; fill.style.width = '0%'; }
}

function resetSlider(prefix) { document.getElementById(`${prefix}-slider-knob`).style.transform = 'translateX(0)'; document.getElementById(`${prefix}-slider-fill`).style.width = '0%'; }

function toggleQuickInv() { const menu = document.getElementById('quick-inv'); menu.style.display === 'flex' ? menu.style.display = 'none' : openQuickInv(); }
function openQuickInv() {
    const menu = document.getElementById('quick-inv'); menu.innerHTML = '';
    let lowest = 'none', min = 100;
    if (state.needs.water < min) { min = state.needs.water; lowest = 'water'; }
    if (state.needs.energy < min) { min = state.needs.energy; lowest = 'energy'; }
    if (state.needs.mood < min) { min = state.needs.mood; lowest = 'mood'; }
    let owned = [];
    for (let [k, c] of Object.entries(state.inventory)) { if (c > 0) owned.push({ k, c, data: ITEMS_DB[k] }); }
    if (owned.length === 0) { menu.innerHTML = `<div style="padding:5px; color:#fff; text-align:center; font-size:12px">Рюкзак пуст!</div><div class="inv-item link-btn" onclick="openModal('shop')">В МАГАЗИН</div>`; }
    else {
        owned.sort((a,b) => (b.data.target === lowest) - (a.data.target === lowest));
        owned.forEach(item => {
            const div = document.createElement('div'); div.className = 'inv-item';
            div.innerHTML = `<span><i class="fa-solid ${item.data.icon}"></i> ${item.data.name}</span><span class="inv-count">x${item.c}</span>`;
            div.onclick = () => useItem(item.k); menu.appendChild(div);
        });
    }
    menu.style.display = 'flex'; menu.classList.add('open');
}

function useItem(key) {
    const item = ITEMS_DB[key]; state.inventory[key]--;
    if (item.effect.energy) state.needs.energy += item.effect.energy;
    if (item.effect.water) state.needs.water += item.effect.water;
    if (item.effect.mood) state.needs.mood += item.effect.mood;
    ['energy','water','mood'].forEach(k => { if(state.needs[k]>100) state.needs[k]=100; });
    showToast(`${item.name} использован!`, 'success'); toggleQuickInv(); saveGame(); updateUI();
}

function toggleMenu() { document.getElementById('side-menu-overlay').classList.toggle('open'); document.getElementById('side-menu').classList.toggle('open'); }
function closeModal() { document.getElementById('full-modal').classList.remove('open'); }
function openModal(type) {
    toggleMenu(); 
    const m = document.getElementById('full-modal'); const b = document.getElementById('modal-body'); m.classList.add('open');
    if (type === 'shop') { document.getElementById('modal-title').textContent = 'Магазин'; renderShop(b); }
    else if (type === 'bank') { document.getElementById('modal-title').textContent = 'Банк (Кредит)'; renderBank(b); }
    else if (type === 'deflation') { document.getElementById('modal-title').textContent = 'Борьба с инфляцией'; renderDeflation(b); }
    else { document.getElementById('modal-title').textContent = 'История'; renderHistory(b); }
}

function renderShop(c) {
    let html = '';
    const levelSum = Object.values(state.repairs).reduce((a,b)=>a+b,0);
    const inflation = 1 + (levelSum * GLOBAL.inflationRate); 

    html += '<div class="shop-section"><h3>🎒 Еда (Цены растут!)</h3>';
    ['water', 'bar', 'energy_drink', 'coffee'].forEach(k => {
        const i = ITEMS_DB[k];
        const price = i.cost * inflation;
        const owned = state.inventory[k] || 0;
        html += `
        <div class="shop-card">
            <div>
                <div style="font-weight:bold">${i.name} <span style="font-size:11px; color:#009de0; font-weight:normal">(В наличии: ${owned})</span></div>
                <div class="shop-desc">${i.desc}</div>
            </div>
            <button class="shop-btn buy" onclick="buyItem('${k}', ${price}, this)">${price.toFixed(1)}</button>
        </div>`;
    });
    html += '</div>';
    
    html += '<div class="shop-section"><h3>🛠 Сервис (Только 0%)</h3>';
    ['bike', 'bag', 'phone', 'gear'].forEach(k => {
        const i = ITEMS_DB[k];
        const base = i.baseCost + ((state.repairs[k]||0)*0.5);
        const price = base * inflation;
        const currentHealth = Math.floor(state.items[k]);
        const isBroken = currentHealth <= 0;
        const btnText = isBroken ? `Починить -${price.toFixed(1)}` : `Целое (${currentHealth}%)`;
        html += `
        <div class="shop-card">
            <div>
                <div style="font-weight:bold">${i.name} (Lvl ${state.repairs[k]||0})</div>
                <div class="shop-desc">Состояние: ${currentHealth}%</div>
            </div>
            <button class="shop-btn" ${isBroken ? '' : 'disabled'} onclick="buyRepair('${k}', ${price}, this)">${btnText}</button>
        </div>`;
    });
    html += '</div>';
    c.innerHTML = html;
}

function renderDeflation(c) {
    const levelSum = Object.values(state.repairs).reduce((a,b)=>a+b,0);
    const inflation = 1 + (levelSum * GLOBAL.inflationRate);
    const cost1 = 2700 * inflation; const cost2 = 5000 * inflation;

    c.innerHTML = `
        <div style="text-align:center; padding:20px 0;">
            <i class="fa-solid fa-scale-unbalanced-flip" style="font-size:40px; color:#90a4ae"></i>
            <h2>Инфляция: ${((inflation-1)*100).toFixed(0)}%</h2>
            <p style="color:#666; font-size:14px">Снижение инфляции уменьшает цены в магазинах, но стоит больших денег.</p>
        </div>
        <div class="shop-card">
            <div><div style="font-weight:bold">Откат (-1 уровень)</div><div class="shop-desc">Снижает цены на шаг назад</div></div>
            <button class="shop-btn govt-btn" onclick="buyDeflation(1, ${cost1})">-${cost1.toFixed(0)}</button>
        </div>
        <div class="shop-card">
            <div><div style="font-weight:bold">Сильный откат (-2 ур.)</div><div class="shop-desc">Серьезное снижение цен</div></div>
            <button class="shop-btn govt-btn" onclick="buyDeflation(2, ${cost2})">-${cost2.toFixed(0)}</button>
        </div>`;
}

function buyItem(k, cost, btn) {
    if(state.balance >= cost) { 
        state.balance-=cost; state.inventory[k]=(state.inventory[k]||0)+1; 
        const originalText = btn.textContent; btn.textContent = 'КУПЛЕНО!'; btn.className = 'shop-btn bought';
        setTimeout(() => { btn.textContent = originalText; btn.className = 'shop-btn buy'; renderShop(document.getElementById('modal-body')); }, 600);
        saveGame(); updateUI(); 
    } else showToast('Нет денег','warn');
}

function buyRepair(k, cost, btn) {
    if (state.items[k] > 0) return;
    if(state.balance >= cost) { 
        state.balance-=cost; state.items[k]=100; state.repairs[k]=(state.repairs[k]||0)+1; 
        btn.textContent = 'ГОТОВО!'; btn.className = 'shop-btn bought';
        setTimeout(() => { renderShop(document.getElementById('modal-body')); }, 600);
        saveGame(); updateUI(); 
    } else showToast('Нет денег','warn');
}

function buyDeflation(levels, cost) {
    if (state.balance < cost) { showToast('Недостаточно средств', 'warn'); return; }
    let reduced = 0;
    for (let i = 0; i < levels; i++) {
        const key = Object.keys(state.repairs).find(k => state.repairs[k] > 0);
        if (key) { state.repairs[key]--; reduced++; }
    }
    if (reduced > 0) {
        state.balance -= cost; showToast(`Инфляция снижена на ${reduced} ур.!`, 'success');
        saveGame(); updateUI(); renderDeflation(document.getElementById('modal-body'));
    } else { showToast('Инфляция уже на минимуме!', 'warn'); }
}

function renderBank(c) {
    let timeLeftStr = "00:00";
    if(state.debt > 0 && !state.debtOverdue) {
        let diff = Math.max(0, state.debtTimer - Date.now());
        let m = Math.floor(diff / 60000);
        let s = Math.floor((diff % 60000) / 1000);
        timeLeftStr = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }
    c.innerHTML = `
        <div class="debt-alert-box" style="display:${state.debtOverdue?'block':'none'}">⚠️ <strong>ПРОСРОЧЕНО!</strong><br>Удерживаем 20% с каждого заказа.</div>
        <div style="text-align:center; margin-bottom:20px">
            <div style="font-size:14px; color:#666">Текущий долг</div>
            <div style="font-size:32px; font-weight:800; color:${state.debt>0?'var(--accent-red)':'#333'}">${state.debt.toFixed(2)} PLN</div>
            <div style="font-size:12px; color:${state.debtOverdue?'red':'#00c853'}; font-weight:bold; margin-top:5px">
                ${state.debt > 0 ? (state.debtOverdue ? 'ВЗЫСКАНИЕ АКТИВНО' : 'Осталось времени: ' + timeLeftStr) : 'Нет долгов'}
            </div>
        </div>
        <input type="number" id="loan-amount" class="bank-input" placeholder="Сумма...">
        <div class="bank-actions">
            <button class="bank-btn btn-loan" onclick="takeLoan()">ВЗЯТЬ</button>
            ${state.debt > 0 ? '<button class="bank-btn btn-repay" onclick="repayLoan()">ВЕРНУТЬ</button>' : ''}
        </div>`;
}
function takeLoan() {
    const input = document.getElementById('loan-amount'); const amt = parseFloat(input.value);
    if (!amt || amt <= 0) return;
    state.balance += amt; state.debt += amt; state.debtTimer = Date.now() + (5 * 60 * 1000); state.debtOverdue = false;
    showToast(`Взят кредит: ${amt} PLN`, 'success'); input.value = ''; renderBank(document.getElementById('modal-body')); saveGame(); updateUI();
}
function repayLoan() {
    const input = document.getElementById('loan-amount'); let amt = parseFloat(input.value);
    if (!amt || amt <= 0) return;
    if (amt > state.balance) amt = state.balance; if (amt > state.debt) amt = state.debt;
    state.balance -= amt; state.debt -= amt; if (state.debt <= 0.01) { state.debt = 0; state.debtOverdue = false; }
    showToast(`Погашено: ${amt} PLN`, 'success'); input.value = ''; renderBank(document.getElementById('modal-body')); saveGame(); updateUI();
}
function renderHistory(c) { c.innerHTML = state.history.slice().reverse().map(h=>`<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between"><b>${h.rest}</b><span>+${h.earn}</span></div>`).join(''); }
function updateTrack(p) { document.getElementById('track-fill').style.width=p+'%'; document.getElementById('track-icon').style.left=p+'%'; }
function resetGame() {
    if(confirm('Сбросить прогресс? Вы начнете новую игру с долгом 7000 PLN!')) {
        localStorage.removeItem(SAVE_KEY);
        const newState = { balance: 0, debt: 7000, debtTimer: Date.now(), debtOverdue: true, isOnline: false, isSearching: false, scheduledOffline: false, items: { bike: 100, bag: 100, phone: 100, gear: 100 }, needs: { energy: 100, water: 100, mood: 100 }, inventory: { water: 0, bar: 0, energy_drink: 0, coffee: 0 }, repairs: { bike: 0, bag: 0, phone: 0, gear: 0 }, history: [] };
        localStorage.setItem(SAVE_KEY, JSON.stringify(newState)); location.reload();
    }
}
window.onload = init;
