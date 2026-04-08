import { Timestamp } from "firebase/firestore";
import { dbGet, dbList, dbSet, dbAdd, dbUpdate, dbDelete } from "./apiBridge";

export interface PromoWeb {
    id: string;
    nombre: string;
    activa: boolean;
    whatsapp_negocio: string;
    subtitulo_logo?: string;
    short_code?: string;
    createdAt?: Timestamp;
}

export interface Premio {
    id: string;
    nombre: string;
    descripcion: string;
    tipo: "descuento" | "regalo" | "otro";
    vencimiento: Timestamp;
    probabilidad: number;
    stock?: number;
    activo: boolean;
    ganadores: number;
}

export interface Participante {
    nombre: string;
    whatsapp: string;
    premioId: string;
    premioNombre: string;
    ganado_en: Timestamp;
}

export interface ShortLink {
    tenantId: string;
    promoId: string;
}

// ─── SHORT LINKS ──────────────────────────────────────────────────────────────

export async function getShortLink(shortCode: string): Promise<ShortLink | null> {
    return await dbGet("short_links", shortCode.toLowerCase());
}

export async function reserveShortLink(shortCode: string, tenantId: string, promoId: string): Promise<void> {
    const code = shortCode.toLowerCase();
    const existing = await getShortLink(code);
    if (existing) {
        if (existing.tenantId !== tenantId || existing.promoId !== promoId) {
            throw new Error(`El link /p/${code} ya está siendo utilizado por otra promo.`);
        }
    }
    await dbSet("short_links", code, { tenantId, promoId });
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
    const res = await dbAdd(`tenants/${tenantId}/promos_web`, { ...data, createdAt: new Date() });
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
        ganado_en: new Date() 
    });

    // Incrementar ganadores (esto requiere lógica que idealmente debería ser atómica, pero proxiamos por ahora)
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
    const now = Math.floor(Date.now() / 1000);
    const elegibles = premios.filter(
        (p) => p.activo && (p.vencimiento?.seconds || 0) > now && (typeof p.stock !== "number" || p.stock > 0)
    );
    if (elegibles.length === 0) return null;

    const total = elegibles.reduce((sum, p) => sum + (p.probabilidad || 1), 0);
    let rand = Math.random() * total;

    for (const premio of elegibles) {
        rand -= premio.probabilidad || 1;
        if (rand <= 0) return premio;
    }
    return elegibles[elegibles.length - 1];
}
