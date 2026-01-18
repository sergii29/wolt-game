// --- ИГРОВАЯ ЛОГИКА ---
const SAVE_KEY = 'WARSZAWA_FOREVER';
let userId = localStorage.getItem('wolt_user_id');
if (!userId) { userId = 'user_' + Math.floor(Math.random()*100000); localStorage.setItem('wolt_user_id', userId); }

// Настройки по умолчанию (если админ не поменял)
let GLOBAL_CONFIG = {
    basePay: 12,
    inflationRate: 0.05,
    energyCost: 0.15,
    penaltyMiss: 0.10,
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
    name: "Курьер " + userId.split('_')[1],
    balance: 0, debt: 0, debtTimer: 0, debtOverdue: false, isBanned: false,
    isOnline: false, isSearching: false, scheduledOffline: false,
    items: { bike: 100, bag: 100, phone: 100, gear: 100 },
    needs: { energy: 100, water: 100, mood: 100 },
    inventory: { water: 0, bar: 0, energy_drink: 0, coffee: 0 },
    repairs: { bike: 0, bag: 0, phone: 0, gear: 0 },
    history: []
};

let currentOrder = null;
let acceptTimeout, orderInterval, map;

// --- ЗАПУСК ---
function init() {
    // Карта
    map = L.map('map', { zoomControl: false, attributionControl: false }).setView([52.2297, 21.0122], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
    L.marker([52.2297, 21.0122]).addTo(map);

    loadGame();
    initSliders();
    document.getElementById('pedal-btn').addEventListener('click', pedal);
    setInterval(checkDebt, 1000);
    
    // Синхронизация с Админкой (Firebase)
    if (window.db) {
        // 1. Слушаем свои данные (вдруг админ поменял баланс)
        db.ref('users/' + userId).on('value', (snap) => {
            const val = snap.val();
            if (val) {
                if (val.balance !== undefined && Math.abs(val.balance - state.balance) > 1) {
                    state.balance = val.balance; // Админ поменял баланс
                    showToast('Администратор изменил баланс!', 'warn');
                }
                if (val.isBanned) {
                    alert("ВЫ ЗАБЛОКИРОВАНЫ АДМИНИСТРАТОРОМ");
                    localStorage.clear(); location.reload();
                }
            }
        });
        // 2. Слушаем глобальные настройки
        db.ref('config').on('value', (snap) => {
            const val = snap.val();
            if (val) GLOBAL_CONFIG = { ...GLOBAL_CONFIG, ...val };
        });
        // 3. Отправляем себя в базу
        syncToCloud();
        setInterval(syncToCloud, 10000);
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
            repairs: state.repairs,
            isOnline: state.isOnline,
            lastActive: Date.now()
        });
    }
}

// ... (СЮДА ВСТАВИТЬ ВСЕ ФУНКЦИИ ИЗ СТАРОГО HTML: pedal, completeOrder, checkDebt и т.д.)
// Я сократил код для удобства вставки, используй логику из прошлого ответа, 
// только замени хардкоды на GLOBAL_CONFIG.basePay и т.д.

// ВАЖНО: Вставь сюда все функции (pedal, completeOrder, updateUI) из предыдущего ответа!
// Они остались без изменений, только добавь syncToCloud() внутри saveGame().

window.onload = init;
