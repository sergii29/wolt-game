const CONFIG = { saveKey: 'WOLT_TYCOON_SAVE', dbPath: 'wolt_users' };
let G = { money: 0, xp: 0, lvl: 1, vehicleId: 'bike', stats: { orders: 0 } };
let State = { isOnline: false, phase: 'IDLE', offer: null, progress: 0, temp: 100, isMoving: false };

function init() {
    loadGame(); initCloud(); updateUI();
    const tg = window.Telegram.WebApp; tg.expand();
    setInterval(gameLoop, 100); setInterval(searchLoop, 2000);
}

function toggleOnline() {
    if (State.phase !== 'IDLE' && State.phase !== 'SEARCH') return;
    State.isOnline = !State.isOnline;
    document.body.classList.toggle('online-mode', State.isOnline);
    if (State.isOnline) {
        document.getElementById('status-badge').innerText = "ONLINE"; document.getElementById('status-badge').classList.add('online');
        document.getElementById('slider-text').innerText = "SWIPE TO OFFLINE"; document.getElementById('map-bg').classList.add('searching');
        State.phase = 'SEARCH'; notify("Вы на линии! Ищем заказы...");
    } else {
        document.getElementById('status-badge').innerText = "OFFLINE"; document.getElementById('status-badge').classList.remove('online');
        document.getElementById('slider-text').innerText = "SWIPE TO ONLINE"; document.getElementById('map-bg').classList.remove('searching');
        State.phase = 'IDLE';
    }
}

function searchLoop() { if (State.isOnline && State.phase === 'SEARCH' && Math.random() < 0.3) foundOffer(); }

function foundOffer() {
    State.phase = 'OFFER'; document.getElementById('map-bg').classList.remove('searching');
    let pay = (10 + Math.random() * 15).toFixed(2);
    let dist = (1.5 + Math.random() * 3).toFixed(1);
    let rests = ["McDonalds", "Kebab King", "Pasibus", "Sushi Master"];
    State.offer = { name: rests[Math.floor(Math.random() * rests.length)], dist: dist, pay: pay };
    document.getElementById('offer-rest').innerText = State.offer.name;
    document.getElementById('offer-meta').innerText = `${dist} km • Ресторан`;
    document.getElementById('offer-pay').innerText = pay + " PLN";
    switchPanel('offer'); window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
}

function acceptOrder() {
    State.phase = 'TO_REST'; State.progress = 0; State.temp = 100;
    document.getElementById('pin-rest').classList.add('visible');
    document.getElementById('pin-rest').style.left = '20%'; document.getElementById('pin-rest').style.top = '30%';
    document.getElementById('task-title').innerText = "Едем в " + State.offer.name;
    document.getElementById('action-btn').innerText = "ЖМИ ГАЗ (ЕХАТЬ)"; document.getElementById('action-btn').disabled = false;
    switchPanel('active');
}

function rejectOrder() { State.phase = 'SEARCH'; State.offer = null; switchPanel('start'); document.getElementById('map-bg').classList.add('searching'); }

function gameLoop() {
    if (!State.isOnline) return;
    if (State.isMoving) {
        State.progress += 0.5;
        if (State.progress >= 100) { State.progress = 100; State.isMoving = false; nextStage(); }
        updateProgressUI();
    }
    if (State.phase === 'TO_CLIENT') { State.temp -= 0.15; if (State.temp < 0) State.temp = 0; updateTempUI(); }
}

function nextStage() {
    if (State.phase === 'TO_REST') {
        document.getElementById('action-btn').innerText = "Готовим еду..."; document.getElementById('action-btn').disabled = true;
        setTimeout(() => {
            State.phase = 'TO_CLIENT'; State.progress = 0;
            document.getElementById('action-btn').innerText = "ВЕЗТИ КЛИЕНТУ"; document.getElementById('action-btn').disabled = false;
            document.getElementById('task-title').innerText = "Доставка клиенту";
            document.getElementById('pin-rest').classList.remove('visible');
            document.getElementById('pin-client').classList.add('visible');
            document.getElementById('pin-client').style.left = '80%'; document.getElementById('pin-client').style.top = '60%';
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }, 2000);
    } else if (State.phase === 'TO_CLIENT') { finishOrder(); }
}

function finishOrder() {
    let pay = parseFloat(State.offer.pay); let tip = 0;
    if (State.temp > 80) { tip = Math.floor(pay * 0.2); notify(`🔥 Горячая еда! Чаевые +${tip} PLN`); } 
    else if (State.temp < 30) { pay *= 0.8; notify("🧊 Еда остыла! Штраф."); }
    G.money += pay + tip; G.stats.orders++; G.xp += 20;
    saveGame(); updateUI();
    document.getElementById('pin-client').classList.remove('visible');
    State.phase = 'SEARCH'; switchPanel('start'); document.getElementById('map-bg').classList.add('searching');
    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
}

function saveGame() {
    localStorage.setItem(CONFIG.saveKey, JSON.stringify(G));
    const tg = window.Telegram.WebApp.initDataUnsafe; let userId = (tg && tg.user) ? tg.user.id : "test_user_browser";
    if (window.db) { window.db.ref(CONFIG.dbPath + '/' + userId).set({ ...G, name: (tg.user ? tg.user.first_name : "Player"), lastActive: Date.now() }); }
}

function loadGame() { let d = localStorage.getItem(CONFIG.saveKey); if (d) { try { G = {...G, ...JSON.parse(d)}; } catch(e){} } }
function initCloud() {
    const tg = window.Telegram.WebApp.initDataUnsafe; let userId = (tg && tg.user) ? tg.user.id : "test_user_browser";
    if (window.db) { window.db.ref(CONFIG.dbPath + '/' + userId).once('value').then((snap) => { let val = snap.val(); if (val) { G = {...G, ...val}; updateUI(); } }); }
}

function switchPanel(id) {
    document.getElementById('panel-start').style.display = 'none'; document.getElementById('panel-offer').style.display = 'none'; document.getElementById('panel-active').style.display = 'none';
    if (id === 'start') document.getElementById('panel-start').style.display = 'block';
    if (id === 'offer') document.getElementById('panel-offer').style.display = 'flex';
    if (id === 'active') document.getElementById('panel-active').style.display = 'block';
}
function holdGas() { State.isMoving = true; }
function releaseGas() { State.isMoving = false; }
function updateUI() { document.getElementById('money-ui').innerText = G.money.toFixed(2) + " PLN"; document.getElementById('lvl-ui').innerText = G.lvl; }
function updateProgressUI() { document.getElementById('prog-bar').style.width = State.progress + "%"; document.getElementById('dist-ui').innerText = (parseFloat(State.offer.dist) * (1 - State.progress/100)).toFixed(1) + " km"; }
function updateTempUI() {
    let bar = document.getElementById('temp-bar'); bar.style.width = State.temp + "%"; document.getElementById('temp-ui').innerText = Math.floor(State.temp) + "%";
    if(State.temp < 40) bar.style.background = "#ff3b30"; else if(State.temp > 75) bar.style.background = "#4cd964"; else bar.style.background = "#ffcc00";
}
function notify(msg) { let n = document.getElementById('notif'); n.innerText = msg; n.classList.add('show'); setTimeout(() => n.classList.remove('show'), 3000); }
window.onload = init;

