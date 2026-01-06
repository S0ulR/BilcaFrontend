// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Configuración pública aceptable para Firebase Web
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyAjd4yxkbUjeAAGKvS0fBTKlr15dQ2G1qg",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "bilca-f948a.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "bilca-f948a",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "bilca-f948a.firebasestorage.app",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "477090073531",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:477090073531:web:b7c90e9dde12667c6bd29e",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
