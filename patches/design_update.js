// --- PATCH: MODERN DELIVERY UI ---
// Этот код обновляет внешний вид окна приема заказов
// Не удаляйте этот файл, он подключен в index.html

(function() {
    // 1. Создаем новые стили
    const newStyles = `
        /* Затемнение фона (более глубокое) */
        #delivery-modal {
            background-color: rgba(0, 0, 0, 0.85) !important;
            backdrop-filter: blur(5px);
            transition: all 0.3s ease;
        }

        /* Само окно заказа */
        #delivery-modal > div {
            background: linear-gradient(145deg, #1e1e24, #2a2a35) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 24px !important;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5), 
                        0 0 20px rgba(0, 255, 200, 0.1) !important;
            color: #fff !important;
            padding: 25px !important;
            max-width: 90% !important;
            width: 350px !important;
            font-family: 'Segoe UI', Roboto, sans-serif !important;
            
            /* Анимация всплытия */
            animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        /* Текст внутри окна */
        #delivery-modal h2 {
            font-size: 22px !important;
            margin-bottom: 15px !important;
            background: linear-gradient(to right, #00ffa3, #00d2ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        #delivery-modal p {
            font-size: 16px !important;
            line-height: 1.5 !important;
            color: #d1d5db !important;
            margin-bottom: 20px !important;
        }

        /* Кнопки действий */
        #delivery-modal button {
            width: 100% !important;
            padding: 14px !important;
            margin: 8px 0 !important;
            border-radius: 12px !important;
            border: none !important;
            font-weight: bold !important;
            font-size: 16px !important;
            cursor: pointer !important;
            text-transform: uppercase !important;
            transition: transform 0.1s, opacity 0.2s !important;
        }

        /* Кнопка ПРИНЯТЬ */
        #delivery-modal button:first-of-type {
            background: linear-gradient(90deg, #00b09b, #96c93d) !important;
            color: white !important;
            box-shadow: 0 4px 15px rgba(0, 176, 155, 0.4) !important;
        }
        
        /* Кнопка ОТКАЗАТЬ (обычно вторая) */
        #delivery-modal button:last-of-type {
            background: rgba(255, 255, 255, 0.1) !important;
            color: #ff6b6b !important;
            border: 1px solid rgba(255, 107, 107, 0.3) !important;
        }

        /* Эффект нажатия */
        #delivery-modal button:active {
            transform: scale(0.96);
        }

        /* Анимация */
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(50px) scale(0.9); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
    `;

    // 2. Внедряем стили в голову документа
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = newStyles;
    document.head.appendChild(styleSheet);

    console.log("Patch Applied: Modern Delivery UI Loaded");
})();

