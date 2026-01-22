
/**
 * Патч обновления интерфейса и логики Wolt Courier
 * Применяет описания бонусов и правила энергетика
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Добавляем описание под кнопку энергетика
    const energyBtn = document.querySelector('#energy-btn') || document.querySelector('button[onclick*="energy"]');
    if (energyBtn) {
        const warning = document.createElement('p');
        warning.style.cssText = "font-size: 11px; color: #ffcc00; margin-top: 5px; font-weight: bold;";
        warning.innerText = "* Энергетик временно останавливает расход энергии, но вода продолжает тратиться, даже во время действия буста.";
        energyBtn.parentNode.insertBefore(warning, energyBtn.nextSibling);
    }

    // 2. Добавляем описания в раздел карьеры
    const careerButtons = document.querySelectorAll('.career-section button, .shop-item button');
    careerButtons.forEach(btn => {
        let descText = "";
        const btnText = btn.innerText.toLowerCase();

        if (btnText.includes('велосипед')) {
            descText = "Бонус: Ускоряет доставку на 20% и снижает риск задержек в пробках.";
        } else if (btnText.includes('авто') || btnText.includes('бот')) {
            descText = "Бонус: Заказы принимаются автоматически. Внимание: потребляет воду и энергию!";
        } else if (btnText.includes('сумка')) {
            descText = "Бонус: Позволяет брать сразу 2 заказа, увеличивая доход.";
        }

        if (descText) {
            const desc = document.createElement('p');
            desc.style.cssText = "font-size: 12px; color: #666; margin-bottom: 15px;";
            desc.innerText = descText;
            btn.parentNode.insertBefore(desc, btn.nextSibling);
        }
    });

    console.log("Патч дизайна применен успешно. Ключ: WARSZAWA_FOREVER");
});
