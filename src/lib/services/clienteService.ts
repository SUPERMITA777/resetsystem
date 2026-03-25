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
    serverTimestamp,
    orderBy
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

export interface CreditoPaquete {
    id: string;
    cantidadInicial: number;
    cantidadRestante: number;
    fechaVencimiento: any;
    createdAt: any;
    notas?: string;
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

    async addCredits(tenantId: string, id: string, amount: number, paymentData: { monto: number, metodo: string, fecha: string }, duracionDias: number = 30) {
        const ref = doc(db, "tenants", tenantId, "clientes", id);
        
        // Calcular fecha de vencimiento
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + duracionDias);
        
        // Crear paquete de créditos
        const paquetesRef = collection(db, "tenants", tenantId, "clientes", id, "creditos_activos");
        await addDoc(paquetesRef, {
            cantidadInicial: amount,
            cantidadRestante: amount,
            fechaVencimiento: fechaVencimiento,
            createdAt: serverTimestamp()
        });

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
            duracionDias,
            fechaVencimiento,
            createdAt: serverTimestamp()
        });
        
        return newCredits;
    },

    async syncValidCredits(tenantId: string, id: string): Promise<number> {
        const ref = doc(db, "tenants", tenantId, "clientes", id);
        const paquetesRef = collection(db, "tenants", tenantId, "clientes", id, "creditos_activos");
        
        const now = new Date();
        const q = query(
            paquetesRef,
            where("fechaVencimiento", ">", now)
        );
        
        const snapPaquetes = await getDocs(q);
        const totalValido = snapPaquetes.docs.reduce((acc, doc) => {
            const data = doc.data();
            return acc + (data.cantidadRestante > 0 ? data.cantidadRestante : 0);
        }, 0);
        
        await updateDoc(ref, { creditos: totalValido });
        return totalValido;
    },

    async deductCredits(tenantId: string, id: string, amount: number): Promise<number> {
        const ref = doc(db, "tenants", tenantId, "clientes", id);
        const snap = await getDoc(ref);
        const clienteData = snap.data() as Cliente;
        const currentCredits = clienteData.creditos || 0;
        
        // 1. Obtener paquetes activos ordenados por vencimiento
        const paquetesRef = collection(db, "tenants", tenantId, "clientes", id, "creditos_activos");
        const now = new Date();
        
        // Primero intentamos consumir de paquetes válidos (no vencidos)
        const q = query(
            paquetesRef, 
            where("fechaVencimiento", ">", now),
            orderBy("fechaVencimiento", "asc")
        );
        const paquetesSnap = await getDocs(q);
        
        let remainingToDeduct = amount;
        
        // Filtrar en memoria los que tienen saldo > 0
        const paquetesValidos = paquetesSnap.docs.filter(d => d.data().cantidadRestante > 0);
        
        // Si no hay paquetes pero hay saldo (legacy), manejarlos
        if (paquetesValidos.length === 0 && currentCredits > 0) {
            // Migración legacy: crear un paquete con el saldo actual
            const fechaVencimientoLegacy = new Date();
            fechaVencimientoLegacy.setDate(fechaVencimientoLegacy.getDate() + 30);
            await addDoc(paquetesRef, {
                cantidadInicial: currentCredits,
                cantidadRestante: currentCredits,
                fechaVencimiento: fechaVencimientoLegacy,
                createdAt: serverTimestamp(),
                notas: "Migración automática legacy"
            });
            // Recargar paquetes
            return this.deductCredits(tenantId, id, amount);
        }

        for (const docPaquete of paquetesValidos) {
            if (remainingToDeduct <= 0) break;
            
            const paquete = docPaquete.data();
            const availableInPaquete = paquete.cantidadRestante;
            const toDeductFromPaquete = Math.min(remainingToDeduct, availableInPaquete);
            
            await updateDoc(docPaquete.ref, {
                cantidadRestante: availableInPaquete - toDeductFromPaquete
            });
            
            remainingToDeduct -= toDeductFromPaquete;
        }

        // Si después de consumir paquetes aún queda por deducir, 
        // significa que el saldo 'creditos' estaba desincronizado o es insuficiente.
        const newCreditsValue = Math.max(0, currentCredits - amount);
        await updateDoc(ref, { creditos: newCreditsValue });

        // Log transaction
        const historyRef = collection(db, "tenants", tenantId, "clientes", id, "creditos_historial");
        await addDoc(historyRef, {
            tipo: 'CONSUMO',
            cantidad: amount,
            nuevoSaldo: newCreditsValue,
            createdAt: serverTimestamp()
        });
        
        return newCreditsValue;
    }

};
