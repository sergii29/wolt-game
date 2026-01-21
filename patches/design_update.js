// --- PATCH V3: DARK MODE & UI FIX (ICONS RESTORED) ---

(function() {
    console.log(">>> Patch v3 Loaded: UI Fixed");

    const darkStyles = `
        /* --- 1. Исправление верхней панели (чтобы иконки не улетали) --- */
        #stats-bar, .top-bar {
            background: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%) !important;
            backdrop-filter: blur(10px) !important;
            border-bottom: 1px solid rgba(255,255,255,0.1) !important;
            
            /* ВОТ ГЛАВНОЕ ИСПРАВЛЕНИЕ: */
            padding-top: 45px !important;  /* Отступ сверху для статус-бара телефона */
            padding-bottom: 15px !important;
            height: auto !important;       /* Высота подстраивается */
            min-height: 100px !important;  /* Минимальная высота */
            
            display: flex !important;
            align-items: flex-end !important; /* Прижимаем иконки к низу панели */
            justify-content: space-around !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            z-index: 9999 !important;
        }

        /* Делаем иконки и текст ярче и читаемее */
        .stat-item {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            opacity: 1 !important;
        }

        .stat-item span {
            color: #00ffcc !important; /* Неоновый цвет текста */
            font-weight: bold !important;
            font-size: 11px !important;
            margin-top: 4px !important;
            text-shadow: 0 1px 3px rgba(0,0,0,0.8) !important;
        }

        /* --- 2. Нижняя панель (Темная тема) --- */
        div[style*="background-color: white"], 
        div[style*="background: white"],
        .bg-white, .bottom-sheet, #active-order-panel {
            background: linear-gradient(160deg, #1a1a2e 0%, #16213e 100%) !important;
            color: #fff !important;
            border-top: 1px solid rgba(0, 255, 200, 0.2) !important;
            box-shadow: 0 -10px 30px rgba(0,0,0,0.7) !important;
            z-index: 9000 !important; /* Чтобы не перекрывало верх */
        }

        div[style*="background-color: white"] h2,
        div[style*="background-color: white"] p,
        div[style*="background-color: white"] span {
            color: #e0e0e0 !important;
        }

        /* Кнопки */
        div[onclick*="offline"] {
            background: rgba(255, 87, 34, 0.15) !important;
            border: 1px solid rgba(255, 87, 34, 0.5) !important;
        }
    `;

    // Удаляем старые стили если есть, чтобы не дублировать
    const oldStyle = document.getElementById("patch-styles");
    if (oldStyle) oldStyle.remove();

    const styleSheet = document.createElement("style");
    styleSheet.id = "patch-styles";
    styleSheet.innerText = darkStyles;
    document.head.appendChild(styleSheet);

    // Уведомление
    const toast = document.createElement("div");
    toast.innerText = "🛠 UI PATCH V3: FIXED";
    toast.style.cssText = "position:fixed; top:120px; left:50%; transform:translateX(-50%); background:#00d2ff; color:black; padding:5px 15px; z-index:10000; border-radius:20px; font-weight:bold; box-shadow: 0 5px 15px rgba(0,0,0,0.5);";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);

})();
