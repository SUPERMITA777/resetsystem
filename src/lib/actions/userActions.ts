"use server";

import { getAdminAuth, getAdminDb } from "../firebase-admin";
import { revalidatePath } from "next/cache";

export async function createAuthUser(data: {
    email: string;
    password: string;
    displayName: string;
    role: string;
    tenantId: string;
}) {
    try {
        const auth = getAdminAuth();
        const db = getAdminDb();

        // 1. Create in Firebase Auth
        const userRecord = await auth.createUser({
            email: data.email,
            password: data.password,
            displayName: data.displayName,
        });

        // 2. Create in Firestore
        await db.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: data.email,
            displayName: data.displayName,
            role: data.role,
            tenantId: data.tenantId,
            status: "active",
            p_shadow: data.password, // This is the user's request: "poder ver las contraseñas"
            createdAt: new Date().toISOString(),
        });

        revalidatePath("/admin/settings");
        revalidatePath("/admin/staff");
        return { success: true, uid: userRecord.uid };
    } catch (error: any) {
        console.error("Error creating user:", error);
        return { success: false, error: error.message };
    }
}

export async function updateAuthUser(uid: string, data: {
    displayName?: string;
    role?: string;
    status?: string;
    password?: string;
    whatsapp?: string;
    tenantId?: string | null;
}) {
    try {
        const auth = getAdminAuth();
        const db = getAdminDb();

        // 1. Update Auth
        const authUpdates: any = {};
        if (data.displayName) authUpdates.displayName = data.displayName;
        if (data.password) authUpdates.password = data.password;

        if (Object.keys(authUpdates).length > 0) {
            try {
                await auth.updateUser(uid, authUpdates);
            } catch (authError: any) {
                // If user doesn't exist in Auth, we ignore and continue to Firestore update
                console.warn(`Auth record not found for UID: ${uid}. Skipping Auth update.`);
                if (authError.code !== 'auth/user-not-found') {
                    throw authError;
                }
            }
        }

        // 2. Update Firestore
        const firestoreUpdates: any = { ...data };
        if (data.password) {
            firestoreUpdates.p_shadow = data.password;
            // No queremos guardar el campo 'password' literal en firestore si ya tenemos p_shadow
            delete firestoreUpdates.password;
        }

        await db.collection("users").doc(uid).update(firestoreUpdates);

        revalidatePath("/admin/settings");
        revalidatePath("/admin/staff");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteAuthUser(uid: string) {
    try {
        const auth = getAdminAuth();
        const db = getAdminDb();

        // 1. Delete from Auth (wrapped to handle non-existent auth records)
        try {
            await auth.deleteUser(uid);
        } catch (authError: any) {
            // Si el usuario no existe en Auth, lo ignoramos y seguimos para borrar de Firestore
            if (authError.code !== 'auth/user-not-found') {
                throw authError;
            }
        }

        // 2. Delete from Firestore
        await db.collection("users").doc(uid).delete();

        revalidatePath("/admin/settings");
        revalidatePath("/admin/staff");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, error: error.message };
    }
}
