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

// ============================================================
// INICIALIZACIÓN CONDICIONAL - SOLO EN CLIENTE
// ============================================================
// PROBLEMA: Next.js renderiza componentes "use client" en el servidor (SSR).
// El SDK de Firebase cliente se cuelga en el servidor de Vercel.
// SOLUCIÓN: Inicializar Firebase SOLO en el navegador.
// En el servidor, exportamos null. Los componentes usan useEffect()
// (que solo corre en el cliente) para acceder a Firebase.
// ============================================================

let app: any = null;
let auth: any = null;
let db: Firestore = null as any;
let storage: any = null;

if (typeof window !== 'undefined') {
    // CLIENTE: Inicializar todo normalmente con persistencia
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);

    try {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            }),
            experimentalForceLongPolling: true,
        });
    } catch {
        db = getFirestore(app);
    }

    storage = getStorage(app);
} else {
    // SERVIDOR: Inicializar sin persistencia
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    console.log("[Firebase] Initialized on server (No persistence)");
}

export { app, auth, db, storage };
