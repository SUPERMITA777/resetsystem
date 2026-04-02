"use client";

import React, { useState, useEffect } from "react";
import { TurnoDB } from "@/lib/services/agendaService";
import { clienteService, Cliente } from "@/lib/services/clienteService";
import { historiaClinicaService, EntradaHistoria } from "@/lib/services/historiaClinicaService";
import { UserProfile } from "@/lib/services/userService";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    X,
    Clock,
    User,
    Phone,
    FileText,
    Plus,
    ChevronDown,
    ChevronUp,
    Loader2,
    AlertCircle,
    ClipboardList,
    Stethoscope,
    CalendarDays,
    CheckCircle2,
    UserPlus
} from "lucide-react";
import toast from "react-hot-toast";

interface TurnoDetailPanelProps {
    turno: TurnoDB | null;
    isOpen: boolean;
    onClose: () => void;
    profesional: UserProfile | null;
    tenantId: string;
}

export function TurnoDetailPanel({ turno, isOpen, onClose, profesional, tenantId }: TurnoDetailPanelProps) {
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [historia, setHistoria] = useState<EntradaHistoria[]>([]);
    const [loadingCliente, setLoadingCliente] = useState(false);
    const [loadingHistoria, setLoadingHistoria] = useState(false);
    const [savingNota, setSavingNota] = useState(false);
    const [nuevaNota, setNuevaNota] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [clienteNotFound, setClienteNotFound] = useState(false);

    useEffect(() => {
        if (isOpen && turno) {
            loadClienteYHistoria();
            setNuevaNota("");
            setShowForm(false);
        }
    }, [isOpen, turno]);

    const getArgentinaTime = () => {
        const formatter = new Intl.DateTimeFormat("sv-SE", {
            timeZone: "America/Argentina/Buenos_Aires",
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit",
            hour12: false
        });
        const parts = formatter.formatToParts(new Date());
        const get = (t: string) => parts.find(p => p.type === t)?.value || "";
        return {
            fecha: `${get("year")}-${get("month")}-${get("day")}`,
            hora: `${get("hour")}:${get("minute")}`
        };
    };

    const loadClienteYHistoria = async () => {
        if (!turno) return;
        const wa = (turno.whatsapp || turno.clienteWhatsapp || "").replace(/\D/g, "");

        setLoadingCliente(true);
        setLoadingHistoria(true);
        setCliente(null);
        setHistoria([]);
        setClienteNotFound(false);

        try {
            let found: Cliente | null = null;
            if (wa) {
                found = await clienteService.getClienteByTelefono(tenantId, wa);
            }

            if (found) {
                setCliente(found);
                setClienteNotFound(false);
                // Load historia
                const hist = await historiaClinicaService.getHistoria(tenantId, found.id);
                setHistoria(hist);
            } else {
                setClienteNotFound(true);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar datos del cliente");
        } finally {
            setLoadingCliente(false);
            setLoadingHistoria(false);
        }
    };

    const handleCrearFicha = async () => {
        if (!turno) return;
        const wa = (turno.whatsapp || turno.clienteWhatsapp || "").replace(/\D/g, "");
        const nameParts = (turno.clienteAbreviado || "").trim().split(" ");
        try {
            const newId = await clienteService.createCliente(tenantId, {
                nombre: nameParts[0] || "Cliente",
                apellido: nameParts.slice(1).join(" ") || "",
                telefono: wa,
                tenantId
            });
            const newCliente: Cliente = {
                id: newId,
                nombre: nameParts[0] || "Cliente",
                apellido: nameParts.slice(1).join(" ") || "",
                telefono: wa,
                tenantId
            };
            setCliente(newCliente);
            setClienteNotFound(false);
            setHistoria([]);
            toast.success("Ficha creada exitosamente");
        } catch (error) {
            toast.error("Error al crear ficha");
        }
    };

    const handleGuardarNota = async () => {
        if (!turno || !cliente || !nuevaNota.trim()) {
            if (!nuevaNota.trim()) toast.error("La nota no puede estar vacía");
            return;
        }

        setSavingNota(true);
        try {
            const { fecha, hora } = getArgentinaTime();
            const subNames = (turno.subtratamientosSnap || []).map(s => s.nombre).join(", ");

            await historiaClinicaService.addEntrada(tenantId, cliente.id, {
                fecha,
                hora,
                profesionalId: profesional?.uid || "",
                profesionalNombre: profesional?.displayName || profesional?.email || "Profesional",
                tratamiento: turno.tratamientoAbreviado || "",
                subtratamiento: subNames,
                nota: nuevaNota.trim()
            });

            toast.success("Nota guardada en la historia clínica");
            setNuevaNota("");
            setShowForm(false);
            // Reload historia
            const hist = await historiaClinicaService.getHistoria(tenantId, cliente.id);
            setHistoria(hist);
        } catch (error) {
            toast.error("Error al guardar la nota");
        } finally {
            setSavingNota(false);
        }
    };

    if (!isOpen || !turno) return null;

    const subtratamientosNombres = (turno.subtratamientosSnap || []).map(s => s.nombre).join(" • ");
    const fechaFormateada = turno.fecha
        ? format(new Date(turno.fecha + "T12:00:00"), "EEEE d 'de' MMMM, yyyy", { locale: es })
        : "";

    const statusColor: Record<string, string> = {
        CONFIRMADO: "bg-emerald-50 text-emerald-700 border-emerald-200",
        COMPLETADO: "bg-blue-50 text-blue-700 border-blue-200",
        RESERVADO: "bg-orange-50 text-orange-700 border-orange-200",
        PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
        CANCELADO: "bg-red-50 text-red-700 border-red-200",
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg flex flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-black text-white">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Detalle del Turno</p>
                        <h2 className="text-2xl font-black uppercase tracking-tight truncate">{turno.clienteAbreviado}</h2>
                        <p className="text-sm font-bold text-gray-300 mt-1 capitalize">{fechaFormateada}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all flex-shrink-0"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Turno Info */}
                    <section className="bg-gray-50 rounded-3xl p-5 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <CalendarDays className="w-4 h-4 text-gray-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Info del Turno</span>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <span className="text-lg font-black text-gray-900">{turno.horaInicio?.substring(0, 5)}</span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor[turno.status || "RESERVADO"] || statusColor["RESERVADO"]}`}>
                                {turno.status || "RESERVADO"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-black text-gray-900">{turno.tratamientoAbreviado}</p>
                            {subtratamientosNombres && (
                                <p className="text-[11px] font-bold text-gray-500">{subtratamientosNombres}</p>
                            )}
                        </div>
                        {turno.duracionMinutos && (
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{turno.duracionMinutos} minutos</p>
                        )}
                    </section>

                    {/* Cliente Info */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cliente</span>
                        </div>

                        {loadingCliente ? (
                            <div className="flex items-center gap-2 text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs font-bold">Buscando ficha...</span>
                            </div>
                        ) : clienteNotFound ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                    <p className="text-xs font-bold text-amber-700">Este cliente no tiene ficha registrada</p>
                                </div>
                                <p className="text-xs text-amber-600 font-medium">Podés crear su ficha para habilitar la historia clínica.</p>
                                <button
                                    onClick={handleCrearFicha}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all"
                                >
                                    <UserPlus className="w-3.5 h-3.5" /> Crear Ficha de Cliente
                                </button>
                            </div>
                        ) : cliente ? (
                            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2">
                                <p className="text-base font-black text-gray-900">{cliente.nombre} {cliente.apellido}</p>
                                {cliente.telefono && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs font-bold text-gray-500">{cliente.telefono}</span>
                                    </div>
                                )}
                                {cliente.notas && (
                                    <p className="text-xs text-gray-400 font-medium border-t border-gray-50 pt-2 mt-2 italic">{cliente.notas}</p>
                                )}
                            </div>
                        ) : null}
                    </section>

                    {/* Historia Clínica */}
                    {!clienteNotFound && cliente && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-gray-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Historia Clínica</span>
                                </div>
                                {!showForm && (
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all"
                                    >
                                        <Plus className="w-3 h-3" /> Agregar Nota
                                    </button>
                                )}
                            </div>

                            {/* New entry form */}
                            {showForm && (
                                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4 text-gray-500" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nueva Entrada</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-400">
                                        <div className="bg-white rounded-xl p-2 border border-gray-100">
                                            <span className="text-[9px] uppercase tracking-widest block mb-0.5">Tratamiento</span>
                                            <span className="text-gray-700 font-black text-xs truncate block">{turno.tratamientoAbreviado}</span>
                                        </div>
                                        <div className="bg-white rounded-xl p-2 border border-gray-100">
                                            <span className="text-[9px] uppercase tracking-widest block mb-0.5">Profesional</span>
                                            <span className="text-gray-700 font-black text-xs truncate block">{profesional?.displayName || profesional?.email?.split("@")[0] || "Yo"}</span>
                                        </div>
                                    </div>
                                    <textarea
                                        value={nuevaNota}
                                        onChange={(e) => setNuevaNota(e.target.value)}
                                        placeholder="Escribí las observaciones del tratamiento realizado, evolución del cliente, materiales utilizados, etc."
                                        className="w-full min-h-[120px] p-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-black/10 resize-none transition-all"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setShowForm(false); setNuevaNota(""); }}
                                            className="flex-1 h-11 px-4 bg-white border border-gray-200 text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleGuardarNota}
                                            disabled={savingNota || !nuevaNota.trim()}
                                            className="flex-1 h-11 px-4 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {savingNota ? (
                                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</>
                                            ) : (
                                                <><CheckCircle2 className="w-3.5 h-3.5" /> Guardar Nota</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Historia list */}
                            {loadingHistoria ? (
                                <div className="flex items-center gap-2 py-4 text-gray-400">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-xs font-bold">Cargando historia...</span>
                                </div>
                            ) : historia.length === 0 ? (
                                <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sin entradas anteriores</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {historia.map((entrada, idx) => (
                                        <div
                                            key={entrada.id || idx}
                                            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-gray-200 transition-all"
                                        >
                                            {/* Entry header */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                                                        {entrada.fecha} · {entrada.hora}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                        {entrada.profesionalNombre}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{entrada.tratamiento}</p>
                                                    {entrada.subtratamiento && (
                                                        <p className="text-[9px] font-bold text-gray-400 mt-0.5">{entrada.subtratamiento}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Nota */}
                                            <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap border-t border-gray-50 pt-3">
                                                {entrada.nota}
                                            </p>
                                            {/* Read-only badge */}
                                            <div className="mt-3 flex justify-end">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-300 flex items-center gap-1">
                                                    🔒 Solo lectura
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}
