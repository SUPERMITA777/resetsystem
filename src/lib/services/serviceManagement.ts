import { dbGet, dbList, dbSet, dbUpdate, dbDelete, dbAdd } from "./apiBridge";

export interface Subtratamiento {
    id: string;
    nombre: string;
    descripcion?: string;
    precio: number;
    duracion_minutos: number;
    imagen_url?: string;
    imagenes?: string[];
    profesional_asignado?: string; // ID del empleado por defecto
}

export interface Tratamiento {
    id: string;
    nombre: string;
    descripcion?: string;
    imagenes?: string[];
    habilitado: boolean;
    order?: number;
    boxId?: string; // Box asignado por defecto
    profesionalId?: string; // Profesional asignado por defecto
    rangos_disponibilidad?: {
        inicio: string; // HH:mm
        fin: string; // HH:mm
        dias: number[]; // [0...6]
        fecha_inicio?: string | null; // YYYY-MM-DD (Opcional para rangos temporales)
        fecha_fin?: string | null; // YYYY-MM-DD
    }[];
}

/**
 * Gestiona la jerarquía de servicios (Categoría -> Servicio específico)
 */
export const serviceManagement = {
    // CATEGORÍAS (TRATAMIENTOS)
    async createTratamiento(tenantId: string, data: Omit<Tratamiento, "id">) {
        const res = await dbAdd(`tenants/${tenantId}/tratamientos`, data);
        await dbUpdate(`tenants/${tenantId}/tratamientos`, res.id, { id: res.id });
        return res.id;
    },

    async getTratamientos(tenantId: string): Promise<Tratamiento[]> {
        return await dbList(`tenants/${tenantId}/tratamientos`);
    },

    async updateTratamiento(tenantId: string, id: string, data: Partial<Tratamiento>) {
        await dbUpdate(`tenants/${tenantId}/tratamientos`, id, data);
    },

    async deleteTratamiento(tenantId: string, id: string) {
        await dbDelete(`tenants/${tenantId}/tratamientos`, id);
    },

    // SERVICIOS (SUBTRATAMIENTOS)
    async createSubtratamiento(tenantId: string, tratamientoId: string, data: Omit<Subtratamiento, "id">) {
        const res = await dbAdd(`tenants/${tenantId}/tratamientos/${tratamientoId}/subtratamientos`, data);
        await dbUpdate(`tenants/${tenantId}/tratamientos/${tratamientoId}/subtratamientos`, res.id, { id: res.id });
        return res.id;
    },

    async getSubtratamientos(tenantId: string, tratamientoId: string): Promise<Subtratamiento[]> {
        if (!tratamientoId) return [];
        return await dbList(`tenants/${tenantId}/tratamientos/${tratamientoId}/subtratamientos`);
    },

    async updateSubtratamiento(tenantId: string, tratamientoId: string, id: string, data: Partial<Subtratamiento>) {
        await dbUpdate(`tenants/${tenantId}/tratamientos/${tratamientoId}/subtratamientos`, id, data);
    },

    async deleteSubtratamiento(tenantId: string, tratamientoId: string, id: string) {
        await dbDelete(`tenants/${tenantId}/tratamientos/${tratamientoId}/subtratamientos`, id);
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
