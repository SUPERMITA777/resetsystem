import { dbGet, dbList, dbSet, dbAdd, dbUpdate, dbDelete } from "./apiBridge";
import { addIngresoCredito } from "./reportesService";

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
    creditos?: number;
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
        return await dbList(`tenants/${tenantId}/clientes`);
    },

    async getClienteByTelefono(tenantId: string, telefono: string): Promise<Cliente | null> {
        const list = await dbList(`tenants/${tenantId}/clientes`, [
            { field: "telefono", operator: "==", value: telefono }
        ]);
        return list.length > 0 ? list[0] : null;
    },

    async createCliente(tenantId: string, data: Omit<Cliente, "id">) {
        const res = await dbAdd(`tenants/${tenantId}/clientes`, {
            ...data,
            tenantId,
            createdAt: new Date().toISOString()
        });
        // Seteamos el ID dentro del doc por consistencia legacy
        await dbUpdate(`tenants/${tenantId}/clientes`, res.id, { id: res.id });
        return res.id;
    },

    async updateCliente(tenantId: string, id: string, data: Partial<Cliente>) {
        await dbUpdate(`tenants/${tenantId}/clientes`, id, data);
    },

    async deleteCliente(tenantId: string, id: string) {
        await dbDelete(`tenants/${tenantId}/clientes`, id);
    },

    async addCredits(tenantId: string, id: string, amount: number, paymentData: { monto: number, metodo: string, fecha: string }, duracionDias: number = 30) {
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + duracionDias);
        
        // Crear paquete de créditos via proxy
        await dbAdd(`tenants/${tenantId}/clientes/${id}/creditos_activos`, {
            cantidadInicial: amount,
            cantidadRestante: amount,
            fechaVencimiento: fechaVencimiento.toISOString(),
            createdAt: new Date().toISOString()
        });

        const cliente = await dbGet(`tenants/${tenantId}/clientes`, id);
        if (!cliente) throw new Error("Cliente no encontrado");

        const currentCredits = cliente.creditos || 0;
        const newCredits = currentCredits + amount;
        
        await dbUpdate(`tenants/${tenantId}/clientes`, id, { creditos: newCredits });

        // Log transaction
        await dbAdd(`tenants/${tenantId}/clientes/${id}/creditos_historial`, {
            tipo: 'CARGA',
            cantidad: amount,
            nuevoSaldo: newCredits,
            pago: paymentData,
            duracionDias,
            fechaVencimiento: fechaVencimiento.toISOString(),
            createdAt: new Date().toISOString()
        });

        // Registrar ingreso en reportes
        try {
            await addIngresoCredito(tenantId, {
                clienteId: id,
                clienteNombre: cliente.nombre + ' ' + (cliente.apellido || ''),
                monto: paymentData.monto,
                metodo: paymentData.metodo as "EFECTIVO" | "TRANSFERENCIA",
                cantidad: amount,
                fecha: paymentData.fecha || new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            console.error("Error al registrar ingreso de créditos en reporte:", error);
        }
        
        return newCredits;
    },

    async syncValidCredits(tenantId: string, id: string): Promise<number> {
        const now = new Date().toISOString();
        const paquetes = await dbList(`tenants/${tenantId}/clientes/${id}/creditos_activos`, [
            { field: "fechaVencimiento", operator: ">", value: now }
        ]);
        
        const totalValido = paquetes.reduce((acc: number, p: any) => {
            return acc + (p.cantidadRestante > 0 ? p.cantidadRestante : 0);
        }, 0);
        
        await dbUpdate(`tenants/${tenantId}/clientes`, id, { creditos: totalValido });
        return totalValido;
    },

    async deductCredits(tenantId: string, id: string, amount: number): Promise<number> {
        const cliente = await dbGet(`tenants/${tenantId}/clientes`, id);
        if (!cliente) throw new Error("Cliente no encontrado");
        
        const currentCredits = cliente.creditos || 0;
        const now = new Date().toISOString();
        
        // Obtener paquetes activos
        const paquetes = await dbList(`tenants/${tenantId}/clientes/${id}/creditos_activos`, [
            { field: "fechaVencimiento", operator: ">", value: now }
        ]);
        
        // Ordenar por vencimiento (el proxy list no garantiza orden si no lo pedimos, pero podemos hacerlo aquí)
        paquetes.sort((a: any, b: any) => (a.fechaVencimiento > b.fechaVencimiento ? 1 : -1));
        
        let remainingToDeduct = amount;
        const paquetesValidos = paquetes.filter((p: any) => p.cantidadRestante > 0);
        
        if (paquetesValidos.length === 0 && currentCredits > 0) {
            const fechaVencimientoLegacy = new Date();
            fechaVencimientoLegacy.setDate(fechaVencimientoLegacy.getDate() + 30);
            await dbAdd(`tenants/${tenantId}/clientes/${id}/creditos_activos`, {
                cantidadInicial: currentCredits,
                cantidadRestante: currentCredits,
                fechaVencimiento: fechaVencimientoLegacy.toISOString(),
                createdAt: new Date().toISOString(),
                notas: "Migración automática legacy"
            });
            return this.deductCredits(tenantId, id, amount);
        }

        for (const p of paquetesValidos) {
            if (remainingToDeduct <= 0) break;
            
            const availableInPaquete = p.cantidadRestante;
            const toDeductFromPaquete = Math.min(remainingToDeduct, availableInPaquete);
            
            await dbUpdate(`tenants/${tenantId}/clientes/${id}/creditos_activos`, p.id, {
                cantidadRestante: availableInPaquete - toDeductFromPaquete
            });
            
            remainingToDeduct -= toDeductFromPaquete;
        }

        const newCreditsValue = Math.max(0, currentCredits - amount);
        await dbUpdate(`tenants/${tenantId}/clientes`, id, { creditos: newCreditsValue });

        await dbAdd(`tenants/${tenantId}/clientes/${id}/creditos_historial`, {
            tipo: 'CONSUMO',
            cantidad: amount,
            nuevoSaldo: newCreditsValue,
            createdAt: new Date().toISOString()
        });
        
        return newCreditsValue;
    }
};
