import { dbGet, dbList, dbUpdate, dbAdd, dbDelete } from "./apiBridge";

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
    // Compatibilidad
    fecha?: string;
    hora?: string;
    inscriptosCount?: number;
}

const COLLECTION_NAME = "clases";

export const claseService = {
    async createClase(tenantId: string, data: Omit<Clase, "id" | "tenantId" | "status" | "horarios"> & { horarios?: Horario[] }) {
        const res = await dbAdd(`tenants/${tenantId}/${COLLECTION_NAME}`, {
            ...data,
            tenantId,
            horarios: data.horarios || [],
            status: 'active',
            createdAt: new Date().toISOString()
        });
        await dbUpdate(`tenants/${tenantId}/${COLLECTION_NAME}`, res.id, { id: res.id });
        return res.id;
    },

    async getClases(tenantId: string): Promise<Clase[]> {
        const list = await dbList(`tenants/${tenantId}/${COLLECTION_NAME}`);
        return list.sort((a: any, b: any) => (b.createdAt > a.createdAt ? 1 : -1));
    },

    async updateClase(tenantId: string, id: string, data: Partial<Clase>) {
        await dbUpdate(`tenants/${tenantId}/${COLLECTION_NAME}`, id, data);
    },

    async deleteClase(tenantId: string, id: string) {
        await dbDelete(`tenants/${tenantId}/${COLLECTION_NAME}`, id);
    },

    async getClaseById(tenantId: string, id: string): Promise<Clase | null> {
        return await dbGet(`tenants/${tenantId}/${COLLECTION_NAME}`, id);
    },

    async rescheduleSession(tenantId: string, claseId: string, oldFecha: string, oldHora: string, newFecha: string, newHora: string, newBoxId?: string) {
        const clase = await this.getClaseById(tenantId, claseId);
        if (clase) {
            const updatedHorarios = (clase.horarios || []).map(h => 
                (h.fecha === oldFecha && h.hora === oldHora) ? { ...h, fecha: newFecha, hora: newHora } : h
            );
            
            const updateData: any = { horarios: updatedHorarios };
            if (newBoxId) updateData.boxId = newBoxId;
            
            await this.updateClase(tenantId, claseId, updateData);

            const { getInscriptosPorClaseYHorario, updateTurnoPosicion } = await import("./agendaService");
            const inscriptos = await getInscriptosPorClaseYHorario(tenantId, claseId, oldFecha, oldHora);
            
            const updates = inscriptos.map(async (alumno) => {
                await updateTurnoPosicion(tenantId, alumno.id, newBoxId || alumno.boxId, newHora, newFecha);
            });
            
            await Promise.all(updates);
        }
    },

    async incrementInscriptos(tenantId: string, id: string, horarioId: string, amount: number = 1) {
        const clase = await this.getClaseById(tenantId, id);
        if (clase) {
            const updatedHorarios = (clase.horarios || []).map(h => 
                h.id === horarioId ? { ...h, inscriptosCount: (h.inscriptosCount || 0) + amount } : h
            );
            await this.updateClase(tenantId, id, { horarios: updatedHorarios });
        }
    },

    async getInscriptos(tenantId: string, claseId: string) {
        return await dbList(`tenants/${tenantId}/agenda`, [
            { field: "claseId", operator: "==", value: claseId },
            { field: "status", operator: "in", value: ["CONFIRMADO", "RESERVADO", "COMPLETADO"] }
        ]);
    }
};
