"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import {
    CalendarDays, ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
    Calendar as CalendarIcon, Banknote, CreditCard, Plus, Trash2,
    Activity, BarChart3, RefreshCw, Wallet, ArrowUpCircle, ArrowDownCircle, Scale, Tag
} from "lucide-react";
import { format, addDays, subDays, startOfMonth, endOfMonth, addMonths, subMonths, parse } from "date-fns";
import { es } from "date-fns/locale";
import { getTurnosPorFecha, getTurnosPorRango, TurnoDB } from "@/lib/services/agendaService";
import {
    getEgresosDelDia, getEgresosDelPeriodo, addEgreso, deleteEgreso,
    buildResumen, EgresoData, ResumenReporte
} from "@/lib/services/reportesService";
import toast, { Toaster } from "react-hot-toast";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

// ──────────────────────────────────────────────
// Summary cards
// ──────────────────────────────────────────────
function SummaryCard({
    label, value, sub, color, icon: Icon
}: {
    label: string; value: string; sub?: string; color: string; icon: React.ElementType
}) {
    return (
        <div className={`rounded-2xl p-5 flex flex-col gap-2 ${color}`}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest opacity-70">{label}</span>
                <Icon className="w-5 h-5 opacity-60" />
            </div>
            <span className="text-3xl font-black tracking-tight">{value}</span>
            {sub && <span className="text-xs font-semibold opacity-60">{sub}</span>}
        </div>
    );
}

// ──────────────────────────────────────────────
// Payments breakdown table
// ──────────────────────────────────────────────
function MetodoRow({ label, icon: Icon, monto, color }: { label: string; icon: React.ElementType; monto: number; color: string }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-gray-700">{label}</span>
            </div>
            <span className="font-black text-gray-900">{formatCurrency(monto)}</span>
        </div>
    );
}

// ──────────────────────────────────────────────
// Turno row in the list – with seña/saldo detail
// ──────────────────────────────────────────────
function PaymentTag({ label, monto, metodo, color }: { label: string; monto: number; metodo?: string; color: string }) {
    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${color}`}>
            {metodo === "EFECTIVO" ? <Banknote className="w-3 h-3" /> : metodo === "TRANSFERENCIA" ? <CreditCard className="w-3 h-3" /> : null}
            <span>{label}: {formatCurrency(monto)}</span>
        </div>
    );
}

function TurnoRow({ turno }: { turno: TurnoDB }) {
    // Build payment breakdown
    const hasSena = (turno.sena ?? 0) > 0;
    const hasSaldo = (turno.pagoSaldo ?? 0) > 0;
    const hasHistorial = turno.historialPagos && turno.historialPagos.length > 0;
    const hasDescuento = !!turno.motivoSaldo || ((turno.ajustePrecio ?? 0) !== 0);

    const totalPagado = hasHistorial
        ? turno.historialPagos!.reduce((s, p) => s + p.monto, 0)
        : (turno.sena ?? 0) + (turno.pagoSaldo ?? 0);

    return (
        <div className="py-3 border-b border-gray-50 last:border-0">
            <div className="flex items-start justify-between gap-4">
                {/* Left: date + client info */}
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-black text-gray-400 uppercase leading-none">{format(new Date(turno.fecha + "T12:00:00"), "MMM", { locale: es })}</span>
                        <span className="text-sm font-black text-gray-800 leading-none">{format(new Date(turno.fecha + "T12:00:00"), "dd")}</span>
                    </div>
                    <div>
                        <p className="font-bold text-sm text-gray-900">{turno.clienteAbreviado}</p>
                        <p className="text-xs text-gray-400 font-medium">{turno.horaInicio} · {turno.tratamientoAbreviado}</p>
                        {/* Payment tags */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {hasHistorial ? (
                                turno.historialPagos!.map((p, i) => (
                                    <PaymentTag
                                        key={i}
                                        label={p.tipo === "SEÑA" ? "Seña" : "Saldo"}
                                        monto={p.monto}
                                        metodo={p.metodo}
                                        color={p.tipo === "SEÑA" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-700"}
                                    />
                                ))
                            ) : (
                                <>
                                    {hasSena && (
                                        <PaymentTag label="Seña" monto={turno.sena!} metodo={turno.metodoPagoSena} color="bg-blue-50 text-blue-600" />
                                    )}
                                    {hasSaldo && (
                                        <PaymentTag label="Saldo" monto={turno.pagoSaldo!} metodo={turno.metodoPagoSaldo} color="bg-emerald-50 text-emerald-700" />
                                    )}
                                </>
                            )}
                            {/* Discount reason */}
                            {hasDescuento && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-600">
                                    <Tag className="w-3 h-3" />
                                    {turno.motivoSaldo
                                        ? turno.motivoSaldo
                                        : `Ajuste ${turno.ajustePrecio! > 0 ? '+' : ''}${formatCurrency(turno.ajustePrecio!)}`}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Right: total */}
                <div className="text-right shrink-0">
                    {totalPagado > 0
                        ? <span className="font-black text-emerald-600">{formatCurrency(totalPagado)}</span>
                        : <span className="text-xs text-gray-300 font-medium">Sin pago</span>
                    }
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// Egreso row
// ──────────────────────────────────────────────
function EgresoRow({ egreso, onDelete }: { egreso: EgresoData; onDelete: () => void }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 group">
            <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${egreso.metodo === "EFECTIVO" ? "bg-amber-50" : "bg-purple-50"}`}>
                    {egreso.metodo === "EFECTIVO"
                        ? <Banknote className="w-4 h-4 text-amber-600" />
                        : <CreditCard className="w-4 h-4 text-purple-600" />
                    }
                </div>
                <div>
                    <p className="font-bold text-sm text-gray-900">{egreso.motivo}</p>
                    <p className="text-xs text-gray-400">{egreso.metodo === "EFECTIVO" ? "Efectivo" : "Transferencia"}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="font-black text-red-500">{formatCurrency(egreso.monto)}</span>
                <button
                    onClick={onDelete}
                    className="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 active:scale-90"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// Add Egreso inline form
