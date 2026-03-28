import { db } from "../firebase";
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy } from "firebase/firestore";

export interface TenantData {
    slug: string;
    nombre_salon: string;
    huso_horario_global: string;
    config_boxes: number;
    tema_visual: "nude" | "lavender" | "sage";
    logo_url?: string;
    status: 'active' | 'paused' | 'deleted';
    activeUntil?: any; // Firestore Timestamp
    createdAt?: any;  // Firestore Timestamp
    agenda_config?: {
        intervalo: 10 | 15 | 30 | 60;
        horario_inicio: string; // "HH:mm"
        horario_fin: string;    // "HH:mm"
        reminder_message?: string;
    };
    datos_contacto?: {
        direccion?: string;
        descripcion?: string;
        telefono?: string;
        instagram?: string;
        whatsapp?: string;
    };
    config_clases?: {
        public_title?: string;
        public_subtitle?: string;
        public_description?: string;
    };
    web_config?: {
        layout_type?: 'classic' | 'modern' | 'minimal';
        primary_color?: string;
        secondary_color?: string;
        accent_color?: string;
        hero_image_url?: string;
        background_image_url?: string;
        seo_title?: string;
        seo_description?: string;
        font_family?: 'serif' | 'sans' | 'mono';
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
