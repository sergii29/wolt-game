// PATCH UI v2 — мягкое обновление окон доставки (без ломки дизайна)

(function () {

  window.addEventListener("load", () => {

    const style = document.createElement("style");
    style.innerHTML = `

      /* Общий фон окон */
      .modal, 
      .popup, 
      .window, 
      .order, 
      .order-window,
      .delivery,
      .card {
        background: #141414 !important;
        color: #eaeaea !important;
        border-radius: 16px !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6) !important;
        border: 1px solid rgba(255,255,255,0.06) !important;
      }

      /* Заголовки в окнах */
      .modal h1, .modal h2, .modal h3,
      .order h1, .order h2, .order h3,
      .delivery h1, .delivery h2 {
        font-weight: 600 !important;
        letter-spacing: 0.3px !important;
        margin-bottom: 8px !important;
      }

      /* Текст заказа */
      .modal p,
      .order p,
      .delivery p {
        opacity: 0.85 !important;
        line-height: 1.4 !important;
      }

      /* Кнопки внутри доставки */
      .modal button,
      .order button,
      .delivery button {
        background: #1f1f1f !important;
        color: #ffffff !important;
        border-radius: 12px !important;
        padding: 10px 14px !important;
        font-size: 15px !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
      }

      .modal button:active,
      .order button:active,
      .delivery button:active {
        transform: scale(0.97);
      }

      /* Выделение важного (цена, расстояние, награда) */
      .price, .reward, .money, .pay {
        color: #00ff9c !important;
        font-weight: 600 !important;
      }

      /* Разделители */
      hr {
        border: none !important;
        border-top: 1px solid rgba(255,255,255,0.08) !important;
        margin: 10px 0 !important;
      }

    `;

    document.head.appendChild(style);
    console.log("UI PATCH v2 активен");
  });

})();
