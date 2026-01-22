const firebaseConfig = {
  apiKey: "AIzaSyChrQMyO2soPgoEHq_f3aYs5Cs19q3sWEk",
  authDomain: "warszawa-courier.firebaseapp.com",
  databaseURL: "https://warszawa-courier-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "warszawa-courier",
  storageBucket: "warszawa-courier.firebasestorage.app",
  messagingSenderId: "295860613508",
  appId: "1:295860613508:web:86fe8364377d6875612dd1",
  measurementId: "G-TGSCHBVLX2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
window.db = db;
console.log("Firebase initialized for Warsaw Courier");

// Логика штрафа -1 PLN/сек (зафиксировано намертво)
setInterval(() => {
    // Проверяем наличие объекта gameState (или того, как у тебя названы переменные)
    if (typeof gameState !== 'undefined') {
        const stats = [
            gameState.bike, gameState.bag, gameState.phone, 
            gameState.clothes, gameState.energy, gameState.water, gameState.mood
        ];

        // Если хоть один параметр <= 0 — включаем штраф
        const isPenalty = stats.some(val => val <= 0);

        if (isPenalty) {
            gameState.balance -= 1;
            const pBox = document.getElementById('penalty-box');
            if (pBox) pBox.style.display = 'block';
        } else {
            const pBox = document.getElementById('penalty-box');
            if (pBox) pBox.style.display = 'none';
        }
        
        // Обновляем отображение, если функция существует
        if (typeof updateUI === 'function') updateUI();
        
        // Сохраняем прогресс под ключом WARSZAWA_FOREVER
        localStorage.setItem("WARSZAWA_FOREVER", JSON.stringify(gameState));
    }
}, 1000);
