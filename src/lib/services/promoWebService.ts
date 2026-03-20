import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";

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
    probabilidad: number; // peso relativo 1-10
    stock?: number; // cantidad de premios disponibles
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

// ─── SHORT LINKS ──────────────────────────────────────────────────────────────

export interface ShortLink {
    tenantId: string;
    promoId: string;
}

export async function getShortLink(shortCode: string): Promise<ShortLink | null> {
    const snap = await getDoc(doc(db, "short_links", shortCode.toLowerCase()));
    if (!snap.exists()) return null;
    return snap.data() as ShortLink;
}

export async function reserveShortLink(shortCode: string, tenantId: string, promoId: string): Promise<void> {
    const code = shortCode.toLowerCase();
    const docRef = doc(db, "short_links", code);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data() as ShortLink;
        if (data.tenantId !== tenantId || data.promoId !== promoId) {
            throw new Error(`El link /p/${code} ya está siendo utilizado por otra promo.`);
        }
    }
    await setDoc(docRef, { tenantId, promoId });
}

export async function releaseShortLink(shortCode: string): Promise<void> {
    if (!shortCode) return;
    await deleteDoc(doc(db, "short_links", shortCode.toLowerCase()));
}

// ─── PROMOS ───────────────────────────────────────────────────────────────────

export async function getPromos(tenantId: string): Promise<PromoWeb[]> {
    const snap = await getDocs(
        query(collection(db, "tenants", tenantId, "promos_web"), orderBy("createdAt", "desc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PromoWeb));
}

export async function getPromo(tenantId: string, promoId: string): Promise<PromoWeb | null> {
    const snap = await getDoc(doc(db, "tenants", tenantId, "promos_web", promoId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as PromoWeb;
}

export async function createPromo(
    tenantId: string,
    data: Omit<PromoWeb, "id" | "createdAt">
): Promise<string> {
    const ref = await addDoc(collection(db, "tenants", tenantId, "promos_web"), {
        ...data,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updatePromo(
    tenantId: string,
    promoId: string,
    data: Partial<Omit<PromoWeb, "id">>
): Promise<void> {
    await updateDoc(doc(db, "tenants", tenantId, "promos_web", promoId), data);
}

// ─── PREMIOS ──────────────────────────────────────────────────────────────────

export async function getPremios(tenantId: string, promoId: string): Promise<Premio[]> {
    const snap = await getDocs(
        collection(db, "tenants", tenantId, "promos_web", promoId, "premios")
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Premio));
}

export async function createPremio(
    tenantId: string,
    promoId: string,
    data: Omit<Premio, "id" | "ganadores">
): Promise<string> {
    const ref = await addDoc(
        collection(db, "tenants", tenantId, "promos_web", promoId, "premios"),
        { ...data, ganadores: 0 }
    );
    return ref.id;
}

export async function updatePremio(
    tenantId: string,
    promoId: string,
    premioId: string,
    data: Partial<Omit<Premio, "id">>
): Promise<void> {
    await updateDoc(
        doc(db, "tenants", tenantId, "promos_web", promoId, "premios", premioId),
        data
    );
}

export async function deletePremio(
    tenantId: string,
    promoId: string,
    premioId: string
): Promise<void> {
    await deleteDoc(
        doc(db, "tenants", tenantId, "promos_web", promoId, "premios", premioId)
    );
}

// ─── PARTICIPANTES / ANTI-FRAUDE ──────────────────────────────────────────────

export async function checkParticipante(
    tenantId: string,
    promoId: string,
    phone: string
): Promise<Participante | null> {
    const normalized = phone.replace(/\D/g, "");
    const snap = await getDoc(
        doc(db, "tenants", tenantId, "promos_web", promoId, "participantes", normalized)
    );
    if (!snap.exists()) return null;
    return snap.data() as Participante;
}

export async function registrarParticipante(
    tenantId: string,
    promoId: string,
    data: Participante
): Promise<void> {
    const normalized = data.whatsapp.replace(/\D/g, "");
    // setDoc con el phone como ID garantiza unicidad (un ganador por número)
    await setDoc(
        doc(db, "tenants", tenantId, "promos_web", promoId, "participantes", normalized),
        { ...data, whatsapp: normalized, ganado_en: serverTimestamp() }
    );
    // incrementar contador de ganadores del premio
    const premioRef = doc(
        db,
        "tenants",
        tenantId,
        "promos_web",
        promoId,
        "premios",
        data.premioId
    );
    const premioSnap = await getDoc(premioRef);
    if (premioSnap.exists()) {
        const pData = premioSnap.data() as Premio;
        const updates: any = { ganadores: (pData.ganadores || 0) + 1 };
        
        if (typeof pData.stock === "number") {
            const nuevoStock = pData.stock - 1;
            updates.stock = nuevoStock;
            if (nuevoStock <= 0) {
                updates.activo = false;
            }
        }
        
        await updateDoc(premioRef, updates);
    }
}

export async function getParticipantes(
    tenantId: string,
    promoId: string
): Promise<(Participante & { id: string })[]> {
    const snap = await getDocs(
        collection(db, "tenants", tenantId, "promos_web", promoId, "participantes")
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Participante & { id: string }));
}

export async function resetParticipante(
    tenantId: string,
    promoId: string,
    phone: string
): Promise<void> {
    const normalized = phone.replace(/\D/g, "");
    await deleteDoc(
        doc(db, "tenants", tenantId, "promos_web", promoId, "participantes", normalized)
    );
}

// ─── SORTEO ───────────────────────────────────────────────────────────────────

/**
 * Elige un premio al azar ponderado por probabilidad.
 * Solo considera premios activos y no vencidos.
 */
export function sortearPremio(premios: Premio[]): Premio | null {
    const now = Timestamp.now();
    const elegibles = premios.filter(
        (p) => p.activo && p.vencimiento.seconds > now.seconds && (typeof p.stock !== "number" || p.stock > 0)
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
