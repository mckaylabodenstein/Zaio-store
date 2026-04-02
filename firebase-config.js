import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBsFMGqpd0ykkAA06gNTVtIBbioZVMIkmU",
    authDomain: "urbanthreadsstore-b1b16.firebaseapp.com",
    projectId: "urbanthreadsstore-b1b16",
    storageBucket: "urbanthreadsstore-b1b16.firebasestorage.app",
    messagingSenderId: "431050769185",
    appId: "1:431050769185:web:712b7020fb84b4573e7460",
    measurementId: "G-Z82PPSGXBV"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };