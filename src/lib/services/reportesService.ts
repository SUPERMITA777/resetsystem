import { dbList, dbAdd, dbDelete } from "./apiBridge";
import { TurnoDB } from "./agendaService";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface EgresoData {
    id: string;
    motivo: string;
    monto: number;
    metodo: "EFECTIVO" | "TRANSFERENCIA";
    fecha: string; // YYYY-MM-DD
}

export interface ResumenPagos {
    efectivo: number;
    transferencia: number;
    total: number;
}

export interface ResumenReporte {
    ingresos: ResumenPagos;
    egresos: ResumenPagos & { items: EgresoData[] };
    creditos: ResumenPagos & { items: any[] }; // Nuevos ingresos por créditos
    totalTurnos: number;
    balance: number;
}

export interface IngresoCredito {
    id: string;
    clienteId: string;
    clienteNombre: string;
    monto: number;
    metodo: "EFECTIVO" | "TRANSFERENCIA";
    cantidad: number;
    fecha: string; // YYYY-MM-DD
}

// ──────────────────────────────────────────────
// Helpers: extract payments from turnos
// ──────────────────────────────────────────────

function extractPagosFromTurnos(turnos: TurnoDB[]): ResumenPagos {
    let efectivo = 0;
    let transferencia = 0;

    for (const t of turnos) {
        // Historial de pagos (priority source)
        if (t.historialPagos && t.historialPagos.length > 0) {
            for (const p of t.historialPagos) {
                if (p.metodo === "EFECTIVO") efectivo += p.monto;
                else if (p.metodo === "TRANSFERENCIA") transferencia += p.monto;
            }
        } else {
            // Fallback: seña + saldo
            const senaMonto = t.sena ?? 0;
            const saldoMonto = t.pagoSaldo ?? 0;

            if (t.metodoPagoSena === "EFECTIVO") efectivo += senaMonto;
            else if (t.metodoPagoSena === "TRANSFERENCIA") transferencia += senaMonto;

            if (t.metodoPagoSaldo === "EFECTIVO") efectivo += saldoMonto;
            else if (t.metodoPagoSaldo === "TRANSFERENCIA") transferencia += saldoMonto;
        }
    }

    return { efectivo, transferencia, total: efectivo + transferencia };
}

// ──────────────────────────────────────────────
// Ingresos
// ──────────────────────────────────────────────

export function calcularIngresos(turnos: TurnoDB[]): ResumenPagos {
    return extractPagosFromTurnos(turnos);
}

// ──────────────────────────────────────────────
// Egresos – Firestore CRUD via Proxy
// ──────────────────────────────────────────────

export async function getEgresosDelDia(
    tenantId: string,
    fecha: string
): Promise<EgresoData[]> {
    return await dbList(`tenants/${tenantId}/egresos`, [
        { field: "fecha", operator: "==", value: fecha }
    ]);
}

export async function getEgresosDelPeriodo(
    tenantId: string,
    fechaInicio: string,
    fechaFin: string
): Promise<EgresoData[]> {
    return await dbList(`tenants/${tenantId}/egresos`, [
        { field: "fecha", operator: ">=", value: fechaInicio },
        { field: "fecha", operator: "<=", value: fechaFin }
    ]);
}

export async function addEgreso(
    tenantId: string,
    egreso: Omit<EgresoData, "id">
): Promise<string> {
    const res = await dbAdd(`tenants/${tenantId}/egresos`, egreso);
    return res.id;
}

export async function deleteEgreso(
    tenantId: string,
    egresoId: string
): Promise<void> {
    await dbDelete(`tenants/${tenantId}/egresos`, egresoId);
}

// ──────────────────────────────────────────────
// Ingresos por Créditos via Proxy
// ──────────────────────────────────────────────

export async function getIngresosCreditosDelDia(
    tenantId: string,
    fecha: string
): Promise<IngresoCredito[]> {
    return await dbList(`tenants/${tenantId}/ingresos_creditos`, [
        { field: "fecha", operator: "==", value: fecha }
    ]);
}

export async function getIngresosCreditosDelPeriodo(
    tenantId: string,
    fechaInicio: string,
    fechaFin: string
): Promise<IngresoCredito[]> {
    return await dbList(`tenants/${tenantId}/ingresos_creditos`, [
        { field: "fecha", operator: ">=", value: fechaInicio },
        { field: "fecha", operator: "<=", value: fechaFin }
    ]);
}

export async function addIngresoCredito(
    tenantId: string,
    ingreso: Omit<IngresoCredito, "id">
): Promise<string> {
    const res = await dbAdd(`tenants/${tenantId}/ingresos_creditos`, ingreso);
    return res.id;
}

// ──────────────────────────────────────────────
// Resumen consolidado
// ──────────────────────────────────────────────

export function buildResumen(
    turnos: TurnoDB[],
    egresos: EgresoData[],
    ingresosCreditos: IngresoCredito[] = []
): ResumenReporte {
    const ingresosTurnos = calcularIngresos(turnos);

    let cEfectivo = 0;
    let cTransferencia = 0;
    for (const c of ingresosCreditos) {
        if (c.metodo === "EFECTIVO") cEfectivo += c.monto;
        else cTransferencia += c.monto;
    }

    const ingresos = {
        efectivo: ingresosTurnos.efectivo + cEfectivo,
        transferencia: ingresosTurnos.transferencia + cTransferencia,
        total: ingresosTurnos.total + cEfectivo + cTransferencia
    };

    let eEfectivo = 0;
    let eTransferencia = 0;
    for (const e of egresos) {
        if (e.metodo === "EFECTIVO") eEfectivo += e.monto;
        else eTransferencia += e.monto;
    }

    const eTotal = eEfectivo + eTransferencia;

    return {
        ingresos,
        egresos: {
            efectivo: eEfectivo,
            transferencia: eTransferencia,
            total: eTotal,
            items: egresos,
        },
        creditos: {
            efectivo: cEfectivo,
            transferencia: cTransferencia,
            total: cEfectivo + cTransferencia,
            items: ingresosCreditos
        },
        totalTurnos: turnos.length,
        balance: ingresos.total - eTotal,
    };
}
