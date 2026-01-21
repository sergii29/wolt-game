// ============================================================
// --- PATCH v9: WOLT WHITE UI + DARK MODALS (HYBRID) ---
// ============================================================

(function() {
    console.log(">>> Patch v9 Loaded: Hybrid Design (Wolt + Neon Modals)");

    // 1. СТИЛИ (CSS) - Wolt UI (Белый) + Dark Map
    const styles = `
        /* --- КАРТА (ТЕМНАЯ) --- */
        #map { 
            background: #1a1a1a !important; 
            filter: contrast(1.1) brightness(0.9);
        }

        /* --- БОКОВОЕ МЕНЮ (БЕЛОЕ КАК В ОРИГИНАЛЕ) --- */
        #side-menu {
            background: #ffffff !important;
            border-right: 1px solid #eee !important;
        }
        .menu-item {
            color: #202125 !important;
            border-bottom: 1px solid #f5f5f5 !important;
            font-weight: 500 !important;
        }
        .menu-item i {
            color: #555 !important; /* Серые иконки по умолчанию */
        }
        /* Исключения для цветных иконок */
        .menu-item .fa-store { color: #009de0 !important; }
        .menu-item .fa-building-columns { color: #00c37b !important; }
        
        #player-name-display { color: #000 !important; }
        #player-id-display { color: #999 !important; }


        /* --- НИЖНЯЯ ПАНЕЛЬ (БЕЛАЯ КАРТОЧКА) --- */
        .bottom-sheet {
            background: #ffffff !important;
            border-top-left-radius: 20px !important;
            border-top-right-radius: 20px !important;
            box-shadow: 0 -5px 30px rgba(0,0,0,0.2) !important;
            color: #202125 !important;
        }
        .bottom-sheet::before {
            content: ''; display: block; width: 40px; height: 4px;
            background: #e0e0e0; border-radius: 2px; margin: -5px auto 15px auto;
        }

        #city-label {
            color: #202125 !important;
            margin-bottom: 5px !important;
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

        /* СЛАЙДЕР */
        .slider-container {
            background: #009de0 !important; border-radius: 30px !important;
            border: none !important;
        }
        .slider-text {
            color: white !important; font-weight: 700 !important;
            font-size: 15px !important; text-transform: none !important;
        }
        .slider-knob {
            background: white !important; color: #009de0 !important;
        }
        
        /* Скрываем демо-алерт */
        #demo-mode-alert { display: none !important; }

        /* --- СТИЛИ ДЛЯ СПЕЦ-ОКОН (ТЕМНЫЕ/МОДНЫЕ) --- */
        .custom-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(8px);
            z-index: 10000; display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.2s ease-out;
        }
        .custom-modal-box {
            /* ТЕМНЫЙ ФОН ДЛЯ ОКОН */
            background: linear-gradient(145deg, #1e1e24, #25252b);
            width: 90%; max-width: 380px; max-height: 85vh; overflow-y: auto;
            border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 60px rgba(0,0,0,0.8); padding: 25px;
            position: relative; color: #fff; font-family: 'Segoe UI', Roboto, sans-serif;
        }
        .close-btn {
            position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
            background: rgba(255, 255, 255, 0.1); border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-weight: bold; color: #bbb;
        }
        .action-btn {
            width: 100%; padding: 15px; margin-bottom: 10px; border: none; border-radius: 12px;
            font-weight: bold; font-size: 14px; cursor: pointer; 
            display: flex; justify-content: space-between; align-items: center;
            transition: transform 0.1s;
        }
        .action-btn:active { transform: scale(0.98); }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);


    // 2. КАРТА (Dark Matter + Bike Icon)
    setTimeout(() => {
        if(window.map) {
            window.map.eachLayer((layer) => { if(layer instanceof L.TileLayer) window.map.removeLayer(layer); });
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', maxZoom: 19 }).addTo(window.map);
            window.map.eachLayer((layer) => {
                if(layer instanceof L.Marker) {
                    const iconHtml = `<div style="background:rgba(255,255,255,0.2); border:2px solid rgba(255,255,255,0.9); border-radius:50%; width:40px; height:40px; display:flex; justify-content:center; align-items:center; color:white; font-size:18px; backdrop-filter:blur(2px); box-shadow:0 0 15px rgba(0,0,0,0.5);"><i class="fa-solid fa-bicycle"></i></div>`;
                    layer.setIcon(L.divIcon({ className: 'custom-div-icon', html: iconHtml, iconSize: [40, 40], iconAnchor: [20, 20] }));
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

    // 4. ИНТЕРФЕЙС WOLT + ДИНАМИЧЕСКИЙ КИЛОМЕТРАЖ
    setInterval(() => {
        // Уменьшение КМ при езде
        const orderDestEl = document.getElementById('order-dest');
        if (typeof currentOrder !== 'undefined' && currentOrder && orderDestEl) {
            const totalDist = parseFloat(currentOrder.distance);
            const progress = currentOrder.progress || 0;
            let remaining = totalDist * (1 - (progress / 100));
            if (remaining < 0) remaining = 0;
            let prefix = currentOrder.stage === 2 ? "К клиенту" : "Забрать";
            orderDestEl.innerHTML = `<strong>${prefix}:</strong> ${remaining.toFixed(1)} km <span style="font-size:10px; color:#aaa">(GPS)</span>`;
            const trackFill = document.getElementById('track-fill');
            if(trackFill) trackFill.style.background = '#009de0';
        }

        // Вставка блока Wolt Partner
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
    }, 100);


    // 5. МОДНЫЕ ОКНА (ТЕМНЫЙ ДИЗАЙН ВНУТРИ БЕЛОГО ПРИЛОЖЕНИЯ)
    window.renderCustomModal = function(type) {
        const old = document.getElementById('active-custom-modal'); if(old) old.remove();
        const overlay = document.createElement('div');
        overlay.id = 'active-custom-modal';
        overlay.className = 'custom-modal-overlay';
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

        let content = '';
        const bal = state.balance; const debt = state.debt;

        // --- БАНК (КРАСИВЫЙ) ---
        if(type==='bank') {
            const limit = 1000 + (state.career.totalOrders * 50);
            const hasDebt = debt > 0;
            content = `
                <h2 style="color:#f1c40f; text-align:center; margin-top:0"><i class="fa-solid fa-building-columns"></i> Варшава Банк</h2>
                <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:12px; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#aaa;"><span>Баланс:</span><span style="color:white; font-weight:bold">${bal.toFixed(2)} PLN</span></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#aaa;"><span>Долг:</span><span style="color:${hasDebt?'#ff6b6b':'white'}; font-weight:bold">${debt.toFixed(2)} PLN</span></div>
                    <div style="width:100%; height:1px; background:rgba(255,255,255,0.1); margin:8px 0;"></div>
                    <div style="display:flex; justify-content:space-between; font-size:12px;"><span>Кред. Лимит:</span><span style="color:#7bed9f">${limit} PLN</span></div>
                </div>
                <div style="font-size:12px; padding:10px; background:rgba(255,255,255,0.05); border-left:3px solid ${hasDebt?'#ff4757':'#2ed573'}; border-radius:6px; margin-bottom:20px; color:${hasDebt?'#ff4757':'#2ed573'}">
                    ${hasDebt ? '⚠️ С активным долгом часть дохода списывается автоматически!' : '✅ Кредитная история чиста.'}
                </div>
                <button class="action-btn" onclick="wrapAction('loan')" style="background:linear-gradient(90deg, #3742fa, #5352ed); color:white;"><span>Взять кредит</span> <span>+500 PLN</span></button>
                <button class="action-btn" onclick="wrapAction('repay')" style="background:linear-gradient(90deg, #2ed573, #7bed9f); color:#1e272e;"><span>Погасить долг</span> <span>-500 PLN</span></button>
            `;
        }
        
        // --- ПРАВИТЕЛЬСТВО (КРАСИВОЕ) ---
        else if(type==='gov') {
             const levelSum = Object.values(state.repairs).reduce((a,b)=>a+b,0);
             const inflationRate = 0.1;
             const inf = (levelSum * inflationRate * 100).toFixed(0);
             const cost1 = 2700 * (1 + levelSum * inflationRate);
             const cost2 = 5000 * (1 + levelSum * inflationRate);
             let color = '#2ecc71'; if(inf > 30) color = '#f1c40f'; if(inf > 80) color = '#e74c3c';

             content = `
                <h2 style="color:#95a5a6; text-align:center; margin-top:0"><i class="fa-solid fa-scale-unbalanced-flip"></i> Министерство</h2>
                <div style="text-align:center; margin:20px 0;">
                    <div style="font-size:48px; font-weight:800; color:${color}; text-shadow:0 0 15px ${color}40">${inf}%</div>
                    <div style="font-size:12px; color:#7f8c8d; letter-spacing:1px">ТЕКУЩАЯ ИНФЛЯЦИЯ</div>
                </div>
                <button class="action-btn" onclick="wrapGov(1, ${cost1})" style="background:#34495e; color:#ecf0f1; border:1px solid #4a69bd;"><span>📉 Лоббирование (-1 ур)</span> <span style="color:#f1c40f">-${cost1.toFixed(0)}</span></button>
                <button class="action-btn" onclick="wrapGov(2, ${cost2})" style="background:#2c3e50; color:#ecf0f1; border:1px solid #6a89cc;"><span>📉 Взятка (-2 ур)</span> <span style="color:#f1c40f">-${cost2.toFixed(0)}</span></button>
             `;
        }
        
        // --- ТАКСИ (КРАСИВОЕ NFS) ---
        else if(type==='taxi') {
             const cars = [
                { id: 'skoda', name: 'Skoda Fabia', price: 15000, desc: 'Эконом', icon: 'fa-car-side', spd: 30, cmf: 20 },
                { id: 'toyota', name: 'Toyota Prius', price: 45000, desc: 'Гибрид', icon: 'fa-leaf', spd: 50, cmf: 60 },
                { id: 'tesla', name: 'Tesla Model 3', price: 120000, desc: 'Бизнес', icon: 'fa-bolt', spd: 90, cmf: 100 }
            ];
            content = `<h2 style="color:#00d2d3; text-align:center; margin-top:0"><i class="fa-solid fa-car"></i> Таксопарк</h2>`;
            cars.forEach(car => {
                const isOwned = (state.taxi.vehicle === car.id);
                const btnCol = isOwned ? '#27ae60' : '#2980b9';
                const btnTxt = isOwned ? 'В ГАРАЖЕ' : `КУПИТЬ ${car.price/1000}K`;
                content += `
                <div style="background:#2d3436; border-radius:12px; margin-bottom:12px; border:${isOwned ? '2px solid #f1c40f' : '1px solid #444'}; padding:12px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-weight:bold;"><span><i class="fa-solid ${car.icon}"></i> ${car.name}</span>${isOwned ? '<i class="fa-solid fa-check" style="color:#f1c40f"></i>' : ''}</div>
                    <div style="display:flex; align-items:center; margin-bottom:5px; font-size:10px; color:#aaa"><span style="width:40px">Speed</span><div style="flex:1; height:4px; background:#444; border-radius:2px"><div style="width:${car.spd}%; height:100%; background:#3498db"></div></div></div>
                    <div style="display:flex; align-items:center; margin-bottom:10px; font-size:10px; color:#aaa"><span style="width:40px">Comfort</span><div style="flex:1; height:4px; background:#444; border-radius:2px"><div style="width:${car.cmf}%; height:100%; background:#9b59b6"></div></div></div>
                    <button onclick="${isOwned?'':`wrapTaxi('${car.id}', ${car.price})`}" style="width:100%; padding:8px; border:none; border-radius:6px; background:${btnCol}; color:white; font-weight:bold;">${btnTxt}</button>
                </div>`;
            });
        }

        overlay.innerHTML = `<div class="custom-modal-box"><div class="close-btn" onclick="document.getElementById('active-custom-modal').remove()">✕</div>${content}</div>`;
        document.body.appendChild(overlay);
    };

    window.openModal = function(type) {
        if(type==='bank') window.renderCustomModal('bank');
        else if(type==='deflation') window.renderCustomModal('gov');
        else if(type==='taxi-shop') window.renderCustomModal('taxi');
        else { 
            toggleMenu(); 
            // Для остальных окон вызываем старый рендер, но через стандартное окно
            const m=document.getElementById('full-modal'); const b=document.getElementById('modal-body'); m.classList.add('open'); 
            if(type==='shop'){document.getElementById('modal-title').textContent='Магазин';renderShop(b);}
            else{document.getElementById('modal-title').textContent='История';renderHistory(b);} 
        }
    };
    
    window.wrapAction = function(a) { if(a==='loan' && window.takeLoan) window.takeLoan(); if(a==='repay' && window.repayLoan) window.repayLoan(); setTimeout(()=>window.renderCustomModal('bank'), 100); }
    window.wrapGov = function(l, c) { if(window.buyDeflation) window.buyDeflation(l, c); setTimeout(()=>window.renderCustomModal('gov'), 100); }
    window.wrapTaxi = function(id, p) { if(window.buyVehicle) window.buyVehicle(id, p); setTimeout(()=>window.renderCustomModal('taxi'), 100); }

})();
