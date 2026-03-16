import { db } from "../firebase";
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

// Tipo de dato en Firestore
export interface TurnoDB {
    id: string; // Document ID
    tenantId: string;
    clienteAbreviado: string;
    tratamientoAbreviado: string;
    duracionMinutos: number;
    boxId: string; // ej: 'box-1'
    fecha: string; // formato 'YYYY-MM-DD'
    horaInicio: string; // formato 'HH:mm'
    whatsapp?: string;
    email?: string;
    sena?: number;
    total?: number;
    status?: 'PENDIENTE' | 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO';
    subIds?: string[];
    tratamientoId?: string;
    subtratamientoAbreviado?: string;
    clienteWhatsapp?: string;
    profesionalId?: string;
    profesionalNombre?: string;
    ajustePrecio?: number;
    motivoSaldo?: string;
    subtratamientosSnap?: Array<{
        id: string;
        nombre: string;
        precio: number;
        duracion: number;
    }>;
}

// Actualizar un turno completo
export async function updateTurno(tenantId: string, turnoId: string, data: Partial<Omit<TurnoDB, 'id' | 'tenantId'>>) {
    const turnoRef = doc(db, `tenants/${tenantId}/agenda`, turnoId);
    await updateDoc(turnoRef, data);
}

// Obtener todos los turnos para un tenant en una fecha específica
export async function getTurnosPorFecha(tenantId: string, fecha: string): Promise<TurnoDB[]> {
    const q = query(
        collection(db, `tenants/${tenantId}/agenda`),
        where("fecha", "==", fecha)
    );
    const querySnapshot = await getDocs(q);

    const turnos: TurnoDB[] = [];
    querySnapshot.forEach((doc) => {
        turnos.push({ id: doc.id, ...doc.data() } as TurnoDB);
    });

    return turnos;
}

// Crear un nuevo turno
export async function createTurno(tenantId: string, data: Omit<TurnoDB, 'id' | 'tenantId'>): Promise<string> {
    const agendaRef = doc(collection(db, `tenants/${tenantId}/agenda`));

    const nuevoTurno: Omit<TurnoDB, 'id'> = {
        tenantId,
        ...data
    };

    await setDoc(agendaRef, nuevoTurno);
    return agendaRef.id;
}

// Actualizar la hora, box o fecha de un turno (usado por el drag and drop)
export async function updateTurnoPosicion(tenantId: string, turnoId: string, newBoxId: string, newHoraInicio: string, newFecha: string) {
    const turnoRef = doc(db, `tenants/${tenantId}/agenda`, turnoId);

    await updateDoc(turnoRef, {
        boxId: newBoxId,
        horaInicio: newHoraInicio,
        fecha: newFecha
    });
}

// Eliminar un turno
export async function deleteTurno(tenantId: string, turnoId: string) {
    const turnoRef = doc(db, `tenants/${tenantId}/agenda`, turnoId);
    await deleteDoc(turnoRef);
}

// Obtener todos los turnos para un tenant en un rango de fechas
export async function getTurnosPorRango(tenantId: string, fechaInicio: string, fechaFin: string): Promise<TurnoDB[]> {
    const q = query(
        collection(db, `tenants/${tenantId}/agenda`),
        where("fecha", ">=", fechaInicio),
        where("fecha", "<=", fechaFin)
    );
    const querySnapshot = await getDocs(q);

    const turnos: TurnoDB[] = [];
    querySnapshot.forEach((doc) => {
        turnos.push({ id: doc.id, ...doc.data() } as TurnoDB);
    });

    return turnos;
}

// Obtener turnos por profesional
export async function getTurnosPorProfesional(tenantId: string, profesionalId: string, fechaInicio: string, fechaFin: string): Promise<TurnoDB[]> {
    const q = query(
        collection(db, `tenants/${tenantId}/agenda`),
        where("profesionalId", "==", profesionalId),
        where("fecha", ">=", fechaInicio),
        where("fecha", "<=", fechaFin)
    );
    const querySnapshot = await getDocs(q);

    const turnos: TurnoDB[] = [];
    querySnapshot.forEach((doc) => {
        turnos.push({ id: doc.id, ...doc.data() } as TurnoDB);
    });

    return turnos;
}