// ──────────────────────────────────────────────
function AddEgresoForm({ onAdd }: { onAdd: (motivo: string, monto: number, metodo: "EFECTIVO" | "TRANSFERENCIA") => Promise<void> }) {
    const [motivo, setMotivo] = useState("");
    const [monto, setMonto] = useState("");
    const [metodo, setMetodo] = useState<"EFECTIVO" | "TRANSFERENCIA">("EFECTIVO");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const n = parseFloat(monto);
        if (!motivo.trim() || isNaN(n) || n <= 0) return;
        setSaving(true);
        await onAdd(motivo.trim(), n, metodo);
        setMotivo(""); setMonto("");
        setSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 bg-gray-50 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
            <input
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Motivo del gasto..."
                className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-black/10 transition-all"
            />
            <input
                type="number"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                placeholder="Monto"
                className="w-32 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-black/10 transition-all"
                min="0"
            />
            <select
                value={metodo}
                onChange={e => setMetodo(e.target.value as any)}
                className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-black/10 transition-all"
            >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
            </select>
            <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
            >
                <Plus className="w-4 h-4" />
                Agregar
            </button>
        </form>
    );
}

// ──────────────────────────────────────────────
// Simple Bar Chart (pure CSS)
// ──────────────────────────────────────────────
function BarChartSimple({ data }: { data: { label: string; ingresos: number; egresos: number }[] }) {
    if (data.length === 0) return <p className="text-xs text-gray-300 text-center py-8">Sin datos para graficar</p>;
    const max = Math.max(...data.map(d => Math.max(d.ingresos, d.egresos)), 1);
    return (
        <div className="flex items-end gap-2 h-40 px-2">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-1 items-end h-32">
                        <div
                            className="flex-1 bg-emerald-400 rounded-t-lg transition-all duration-500"
                            style={{ height: `${(d.ingresos / max) * 100}%` }}
                            title={`Ingresos: ${formatCurrency(d.ingresos)}`}
                        />
                        <div
                            className="flex-1 bg-red-300 rounded-t-lg transition-all duration-500"
                            style={{ height: `${(d.egresos / max) * 100}%` }}
                            title={`Egresos: ${formatCurrency(d.egresos)}`}
                        />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap capitalize">{d.label}</span>
                </div>
            ))}
        </div>
    );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
