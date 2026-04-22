import { dbGet, dbList, dbSet, dbAdd, dbUpdate, dbDelete } from "./apiBridge";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface PromoWeb {
    id: string;
    nombre: string;
    activa: boolean;
    whatsapp_negocio: string;
    subtitulo_logo?: string;
    short_code?: string;
    tipo?: "sorteo" | "ruleta";
    createdAt?: any;
    whatsapp_emojis?: string; // <-- NUEVO: Emojis personalizados para el mensaje de reclamo
}

export interface Premio {
    id: string;
    nombre: string;
    descripcion: string;
    tipo: "descuento" | "regalo" | "otro";
    vencimiento: any; // ISO string o timestamp object
    probabilidad: number;
    stock?: number;
    activo: boolean;
    ganadores: number;
}

// Segmento de ruleta
export interface RuletaSlice {
    id: string;
    nombre: string;
    descripcion?: string;
    probabilidad: number; // peso relativo (ej: 10 = 10%)
    color: string;        // hex color del segmento
    activo: boolean;
    imagenUrl?: string;   // Imagen opcional para en lugar del texto
    validez?: string;     // <-- NUEVO: Texto de validez (ej: "Vence en 48hs")
}

export interface Participante {
    nombre: string;
    whatsapp: string;
    premioId: string;
    premioNombre: string;
    ganado_en: any;
}

export interface ShortLink {
    tenantId: string;
    promoId: string;
    tipo?: "sorteo" | "ruleta";
}

// ─── SHORT LINKS ──────────────────────────────────────────────────────────────

export async function getShortLink(shortCode: string): Promise<ShortLink | null> {
    return await dbGet("short_links", shortCode.toLowerCase());
}

// ─── RULETA SLICES ────────────────────────────────────────────────────────────

export async function getRuletaSlices(tenantId: string, promoId: string): Promise<RuletaSlice[]> {
    return await dbList(`tenants/${tenantId}/promos_web/${promoId}/ruleta_slices`);
}

export async function createRuletaSlice(tenantId: string, promoId: string, data: Omit<RuletaSlice, "id">): Promise<string> {
    const res = await dbAdd(`tenants/${tenantId}/promos_web/${promoId}/ruleta_slices`, data);
    return res.id;
}

export async function updateRuletaSlice(tenantId: string, promoId: string, sliceId: string, data: Partial<Omit<RuletaSlice, "id">>): Promise<void> {
    await dbUpdate(`tenants/${tenantId}/promos_web/${promoId}/ruleta_slices`, sliceId, data);
}

export async function deleteRuletaSlice(tenantId: string, promoId: string, sliceId: string): Promise<void> {
    await dbDelete(`tenants/${tenantId}/promos_web/${promoId}/ruleta_slices`, sliceId);
}

export async function reserveShortLink(shortCode: string, tenantId: string, promoId: string, tipo?: "sorteo" | "ruleta"): Promise<void> {
    const code = shortCode.toLowerCase();
    const existing = await getShortLink(code);
    if (existing) {
        if (existing.tenantId !== tenantId || existing.promoId !== promoId) {
            throw new Error(`El link /p/${code} ya está siendo utilizado por otra promo.`);

        }
    }
    await dbSet("short_links", code, { tenantId, promoId, ...(tipo ? { tipo } : {}) });
}

export async function releaseShortLink(shortCode: string): Promise<void> {
    if (!shortCode) return;
    await dbDelete("short_links", shortCode.toLowerCase());
}

// ─── PROMOS ───────────────────────────────────────────────────────────────────

export async function getPromos(tenantId: string): Promise<PromoWeb[]> {
    return await dbList(`tenants/${tenantId}/promos_web`);
}

export async function getPromo(tenantId: string, promoId: string): Promise<PromoWeb | null> {
    return await dbGet(`tenants/${tenantId}/promos_web`, promoId);
}

export async function createPromo(tenantId: string, data: Omit<PromoWeb, "id" | "createdAt">): Promise<string> {
    const res = await dbAdd(`tenants/${tenantId}/promos_web`, { ...data, createdAt: new Date().toISOString() });
    return res.id;
}

