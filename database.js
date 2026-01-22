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
window.db = firebase.database();

// Глобальный объект состояния (фиксируем структуру)
const SAVE_KEY = "WARSZAWA_FOREVER";
window.state = JSON.parse(localStorage.getItem(SAVE_KEY)) || {
    balance: 100,
    items: { bike: 100, bag: 100, phone: 100, gear: 100 }, // Вел, Сумка, Связь, Одежда
    needs: { energy: 100, water: 100, mood: 100 }         // Силы, Вода, Настроение
};

console.log(">>> Database Ready. Key: WARSZAWA_FOREVER");
