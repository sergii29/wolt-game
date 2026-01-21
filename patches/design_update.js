// ============================================================
// --- PATCH v19: FINAL FIX (ALL BONUSES + PERCENTAGES) ---
// ============================================================

(function() {
    console.log(">>> Patch v19: Rocket Fix & UI Stats Loaded");

    window.bonusData = [];

    // 1. СИНХРОНИЗАЦИЯ
    if(window.db) {
        window.db.ref('bonuses/list').on('value', snap => {
            const data = snap.val() || {};
            window.bonusData = Object.entries(data).map(([key, val]) => ({id: key, ...val}));
            if(document.getElementById('bonus-modal')) renderBonusModal();
        });
        
        window.db.ref('config').on('value', snap => {
            const cfg = snap.val();
            if(cfg) {
                if(!window.gameConfig) window.gameConfig = {};
                Object.assign(window.gameConfig, cfg);
                
                // ПРЕДОХРАНИТЕЛЬ ЭНЕРГИИ
                // Если админ случайно сохранил 0, ставим дефолт
                if(window.gameConfig.energyDrain === 0) window.gameConfig.energyDrain = 0.15;
                if(window.gameConfig.waterDrain === 0) window.gameConfig.waterDrain = 0.10;
            }
        });
    }

    if(typeof window.startSessionOrders === 'undefined') window.startSessionOrders = (state.career.totalOrders || 0);

    // 2. СТИЛИ (Маленькие проценты + Модалка)
    const styles = `
        /* PERCENTAGE NUMBERS UNDER ICONS */
        .equip-item { position: relative; padding-bottom: 12px !important; }
        .tiny-stat { 
            position: absolute; bottom: 1px; left: 0; right: 0; 
            text-align: center; font-size: 8px; font-weight: bold; color: #fff; opacity: 0.8; 
            text-shadow: 0 1px 2px black;
        }

        /* BONUS MODAL */
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: flex-end; }
        .bonus-modal-card { background: #f4f6f8; width: 100%; height: 85vh; border-radius: 20px 20px 0 0; padding: 20px; overflow-y: auto; animation: slideUp 0.3s; display: flex; flex-direction: column; }
        .close-circle { position: absolute; top: 15px; right: 15px; width: 30px; height: 30px; background: #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer; color: #333; z-index: 10; }
        
        .section-header { font-size: 13px; font-weight: 800; color: #888; text-transform: uppercase; margin: 20px 0 10px 0; letter-spacing: 1px; }
        
        .b-card { background: white; padding: 15px; border-radius: 14px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.03); border-left: 5px solid #ccc; position: relative; }
        .b-card.active { border-left-color: #00c853; }
        .b-card.future { border-left-color: #ff9800; }
        
        .b-tag { position: absolute; top: 15px; right: 15px; font-size: 10px; padding: 3px 8px; border-radius: 10px; color: white; font-weight: bold; }
        .tag-act { background: #00c853; } .tag-fut { background: #ff9800; }
        
        .prog-bar { height: 6px; background: #eee; border-radius: 3px; margin-top: 10px; overflow: hidden; }
        .prog-fill { height: 100%; background: #00c853; width: 0%; }
        
        .rocket-banner { background: #fff; padding: 12px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin: 10px 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); cursor: pointer; }
        
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    `;
    const styleSheet = document.createElement("style"); styleSheet.innerText = styles; document.head.appendChild(styleSheet);

    // 3. ОТРИСОВКА БОНУСОВ (ВСЁ В ОДНОМ СПИСКЕ)
    window.renderBonusModal = function() {
        const old = document.getElementById('bonus-modal'); if(old) old.remove();
        
        const now = Date.now();
        const active = window.bonusData.filter(b => now >= b.startTime && now <= b.endTime);
        const future = window.bonusData.filter(b => now < b.startTime);
        
        // Сортировка
        active.sort((a,b) => a.endTime - b.endTime);
        future.sort((a,b) => a.startTime - b.startTime);

        let html = `<div class="bonus-modal-card">
            <div class="close-circle" onclick="document.getElementById('bonus-modal').remove()">✕</div>
            <h1 style="margin:0 0 5px 0; font-size:24px; color:#222">Бонусы</h1>
            <p style="margin:0; font-size:12px; color:#666">Выполняй задания и получай деньги</p>`;

        // АКТИВНЫЕ
        html += `<div class="section-header">🔥 Активные (Live)</div>`;
        if (active.length === 0) {
            html += `<div style="text-align:center; padding:15px; color:#aaa; font-size:13px; background:rgba(0,0,0,0.03); border-radius:10px">Нет активных заданий</div>`;
        } else {
            const sessionOrders = (state.career.totalOrders || 0) - window.startSessionOrders;
            active.forEach(b => {
                const target = parseInt(b.target);
                const current = Math.min(sessionOrders, target);
                const pct = (current / target) * 100;
                
                // Таймер
                const diff = b.endTime - now;
                const h = Math.floor(diff/3600000);
                const m = Math.floor((diff%3600000)/60000);

                html += `
                <div class="b-card active">
                    <span class="b-tag tag-act">+${b.reward} PLN</span>
                    <div style="font-weight:bold; font-size:15px; color:#222">${b.title}</div>
                    <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
                    <div style="display:flex; justify-content:space-between; margin-top:5px; font-size:11px; color:#555">
                        <span><i class="fa-solid fa-hourglass-half"></i> ${h}ч ${m}м</span>
                        <span>${current} / ${target}</span>
                    </div>
                </div>`;
            });
        }

        // БУДУЩИЕ
        html += `<div class="section-header">⏳ Скоро (Анонсы)</div>`;
        if (future.length === 0) {
            html += `<div style="text-align:center; padding:15px; color:#aaa; font-size:13px">Нет запланированных акций</div>`;
        } else {
            future.forEach(b => {
                const start = new Date(b.startTime);
                const dateStr = start.toLocaleDateString();
                const timeStr = start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                html += `
                <div class="b-card future">
                    <span class="b-tag tag-fut">СКОРО</span>
                    <div style="font-weight:bold; font-size:15px; color:#555">${b.title}</div>
                    <div style="font-size:12px; color:#666; margin-top:5px">
                        Цель: <b>${b.target} заказов</b> • Награда: <b>${b.reward} PLN</b>
                    </div>
                    <div style="font-size:11px; color:#888; margin-top:5px">
                        📅 Старт: ${dateStr} в ${timeStr}
                    </div>
                </div>`;
            });
        }

        html += `</div>`; // Close card
        
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';
        overlay.id = 'bonus-modal';
        overlay.innerHTML = html;
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
        document.body.appendChild(overlay);
    };

    // 4. ЦИКЛ ОБНОВЛЕНИЯ (ПРОЦЕНТЫ + РАКЕТА)
    setInterval(() => {
        // A. Обновляем проценты под иконками
        if(typeof state !== 'undefined') {
            const stats = {
                'vehicle': Math.floor(state.items.bike||0),
                'bag': Math.floor(state.items.bag||0),
                'energy': Math.floor(state.needs.energy||0),
                'water': Math.floor(state.needs.water||0),
                'mood': Math.floor(state.needs.mood||0),
                'gear': Math.floor(state.items.gear||0),
                'phone': Math.floor(state.items.phone||0)
            };

            // Пробегаем по иконкам и вставляем цифры
            for (let [key, val] of Object.entries(stats)) {
                // Ищем элемент equip-item, который содержит иконку с id="icon-key" или баром "bar-key"
                // В index.html id меток: 'label-vehicle', 'bar-vehicle' и т.д.
                // Самый надежный способ - найти бар и подняться к родителю
                const bar = document.getElementById(`bar-${key}`);
                if(bar) {
                    const parent = bar.parentElement.parentElement; // .equip-item
                    let numDisplay = parent.querySelector('.tiny-stat');
                    if(!numDisplay) {
                        numDisplay = document.createElement('div');
                        numDisplay.className = 'tiny-stat';
                        parent.appendChild(numDisplay);
                    }
                    numDisplay.textContent = val + '%';
                    
                    // Красный цвет если мало
                    numDisplay.style.color = val < 20 ? '#ff3d00' : '#fff';
                }
            }
        }

        // B. Ракета в меню
        const slider = document.getElementById('offline-slider-box');
        if(slider && !document.querySelector('.rocket-banner')) {
            const div = document.createElement('div');
            div.className = 'rocket-banner';
            div.innerHTML = `<div><div style="font-weight:bold;color:#333">🚀 Бонусы</div><div style="font-size:10px;color:#888">Есть новые задания</div></div><i class="fa-solid fa-chevron-right" style="color:#ccc"></i>`;
            div.onclick = window.renderBonusModal;
            slider.parentNode.insertBefore(div, slider);
        }

    }, 500);

    // Override opens
    window.openBonusModal = window.renderBonusModal; // Alias

})();
