import { db } from "../firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp
} from "firebase/firestore";

export interface EntradaHistoria {
    id?: string;
    fecha: string;          // YYYY-MM-DD
    hora: string;           // HH:mm
    profesionalId: string;
    profesionalNombre: string;
    tratamiento: string;
    subtratamiento: string; // nombres de los subs separados por coma
    nota: string;
    createdAt?: any;
}

const path = (tenantId: string, clienteId: string) =>
    collection(db, "tenants", tenantId, "clientes", clienteId, "historia_clinica");

export const historiaClinicaService = {
    async getHistoria(tenantId: string, clienteId: string): Promise<EntradaHistoria[]> {
        const ref = path(tenantId, clienteId);
        const q = query(ref, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as EntradaHistoria));
    },

    async addEntrada(tenantId: string, clienteId: string, entrada: Omit<EntradaHistoria, 'id' | 'createdAt'>): Promise<string> {
        const ref = path(tenantId, clienteId);
        const docRef = await addDoc(ref, {
            ...entrada,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    }
};
