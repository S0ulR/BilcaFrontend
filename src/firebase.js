// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAjd4yxkbUjeAAGKvS0fBTKlr15dQ2G1qg",
  authDomain: "bilca-f948a.firebaseapp.com",
  projectId: "bilca-f948a",
  storageBucket: "bilca-f948a.firebasestorage.app",
  messagingSenderId: "477090073531",
  appId: "1:477090073531:web:b7c90e9dde12667c6bd29e"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener servicio de autenticación
const auth = getAuth(app);

export { auth };