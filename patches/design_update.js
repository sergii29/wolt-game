// --- PATCH: SMART BANK UI v2 ---
// Этот патч перехватывает нажатие на кнопку банка и показывает новое меню

(function() {
    console.log(">>> Smart Bank Patch Loaded");

    // 1. Функция отрисовки НОВОГО БАНКА
    window.openNewBank = function() {
        // Пытаемся закрыть старое меню, если оно открыто
        const menu = document.querySelector('#main-menu, .menu-drawer'); 
        if(menu) menu.style.display = 'none';

        // Берем данные из памяти игры (если переменные называются иначе, ставим 0)
        // state - это стандартное хранилище в твоей игре
        const currentBalance = (typeof state !== 'undefined' && state.balance) ? state.balance : 0;
        const currentDebt = (typeof state !== 'undefined' && state.debt) ? state.debt : 0;
        const reputation = (typeof state !== 'undefined' && state.reputation) ? state.reputation : 0;
        
        // Лимит кредита
        const creditLimit = 2050 + (reputation * 10);
        
        // Логика текста о списании (как ты просил)
        const hasDebt = currentDebt > 0;
        const statusColor = hasDebt ? '#ff4757' : '#2ed573';
        const statusText = hasDebt 
            ? `⚠️ ВНИМАНИЕ: При активном долге с каждого заказа списывается % в счет погашения!` 
            : `✅ Кредитная история чиста. Вы получаете 100% дохода.`;

        // Создаем или находим модальное окно
        let modal = document.getElementById('custom-bank-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-bank-modal';
            modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:10000; backdrop-filter: blur(5px);";
            document.body.appendChild(modal);
        }

        // Вставляем HTML внутрь
        modal.innerHTML = `
            <div style="background: linear-gradient(145deg, #2f3542, #1e272e); width: 90%; max-width: 350px; padding: 25px; border-radius: 20px; color: white; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 40px rgba(0,0,0,0.5); text-align: center; font-family: sans-serif;">
                
                <h2 style="margin: 0 0 20px 0; color: #ffa502; text-transform: uppercase; letter-spacing: 1px;">🏦 Варшава Банк</h2>
                
                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px; color:#a4b0be;">
                        <span>Баланс:</span>
                        <span style="color:white; font-weight:bold;">${currentBalance.toFixed(2)} PLN</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px; color:#a4b0be;">
                        <span>Долг:</span>
                        <span style="color:#ff6b6b; font-weight:bold;">${currentDebt.toFixed(2)} PLN</span>
                    </div>
                    <div style="width:100%; height:1px; background:rgba(255,255,255,0.1); margin:8px 0;"></div>
                    <div style="display:flex; justify-content:space-between; font-size:13px;">
                        <span style="color:#7bed9f;">Лимит:</span>
                        <span>${creditLimit} PLN</span>
                    </div>
                </div>

                <div style="font-size: 12px; line-height: 1.4; color: ${statusColor}; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid ${statusColor}; text-align: left;">
                    ${statusText}
                </div>

                <button id="btn-take-loan" style="width:100%; padding:12px; border:none; border-radius:10px; background: linear-gradient(90deg, #3742fa, #5352ed); color:white; font-weight:bold; margin-bottom:10px; cursor:pointer; font-size:14px;">
                    Взять кредит (+500)
                </button>
                
                <button id="btn-repay-loan" style="width:100%; padding:12px; border:none; border-radius:10px; background: linear-gradient(90deg, #2ed573, #7bed9f); color:#2f3542; font-weight:bold; margin-bottom:15px; cursor:pointer; font-size:14px;">
                    Погасить долг (-500)
                </button>

                <button onclick="document.getElementById('custom-bank-modal').remove()" style="background:transparent; border:none; color:#747d8c; font-size:14px; text-decoration:underline; cursor:pointer;">
                    Закрыть
                </button>
            </div>
        `;

        // Логика кнопок внутри окна
        document.getElementById('btn-take-loan').onclick = function() {
            if(state.debt + 500 > creditLimit) {
                alert("Банк: Отказ! Превышен кредитный лимит.");
            } else {
                state.balance += 500;
                state.debt += 500;
                // Сохраняем игру (вызываем стандартную функцию сохранения если есть, или просто обновляем UI)
                if(typeof updateUI === 'function') updateUI();
                openNewBank(); // Перерисовать окно
            }
        };

        document.getElementById('btn-repay-loan').onclick = function() {
            if(state.debt <= 0) return alert("У вас нет долгов!");
            if(state.balance < 500) return alert("Мало денег!");
            
            state.balance -= 500;
            state.debt -= 500;
            if(state.debt < 0) state.debt = 0;
            
            if(typeof updateUI === 'function') updateUI();
            openNewBank(); // Перерисовать окно
        };
    };

    // 2. ПЕРЕХВАТЧИК (HIJACKER)
    // Каждую секунду проверяем кнопки, чтобы найти кнопку "Банк" и подменить её действие
    setInterval(() => {
        // Ищем все элементы, похожие на кнопки меню
        const menuItems = document.querySelectorAll('div, li, span, button, a');
        
        menuItems.forEach(item => {
            // Если текст элемента содержит "Банк"
            if (item.innerText && (item.innerText.includes('Банк / Кредит') || item.innerText.includes('Банк (Кредит)'))) {
                // Если мы еще не повесили на него наш обработчик
                if (item.getAttribute('data-patched') !== 'true') {
                    // console.log("Кнопка банка найдена! Подменяем...");
                    item.setAttribute('data-patched', 'true');
                    
                    // Удаляем старый onclick (клонированием элемента) - жесткий метод
                    // Но проще просто перехватить клик в фазе захвата
                    item.addEventListener('click', function(e) {
                        e.preventDefault(); // Отменяем старое действие
                        e.stopPropagation(); // Не даем событию уйти дальше
                        e.stopImmediatePropagation(); 
                        
                        // Запускаем НАШ банк
                        window.openNewBank();
                    }, true); // true = перехват на ранней стадии
                }
            }
        });
    }, 1000); // Проверяем раз в секунду (это не грузит телефон)

})();
