import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager,
    memoryLocalCache
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

// Determinar el cache de Firestore
let firestoreCache;
if (typeof window !== 'undefined') {
    // Si estamos en el navegador, usamos persistencia multi-pestaña por defecto
    // Esto evita el error de "Failed to obtain exclusive access"
    firestoreCache = persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    });
} else {
    // En el servidor (SSR), usamos cache en memoria
    firestoreCache = memoryLocalCache();
}

const db = initializeFirestore(app, {
    localCache: firestoreCache,
    experimentalForceLongPolling: true,
});

const storage = getStorage(app);

export { app, auth, db, storage };
