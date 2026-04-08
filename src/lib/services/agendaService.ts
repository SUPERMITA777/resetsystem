import { dbGet, dbList, dbSet, dbUpdate, dbDelete, dbAdd } from "./apiBridge";

// Tipo de dato en Firestore
export interface PagoRecord {
    monto: number;
    metodo: 'EFECTIVO' | 'TRANSFERENCIA';
    tipo: 'SEÑA' | 'SALDO';
    fecha: string; // ISO Argentina
    timestamp: number;
}

export interface TurnoDB {
    id: string; // Document ID
    tenantId: string;
    clienteAbreviado: string;
    nombre?: string;
    apellido?: string;
    tratamientoAbreviado: string;
    duracionMinutos: number;
    boxId: string; // ej: 'box-1'
    fecha: string; // formato 'YYYY-MM-DD'
    horaInicio: string; // formato 'HH:mm'
    whatsapp?: string;
    email?: string;
    pagoSaldo?: number;
    saldoPagado?: boolean;
    historialPagos?: PagoRecord[];
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
    metodoPagoSena?: 'EFECTIVO' | 'TRANSFERENCIA';
    metodoPagoSaldo?: 'EFECTIVO' | 'TRANSFERENCIA';
    claseId?: string;       // Link to group class
    valorCreditos?: number; // Credit cost if it's a class
    checkinCode?: string;   // 4-digit alphanumeric code for attendance
}

// Actualizar un turno completo
export async function updateTurno(tenantId: string, turnoId: string, data: Partial<Omit<TurnoDB, 'id' | 'tenantId'>>) {
    await dbUpdate(`tenants/${tenantId}/agenda`, turnoId, data);
}

// Obtener todos los turnos para un tenant en una fecha específica
export async function getTurnosPorFecha(tenantId: string, fecha: string): Promise<TurnoDB[]> {
    return await dbList(`tenants/${tenantId}/agenda`, [
        { field: "fecha", operator: "==", value: fecha }
    ]);
}

// Crear un nuevo turno
export async function createTurno(tenantId: string, data: Omit<TurnoDB, 'id' | 'tenantId'>): Promise<string> {
    const res = await dbAdd(`tenants/${tenantId}/agenda`, {
        tenantId,
        ...data
    });
    return res.id;
}

// Actualizar la hora, box o fecha de un turno (usado por el drag and drop)
export async function updateTurnoPosicion(tenantId: string, turnoId: string, newBoxId: string, newHoraInicio: string, newFecha: string) {
    await dbUpdate(`tenants/${tenantId}/agenda`, turnoId, {
        boxId: newBoxId,
        horaInicio: newHoraInicio,
        fecha: newFecha
    });
}

// Eliminar un turno
export async function deleteTurno(tenantId: string, turnoId: string) {
    await dbDelete(`tenants/${tenantId}/agenda`, turnoId);
}

// Obtener todos los turnos para un tenant en un rango de fechas
export async function getTurnosPorRango(tenantId: string, fechaInicio: string, fechaFin: string): Promise<TurnoDB[]> {
    return await dbList(`tenants/${tenantId}/agenda`, [
        { field: "fecha", operator: ">=", value: fechaInicio },
        { field: "fecha", operator: "<=", value: fechaFin }
    ]);
}

// Obtener turnos por profesional
export async function getTurnosPorProfesional(tenantId: string, profesionalId: string, fechaInicio: string, fechaFin: string): Promise<TurnoDB[]> {
    return await dbList(`tenants/${tenantId}/agenda`, [
        { field: "profesionalId", operator: "==", value: profesionalId },
        { field: "fecha", operator: ">=", value: fechaInicio },
        { field: "fecha", operator: "<=", value: fechaFin }
    ]);
}

// Obtener todos los inscritos en una clase y horario específicos
export async function getInscriptosPorClaseYHorario(tenantId: string, claseId: string, fecha: string, horaInicio: string): Promise<TurnoDB[]> {
    return await dbList(`tenants/${tenantId}/agenda`, [
        { field: "claseId", operator: "==", value: claseId },
        { field: "fecha", operator: "==", value: fecha },
        { field: "horaInicio", operator: "==", value: horaInicio }
    ]);
}
// Obtener turnos por WhatsApp del cliente
export async function getTurnosPorWhatsApp(tenantId: string, whatsapp: string): Promise<TurnoDB[]> {
    return await dbList(`tenants/${tenantId}/agenda`, [
        { field: "whatsapp", operator: "==", value: whatsapp }
    ]);
}
