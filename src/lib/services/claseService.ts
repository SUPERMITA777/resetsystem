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

export interface Horario {
    id: string;
    fecha: string; // YYYY-MM-DD
    hora: string;  // HH:mm
    inscriptosCount: number;
}

export interface Clase {
    id: string;
    tenantId: string;
    nombre: string;
    detalle?: string;
    cupo: number;
    valorCreditos: number;
    boxId: string;
    duracion: number; // en minutos
    profesionalId: string;
    profesionalNombre: string;
    imagenes?: string[];
    horarios: Horario[];
    createdAt?: any;
    status: 'active' | 'cancelled';
    // Compatibilidad (se usará el primer horario si existe o se dejará vacío)
    fecha?: string;
    hora?: string;
    inscriptosCount?: number;
}

const COLLECTION_NAME = "clases";

export const claseService = {
    async createClase(tenantId: string, data: Omit<Clase, "id" | "tenantId" | "status" | "horarios"> & { horarios?: Horario[] }) {
        const ref = collection(db, "tenants", tenantId, COLLECTION_NAME);
        const newDoc = doc(ref);
        const claseData: Clase = {
            ...data,
            id: newDoc.id,
            tenantId,
            horarios: data.horarios || [],
            status: 'active',
            createdAt: serverTimestamp()
        };
        await setDoc(newDoc, claseData);
        return newDoc.id;
    },

    async getClases(tenantId: string): Promise<Clase[]> {
        const ref = collection(db, "tenants", tenantId, COLLECTION_NAME);
        const q = query(ref, orderBy("createdAt", "desc"));
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

    async rescheduleSession(tenantId: string, claseId: string, oldFecha: string, oldHora: string, newFecha: string, newHora: string, newBoxId?: string) {
        const ref = doc(db, "tenants", tenantId, COLLECTION_NAME, claseId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const clase = snap.data() as Clase;
            // 1. Actualizar el horario en el documento de la Clase
            const updatedHorarios = (clase.horarios || []).map(h => 
                (h.fecha === oldFecha && h.hora === oldHora) ? { ...h, fecha: newFecha, hora: newHora } : h
            );
            
            const updateData: any = { horarios: updatedHorarios };
            if (newBoxId) updateData.boxId = newBoxId;
            
            await updateDoc(ref, updateData);

            // 2. Actualizar todos los turnos de alumnos vinculados a esta sesión en la Agenda
            const { getInscriptosPorClaseYHorario, updateTurnoPosicion } = await import("./agendaService");
            const inscriptos = await getInscriptosPorClaseYHorario(tenantId, claseId, oldFecha, oldHora);
            
            const updates = inscriptos.map(async (alumno) => {
                await updateTurnoPosicion(tenantId, alumno.id, newBoxId || alumno.boxId, newHora, newFecha);
            });
            
            await Promise.all(updates);
        }
    },

    async incrementInscriptos(tenantId: string, id: string, horarioId: string, amount: number = 1) {
        const ref = doc(db, "tenants", tenantId, COLLECTION_NAME, id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const clase = snap.data() as Clase;
            const updatedHorarios = (clase.horarios || []).map(h => 
                h.id === horarioId ? { ...h, inscriptosCount: (h.inscriptosCount || 0) + amount } : h
            );
            await updateDoc(ref, { horarios: updatedHorarios });
        }
    },

    async getInscriptos(tenantId: string, claseId: string) {
        // Obtenemos los turnos vinculados a esta clase que estén CONFIRMADOS o RESERVADOS
        const q = query(
            collection(db, "tenants", tenantId, "agenda"),
            where("claseId", "==", claseId),
            where("status", "in", ["CONFIRMADO", "RESERVADO", "COMPLETADO"])
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    }
};
