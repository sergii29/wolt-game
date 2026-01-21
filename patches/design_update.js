// ============================================================
// --- PATCH v10: BONUSES (WOLT STYLE) + GPS FIX ---
// ============================================================

(function() {
    console.log(">>> Patch v10 Loaded: Bonus System & GPS Fix");

    // --- 1. НАСТРОЙКИ БОНУСОВ (База для будущей Админки) ---
    // Это мы будем менять через админку позже
    window.bonusConfig = {
        active: [
            { id: 1, title: "Спринт: 7 заказов", reward: 150, target: 7, desc: "Успей за 10 минут!", end: Date.now() + 600000 }, 
            { id: 2, title: "Турбо: 15 заказов", reward: 300, target: 15, desc: "Премия за активность", end: Date.now() + 3600000 }
        ],
        later: [
            { date: "Сегодня", time: "18:00-22:00", text: "Вечерняя смена: +50 PLN к заказам", target: "15 заказов" },
            { date: "Завтра", time: "12:00-14:00", text: "Обеденный пик: +30 PLN к заказам", target: "10 заказов" },
            { date: "25.01", time: "Весь день", text: "Мега-Бонус выходного дня", target: "40 заказов" }
        ]
    };

    // Сохраняем начальное количество заказов, чтобы считать прогресс от текущего момента
    if(typeof window.startSessionOrders === 'undefined') {
        window.startSessionOrders = (state.career.totalOrders || 0);
    }

    // --- 2. СТИЛИ (CSS) ---
    const styles = `
        /* КАРТА - ТЕМНАЯ */
        #map { background: #1a1a1a !important; filter: contrast(1.1) brightness(0.9); }
        
        /* НИЖНЯЯ ПАНЕЛЬ - БЕЛАЯ (WOLT) */
        .bottom-sheet {
            background: #ffffff !important; color: #202125 !important;
            border-top-left-radius: 20px !important; border-top-right-radius: 20px !important;
            box-shadow: 0 -5px 30px rgba(0,0,0,0.2) !important;
        }
        .bottom-sheet::before {
            content: ''; display: block; width: 40px; height: 4px;
            background: #e0e0e0; border-radius: 2px; margin: -5px auto 15px auto;
        }

        /* РАКЕТА (КНОПКА) */
        .rocket-banner {
            background: #f7f7f7; border-radius: 12px; padding: 12px 15px;
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 20px; cursor: pointer; transition: background 0.2s;
        }
        .rocket-banner:active { background: #eee; }
        .rocket-text { font-size: 14px; font-weight: 700; color: #202125; }
        .rocket-sub { font-size: 11px; color: #666; margin-top: 2px; }

        /* ОКНО БОНУСОВ (КАК НА СКРИНЕ) */
        .bonus-modal-bg { background: #f2f2f2 !important; } /* Серый фон всего окна */
        
        .bonus-card {
            background: white; border-radius: 12px; padding: 15px; margin-bottom: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 1px solid #eee;
        }
        .bonus-title { font-weight: 700; font-size: 15px; color: #202125; margin-bottom: 5px; }
        
        /* Прогресс бар (ЗЕЛЕНЫЙ) */
        .wolt-progress-bg {
            height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; margin: 10px 0;
        }
        .wolt-progress-fill {
            height: 100%; background: #5ddb69; /* Ярко зеленый как на скрине */
            border-radius: 4px; width: 0%; transition: width 0.5s;
        }
        
        .bonus-time { font-size: 11px; color: #777; display:flex; align-items:center; gap:5px; }
        
        .later-row {
            display: flex; margin-bottom: 15px; border-bottom: 1px solid #f5f5f5; padding-bottom: 10px;
        }
        .later-date { font-size: 12px; color: #999; width: 50px; }
        .later-info { flex: 1; }
        .later-title { font-weight: 700; font-size: 14px; color: #202125; }
        .later-sub { font-size: 12px; color: #666; margin-top: 2px; }

        /* ОБЩИЕ ЭЛЕМЕНТЫ */
        .wolt-header { font-size: 24px; font-weight: 800; color: #202125; margin-bottom: 20px; }
        .section-title { font-weight: 700; font-size: 13px; color: #202125; margin: 20px 0 10px 0; }
        
        .close-circle {
            position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
            background: #e0e0e0; border-radius: 50%; color: #000;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);


    // --- 3. FIX GPS (ПРИНУДИТЕЛЬНЫЙ) ---
    function forceGPS() {
        if (!navigator.geolocation) return;
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                // 1. Центруем карту
                if(window.map) window.map.setView([latitude, longitude], 16);
                
                // 2. Двигаем велосипед
                if(window.map) {
                    window.map.eachLayer(l => { 
                        if(l instanceof L.Marker) l.setLatLng([latitude, longitude]); 
                    });
                }
                
                // 3. Создаем "Синюю точку" (GPS Dot) если нет
                if(!document.getElementById('gps-dot')) {
                   const dotIcon = L.divIcon({
                       className: 'gps-dot-icon',
                       html: '<div id="gps-dot" style="width:12px; height:12px; background:#4285F4; border:2px solid white; border-radius:50%; box-shadow:0 0 0 10px rgba(66,133,244,0.1);"></div>',
                       iconSize: [12, 12]
                   });
                   L.marker([latitude, longitude], {icon: dotIcon}).addTo(window.map);
                }
                
                showToast("📍 GPS локация обновлена", "success");
            },
            (err) => {
                console.log("GPS Error:", err);
                showToast("⚠️ GPS недоступен. Проверьте настройки.", "warn");
            },
            { enableHighAccuracy: true }
        );
    }
    // Пробуем запустить GPS сразу и еще раз через 3 сек (чтобы карта точно прогрузилась)
    setTimeout(forceGPS, 1000);
    setTimeout(forceGPS, 3000);


    // --- 4. ИНТЕРФЕЙС WOLT + РАКЕТА ---
    setInterval(() => {
        // Заголовок города
        const cityLbl = document.getElementById('city-label');
        if(cityLbl && cityLbl.innerText !== 'Warsaw') cityLbl.innerHTML = 'Warsaw';

        // Вставка ракеты
        const offlineView = document.getElementById('offline-view');
        if(offlineView && !document.querySelector('.rocket-banner')) {
            const oldInfo = offlineView.querySelector('p');
            if(oldInfo) oldInfo.style.display = 'none';

            const statusHTML = `
                <div class="wolt-status-row">
                    <i class="fa-solid fa-chart-simple status-icon"></i>
                    <span>Dostępność zamówień: <strong>Niska</strong></span>
                </div>
                
                <div class="rocket-banner" onclick="window.renderBonusModal()">
                    <div>
                        <div class="rocket-text">🚀 Зарабатывай дополнительно</div>
                        <div class="rocket-sub">Нажми, чтобы увидеть бонусы</div>
                    </div>
                    <i class="fa-solid fa-chevron-right" style="color:#ccc; font-size:12px"></i>
                </div>
            `;
            
            const slider = document.getElementById('offline-slider-box');
            if(slider) {
                const container = document.createElement('div');
                container.innerHTML = statusHTML;
                slider.parentNode.insertBefore(container, slider);
                
                // Синий слайдер
                slider.style.background = "#009de0";
                const sliderTxt = slider.querySelector('.slider-text');
                if(sliderTxt) {
                    sliderTxt.innerText = "Przejdź do trybu online";
                    sliderTxt.style.color = "white";
                }
                const knob = slider.querySelector('.slider-knob');
                if(knob) {
                    knob.style.background = "white";
                    knob.style.color = "#009de0";
                }
            }
        }
        
        // Обновление дистанции (GPS КМ)
        const orderDestEl = document.getElementById('order-dest');
        if (typeof currentOrder !== 'undefined' && currentOrder && orderDestEl) {
            const totalDist = parseFloat(currentOrder.distance);
            const progress = currentOrder.progress || 0;
            let remaining = totalDist * (1 - (progress / 100));
            if (remaining < 0) remaining = 0;
            let prefix = currentOrder.stage === 2 ? "К клиенту" : "Забрать";
            orderDestEl.innerHTML = `<strong>${prefix}:</strong> ${remaining.toFixed(1)} km <span style="font-size:10px; color:#aaa">(GPS)</span>`;
            
            // Красим полоску в синий
            const trackFill = document.getElementById('track-fill');
            if(trackFill) trackFill.style.background = '#009de0';
        }

    }, 200);


    // --- 5. ОКНО БОНУСОВ (КОПИЯ СКРИНШОТА) ---
    window.renderBonusModal = function() {
        // Расчет прогресса
        // Текущий прогресс сессии = Всего заказов сейчас - Всего заказов при старте
        const currentSessionOrders = (state.career.totalOrders || 0) - window.startSessionOrders;

        // Генерация HTML для Активных
        let activeHtml = '';
        window.bonusConfig.active.forEach(b => {
            // Ограничиваем прогресс, чтобы не вылез за 100%
            let displayProgress = Math.min(currentSessionOrders, b.target);
            let percent = (displayProgress / b.target) * 100;
            
            // Если выполнено - цвет текста зеленый
            let titleColor = (displayProgress >= b.target) ? '#00c37b' : '#202125';

            activeHtml += `
            <div class="bonus-card">
                <div class="bonus-title" style="color:${titleColor}">${b.title} за ${b.reward},00 zł!</div>
                <div class="wolt-progress-bg">
                    <div class="wolt-progress-fill" style="width: ${percent}%"></div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#555;">
                    <div class="bonus-time"><i class="fa-regular fa-clock"></i> До 23:59</div>
                    <div>${displayProgress} / ${b.target}</div>
                </div>
            </div>`;
        });

        // Генерация HTML для "Позже"
        let laterHtml = '';
        window.bonusConfig.later.forEach(l => {
            laterHtml += `
            <div class="later-row">
                <div class="later-date">${l.date}<br><span style="font-size:10px">${l.time}</span></div>
                <div class="later-info">
                    <div class="later-title">${l.text}</div>
                    <div class="later-sub">${l.target}</div>
                </div>
            </div>`;
        });

        const overlay = document.createElement('div');
        overlay.id = 'bonus-modal-overlay';
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:20000; display:flex; align-items:flex-end;"; // Выезжает снизу
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div style="background:#f2f2f2; width:100%; height:90vh; border-top-left-radius:20px; border-top-right-radius:20px; overflow-y:auto; padding:20px; position:relative; animation: slideUp 0.3s;">
                <div class="close-circle" onclick="document.getElementById('bonus-modal-overlay').remove()">✕</div>
                
                <h1 class="wolt-header">Зарабатывай дополнительно</h1>
                
                <div class="section-title">Активные</div>
                ${activeHtml}

                <div class="section-title">Позже</div>
                <div style="background:white; border-radius:12px; padding:15px; border:1px solid #eee;">
                    ${laterHtml}
                </div>

                <style>
                    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                </style>
            </div>
        `;
        document.body.appendChild(overlay);
    };

    // --- 6. СОХРАНЕНИЕ ОСТАЛЬНЫХ ОКОН (BANK/GOV/TAXI) В ТЕМНОМ СТИЛЕ ---
    // (Код окон сохранен для совместимости)
    window.renderCustomModal = function(type) {
        const old = document.getElementById('active-custom-modal'); if(old) old.remove();
        const overlay = document.createElement('div');
        overlay.id = 'active-custom-modal';
        overlay.className = 'custom-modal-overlay'; // Стили уже добавлены выше (в предыдущих патчах, но продублируем)
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); backdrop-filter:blur(5px); z-index:10000; display:flex; align-items:center; justify-content:center;";
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

        let content = '';
        if(type==='bank') {
            const limit = 1000 + (state.career.totalOrders * 50);
            content = `<h2 style="color:#f1c40f; text-align:center"><i class="fa-solid fa-building-columns"></i> Банк</h2>
            <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:12px; color:white; margin-bottom:20px">
                Баланс: ${state.balance.toFixed(2)} PLN<br>Долг: ${state.debt.toFixed(2)} PLN<br><small style="color:#7bed9f">Лимит: ${limit}</small>
            </div>
            <button onclick="if(window.takeLoan)takeLoan(); else{state.balance+=500;state.debt+=550;} document.getElementById('active-custom-modal').remove();" style="width:100%; padding:15px; background:blue; color:white; border:none; border-radius:10px; margin-bottom:10px; font-weight:bold">Взять кредит (+500)</button>
            <button onclick="if(window.repayLoan)repayLoan(); else{state.balance-=500;state.debt-=500;} document.getElementById('active-custom-modal').remove();" style="width:100%; padding:15px; background:green; color:white; border:none; border-radius:10px; font-weight:bold">Погасить долг (-500)</button>`;
        } 
        else if(type==='gov') {
             content = `<h2 style="color:#aaa; text-align:center">Министерство</h2><div style="text-align:center; font-size:40px; color:orange; margin:20px 0">10%</div><div style="text-align:center; color:#777; margin-bottom:20px">ИНФЛЯЦИЯ</div><button onclick="if(window.buyDeflation)buyDeflation(1,2700); document.getElementById('active-custom-modal').remove();" style="width:100%; padding:15px; background:#333; color:white; border:none; border-radius:10px;">Взятка (-2700)</button>`;
        }
        else if(type==='taxi') {
             content = `<h2 style="color:cyan; text-align:center">Таксопарк</h2><div style="text-align:center; padding:20px; color:#ccc">Машины доступны в полной версии</div>`;
        }

        overlay.innerHTML = `<div style="background:linear-gradient(145deg, #1e1e24, #25252b); width:90%; padding:25px; border-radius:20px; border:1px solid rgba(255,255,255,0.1); color:white; font-family:sans-serif;">${content}</div>`;
        document.body.appendChild(overlay);
    };

    window.openModal = function(type) {
        if(type==='bank') window.renderCustomModal('bank');
        else if(type==='deflation') window.renderCustomModal('gov');
        else if(type==='taxi-shop') window.renderCustomModal('taxi');
        else { toggleMenu(); const m=document.getElementById('full-modal'); const b=document.getElementById('modal-body'); m.classList.add('open'); if(type==='shop'){document.getElementById('modal-title').textContent='Магазин';renderShop(b);}else{renderHistory(b);} }
    };

})();
