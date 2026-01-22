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

// Изначальные данные игрока (добавлены все 7 параметров)
window.gameState = JSON.parse(localStorage.getItem("WARSZAWA_FOREVER")) || {
    balance: 100,
    energy: 100,
    water: 100,
    bike: 100,
    bag: 100,
    phone: 100,
    clothes: 100,
    mood: 100,
    isEnergyDrinkActive: false
};

console.log("Database & Firebase Ready");