export async function updatePromo(tenantId: string, promoId: string, data: Partial<Omit<PromoWeb, "id">>): Promise<void> {
    await dbUpdate(`tenants/${tenantId}/promos_web`, promoId, data);
}

// ─── PREMIOS ──────────────────────────────────────────────────────────────────

export async function getPremios(tenantId: string, promoId: string): Promise<Premio[]> {
    return await dbList(`tenants/${tenantId}/promos_web/${promoId}/premios`);
}

export async function createPremio(tenantId: string, promoId: string, data: Omit<Premio, "id" | "ganadores">): Promise<string> {
    const res = await dbAdd(`tenants/${tenantId}/promos_web/${promoId}/premios`, { ...data, ganadores: 0 });
    return res.id;
}

export async function updatePremio(tenantId: string, promoId: string, premioId: string, data: Partial<Omit<Premio, "id">>): Promise<void> {
    await dbUpdate(`tenants/${tenantId}/promos_web/${promoId}/premios`, premioId, data);
}

export async function deletePremio(tenantId: string, promoId: string, premioId: string): Promise<void> {
    await dbDelete(`tenants/${tenantId}/promos_web/${promoId}/premios`, premioId);
}

// ─── PARTICIPANTES / ANTI-FRAUDE ──────────────────────────────────────────────

export async function checkParticipante(tenantId: string, promoId: string, phone: string): Promise<Participante | null> {
    const normalized = phone.replace(/\D/g, "");
    return await dbGet(`tenants/${tenantId}/promos_web/${promoId}/participantes`, normalized);
}

export async function registrarParticipante(tenantId: string, promoId: string, data: Participante): Promise<void> {
    const normalized = data.whatsapp.replace(/\D/g, "");
    await dbSet(`tenants/${tenantId}/promos_web/${promoId}/participantes`, normalized, { 
        ...data, 
        whatsapp: normalized, 
        ganado_en: new Date().toISOString()
    });

    const premio = await dbGet(`tenants/${tenantId}/promos_web/${promoId}/premios`, data.premioId);
    if (premio) {
        const updates: any = { ganadores: (premio.ganadores || 0) + 1 };
        if (typeof premio.stock === "number") {
            updates.stock = premio.stock - 1;
            if (updates.stock <= 0) updates.activo = false;
        }
        await dbUpdate(`tenants/${tenantId}/promos_web/${promoId}/premios`, data.premioId, updates);
    }
}

export async function getParticipantes(tenantId: string, promoId: string): Promise<(Participante & { id: string })[]> {
    return await dbList(`tenants/${tenantId}/promos_web/${promoId}/participantes`);
}

export async function resetParticipante(tenantId: string, promoId: string, phone: string): Promise<void> {
    const normalized = phone.replace(/\D/g, "");
    await dbDelete(`tenants/${tenantId}/promos_web/${promoId}/participantes`, normalized);
}

// ─── SORTEO ───────────────────────────────────────────────────────────────────

export function sortearPremio(premios: Premio[]): Premio | null {
    const now = Date.now();
    const elegibles = premios.filter((p) => {
        // Manejar fecha de vencimiento que viene del proxy (Admin SDK as ISO o Timestamp object)
        let vencimientoMs = 0;
        if (p.vencimiento?._seconds) {
            vencimientoMs = p.vencimiento._seconds * 1000;
        } else if (typeof p.vencimiento === "string") {
            vencimientoMs = new Date(p.vencimiento).getTime();
        } else if (p.vencimiento instanceof Date) {
            vencimientoMs = p.vencimiento.getTime();
        }

        return p.activo && vencimientoMs > now && (typeof p.stock !== "number" || p.stock > 0);
    });
    
    if (elegibles.length === 0) return null;

    const total = elegibles.reduce((sum, p) => sum + (p.probabilidad || 1), 0);
    let rand = Math.random() * total;

    for (const premio of elegibles) {
        rand -= premio.probabilidad || 1;
        if (rand <= 0) return premio;
    }
    return elegibles[elegibles.length - 1];
}

export const uploadRuletaImage = async (file: File, tenantId: string): Promise<string> => {
    const storageRef = ref(storage, `tenants/${tenantId}/ruleta_images/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};
