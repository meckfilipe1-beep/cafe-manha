import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { useState, useEffect } from 'react' // se já não tiver esse import

// SEU CÓDIGO DE funcionamentoURAÇÃO QUE VOCÊ ME MANDOU
const firebasefuncionamento = {
  apiKey: "AIzaSyAsRmWaIlgfLSnv0xU1CBKi_8KNhDnhNjg",
  authDomain: "tapicuz-aa78f.firebaseapp.com",
  projectId: "tapicuz-aa78f",
  storageBucket: "tapicuz-aa78f.appspot.com",
  messagingSenderId: "478217285958",
  appId: "1:478217285958:web:ac95f12d330d73d22ab547",
  measurementId: "G-P4FC9P4J1L"
}

const app = initializeApp(firebasefuncionamento)
export const db = getFirestore(app)