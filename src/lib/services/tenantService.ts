import { db } from "../firebase";
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy } from "firebase/firestore";

export interface TenantData {
    slug: string;
    nombre_salon: string;
    huso_horario_global: string;
    config_boxes: number;
    tema_visual: "nude" | "lavender" | "sage";
    status: 'active' | 'paused' | 'deleted';
    activeUntil?: any; // Firestore Timestamp
    createdAt?: any;  // Firestore Timestamp
    datos_contacto?: {
        direccion?: string;
        descripcion?: string;
        telefono?: string;
        instagram?: string;
        whatsapp?: string;
    };
}

const COLLECTION_NAME = "tenants";

export async function createOrUpdateTenant(slug: string, data: Partial<TenantData>) {
    const tenantRef = doc(db, COLLECTION_NAME, slug);
    await setDoc(tenantRef, data, { merge: true });
}

export async function getTenant(slug: string): Promise<TenantData | null> {
    const tenantRef = doc(db, COLLECTION_NAME, slug);
    const docSnap = await getDoc(tenantRef);

    if (docSnap.exists()) {
        return { ...docSnap.data() } as TenantData;
    }

    return null;
}

export async function getAllTenants(): Promise<(TenantData & { id: string })[]> {
    const tenantsRef = collection(db, COLLECTION_NAME);
    const q = query(tenantsRef, orderBy("nombre_salon", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as TenantData & { id: string }));
}
