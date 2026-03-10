import { db } from "../firebase";
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    updateDoc
} from "firebase/firestore";

export interface Subtratamiento {
    id: string;
    nombre: string;
    precio: number;
    duracion_minutos: number;
    imagen_url?: string;
    profesional_asignado?: string; // ID del empleado por defecto
}

export interface Tratamiento {
    id: string;
    nombre: string;
    descripcion?: string;
    habilitado: boolean;
    boxId?: string; // Box asignado por defecto
    profesionalId?: string; // Profesional asignado por defecto
    rangos_disponibilidad?: {
        inicio: string; // HH:mm
        fin: string; // HH:mm
        dias: number[]; // [0...6]
        fecha_inicio?: string | null; // YYYY-MM-DD (Opcional para rangos temporales)
        fecha_fin?: string | null; // YYYY-MM-DD
    }[];
    // En Firestore, los subtratamientos irán en una subcolección
}

/**
 * Gestiona la jerarquía de servicios (Categoría -> Servicio específico)
 */
export const serviceManagement = {
    // CATEGORÍAS (TRATAMIENTOS)
    async createTratamiento(tenantId: string, data: Omit<Tratamiento, "id">) {
        const ref = collection(db, "tenants", tenantId, "tratamientos");
        const newDoc = doc(ref);
        await setDoc(newDoc, { ...data, id: newDoc.id });
        return newDoc.id;
    },

    async getTratamientos(tenantId: string): Promise<Tratamiento[]> {
        const ref = collection(db, "tenants", tenantId, "tratamientos");
        const snap = await getDocs(ref);
        return snap.docs.map(doc => doc.data() as Tratamiento);
    },

    async updateTratamiento(tenantId: string, id: string, data: Partial<Tratamiento>) {
        const ref = doc(db, "tenants", tenantId, "tratamientos", id);
        await updateDoc(ref, data);
    },

    async deleteTratamiento(tenantId: string, id: string) {
        if (!tenantId || !id || tenantId.trim() === "" || id.trim() === "") {
            console.error("deleteTratamiento called with invalid IDs:", { tenantId, id });
            throw new Error("ID de tenant o tratamiento inválido");
        }
        const ref = doc(db, "tenants", tenantId.trim(), "tratamientos", id.trim());
        await deleteDoc(ref);
    },

    // SERVICIOS (SUBTRATAMIENTOS)
    async createSubtratamiento(tenantId: string, tratamientoId: string, data: Omit<Subtratamiento, "id">) {
        const ref = collection(db, "tenants", tenantId, "tratamientos", tratamientoId, "subtratamientos");
        const newDoc = doc(ref);
        await setDoc(newDoc, { ...data, id: newDoc.id });
        return newDoc.id;
    },

    async getSubtratamientos(tenantId: string, tratamientoId: string): Promise<Subtratamiento[]> {
        if (!tratamientoId) return [];
        const ref = collection(db, "tenants", tenantId, "tratamientos", tratamientoId, "subtratamientos");
        const snap = await getDocs(ref);
        return snap.docs.map(doc => doc.data() as Subtratamiento);
    },

    async updateSubtratamiento(tenantId: string, tratamientoId: string, id: string, data: Partial<Subtratamiento>) {
        const ref = doc(db, "tenants", tenantId, "tratamientos", tratamientoId, "subtratamientos", id);
        await updateDoc(ref, data);
    },

    async deleteSubtratamiento(tenantId: string, tratamientoId: string, id: string) {
        if (!tenantId || !tratamientoId || !id) throw new Error("Parámetros faltantes para eliminar subtratamiento");
        const ref = doc(db, "tenants", tenantId, "tratamientos", tratamientoId, "subtratamientos", id);
        await deleteDoc(ref);
    },

    /**
     * Obtiene TODOS los subtratamientos de un salón, útil para el selector de la agenda
     */
    async getAllSubtratamientos(tenantId: string): Promise<(Subtratamiento & { tratamientoId: string })[]> {
        const tratamientos = await this.getTratamientos(tenantId);
        let all: (Subtratamiento & { tratamientoId: string })[] = [];

        for (const t of tratamientos) {
            const subs = await this.getSubtratamientos(tenantId, t.id);
            all = [...all, ...subs.map(s => ({ ...s, tratamientoId: t.id }))];
        }

        return all;
    }
};
