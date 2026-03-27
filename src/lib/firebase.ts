import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, enableIndexedDbPersistence } from "firebase/firestore";
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
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});

// Habilitar persistencia offline si está activada en localStorage
if (typeof window !== 'undefined') {
    const isOfflineEnabled = localStorage.getItem('offline_persistence_enabled') === 'true';
    if (isOfflineEnabled) {
        enableIndexedDbPersistence(db).catch((err) => {
            if (err.code === 'failed-precondition') {
                // Multiple tabs open, persistence can only be enabled in one tab at a time.
                console.warn('Persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
                // The current browser does not support all of the features required to enable persistence
                console.warn('Persistence failed: Browser not supported');
            }
        });
    }
}

const storage = getStorage(app);

export { app, auth, db, storage };
