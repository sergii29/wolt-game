// ============================================================
// --- PATCH v36: ATMOSPHERE & MAP TOGGLE ---
// Key: WARSZAWA_FOREVER
// Description: Adds Day/Night map toggle and Weather effects.
// ============================================================

(function() {
    console.log(">>> Patch v36 Loaded: ATMOSPHERE CONTROL");

    // 1. НАСТРОЙКИ СТИЛЕЙ КАРТЫ
    const MAP_PROVIDERS = {
        dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    };

    // Состояние погоды
    window.weatherState = {
        isRaining: false,
        isNight: true // По умолчанию
    };

    // 2. CSS ДЛЯ ДОЖДЯ И НАСТРОЕК
    const atmStyles = `
        /* Rain Effect */
        .rain-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: url('https://i.imgur.com/7Q3X3wX.png');
            animation: rainAnim 0.5s linear infinite;
            opacity: 0; pointer-events: none; z-index: 500;
            transition: opacity 1s;
        }
        .rain-overlay.active { opacity: 0.3; }
        @keyframes rainAnim { 0% { background-position: 0 0; } 100% { background-position: 20px 40px; } }

        /* Weather Badge */
        .weather-badge {
            position: absolute; top: 75px; right: 15px;
            background: rgba(255,255,255,0.9); color: #333;
            padding: 5px 10px; border-radius: 15px;
            font-size: 11px; font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 998; display: none; align-items: center; gap: 5px;
        }
    `;
    const s = document.createElement("style"); s.innerText = atmStyles; document.head.appendChild(s);

    // Добавляем слой дождя
    const rainDiv = document.createElement('div');
    rainDiv.id = 'rain-layer';
    rainDiv.className = 'rain-overlay';
    document.body.appendChild(rainDiv);

    // Добавляем бейдж погоды
    const wBadge = document.createElement('div');
    wBadge.id = 'weather-badge';
    wBadge.innerHTML = '<i class="fa-solid fa-cloud-rain" style="color:#009de0"></i> <span>Ливень</span>';
    document.body.appendChild(wBadge);


    // 3. ФУНКЦИЯ СМЕНЫ КАРТЫ (ДЕНЬ/НОЧЬ)
    window.setMapTheme = function(mode) {
        if(!window.map) return;
        
        window.weatherState.isNight = (mode === 'dark');
        const url = mode === 'dark' ? MAP_PROVIDERS.dark : MAP_PROVIDERS.light;
        
        // Меняем тайлы
        window.map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                layer.setUrl(url);
            }
        });

        // Меняем стили интерфейса
        const mapDiv = document.getElementById('map');
        if(mode === 'light') {
            mapDiv.style.filter = 'brightness(1) contrast(1)'; // Яркая карта
            document.body.style.setProperty('--bg-dark', '#f0f2f5'); // Светлый фон
            document.body.style.setProperty('--text-primary', '#333'); // Темный текст
        } else {
            mapDiv.style.filter = 'brightness(0.8) contrast(1.2)'; // Темная карта
            document.body.style.setProperty('--bg-dark', '#1a1a1a');
            document.body.style.setProperty('--text-primary', '#ffffff');
        }
        
        if(window.showToast) window.showToast(mode === 'light' ? '☀️ Дневной режим' : '🌙 Ночной режим', 'info');
        if(window.saveGame) window.saveGame();
    };


    // 4. СИСТЕМА ПОГОДЫ
    window.toggleRain = function(forceState) {
        const r = document.getElementById('rain-layer');
        const b = document.getElementById('weather-badge');
        
        const newState = (typeof forceState !== 'undefined') ? forceState : !window.weatherState.isRaining;
        window.weatherState.isRaining = newState;

        if(newState) {
            r.classList.add('active');
            b.style.display = 'flex';
            if(window.showToast) window.showToast('🌧 Начался дождь! Осторожнее!', 'warn');
        } else {
            r.classList.remove('active');
            b.style.display = 'none';
        }
    };

    // Случайная погода (раз в 5 минут)
    setInterval(() => {
        if(Math.random() < 0.3) { 
            window.toggleRain(!window.weatherState.isRaining);
        }
    }, 300000);


    // 5. ВЛИЯНИЕ НА ГЕЙМПЛЕЙ
    setInterval(() => {
        if(!window.state || !window.state.isOnline) return;

        if(window.weatherState.isRaining) {
            // В дождь одежда портится, но энергия тратится меньше (прохладно)
            if(state.needs.energy > -10) state.needs.energy += 0.05; 
            state.needs.mood -= 0.05; 
            state.items.gear -= 0.05; 
        }
    }, 1000);


    // 6. ДОБАВЛЕНИЕ КНОПКИ В МЕНЮ
    const menuObserver = new MutationObserver(() => {
        const menu = document.getElementById('side-menu');
        if(menu && menu.classList.contains('open')) {
            if(!document.getElementById('theme-toggle-box')) {
                const div = document.createElement('div');
                div.id = 'theme-toggle-box';
                div.className = 'menu-item';
                div.style.background = 'rgba(0,0,0,0.05)';
                div.style.marginTop = '10px';
                
                div.innerHTML = `
                    <div style="flex:1"><i class="fa-solid fa-sun"></i> Режим карты</div>
                    <div style="display:flex; gap:5px">
                        <button onclick="window.setMapTheme('light')" style="padding:5px 10px;border:1px solid #ddd;border-radius:5px;background:white;cursor:pointer">☀️</button>
                        <button onclick="window.setMapTheme('dark')" style="padding:5px 10px;border:1px solid #333;border-radius:5px;background:#333;color:white;cursor:pointer">🌙</button>
                    </div>
                `;
                
                const exitBtn = document.querySelector('.menu-item[onclick="resetGame()"]');
                if(exitBtn) menu.insertBefore(div, exitBtn);
                else menu.appendChild(div);
            }
        }
    });

    const menuEl = document.getElementById('side-menu');
    if(menuEl) menuObserver.observe(menuEl, { attributes: true });

})();
