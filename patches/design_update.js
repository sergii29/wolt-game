// ============================================================
// --- PATCH v11: CUSTOMIZABLE BONUSES (SIMULATION SPEED) ---
// ============================================================

(function() {
    console.log(">>> Patch v11: High Speed Bonuses Loaded");

    // 1. КОНФИГУРАЦИЯ БОНУСОВ (То, что ты будешь менять из админки)
    // target: сколько заказов
    // reward: сколько денег
    // timeLimit: сколько минут дается (для активных)
    window.bonusConfig = {
        active: [
            { 
                id: 1, 
                title: "🔥 SPEEDRUN: 50 заказов", 
                reward: 500, 
                target: 50, 
                desc: "Успей за 20 минут!", 
                endTime: Date.now() + (20 * 60 * 1000) // 20 минут от сейчас
            }, 
            { 
                id: 2, 
                title: "💀 GRIND GOD: 550 заказов", 
                reward: 7000, 
                target: 550, 
                desc: "Цель для маньяков (до 22:00)", 
                endTime: new Date().setHours(22,0,0,0) // До 22:00 сегодня
            }
        ],
        later: [
            { date: "Сегодня", time: "12:00-16:00", text: "Обеденный Раш: +150 PLN", target: "Сделай 100 заказов" },
            { date: "Сегодня", time: "18:00-22:00", text: "Вечерний Жор: +300 PLN", target: "Сделай 200 заказов" },
            { date: "Завтра", time: "Весь день", text: "Выходной Марафон", target: "1000 заказов за 24ч" }
        ]
    };

    // Запоминаем старт сессии для подсчета прогресса
    if(typeof window.startSessionOrders === 'undefined') {
        window.startSessionOrders = (state.career.totalOrders || 0);
    }


    // 2. СТИЛИ (Wolt Design + Bonus UI)
    const styles = `
        /* DARK MAP & WHITE UI */
        #map { background: #1a1a1a !important; filter: contrast(1.1) brightness(0.9); }
        .bottom-sheet { background: #ffffff !important; color: #202125 !important; border-top-left-radius: 20px !important; border-top-right-radius: 20px !important; box-shadow: 0 -5px 30px rgba(0,0,0,0.2) !important; }
        
        /* HEADER ROCKET */
        .rocket-banner {
            background: #f7f7f7; border-radius: 12px; padding: 12px 15px;
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 20px; cursor: pointer; transition: background 0.2s;
        }
        .rocket-banner:active { background: #eee; }
        .rocket-text { font-size: 14px; font-weight: 700; color: #202125; }
        .rocket-sub { font-size: 11px; color: #666; margin-top: 2px; }

        /* ОКНО БОНУСОВ (МОДАЛКА) */
        .bonus-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 20000;
            display: flex; align-items: flex-end; /* Выезд снизу */
        }
        .bonus-modal-card {
            background: #f2f2f2; width: 100%; height: 92vh;
            border-top-left-radius: 20px; border-top-right-radius: 20px;
            overflow-y: auto; padding: 20px; position: relative;
            animation: slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        
        .wolt-header { font-size: 26px; font-weight: 800; color: #202125; margin: 15px 0 25px 0; letter-spacing: -0.5px; }
        .section-label { font-size: 14px; font-weight: 700; color: #202125; margin-bottom: 10px; }

        /* КАРТОЧКА АКТИВНОГО БОНУСА */
        .active-card {
            background: white; border-radius: 16px; padding: 20px; margin-bottom: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #fff;
        }
        .ac-title { font-weight: 800; font-size: 16px; color: #202125; margin-bottom: 5px; }
        
        /* ЗЕЛЕНАЯ ПОЛОСКА */
        .progress-track { height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden; margin: 15px 0; }
        .progress-fill {
            height: 100%; background: #00c37b; /* WOLT GREEN */
            border-radius: 5px; width: 0%; transition: width 0.5s ease-out;
            background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px);
        }

        .ac-meta { display: flex; justify-content: space-between; font-size: 12px; color: #777; font-weight: 500; }
        .time-badge { display: flex; align-items: center; gap: 6px; }

        /* СПИСОК "ПОЗЖЕ" */
        .later-list { background: white; border-radius: 16px; padding: 0 20px; }
        .later-item {
            display: flex; padding: 20px 0; border-bottom: 1px solid #f5f5f5;
        }
        .later-item:last-child { border-bottom: none; }
        
        .li-date { width: 60px; font-size: 13px; color: #999; line-height: 1.4; }
        .li-content { flex: 1; }
        .li-title { font-weight: 700; font-size: 15px; color: #202125; margin-bottom: 4px; }
        .li-sub { font-size: 13px; color: #666; }

        .close-circle {
            position: absolute; top: 15px; right: 15px; width: 36px; height: 36px;
            background: #e0e0e0; border-radius: 50%; color: #333;
            display: flex; align-items: center; justify-content: center; 
            cursor: pointer; font-size: 16px; transition: background 0.2s;
        }
        .close-circle:active { background: #d0d0d0; }

        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    `;
    const styleSheet = document.createElement("style"); styleSheet.innerText = styles; document.head.appendChild(styleSheet);


    // 3. ФУНКЦИЯ ОТРИСОВКИ ОКНА БОНУСОВ
    window.renderBonusModal = function() {
        // Считаем прогресс (сколько заказов сделано за эту сессию)
        const sessionProgress = (state.career.totalOrders || 0) - window.startSessionOrders;

        // Генерация АКТИВНЫХ
        let activeHtml = '';
        window.bonusConfig.active.forEach(b => {
            // Лимит 100%
            let safeProgress = Math.min(sessionProgress, b.target);
            let percent = (safeProgress / b.target) * 100;
            
            // Время окончания
            let timeLeft = "Истекло";
            let diff = b.endTime - Date.now();
            if(diff > 0) {
                let h = Math.floor(diff/3600000);
                let m = Math.floor((diff%3600000)/60000);
                timeLeft = `Осталось: ${h}ч ${m}мин`;
                if(h===0) timeLeft = `Осталось: ${m} мин`;
            }

            activeHtml += `
            <div class="active-card">
                <div class="ac-title">${b.title} за ${b.reward.toFixed(2)} zł!</div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
                <div class="ac-meta">
                    <div class="time-badge"><i class="fa-regular fa-clock"></i> ${timeLeft}</div>
                    <div><strong style="color:#202125">${safeProgress}</strong> / ${b.target}</div>
                </div>
            </div>`;
        });

        // Генерация БУДУЩИХ
        let laterHtml = '';
        window.bonusConfig.later.forEach(l => {
            laterHtml += `
            <div class="later-item">
                <div class="li-date">${l.date}<br><span style="font-size:11px">${l.time}</span></div>
                <div class="li-content">
                    <div class="li-title">${l.text}</div>
                    <div class="li-sub">${l.target}</div>
                </div>
            </div>`;
        });

        // Отрисовка
        const overlay = document.createElement('div');
        overlay.className = 'bonus-modal-overlay';
        overlay.id = 'bonus-modal';
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="bonus-modal-card">
                <div class="close-circle" onclick="document.getElementById('bonus-modal').remove()">✕</div>
                
                <h1 class="wolt-header">Зарабатывай дополнительно</h1>
                
                <div class="section-label">Активные</div>
                ${activeHtml}

                <div class="section-label" style="margin-top:25px">Позже</div>
                <div class="later-list">
                    ${laterHtml}
                </div>
                
                <div style="text-align:center; margin-top:30px; color:#999; font-size:11px">
                    Бонусы обновляются автоматически.<br>ID: ${state.id}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    };


    // 4. GPS FIX (Чтобы карта не тупила)
    function forceGPS() {
        if (!navigator.geolocation || !window.map) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                window.map.setView([latitude, longitude], 16);
                window.map.eachLayer(l => { if(l instanceof L.Marker) l.setLatLng([latitude, longitude]); });
            },
            null, { enableHighAccuracy: true }
        );
    }
    setTimeout(forceGPS, 2000);


    // 5. ИНТЕГРАЦИЯ В ИНТЕРФЕЙС (Ракета + Обновление КМ)
    setInterval(() => {
        // Название города
        const cityLbl = document.getElementById('city-label');
        if(cityLbl && cityLbl.innerText !== 'Warsaw') cityLbl.innerHTML = 'Warsaw';

        // Кнопка Ракеты
        const offlineView = document.getElementById('offline-view');
        if(offlineView && !document.querySelector('.rocket-banner')) {
            const oldInfo = offlineView.querySelector('p'); if(oldInfo) oldInfo.style.display = 'none';

            const rocketHTML = `
                <div style="display:flex; gap:10px; font-size:14px; color:#555; margin-bottom:15px; font-weight:500;">
                    <i class="fa-solid fa-chart-simple" style="color:#00c37b"></i> 
                    <span>Dostępność zamówień: <strong>Wysoka</strong></span>
                </div>
                <div class="rocket-banner" onclick="window.renderBonusModal()">
                    <div>
                        <div class="rocket-text">🚀 Зарабатывай дополнительно</div>
                        <div class="rocket-sub">Доступно 2 новых бонуса</div>
                    </div>
                    <i class="fa-solid fa-chevron-right" style="color:#ccc; font-size:12px"></i>
                </div>
            `;
            const slider = document.getElementById('offline-slider-box');
            if(slider) {
                const div = document.createElement('div'); div.innerHTML = rocketHTML;
                slider.parentNode.insertBefore(div, slider);
                
                // Синий слайдер
                slider.style.background = "#009de0";
                const txt = slider.querySelector('.slider-text'); if(txt) { txt.innerText = "Przejdź do trybu online"; txt.style.color="white"; }
                const knob = slider.querySelector('.slider-knob'); if(knob) { knob.style.background="white"; knob.style.color="#009de0"; }
            }
        }

        // Динамический КМ (GPS стиль)
        const orderDestEl = document.getElementById('order-dest');
        if (typeof currentOrder !== 'undefined' && currentOrder && orderDestEl) {
            const totalDist = parseFloat(currentOrder.distance);
            const progress = currentOrder.progress || 0;
            let remaining = totalDist * (1 - (progress / 100));
            if (remaining < 0) remaining = 0;
            let prefix = currentOrder.stage === 2 ? "К клиенту" : "Забрать";
            orderDestEl.innerHTML = `<strong>${prefix}:</strong> ${remaining.toFixed(1)} km <span style="font-size:10px; color:#aaa">(GPS)</span>`;
            
            // Синяя полоска прогресса
            const trackFill = document.getElementById('track-fill');
            if(trackFill) trackFill.style.background = '#009de0';
        }

    }, 200);

    // 6. СОХРАНЕНИЕ ОСТАЛЬНЫХ ОКОН (BANK/GOV/TAXI) - ТЕМНЫЙ СТИЛЬ
    window.renderCustomModal = function(type) {
        const old = document.getElementById('active-custom-modal'); if(old) old.remove();
        const overlay = document.createElement('div');
        overlay.id = 'active-custom-modal';
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);backdrop-filter:blur(5px);z-index:10000;display:flex;align-items:center;justify-content:center;";
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

        let content = '';
        if(type==='bank') {
            const limit = 1000 + (state.career.totalOrders * 50);
            content = `<h2 style="color:#f1c40f; text-align:center"><i class="fa-solid fa-building-columns"></i> Банк</h2><div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:12px; color:white; margin-bottom:20px">Баланс: ${state.balance.toFixed(2)} PLN<br>Долг: ${state.debt.toFixed(2)} PLN<br><small style="color:#7bed9f">Лимит: ${limit}</small></div><button onclick="if(window.takeLoan)takeLoan(); else{state.balance+=500;state.debt+=550;} document.getElementById('active-custom-modal').remove();" style="width:100%; padding:15px; background:blue; color:white; border:none; border-radius:10px; margin-bottom:10px; font-weight:bold">Взять кредит (+500)</button><button onclick="if(window.repayLoan)repayLoan(); else{state.balance-=500;state.debt-=500;} document.getElementById('active-custom-modal').remove();" style="width:100%; padding:15px; background:green; color:white; border:none; border-radius:10px; font-weight:bold">Погасить долг (-500)</button>`;
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
