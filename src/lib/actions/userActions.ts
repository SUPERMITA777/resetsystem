"use server";

import { adminAuth, adminDb } from "../firebase-admin";
import { revalidatePath } from "next/cache";

export async function createAuthUser(data: {
    email: string;
    password: string;
    displayName: string;
    role: string;
    tenantId: string;
}) {
    try {
        // 1. Create in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email: data.email,
            password: data.password,
            displayName: data.displayName,
        });

        // 2. Create in Firestore
        await adminDb.collection("users").doc(userRecord.uid).set({
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
}) {
    try {
        // 1. Update Auth
        const authUpdates: any = {};
        if (data.displayName) authUpdates.displayName = data.displayName;
        if (data.password) authUpdates.password = data.password;

        if (Object.keys(authUpdates).length > 0) {
            await adminAuth.updateUser(uid, authUpdates);
        }

        // 2. Update Firestore
        const firestoreUpdates: any = { ...data };
        if (data.password) {
            firestoreUpdates.p_shadow = data.password;
            // No queremos guardar el campo 'password' literal en firestore si ya tenemos p_shadow
            delete firestoreUpdates.password;
        }

        await adminDb.collection("users").doc(uid).update(firestoreUpdates);

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
        // 1. Delete from Auth
        await adminAuth.deleteUser(uid);

        // 2. Delete from Firestore
        await adminDb.collection("users").doc(uid).delete();

        revalidatePath("/admin/settings");
        revalidatePath("/admin/staff");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, error: error.message };
    }
}
