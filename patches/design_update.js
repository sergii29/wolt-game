// --- PATCH: SMART BANK UI v3 (Fixed Closing) ---
// Исправлено: теперь при закрытии окна вы возвращаетесь в меню, а не в пустоту.
// Добавлено: можно закрыть, нажав на темный фон.

(function() {
    console.log(">>> Smart Bank Patch v3 Loaded");

    // 1. Функция отрисовки НОВОГО БАНКА
    window.openNewBank = function() {
        // МЫ БОЛЬШЕ НЕ СКРЫВАЕМ МЕНЮ (чтобы не ломать навигацию)
        // Вместо этого мы открываем окно ПОВЕРХ всего.

        // Берем данные
        const currentBalance = (typeof state !== 'undefined' && state.balance) ? state.balance : 0;
        const currentDebt = (typeof state !== 'undefined' && state.debt) ? state.debt : 0;
        const reputation = (typeof state !== 'undefined' && state.reputation) ? state.reputation : 0;
        const creditLimit = 2050 + (reputation * 10);
        
        const hasDebt = currentDebt > 0;
        const statusColor = hasDebt ? '#ff4757' : '#2ed573';
        const statusText = hasDebt 
            ? `⚠️ ВНИМАНИЕ: Часть дохода списывается в счет долга!` 
            : `✅ Кредитная история чиста. Доход 100%.`;

        // Удаляем старое окно если есть (чтобы не плодились)
        const existingModal = document.getElementById('custom-bank-modal');
        if (existingModal) existingModal.remove();

        // Создаем модальное окно
        let modal = document.createElement('div');
        modal.id = 'custom-bank-modal';
        // z-index 10001 чтобы точно перекрыть всё
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:10001; backdrop-filter: blur(8px); animation: fadeIn 0.2s;";
        
        // Добавляем закрытие по клику на фон
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeNewBank();
            }
        };

        // Вставляем HTML
        modal.innerHTML = `
            <style>
                @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
                @keyframes scaleUp { from { transform:scale(0.9); } to { transform:scale(1); } }
            </style>
            <div style="background: linear-gradient(145deg, #2f3542, #1e272e); width: 90%; max-width: 350px; padding: 25px; border-radius: 20px; color: white; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 40px rgba(0,0,0,0.5); text-align: center; font-family: sans-serif; position: relative; animation: scaleUp 0.2s;">
                
                <div onclick="closeNewBank()" style="position:absolute; top:15px; right:15px; width:30px; height:30px; background:rgba(255,255,255,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; color:#aaa;">✕</div>

                <h2 style="margin: 5px 0 20px 0; color: #ffa502; text-transform: uppercase; letter-spacing: 1px; font-size: 18px;">🏦 Варшава Банк</h2>
                
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

                <button id="btn-take-loan" style="width:100%; padding:14px; border:none; border-radius:12px; background: linear-gradient(90deg, #3742fa, #5352ed); color:white; font-weight:bold; margin-bottom:10px; cursor:pointer; font-size:15px; box-shadow: 0 4px 15px rgba(55, 66, 250, 0.3);">
                    Взять кредит (+500)
                </button>
                
                <button id="btn-repay-loan" style="width:100%; padding:14px; border:none; border-radius:12px; background: linear-gradient(90deg, #2ed573, #7bed9f); color:#2f3542; font-weight:bold; margin-bottom:15px; cursor:pointer; font-size:15px;">
                    Погасить долг (-500)
                </button>

                <div style="color:#777; font-size:11px;">Нажмите на фон, чтобы закрыть</div>
            </div>
        `;
        document.body.appendChild(modal);

        // Логика кнопок
        document.getElementById('btn-take-loan').onclick = function() {
            if(state.debt + 500 > creditLimit) {
                alert("Банк: Отказ! Превышен кредитный лимит.");
            } else {
                state.balance += 500;
                state.debt += 500;
                saveAndRefresh();
            }
        };

        document.getElementById('btn-repay-loan').onclick = function() {
            if(state.debt <= 0) return alert("У вас нет долгов!");
            if(state.balance < 500) return alert("Мало денег!");
            state.balance -= 500;
            state.debt -= 500;
            if(state.debt < 0) state.debt = 0;
            saveAndRefresh();
        };
    };

    // Функция закрытия (глобальная, чтобы работала из HTML)
    window.closeNewBank = function() {
        const modal = document.getElementById('custom-bank-modal');
        if (modal) modal.remove();
        // Мы ничего не скрывали, так что ничего и не нужно восстанавливать
        // Меню останется там, где было
    };

    function saveAndRefresh() {
        if(typeof updateUI === 'function') updateUI();
        // Просто перерисовываем окно банка с новыми цифрами
        window.openNewBank(); 
    }

    // 2. ПЕРЕХВАТЧИК (HIJACKER) - Тот же самый, он работает хорошо
    setInterval(() => {
        const menuItems = document.querySelectorAll('div, li, span, button, a');
        menuItems.forEach(item => {
            if (item.innerText && (item.innerText.includes('Банк / Кредит') || item.innerText.includes('Банк (Кредит)'))) {
                if (item.getAttribute('data-patched') !== 'true') {
                    item.setAttribute('data-patched', 'true');
                    item.addEventListener('click', function(e) {
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        e.stopImmediatePropagation(); 
                        window.openNewBank();
                    }, true);
                }
            }
        });
    }, 1000);

})();
