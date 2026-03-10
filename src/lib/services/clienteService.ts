import { db } from "../firebase";
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "firebase/firestore";

export interface Cliente {
    id: string;
    nombre: string;
    apellido: string;
    email?: string;
    telefono: string; // WhatsApp
    tenantId: string;
    notas?: string;
    createdAt?: any;
    ultimaVisita?: string;
}

export const clienteService = {
    async getClientes(tenantId: string): Promise<Cliente[]> {
        const ref = collection(db, "tenants", tenantId, "clientes");
        const snap = await getDocs(ref);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente));
    },

    async getClienteByTelefono(tenantId: string, telefono: string): Promise<Cliente | null> {
        const q = query(
            collection(db, "tenants", tenantId, "clientes"),
            where("telefono", "==", telefono)
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as Cliente;
    },

    async createCliente(tenantId: string, data: Omit<Cliente, "id">) {
        const ref = collection(db, "tenants", tenantId, "clientes");
        const newDoc = doc(ref);
        await setDoc(newDoc, {
            ...data,
            id: newDoc.id,
            tenantId,
            createdAt: serverTimestamp()
        });
        return newDoc.id;
    },

    async updateCliente(tenantId: string, id: string, data: Partial<Cliente>) {
        const ref = doc(db, "tenants", tenantId, "clientes", id);
        await updateDoc(ref, data);
    },

    async deleteCliente(tenantId: string, id: string) {
        const ref = doc(db, "tenants", tenantId, "clientes", id);
        await deleteDoc(ref);
    }
};
