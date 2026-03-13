import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

/**
 * Box names per date are stored in:
 * tenants/{tenantId}/box_names/{date}
 * 
 * Document structure:
 * {
 *   "box-1": "DEPILACION",
 *   "box-2": "FACIAL",
 *   ...
 * }
 */

export async function getBoxNames(tenantId: string, date: string): Promise<Record<string, string>> {
    try {
        const ref = doc(db, "tenants", tenantId, "box_names", date);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return snap.data() as Record<string, string>;
        }
        return {};
    } catch (error) {
        console.error("Error loading box names:", error);
        return {};
    }
}

export async function setBoxName(tenantId: string, date: string, boxId: string, name: string): Promise<void> {
    const ref = doc(db, "tenants", tenantId, "box_names", date);
    const snap = await getDoc(ref);

    if (snap.exists()) {
        await updateDoc(ref, { [boxId]: name });
    } else {
        await setDoc(ref, { [boxId]: name });
    }
}
