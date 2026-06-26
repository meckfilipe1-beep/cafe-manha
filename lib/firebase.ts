import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 👈 Essa linha estava faltando

// Suas configurações corretas
const firebaseConfig = {
  apiKey: "AIzaSyAsRmWaIlgfLSnv0xU1CBKi_8KNhDnhNjg",
  authDomain: "tapicuz-aa78f.firebaseapp.com",
  projectId: "tapicuz-aa78f",
  storageBucket: "tapicuz-aa78f.appspot.com",
  messagingSenderId: "478217285958",
  appId: "1:478217285958:web:ac95f12d330d73d22ab547",
  measurementId: "G-P4FC9P4J1L"
};

const app = initializeApp(firebaseConfig);

// Exportamos tanto o banco quanto a autenticação
export const db = getFirestore(app);
export const auth = getAuth(app); // 👈 Agora o auth existe!