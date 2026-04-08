import { dbList, dbAdd } from "./apiBridge";

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

const getPath = (tenantId: string, clienteId: string) =>
    `tenants/${tenantId}/clientes/${clienteId}/historia_clinica`;

export const historiaClinicaService = {
    async getHistoria(tenantId: string, clienteId: string): Promise<EntradaHistoria[]> {
        const list = await dbList(getPath(tenantId, clienteId));
        return list.sort((a: any, b: any) => (b.createdAt > a.createdAt ? 1 : -1));
    },

    async addEntrada(tenantId: string, clienteId: string, entrada: Omit<EntradaHistoria, 'id' | 'createdAt'>): Promise<string> {
        const res = await dbAdd(getPath(tenantId, clienteId), {
            ...entrada,
            createdAt: new Date().toISOString()
        });
        return res.id;
    }
};
