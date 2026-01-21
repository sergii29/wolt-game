// --- PATCH V2: DARK MODE & UI FIX ---
// Вставьте этот код в файл patches/design_update.js

(function() {
    console.log(">>> Patch v2 Loaded: Dark Mode Applied");

    // 1. Создаем стили для ТЕМНОЙ ТЕМЫ (включая нижнюю панель)
    const darkStyles = `
        /* --- 1. Основной фон нижней панели (та, что на скрине белая) --- */
        /* Мы используем универсальные селекторы, чтобы попасть наверняка */
        div[style*="background-color: white"], 
        div[style*="background: white"],
        .bg-white, .bottom-sheet, #active-order-panel {
            background: linear-gradient(160deg, #1a1a2e 0%, #16213e 100%) !important;
            color: #fff !important;
            border-top: 1px solid rgba(0, 255, 200, 0.2) !important;
            box-shadow: 0 -10px 30px rgba(0,0,0,0.7) !important;
        }

        /* Текст внутри белой панели делаем светлым */
        div[style*="background-color: white"] h2,
        div[style*="background-color: white"] h3, 
        div[style*="background-color: white"] p,
        div[style*="background-color: white"] span {
            color: #e0e0e0 !important;
        }

        /* --- 2. Кнопка "ЗАПЛАНИРОВАТЬ ОФЛАЙН" (Красная/Оранжевая) --- */
        button {
            font-family: 'Segoe UI', sans-serif !important;
            letter-spacing: 0.5px !important;
            border-radius: 12px !important;
        }
        
        /* Делаем её более стильной */
        div[onclick*="offline"] {
            background: rgba(255, 87, 34, 0.15) !important;
            border: 1px solid rgba(255, 87, 34, 0.5) !important;
            backdrop-filter: blur(5px);
        }

        /* --- 3. Кнопка "ЖМИ ГАЗ (PEDAL)" (Синяя) --- */
        /* Находим её по цвету или тексту */
        button:contains("ЖМИ ГАЗ"), .btn-blue, div[style*="background-color: #"] {
            box-shadow: 0 0 15px rgba(0, 140, 255, 0.4) !important;
            transition: all 0.1s !important;
        }

        /* --- 4. Верхняя панель статистики (где деньги) --- */
        /* Делаем её прозрачно-черной */
        #stats-bar, .top-bar {
            background: rgba(0, 0, 0, 0.6) !important;
            backdrop-filter: blur(8px) !important;
            border-bottom: 1px solid rgba(255,255,255,0.05) !important;
        }

        /* Исправление иконок (Вел, Сумка...), чтобы текст был читаем */
        .stat-item span {
            color: #fff !important;
            text-shadow: 0 1px 2px black;
        }
    `;

    // 2. Внедряем стили
    const styleSheet = document.createElement("style");
    styleSheet.innerText = darkStyles;
    document.head.appendChild(styleSheet);

    // 3. ПРОВЕРКА (Всплывающее уведомление)
    // Если вы увидите это сообщение на экране, значит патч работает!
    const toast = document.createElement("div");
    toast.innerText = "🎨 DARK MODE PATCH ACTIVE";
    toast.style.cssText = "position:fixed; top:10px; left:50%; transform:translateX(-50%); background:limegreen; color:black; padding:5px 10px; z-index:9999; border-radius:5px; font-size:12px; font-weight:bold;";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);

})();

