// ============================================================
// --- PATCH v8: DYNAMIC DISTANCE + REAL WOLT UI ---
// ============================================================

(function() {
    console.log(">>> Patch v8 Loaded: Dynamic Distance Active");

    // 1. СТИЛИ (CSS) - Wolt Partner Design
    const woltCourierStyles = `
        /* --- КАРТА (ТЕМНАЯ) --- */
        #map { 
            background: #1a1a1a !important; 
            filter: contrast(1.1) brightness(0.9);
        }

        /* --- НИЖНЯЯ ПАНЕЛЬ (БЕЛАЯ КАРТОЧКА) --- */
        .bottom-sheet {
            background: #ffffff !important;
            border-top-left-radius: 20px !important;
            border-top-right-radius: 20px !important;
            box-shadow: 0 -5px 30px rgba(0,0,0,0.2) !important;
            padding: 15px 20px !important;
            padding-bottom: 30px !important;
            color: #202125 !important;
        }
        .bottom-sheet::before {
            content: ''; display: block; width: 40px; height: 4px;
            background: #e0e0e0; border-radius: 2px; margin: -5px auto 15px auto;
        }

        #city-label {
            font-size: 24px !important; font-weight: 800 !important;
            color: #202125 !important; margin-bottom: 5px !important;
            letter-spacing: -0.5px !important;
        }

        /* Статус (Доступность) */
        .wolt-status-row {
            display: flex; align-items: center; gap: 8px;
            font-size: 14px; color: #555; margin-bottom: 15px; font-weight: 500;
        }
        .status-icon { color: #00c37b; }

        /* Баннер с ракетой */
        .rocket-banner {
            background: #f7f7f7; border-radius: 12px; padding: 12px 15px;
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 20px; cursor: pointer;
        }
        .rocket-text { font-size: 13px; font-weight: 600; color: #333; }
        .rocket-sub { font-size: 11px; color: #777; margin-top: 2px; }

        /* СЛАЙДЕР И КНОПКИ */
        .slider-container {
            background: #009de0 !important; border-radius: 30px !important;
            height: 56px !important; border: none !important;
        }
        .slider-text {
            color: white !important; font-weight: 700 !important;
            font-size: 15px !important; text-transform: none !important;
        }
        .slider-knob {
            background: white !important; color: #009de0 !important;
            border-radius: 50% !important; top: 4px !important; bottom: 4px !important; left: 4px !important;
            width: 48px !important; height: 48px !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
        }
        
        /* Скрываем демо-алерт */
        #demo-mode-alert { display: none !important; }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = woltCourierStyles;
    document.head.appendChild(styleSheet);


    // 2. ИЗМЕНЕНИЕ КАРТЫ НА ТЕМНУЮ
    setTimeout(() => {
        if(window.map) {
            window.map.eachLayer((layer) => {
                if(layer instanceof L.TileLayer) window.map.removeLayer(layer);
            });
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO', maxZoom: 19
            }).addTo(window.map);

            window.map.eachLayer((layer) => {
                if(layer instanceof L.Marker) {
                    const iconHtml = `<div style="background:rgba(255,255,255,0.2); border:2px solid rgba(255,255,255,0.9); border-radius:50%; width:40px; height:40px; display:flex; justify-content:center; align-items:center; color:white; font-size:18px; backdrop-filter:blur(2px); box-shadow:0 0 15px rgba(0,0,0,0.5);"><i class="fa-solid fa-bicycle"></i></div>`;
                    const woltIcon = L.divIcon({ className: 'custom-div-icon', html: iconHtml, iconSize: [40, 40], iconAnchor: [20, 20] });
                    layer.setIcon(woltIcon);
                }
            });
        }
    }, 1000);

    // 3. GPS
    setTimeout(() => {
        if (navigator.geolocation && window.map) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                window.map.setView([latitude, longitude], 16);
                window.map.eachLayer(l => { if(l instanceof L.Marker) l.setLatLng([latitude, longitude]); });
            });
        }
    }, 2000);

    // 4. ГЛАВНАЯ ЛОГИКА: ЖИВОЙ КИЛОМЕТРАЖ + ИНТЕРФЕЙС
    setInterval(() => {
        // А) Динамический километраж
        // Мы ищем элемент с расстоянием и обновляем его математически
        const orderDestEl = document.getElementById('order-dest');
        
        // Проверяем, есть ли активный заказ в памяти (глобальная переменная currentOrder)
        if (typeof currentOrder !== 'undefined' && currentOrder && orderDestEl) {
            const totalDist = parseFloat(currentOrder.distance); // Например 3.3
            const progress = currentOrder.progress || 0; // Например 50 (%)
            
            // Формула: (Всего) * (1 - Прогресс/100)
            let remaining = totalDist * (1 - (progress / 100));
            if (remaining < 0) remaining = 0;
            
            // Определяем текст (Забрать или Доставить)
            // stage 0/1 = Едем в ресторан. stage 2 = Едем к клиенту.
            let prefix = "Забрать";
            if (currentOrder.stage === 2) prefix = "К клиенту";
            
            // ОБНОВЛЯЕМ ТЕКСТ НА ЭКРАНЕ
            orderDestEl.innerHTML = `<strong>${prefix}:</strong> ${remaining.toFixed(1)} km <span style="font-size:10px; color:#aaa">(GPS)</span>`;
            
            // Заодно обновляем полоску прогресса на карте (визуально)
            const trackFill = document.getElementById('track-fill');
            if(trackFill) trackFill.style.background = '#009de0'; // Синий цвет Wolt
        }

        // Б) Wolt Интерфейс (тексты)
        const cityLbl = document.getElementById('city-label');
        if(cityLbl && cityLbl.innerText !== 'Warsaw') cityLbl.innerHTML = 'Warsaw';

        const offlineView = document.getElementById('offline-view');
        if(offlineView && !document.querySelector('.rocket-banner')) {
            const oldInfo = offlineView.querySelector('p');
            if(oldInfo) oldInfo.style.display = 'none';

            const statusHTML = `
                <div class="wolt-status-row">
                    <i class="fa-solid fa-chart-simple status-icon"></i>
                    <span>Dostępność zamówień: <strong>Niska</strong></span>
                </div>
                <div class="rocket-banner">
                    <div>
                        <div class="rocket-text">🚀 Zobacz bonusy</div>
                        <div class="rocket-sub">Możliwości dodatkowego zarobku</div>
                    </div>
                    <i class="fa-solid fa-chevron-right" style="color:#ccc; font-size:12px"></i>
                </div>
            `;
            const slider = document.getElementById('offline-slider-box');
            if(slider) {
                const container = document.createElement('div');
                container.innerHTML = statusHTML;
                slider.parentNode.insertBefore(container, slider);
                const sliderTxt = slider.querySelector('.slider-text');
                if(sliderTxt) sliderTxt.innerText = "Przejdź do trybu online";
            }
        }
    }, 100); // Обновляем каждые 100мс для плавности

    // 5. ОКНА (БАНК, АВТОСАЛОН) - Чтобы они работали красиво
    window.renderCustomModal = function(type) {
        const old = document.getElementById('active-custom-modal'); if(old) old.remove();
        const overlay = document.createElement('div');
        overlay.id = 'active-custom-modal';
        overlay.className = 'custom-modal-overlay';
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);";
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

        let content = '';
        if(type==='bank') {
            content = `<h2 style="color:#009de0;text-align:center">Bank</h2><div style="background:#f5f5f5;padding:15px;border-radius:10px;margin-bottom:10px;color:black">Баланс: ${state.balance.toFixed(2)} PLN<br>Долг: ${state.debt.toFixed(2)} PLN</div><button onclick="takeLoan();document.getElementById('active-custom-modal').remove()" style="width:100%;padding:15px;background:#009de0;color:white;border:none;border-radius:10px;font-weight:bold">Взять кредит</button>`;
        } else if (type==='taxi') {
            content = `<h2 style="color:#009de0;text-align:center">Taxi (WIP)</h2>`;
        }
        overlay.innerHTML = `<div style="background:white;width:90%;padding:20px;border-radius:20px;position:relative">${content}</div>`;
        document.body.appendChild(overlay);
    };

    window.openModal = function(type) {
        if(type==='bank') window.renderCustomModal('bank');
        else if(type==='taxi-shop') window.renderCustomModal('taxi');
        else { toggleMenu(); const m=document.getElementById('full-modal'); const b=document.getElementById('modal-body'); m.classList.add('open'); if(type==='shop'){document.getElementById('modal-title').textContent='Магазин';renderShop(b);}else{renderHistory(b);} }
    };

})();
