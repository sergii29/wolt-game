// PATCH UI v3 — реальное изменение окон доставки (по структуре)

(function () {

  window.addEventListener("load", () => {

    const style = document.createElement("style");
    style.innerHTML = `

      /* === НИЖНЕЕ ОКНО ДОСТАВКИ === */
      div[style*="background: #fff"],
      div[style*="background:#fff"],
      div[style*="background: white"] {
        background: #121212 !important;
        color: #eaeaea !important;
        border-radius: 18px 18px 0 0 !important;
        box-shadow: 0 -12px 40px rgba(0,0,0,0.7) !important;
      }

      /* ТЕКСТ В ОКНЕ */
      div[style*="background"] p,
      div[style*="background"] span {
        color: #eaeaea !important;
      }

      /* СУММА ЗАКАЗА */
      span:has(text()),
      .money,
      .price {
        color: #00ff9c !important;
        font-weight: 600 !important;
      }

      /* ПРОГРЕСС БАР */
      progress,
      div[role="progressbar"] {
        border-radius: 6px !important;
        overflow: hidden !important;
      }

      /* КНОПКА ПРИНЯТЬ ЗАКАЗ */
      button,
      div[role="button"] {
        border-radius: 14px !important;
        font-size: 16px !important;
        font-weight: 600 !important;
      }

      /* СИНЯЯ
