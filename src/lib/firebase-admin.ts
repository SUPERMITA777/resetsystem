import * as admin from "firebase-admin";

function initializeAdmin(): admin.app.App {
    if (admin.apps.length > 0) return admin.apps[0]!;

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // We handle the case where the key might have literal \n or be wrapped in quotes
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        const missing = [];
        if (!projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
        if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
        if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");
        
        throw new Error(`Configuración de Firebase incompleta. Faltan: ${missing.join(", ")}`);
    }

    // Clean up private key
    privateKey = privateKey.trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    try {
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
    } catch (error: any) {
        console.error("Error initializing Firebase Admin:", error);
        throw new Error(`Error al inicializar Firebase Admin: ${error.message}`);
    }
}

export const getAdminAuth = () => initializeAdmin().auth();
export const getAdminDb = () => initializeAdmin().firestore();