export default function ReportesPage() {
    const [tab, setTab] = useState<"diario" | "mensual">("diario");

    // Diario
    const [diaFecha, setDiaFecha] = useState(new Date());
    const [diaTurnos, setDiaTurnos] = useState<TurnoDB[]>([]);
    const [diaEgresos, setDiaEgresos] = useState<EgresoData[]>([]);
    const [diaResumen, setDiaResumen] = useState<ResumenReporte | null>(null);
    const [diaLoading, setDiaLoading] = useState(false);

    // Mensual
    const [mesDate, setMesDate] = useState(new Date());
    const [mesTurnos, setMesTurnos] = useState<TurnoDB[]>([]);
    const [mesEgresos, setMesEgresos] = useState<EgresoData[]>([]);
    const [mesResumen, setMesResumen] = useState<ResumenReporte | null>(null);
    const [mesLoading, setMesLoading] = useState(false);

    const currentTenant = typeof window !== "undefined" ? localStorage.getItem("currentTenant") || "resetspa" : "resetspa";

    // ── Load daily ──
    const loadDia = useCallback(async (fecha: Date) => {
        setDiaLoading(true);
        try {
            const fechaStr = format(fecha, "yyyy-MM-dd");
            const [turnos, egresos] = await Promise.all([
                getTurnosPorFecha(currentTenant, fechaStr),
                getEgresosDelDia(currentTenant, fechaStr),
            ]);
            setDiaTurnos(turnos);
            setDiaEgresos(egresos);
            setDiaResumen(buildResumen(turnos, egresos));
        } catch {
            toast.error("Error al cargar el reporte diario");
        } finally {
            setDiaLoading(false);
        }
    }, [currentTenant]);

    // ── Load monthly ──
    const loadMes = useCallback(async (fecha: Date) => {
        setMesLoading(true);
        try {
            const inicio = format(startOfMonth(fecha), "yyyy-MM-dd");
            const fin = format(endOfMonth(fecha), "yyyy-MM-dd");
            const [turnos, egresos] = await Promise.all([
                getTurnosPorRango(currentTenant, inicio, fin),
                getEgresosDelPeriodo(currentTenant, inicio, fin),
            ]);
            setMesTurnos(turnos);
            setMesEgresos(egresos);
            setMesResumen(buildResumen(turnos, egresos));
        } catch {
            toast.error("Error al cargar el reporte mensual");
        } finally {
            setMesLoading(false);
        }
    }, [currentTenant]);

    useEffect(() => { loadDia(diaFecha); }, [diaFecha]);
    useEffect(() => { loadMes(mesDate); }, [mesDate]);

    // ── Add egreso ──
    const handleAddEgreso = async (motivo: string, monto: number, metodo: "EFECTIVO" | "TRANSFERENCIA") => {
        try {
            const fechaStr = format(diaFecha, "yyyy-MM-dd");
            const id = await addEgreso(currentTenant, { motivo, monto, metodo, fecha: fechaStr });
            const nuevo: EgresoData = { id, motivo, monto, metodo, fecha: fechaStr };
            const updated = [...diaEgresos, nuevo];
            setDiaEgresos(updated);
            setDiaResumen(buildResumen(diaTurnos, updated));
            toast.success("Egreso registrado");
        } catch {
            toast.error("Error al guardar el egreso");
        }
    };

    // ── Delete egreso ──
    const handleDeleteEgreso = async (egresoId: string) => {
        try {
            await deleteEgreso(currentTenant, egresoId);
            const updated = diaEgresos.filter(e => e.id !== egresoId);
            setDiaEgresos(updated);
            setDiaResumen(buildResumen(diaTurnos, updated));
            toast.success("Egreso eliminado");
        } catch {
            toast.error("Error al eliminar el egreso");
        }
    };

    // ── Monthly chart data (weekly buckets) ──
    const chartData = React.useMemo(() => {
        const weeks: { label: string; ingresos: number; egresos: number }[] = [];
        const inicio = startOfMonth(mesDate);
        const fin = endOfMonth(mesDate);

        let cursor = inicio;
        let weekNum = 1;
        while (cursor <= fin) {
            const weekEnd = addDays(cursor, 6);
            const wLabel = `Sem ${weekNum}`;
            const wTurnos = mesTurnos.filter(t => t.fecha >= format(cursor, "yyyy-MM-dd") && t.fecha <= format(weekEnd > fin ? fin : weekEnd, "yyyy-MM-dd"));
            const wEgresos = mesEgresos.filter(e => e.fecha >= format(cursor, "yyyy-MM-dd") && e.fecha <= format(weekEnd > fin ? fin : weekEnd, "yyyy-MM-dd"));
            const ing = buildResumen(wTurnos, wEgresos).ingresos.total;
            const eg = buildResumen(wTurnos, wEgresos).egresos.total;
            weeks.push({ label: wLabel, ingresos: ing, egresos: eg });
            cursor = addDays(weekEnd, 1);
            weekNum++;
        }
        return weeks;
    }, [mesTurnos, mesEgresos, mesDate]);

    const loading = tab === "diario" ? diaLoading : mesLoading;

    return (
        <AdminLayout>
            <Toaster />
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tight text-gray-900">Reportes</h1>
                        <p className="text-gray-400 font-medium text-sm mt-0.5">Ingresos, egresos y resumen de actividad</p>
                    </div>
                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-2xl self-start">
                        <button
                            onClick={() => setTab("diario")}
                            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${tab === "diario" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Reporte Diario
                        </button>
                        <button
                            onClick={() => setTab("mensual")}
                            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${tab === "mensual" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Reporte Mensual
                        </button>
                    </div>
                </div>

                {/* ═══════════ DIARIO ═══════════ */}
                {tab === "diario" && (
                    <div className="flex flex-col gap-6">
                        {/* Date control */}
                        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
                            <div>
                                <p className="text-lg font-black text-gray-900 capitalize">
                                    {format(diaFecha, "EEEE d 'de' MMMM yyyy", { locale: es })}
                                </p>
                                <p className="text-xs text-gray-400 font-medium">Reporte Diario</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => loadDia(diaFecha)}
                                    className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all active:scale-90"
                                    title="Recargar"
                                >
                                    <RefreshCw className={`w-4 h-4 ${diaLoading ? "animate-spin" : ""}`} />
                                </button>
                                <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl p-0.5">
                                    <button onClick={() => setDiaFecha(subDays(diaFecha, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all">
                                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <div className="px-3 flex items-center gap-1.5">
                                        <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={format(diaFecha, "yyyy-MM-dd")}
                                            onChange={e => {
                                                const d = parse(e.target.value, "yyyy-MM-dd", new Date());
                                                if (!isNaN(d.getTime())) setDiaFecha(d);
                                            }}
                                            className="text-xs font-black bg-transparent outline-none cursor-pointer"
                                        />
                                    </div>
                                    <button onClick={() => setDiaFecha(addDays(diaFecha, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all">
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {diaLoading ? <LoadingSpinner label="Cargando reporte..." /> : (
                            <>
                                {/* Summary cards */}
                                {diaResumen && (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <SummaryCard
                                            label="Ingresos"
                                            value={formatCurrency(diaResumen.ingresos.total)}
                                            sub={`${diaResumen.totalTurnos} turnos`}
                                            icon={ArrowUpCircle}
                                            color="bg-emerald-50 text-emerald-800"
                                        />
                                        <SummaryCard
                                            label="Egresos"
                                            value={formatCurrency(diaResumen.egresos.total)}
                                            sub={`${diaResumen.egresos.items.length} gastos`}
                                            icon={ArrowDownCircle}
                                            color="bg-red-50 text-red-800"
                                        />
                                        <SummaryCard
                                            label="Turnos"
                                            value={String(diaResumen.totalTurnos)}
                                            sub="agendados hoy"
                                            icon={CalendarDays}
                                            color="bg-blue-50 text-blue-800"
                                        />
                                        <SummaryCard
                                            label="Balance"
                                            value={formatCurrency(diaResumen.balance)}
                                            sub="ingresos - egresos"
                                            icon={Scale}
                                            color={diaResumen.balance >= 0 ? "bg-violet-50 text-violet-800" : "bg-orange-50 text-orange-800"}
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Ingresos por método */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Wallet className="w-4 h-4 text-emerald-500" />
                                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">Ingresos por Método</h2>
                                        </div>
                                        {diaResumen && diaResumen.ingresos.total > 0 ? (
                                            <>
                                                <MetodoRow label="Efectivo" icon={Banknote} monto={diaResumen.ingresos.efectivo} color="bg-amber-50 text-amber-600" />
                                                <MetodoRow label="Transferencia" icon={CreditCard} monto={diaResumen.ingresos.transferencia} color="bg-purple-50 text-purple-600" />
                                                <div className="flex items-center justify-between pt-3 mt-1">
                                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total</span>
                                                    <span className="font-black text-emerald-600 text-lg">{formatCurrency(diaResumen.ingresos.total)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <EmptyState label="Sin ingresos registrados" icon={Wallet} />
                                        )}
                                    </div>

                                    {/* Egresos */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TrendingDown className="w-4 h-4 text-red-500" />
                                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">Egresos del Día</h2>
                                        </div>
                                        {diaEgresos.length > 0 ? (
                                            diaEgresos.map(e => (
                                                <EgresoRow
                                                    key={e.id}
                                                    egreso={e}
                                                    onDelete={() => handleDeleteEgreso(e.id)}
                                                />
                                            ))
                                        ) : (
                                            <EmptyState label="Sin egresos registrados" icon={TrendingDown} />
                                        )}
                                        <AddEgresoForm onAdd={handleAddEgreso} />
                                    </div>
                                </div>

                                {/* Detalles del Día */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className="w-4 h-4 text-blue-500" />
                                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">
                                            Detalles del Día
                                            <span className="ml-2 text-gray-300 font-bold">({diaTurnos.length} turnos)</span>
                                        </h2>
                                    </div>
                                    {diaTurnos.length > 0 ? (
                                        diaTurnos
                                            .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                                            .map(t => <TurnoRow key={t.id} turno={t} />)
                                    ) : (
                                        <EmptyState label="Sin turnos para este día" icon={CalendarDays} />
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ═══════════ MENSUAL ═══════════ */}
                {tab === "mensual" && (
                    <div className="flex flex-col gap-6">
                        {/* Month control */}
                        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
                            <div>
                                <p className="text-lg font-black text-gray-900 capitalize">
                                    {format(mesDate, "MMMM yyyy", { locale: es })}
                                </p>
                                <p className="text-xs text-gray-400 font-medium">
                                    {format(startOfMonth(mesDate), "dd/MM")} — {format(endOfMonth(mesDate), "dd/MM/yyyy")}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => loadMes(mesDate)}
                                    className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all active:scale-90"
                                    title="Recargar"
                                >
                                    <RefreshCw className={`w-4 h-4 ${mesLoading ? "animate-spin" : ""}`} />
                                </button>
                                <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl p-0.5">
                                    <button onClick={() => setMesDate(subMonths(mesDate, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all">
                                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <span className="px-4 text-xs font-black capitalize">
                                        {format(mesDate, "MMM yyyy", { locale: es })}
                                    </span>
                                    <button onClick={() => setMesDate(addMonths(mesDate, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all">
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {mesLoading ? <LoadingSpinner label="Cargando reporte mensual..." /> : (
                            <>
                                {/* Summary cards */}
                                {mesResumen && (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <SummaryCard
                                            label="Ingresos"
                                            value={formatCurrency(mesResumen.ingresos.total)}
                                            sub={`${mesResumen.totalTurnos} turnos`}
                                            icon={TrendingUp}
                                            color="bg-emerald-50 text-emerald-800"
                                        />
                                        <SummaryCard
                                            label="Egresos"
                                            value={formatCurrency(mesResumen.egresos.total)}
                                            sub={`${mesResumen.egresos.items.length} gastos`}
                                            icon={TrendingDown}
                                            color="bg-red-50 text-red-800"
                                        />
                                        <SummaryCard
                                            label="Turnos"
                                            value={String(mesResumen.totalTurnos)}
                                            sub="en el período"
                                            icon={CalendarDays}
                                            color="bg-blue-50 text-blue-800"
                                        />
                                        <SummaryCard
                                            label="Balance"
                                            value={formatCurrency(mesResumen.balance)}
                                            sub="neto del mes"
                                            icon={BarChart3}
                                            color={mesResumen.balance >= 0 ? "bg-violet-50 text-violet-800" : "bg-orange-50 text-orange-800"}
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Ingresos por método mensual */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Wallet className="w-4 h-4 text-emerald-500" />
                                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">Ingresos por Método</h2>
                                        </div>
                                        {mesResumen && mesResumen.ingresos.total > 0 ? (
                                            <>
                                                <MetodoRow label="Efectivo" icon={Banknote} monto={mesResumen.ingresos.efectivo} color="bg-amber-50 text-amber-600" />
                                                <MetodoRow label="Transferencia" icon={CreditCard} monto={mesResumen.ingresos.transferencia} color="bg-purple-50 text-purple-600" />
                                                <div className="flex items-center justify-between pt-3 mt-1">
                                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total</span>
                                                    <span className="font-black text-emerald-600 text-lg">{formatCurrency(mesResumen.ingresos.total)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <EmptyState label="Sin ingresos en el período" icon={Wallet} />
                                        )}
                                    </div>

                                    {/* Gráfico semanal */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <BarChart3 className="w-4 h-4 text-violet-500" />
                                                <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">Ingresos vs Egresos</h2>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" />Ingresos</span>
                                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-300 inline-block" />Egresos</span>
                                            </div>
                                        </div>
                                        <BarChartSimple data={chartData} />
                                    </div>
                                </div>

                                {/* Egresos del mes */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingDown className="w-4 h-4 text-red-500" />
                                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">
                                            Egresos del Período
                                            <span className="ml-2 text-gray-300 font-bold">({mesEgresos.length})</span>
                                        </h2>
                                    </div>
                                    {mesEgresos.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                            {mesEgresos.sort((a, b) => a.fecha.localeCompare(b.fecha)).map(e => (
                                                <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-gray-400 font-bold w-16">{format(new Date(e.fecha + "T12:00:00"), "dd/MM")}</span>
                                                        <span className="text-sm font-semibold text-gray-700">{e.motivo}</span>
                                                    </div>
                                                    <span className="font-black text-red-500 text-sm">{formatCurrency(e.monto)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState label="Sin egresos en el período" icon={TrendingDown} />
                                    )}
                                </div>

                                {/* Detalles del Período */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className="w-4 h-4 text-blue-500" />
                                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">
                                            Detalles del Período
                                            <span className="ml-2 text-gray-300 font-bold">({mesTurnos.length} turnos)</span>
                                        </h2>
                                    </div>
                                    {mesTurnos.length > 0 ? (
                                        mesTurnos
                                            .sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`))
                                            .map(t => <TurnoRow key={t.id} turno={t} />)
                                    ) : (
                                        <EmptyState label="Sin turnos en el período" icon={CalendarDays} />
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

// ──────────────────────────────────────────────
// Utility sub-components
// ──────────────────────────────────────────────
function LoadingSpinner({ label }: { label: string }) {
    return (
        <div className="py-24 flex flex-col items-center gap-4">
            <div className="animate-spin w-10 h-10 border-[3px] border-black border-t-transparent rounded-full" />
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</span>
        </div>
    );
}

function EmptyState({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
    return (
        <div className="py-8 flex flex-col items-center gap-3 opacity-30">
            <Icon className="w-10 h-10" />
            <p className="text-xs font-black uppercase tracking-widest">{label}</p>
        </div>
    );
}
