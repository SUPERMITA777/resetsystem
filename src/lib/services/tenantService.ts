import { dbGet, dbList, dbUpdate, dbAdd, dbSet } from "./apiBridge";

export interface TenantData {
    slug: string;
    nombre_salon: string;
    huso_horario_global: string;
    config_boxes: number;
    tema_visual: "nude" | "lavender" | "sage";
    logo_url?: string;
    descripcion?: string; // Agregado para marketing
    redes?: {
        instagram?: string;
        facebook?: string;
        tiktok?: string;
    };
    seo?: {
        title?: string;
        description?: string;
    };
    status: 'active' | 'paused' | 'deleted';
    activeUntil?: any;
    createdAt?: any;
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
        layout_type?: 'classic' | 'modern' | 'minimal' | 'premium';
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
        evolution_api_url?: string;
    };
    modules?: {
        turnos_agenda?: boolean;
        clientes?: boolean;
        staff?: boolean;
        tratamientos?: boolean;
        clases?: boolean;
        productos?: boolean;
        fitness?: boolean;
        marketing?: boolean;
        ai_agents?: boolean;
        noemi_chat?: boolean;
        reportes?: boolean;
    };
    ai_usage?: {
        tokens_spent: number;
        ars_spent: number;
        ars_limit: number;
    };
    ai_knowledge?: string;
}

const COLLECTION_NAME = "tenants";

export async function createOrUpdateTenant(slug: string, data: Partial<TenantData>) {
    await dbUpdate(COLLECTION_NAME, slug, data);
}

export async function getTenant(slug: string): Promise<TenantData | null> {
    if (!slug) return null;
    return await dbGet(COLLECTION_NAME, slug);
}

export async function getAllTenants(): Promise<(TenantData & { id: string })[]> {
    const list = await dbList(COLLECTION_NAME);
    return list.map((t: any) => ({ ...t, id: t.id || t.slug }));
}
