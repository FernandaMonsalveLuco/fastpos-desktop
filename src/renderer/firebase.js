import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
    
    const firebaseConfig = {
      apiKey: "AIzaSyCSqeWH_cMpwN1arZRB7goh-85vbzRh__0",
      authDomain: "fastpos-b9692.firebaseapp.com",
      projectId: "fastpos-b9692",
      storageBucket: "fastpos-b9692.firebasestorage.app",
      messagingSenderId: "224785835444",
      appId: "1:224785835444:web:da9f70c95e6bba66fa3ee1"
    };
    
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Servicios que usarás
export const auth = getAuth(app);
export const db = getFirestore(app);

// Exportar app si la necesitas en el futuro (opcional)
export default app;