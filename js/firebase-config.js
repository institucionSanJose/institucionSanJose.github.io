/* ===========================================================
   CONFIGURACIÓN DE FIREBASE — Real Colegio San José
   Proyecto: institucionsanjose-dc3c2
   =========================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyC9Ehv4Ssy1aC_lrU28iZEmWLmGn_mDT1k",
  authDomain: "institucionsanjose-dc3c2.firebaseapp.com",
  projectId: "institucionsanjose-dc3c2",
  storageBucket: "institucionsanjose-dc3c2.firebasestorage.app",
  messagingSenderId: "380261893760",
  appId: "1:380261893760:web:cb0eb15d097686f7018865"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
