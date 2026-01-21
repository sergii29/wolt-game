// ============================================================
// --- PATCH v20: GPS TRACKING + BIKE FIX + BONUS LISTS ---
// ============================================================

(function() {
    console.log(">>> Patch v20: Final Fixes Loaded");

    window.bonusData = [];

    // 1. СИНХРОНИЗАЦИЯ С БАЗОЙ
    if(window.db) {
        // Бонусы
        window.db.ref('bonuses/list').on('value', snap => {
            const data = snap.val() || {};
            window.bonusData = Object.entries(data).map(([key, val]) => ({id: key, ...val}));
            // Если окно открыто - обновляем сразу
            if(document.getElementById('bonus-modal')) window.renderBonusModal();
        });
        
        // Конфиг (Цены)
        window.db.ref('config').on('value', snap => {
            const cfg = snap.val();
            if(cfg) {
                if(!window.gameConfig) window.gameConfig = {};
                Object.assign(window.gameConfig, cfg);
                
                // Исправляем нули в энергии, если админ ошибся
                if(!window.gameConfig.energyDrain) window.gameConfig.energyDrain = 0.15;
                if(!window.gameConfig.waterDrain) window.gameConfig.waterDrain = 0.10;

                // Обновляем цены предметов в памяти игры
                if(cfg.itemPrices && window.ITEMS_DB) {
                    const p = cfg.itemPrices;
                    if(window.ITEMS_DB.water) window.ITEMS_DB.water.cost = p.water;
                    if(window.ITEMS_DB.bar) window.ITEMS_DB.bar.cost = p.bar;
                    if(window.ITEMS_DB.energy_drink) window.ITEMS_DB.energy_drink.cost = p.energy_drink;
                    // ... остальные цены обновляются автоматически при рендере магазина
                }
            }
        });
    }

    if(typeof window.startSessionOrders === 'undefined') window.startSessionOrders = (state.career.totalOrders || 0);

    // 2. СТИЛИ (CSS)
    const styles = `
        /* PERCENT FIX */
        .equip-item { position: relative; padding-bottom: 12px !important; }
        .tiny-stat { 
            position: absolute; bottom: 2px; left: 0; right: 0; 
            text-align: center; font-size: 9px; font-weight: 800; color: #fff; 
            text-shadow: 0 1px 2px black; letter-spacing: 0.5px;
        }

        /* MODAL STYLES */
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: flex-end; }
        .bonus-modal-card { background: #f4f6f8; width: 100%; height: 85vh; border-radius: 20px 20px 0 0; padding: 0; overflow: hidden; display: flex; flex-direction: column; animation: slideUp 0.3s; }
        
        .bm-head { background: white; padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .bm-title { margin:0; font-size: 20px; font-weight: 800; color: #222; }
        .bm-close { width: 32px; height: 32px; background: #f0f0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer; color: #333; }
        
        .bm-scroll { flex: 1; overflow-y: auto; padding: 20px; }
        
        .section-label { font-size: 13px; font-weight: 800; color: #999; text-transform: uppercase; margin-bottom: 10px; margin-top: 20px; letter-spacing: 1px; }
        .section-label:first-child { margin-top: 0; }

        .b-card { background: white; padding: 15px; border-radius: 12px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border-left: 5px solid #ccc; position: relative; }
        .b-card.active { border-left-color: #00c853; }
        .b-card.future { border-left-color: #ff9800; }
        
        .b-tag { position: absolute; top: 15px; right: 15px; background: #333; color: white; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; }
        .tag-act { background: #00c853; } .tag-fut { background: #ff9800; }

        .prog-bar { height: 6px; background: #eee; border-radius: 3px; margin: 10px 0; overflow: hidden; }
        .prog-fill { height: 100%; background: #00c853; width: 0%; transition: width 0.5s; }

        .rocket-banner { background: white; padding: 12px 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin: 10px 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); cursor: pointer; border: 1px solid #eee; }

        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    `;
    const styleSheet = document.createElement("style"); styleSheet.innerText = styles; document.head.appendChild(styleSheet);


    // 3. ОТРИСОВКА БОНУСОВ (ИСПРАВЛЕНА ЛОГИКА)
    window.renderBonusModal = function() {
        const old = document.getElementById('bonus-modal'); if(old) old.remove();
        
        const now = Date.now();
        // Разделяем на списки
        const active = window.bonusData.filter(b => now >= b.startTime && now <= b.endTime);
        const future = window.bonusData.filter(b => now < b.startTime);
        
        // Сортировка
        active.sort((a,b) => a.endTime - b.endTime);
        future.sort((a,b) => a.startTime - b.startTime);

        let htmlContent = '';

        // --- БЛОК АКТИВНЫХ ---
        htmlContent += `<div class="section-label">🔥 Активные сейчас</div>`;
        if (active.length === 0) {
            htmlContent += `<div style="text-align:center; padding:20px; color:#aaa; font-size:13px; background:rgba(0,0,0,0.02); border-radius:10px;">Нет активных заданий</div>`;
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

                htmlContent += `
                <div class="b-card active">
                    <span class="b-tag tag-act">+${b.reward} PLN</span>
                    <div style="font-weight:800; color:#222; font-size:15px; margin-bottom:5px">${b.title}</div>
                    <div style="font-size:11px; color:#666">Осталось: ${h}ч ${m}м</div>
                    
                    <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
                    <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:bold; color:#555">
                        <span>Прогресс</span>
                        <span>${current} / ${target}</span>
                    </div>
                </div>`;
            });
        }

        // --- БЛОК БУДУЩИХ ---
        htmlContent += `<div class="section-label">⏳ Скоро (Анонсы)</div>`;
        if (future.length === 0) {
            htmlContent += `<div style="text-align:center; padding:20px; color:#aaa; font-size:13px;">Нет запланированных акций</div>`;
        } else {
            future.forEach(b => {
                const start = new Date(b.startTime);
                const dateStr = start.toLocaleDateString();
                const timeStr = start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                // Таймер до начала
                const diff = b.startTime - now;
                const h = Math.floor(diff/3600000); 
                
                htmlContent += `
                <div class="b-card future">
                    <span class="b-tag tag-fut">СКОРО</span>
                    <div style="font-weight:800; color:#222; font-size:15px">${b.title}</div>
                    <div style="font-size:12px; color:#555; margin:5px 0">
                        Цель: <b>${b.target} зак.</b> • Награда: <b>${b.reward} PLN</b>
                    </div>
                    <div style="font-size:11px; color:#888; border-top:1px solid #eee; padding-top:5px; margin-top:5px; display:flex; justify-content:space-between">
                        <span>📅 Старт: ${dateStr} ${timeStr}</span>
                        <span style="color:#ff9800; font-weight:bold">Через ${h}ч</span>
                    </div>
                </div>`;
            });
        }

        // СБОРКА МОДАЛКИ
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';
        overlay.id = 'bonus-modal';
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
        
        overlay.innerHTML = `
            <div class="bonus-modal-card">
                <div class="bm-head">
                    <h2 class="bm-title">Зарабатывай</h2>
                    <div class="bm-close" onclick="document.getElementById('bonus-modal').remove()">✕</div>
                </div>
                <div class="bm-scroll">
                    ${htmlContent}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    };


    // 4. GPS TRACKER (АГРЕССИВНЫЙ РЕЖИМ)
    function startGPS() {
        if (!navigator.geolocation) return;
        
        // Используем watchPosition для постоянного слежения
        navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if(window.map) {
                    // Плавное перемещение
                    window.map.flyTo([latitude, longitude], 16, { animate: true, duration: 1 });
                    
                    // Обновляем маркер игрока (ищем его или создаем свой)
                    let found = false;
                    window.map.eachLayer(l => {
                        if(l instanceof L.Marker) {
                            l.setLatLng([latitude, longitude]);
                            found = true;
                        }
                    });
                    
                    // Если маркера нет (вдруг удалился), создаем свой синий
                    if(!found) {
                        L.marker([latitude, longitude]).addTo(window.map);
                    }
                }
            },
            (err) => console.warn("GPS Error:", err),
            { enableHighAccuracy: true, maximumAge: 0 }
        );
    }
    // Запускаем GPS сразу
    startGPS();


    // 5. ЦИКЛ ОБНОВЛЕНИЯ UI (ПРОЦЕНТЫ + РАКЕТА В МЕНЮ)
    setInterval(() => {
        // A. ПРОЦЕНТЫ (ИСПРАВЛЕНО ИМЯ BIKE)
        if(typeof state !== 'undefined' && state.items) {
            const stats = {
                'bike': Math.floor(state.items.bike||0), // ВОТ ТУТ БЫЛА ОШИБКА (было 'vehicle')
                'bag': Math.floor(state.items.bag||0),
                'phone': Math.floor(state.items.phone||0),
                'gear': Math.floor(state.items.gear||0),
                'energy': Math.floor(state.needs.energy||0),
                'water': Math.floor(state.needs.water||0),
                'mood': Math.floor(state.needs.mood||0)
            };

            for (let [key, val] of Object.entries(stats)) {
                // Находим бар по ID
                const bar = document.getElementById(`bar-${key}`);
                if(bar) {
                    const parent = bar.parentElement.parentElement; // .equip-item
                    // Ищем или создаем цифру
                    let num = parent.querySelector('.tiny-stat');
                    if(!num) {
                        num = document.createElement('div');
                        num.className = 'tiny-stat';
                        parent.appendChild(num);
                    }
                    num.textContent = val + '%';
                    
                    // Красим в красный если < 20%
                    num.style.color = val < 20 ? '#ff3d00' : 'white';
                }
            }
        }

        // B. РАКЕТА В ГЛАВНОМ МЕНЮ
        const slider = document.getElementById('offline-slider-box');
        if(slider && !document.querySelector('.rocket-banner')) {
            const div = document.createElement('div');
            div.className = 'rocket-banner';
            // Считаем сколько сейчас активных
            const now = Date.now();
            const activeCount = window.bonusData.filter(b => now >= b.startTime && now <= b.endTime).length;
            const text = activeCount > 0 ? `Активно акций: ${activeCount}` : 'Проверь расписание';
            
            div.innerHTML = `
                <div>
                    <div style="font-weight:800; color:#222; font-size:14px">🚀 Бонусы</div>
                    <div style="font-size:11px; color:#666">${text}</div>
                </div>
                <i class="fa-solid fa-chevron-right" style="color:#aaa"></i>
            `;
            div.onclick = window.renderBonusModal;
            slider.parentNode.insertBefore(div, slider);
        }
        
        // C. ОБНОВЛЕНИЕ ТАЙМЕРОВ В ОТКРЫТОМ ОКНЕ
        if(document.getElementById('bonus-modal')) {
            // Перерисовываем каждые 5 сек, чтобы таймеры тикали, но не спамили DOM
            // (или можно сделать умнее, но простой ререндер надежнее)
            // Пока оставим ручное обновление при клике или событиях Firebase
        }

    }, 1000);

    // Override modals logic to keep styles consistent
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
