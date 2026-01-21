// --- PATCH: BANK RESTRUCTURE v1 ---
// Полностью обновляет визуальную структуру меню "Банк"

// Перезаписываем стандартную функцию отображения банка
window.showBank = function() {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    
    // 1. Расчеты для отображения
    // Если есть долг, высчитываем процент "штрафа" при доставке (обычно это 20-30% или фиксировано)
    // В вашей игре это может быть реализовано по-разному, здесь мы просто показываем статус.
    const hasDebt = state.debt > 0;
    const penaltyText = hasDebt ? "⚠️ С активным долгом часть дохода с заказов списывается автоматически!" : "✅ Долгов нет, вы получаете 100% дохода.";
    
    // 2. Формируем новый HTML для окна
    content.innerHTML = `
        <h2 style="color: #ffd700; text-align: center; margin-bottom: 20px;">🏦 WARSAW BANK</h2>
        
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #aaa;">Ваш баланс:</span>
                <span style="color: #fff; font-weight: bold;">${state.balance.toFixed(2)} PLN</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #aaa;">Текущий долг:</span>
                <span style="color: #ff6b6b; font-weight: bold;">${state.debt.toFixed(2)} PLN</span>
            </div>
             <div style="display: flex; justify-content: space-between;">
                <span style="color: #aaa;">Кредитный лимит:</span>
                <span style="color: #4cd137; font-weight: bold;">${(7000 + (state.reputation || 0) * 10).toFixed(0)} PLN</span>
            </div>
        </div>

        <div style="font-size: 12px; color: ${hasDebt ? '#ff9f43' : '#2ecc71'}; text-align: center; margin-bottom: 20px; font-style: italic;">
            ${penaltyText}
        </div>

        <div style="display: grid; gap: 10px;">
            <button onclick="takeLoan()" style="background: linear-gradient(90deg, #1e3799, #0c2461); color: white; padding: 12px; border: none; border-radius: 8px; font-weight: bold;">
                💰 Взять кредит (+500 PLN)
            </button>
            
            <button onclick="repayDebt()" style="background: linear-gradient(90deg, #009432, #006266); color: white; padding: 12px; border: none; border-radius: 8px; font-weight: bold;">
                💸 Погасить долг (-500 PLN)
            </button>

             <button onclick="closeModal()" style="background: #333; color: #ccc; padding: 10px; border: 1px solid #555; border-radius: 8px; margin-top: 10px;">
                Закрыть
            </button>
        </div>
    `;

    // 3. Показываем окно
    modal.style.display = 'flex';
};

// Функция взятия кредита (дублируем логику, чтобы работала из патча)
window.takeLoan = function() {
    const limit = 7000 + (state.reputation || 0) * 10;
    if (state.debt >= limit) {
        alert("Банк: Отказано. Вы достигли кредитного лимита!");
        return;
    }
    state.balance += 500;
    state.debt += 500;
    updateUI();
    showBank(); // Обновляем окно банка сразу
};

// Функция погашения
window.repayDebt = function() {
    if (state.debt <= 0) {
        alert("У вас нет долгов!");
        return;
    }
    if (state.balance < 500) {
        alert("Недостаточно средств для погашения!");
        return;
    }
    state.balance -= 500;
    state.debt -= 500;
    if (state.debt < 0) state.debt = 0; // Защита от минуса
    updateUI();
    showBank();
};

console.log("Bank Structure Updated");
