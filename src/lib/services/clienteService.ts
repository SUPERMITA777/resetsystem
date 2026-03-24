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
    addDoc,
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
    direccion?: string;
    provincia?: string;
    direccionValidada?: boolean;
    createdAt?: any;
    ultimaVisita?: string;
    creditos?: number; // Added for the new credits system
    fechaNacimiento?: string; // YYYY-MM-DD
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
    },

    async addCredits(tenantId: string, id: string, amount: number, paymentData: { monto: number, metodo: string, fecha: string }) {
        const ref = doc(db, "tenants", tenantId, "clientes", id);
        const snap = await getDoc(ref);
        const currentCredits = (snap.data() as Cliente).creditos || 0;
        const newCredits = currentCredits + amount;
        
        await updateDoc(ref, { creditos: newCredits });

        // Log transaction
        const historyRef = collection(db, "tenants", tenantId, "clientes", id, "creditos_historial");
        await addDoc(historyRef, {
            tipo: 'CARGA',
            cantidad: amount,
            nuevoSaldo: newCredits,
            pago: paymentData,
            createdAt: serverTimestamp()
        });
        
        return newCredits;
    },

    async deductCredits(tenantId: string, id: string, amount: number) {
        const ref = doc(db, "tenants", tenantId, "clientes", id);
        const snap = await getDoc(ref);
        const currentCredits = (snap.data() as Cliente).creditos || 0;
        const newCredits = Math.max(0, currentCredits - amount);
        
        await updateDoc(ref, { creditos: newCredits });

        // Log transaction
        const historyRef = collection(db, "tenants", tenantId, "clientes", id, "creditos_historial");
        await addDoc(historyRef, {
            tipo: 'CONSUMO',
            cantidad: amount,
            nuevoSaldo: newCredits,
            createdAt: serverTimestamp()
        });
        
        return newCredits;
    }
};
