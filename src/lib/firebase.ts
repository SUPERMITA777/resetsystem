import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
    initializeFirestore, 
    getFirestore,
    persistentLocalCache, 
    persistentMultipleTabManager,
    Firestore
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Determinar la instancia de Firestore
let db: Firestore;

if (typeof window !== 'undefined') {
    // Si estamos en el navegador, usamos persistencia multi-pestaña
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        }),
        experimentalForceLongPolling: true,
    });
} else {
    // En el servidor (SSR/Serverless), usamos la configuración estándar de Firestore
    // EVITAMOS usar initializeFirestore con opciones para prevenir el crasheo "about:blank" en Vercel
    db = getFirestore(app);
}

const storage = getStorage(app);

export { app, auth, db, storage };
