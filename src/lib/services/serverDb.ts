import { getAdminDb } from "../firebase-admin";

export async function getTenantServer(slug: string): Promise<any | null> {
    try {
        const db = getAdminDb();
        const tenantRef = db.collection("tenants").doc(slug);
        const docSnap = await tenantRef.get();

        if (docSnap.exists) {
            return { ...docSnap.data() };
        }
    } catch (e) {
        console.error(`[ServerDB] Error obteniendo tenant ${slug}:`, e);
    }
    return null;
}
