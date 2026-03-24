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
    updateDoc,
    serverTimestamp,
    orderBy
} from "firebase/firestore";

export interface Clase {
    id: string;
    tenantId: string;
    nombre: string;
    detalle?: string;
    cupo: number;
    valorCreditos: number;
    boxId: string;
    fecha: string; // YYYY-MM-DD
    hora: string;  // HH:mm
    duracion: number; // en minutos
    profesionalId: string;
    profesionalNombre: string;
    imagenes?: string[];
    inscriptosCount: number;
    createdAt?: any;
    status: 'active' | 'cancelled';
}

const COLLECTION_NAME = "clases";

export const claseService = {
    async createClase(tenantId: string, data: Omit<Clase, "id" | "tenantId" | "inscriptosCount" | "status">) {
        const ref = collection(db, "tenants", tenantId, COLLECTION_NAME);
        const newDoc = doc(ref);
        const claseData: Clase = {
            ...data,
            id: newDoc.id,
            tenantId,
            inscriptosCount: 0,
            status: 'active',
            createdAt: serverTimestamp()
        };
        await setDoc(newDoc, claseData);
        return newDoc.id;
    },

    async getClases(tenantId: string): Promise<Clase[]> {
        const ref = collection(db, "tenants", tenantId, COLLECTION_NAME);
        const q = query(ref, orderBy("fecha", "asc"), orderBy("hora", "asc"));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Clase));
    },

    async getClasesByDateRange(tenantId: string, startDate: string, endDate: string): Promise<Clase[]> {
        const ref = collection(db, "tenants", tenantId, COLLECTION_NAME);
        const q = query(
            ref,
            where("fecha", ">=", startDate),
            where("fecha", "<=", endDate),
            orderBy("fecha", "asc"),
            orderBy("hora", "asc")
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Clase));
    },

    async updateClase(tenantId: string, id: string, data: Partial<Clase>) {
        const ref = doc(db, "tenants", tenantId, COLLECTION_NAME, id);
        await updateDoc(ref, data);
    },

    async deleteClase(tenantId: string, id: string) {
        const ref = doc(db, "tenants", tenantId, COLLECTION_NAME, id);
        await deleteDoc(ref);
    },

    async getClaseById(tenantId: string, id: string): Promise<Clase | null> {
        const ref = doc(db, "tenants", tenantId, COLLECTION_NAME, id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return { ...snap.data(), id: snap.id } as Clase;
        }
        return null;
    },

    async incrementInscriptos(tenantId: string, id: string) {
        const ref = doc(db, "tenants", tenantId, COLLECTION_NAME, id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const current = (snap.data() as Clase).inscriptosCount || 0;
            await updateDoc(ref, { inscriptosCount: current + 1 });
        }
    }
};
