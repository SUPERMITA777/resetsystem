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
        social_share_title?: string;
        social_share_description?: string;
        default_view?: 'tratamientos' | 'clases' | 'productos';
        font_family?: 'serif' | 'sans' | 'mono' | 'display' | 'elegant';
    };
    ai_config?: {
        noemi?: { 
            active: boolean; 
            tone: 'profesional' | 'amigable' | 'casual'; 
            rules?: string;
            whatsapp_connected?: boolean;
            instagram_connected?: boolean;
            pause_phrase?: string;
            resume_phrase?: string;
        };
        veronica?: { 
            active: boolean; 
            timing: string; 
            auto_reschedule: boolean;
            smart_waitlist?: boolean;
        };
        evolution_api_url?: string; // Para modo servidor local
    };
}

const COLLECTION_NAME = "tenants";

export async function createOrUpdateTenant(slug: string, data: Partial<TenantData>) {
    console.log(`Firestore: Guardando en tenants/${slug}:`, data);
    const tenantRef = doc(db, COLLECTION_NAME, slug);
    await setDoc(tenantRef, data, { merge: true });
}

export async function getTenant(slug: string): Promise<TenantData | null> {
    const tenantRef = doc(db, COLLECTION_NAME, slug);
    
    // Implementar timeout de 5s para evitar bloqueos en SSR
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout de conexión a BD")), 5000)
    );

    try {
        const docSnap = await Promise.race([
            getDoc(tenantRef),
            timeoutPromise
        ]) as any;

        if (docSnap.exists()) {
            return { ...docSnap.data() } as TenantData;
        }
    } catch (e) {
        console.error(`Error obteniendo tenant ${slug}:`, e);
        return null;
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
