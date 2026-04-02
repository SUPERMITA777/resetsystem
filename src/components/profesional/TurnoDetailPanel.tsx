"use client";

import React, { useState, useEffect, useRef } from "react";
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
    Loader2,
    AlertCircle,
    ClipboardList,
    Stethoscope,
    CalendarDays,
    CheckCircle2,
    UserPlus,
    Search,
    Link2,
} from "lucide-react";
import toast from "react-hot-toast";

interface TurnoDetailPanelProps {
    turno: TurnoDB | null;
    isOpen: boolean;
    onClose: () => void;
    profesional: UserProfile | null;
    tenantId: string;
}

type NotFoundMode = 'options' | 'search';

export function TurnoDetailPanel({ turno, isOpen, onClose, profesional, tenantId }: TurnoDetailPanelProps) {
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [historia, setHistoria] = useState<EntradaHistoria[]>([]);
    const [loadingCliente, setLoadingCliente] = useState(false);
    const [loadingHistoria, setLoadingHistoria] = useState(false);
    const [savingNota, setSavingNota] = useState(false);
    const [nuevaNota, setNuevaNota] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [clienteNotFound, setClienteNotFound] = useState(false);
    const [notFoundMode, setNotFoundMode] = useState<NotFoundMode>('options');

    // Search-by-name state
    const [allClientes, setAllClientes] = useState<Cliente[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Cliente[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [linkingCliente, setLinkingCliente] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && turno) {
            setNuevaNota("");
            setShowForm(false);
            setNotFoundMode('options');
            setSearchQuery("");
            setSearchResults([]);
            loadClienteYHistoria();
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

    const loadAllClientes = async () => {
        if (allClientes.length > 0) return; // ya cargado
        setLoadingSearch(true);
        try {
            const data = await clienteService.getClientes(tenantId);
            setAllClientes(data);
        } catch {
            toast.error("Error al cargar clientes");
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleStartSearch = async () => {
        setNotFoundMode('search');
        await loadAllClientes();
        setTimeout(() => searchRef.current?.focus(), 100);
    };

    const handleSearch = (val: string) => {
        setSearchQuery(val);
        if (!val.trim()) {
            setSearchResults([]);
            return;
        }
        const q = val.toLowerCase();
        setSearchResults(
            allClientes.filter(c =>
                `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
                c.telefono.includes(val)
            ).slice(0, 8)
        );
    };

    /** Vincular un cliente existente: actualiza su teléfono al actual y carga su historia */
    const handleVincularCliente = async (found: Cliente) => {
        if (!turno) return;
        setLinkingCliente(true);
        try {
            const wa = (turno.whatsapp || turno.clienteWhatsapp || "").replace(/\D/g, "");
            // Actualizar teléfono si cambió
            if (wa && found.telefono !== wa) {
                await clienteService.updateCliente(tenantId, found.id, { telefono: wa });
                found = { ...found, telefono: wa };
            }
            setCliente(found);
            setClienteNotFound(false);
            setNotFoundMode('options');
            const hist = await historiaClinicaService.getHistoria(tenantId, found.id);
            setHistoria(hist);
            toast.success(`Historia clínica de ${found.nombre} ${found.apellido} vinculada`);
        } catch {
            toast.error("Error al vincular cliente");
        } finally {
            setLinkingCliente(false);
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
            toast.success("Ficha creada. ¡Ya podés registrar la historia clínica!");
        } catch {
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
            const hist = await historiaClinicaService.getHistoria(tenantId, cliente.id);
            setHistoria(hist);
        } catch {
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
                <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-black text-white flex-shrink-0">
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
                        <div className="flex items-center gap-3 flex-wrap">
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
                        {turno.duracionMinutos > 0 && (
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{turno.duracionMinutos} minutos</p>
                        )}
                    </section>

                    {/* Cliente */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cliente</span>
                        </div>

                        {loadingCliente ? (
                            <div className="flex items-center gap-2 text-gray-400 py-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs font-bold">Buscando ficha...</span>
                            </div>
                        ) : clienteNotFound ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
                                {/* Header warning */}
                                <div className="p-4 flex items-start gap-3">
                                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black text-amber-800">Sin ficha registrada para este número</p>
                                        <p className="text-[11px] text-amber-600 font-medium mt-0.5">¿El cliente cambió de WhatsApp? Podés buscarlo por nombre.</p>
                                    </div>
                                </div>

                                {notFoundMode === 'options' ? (
                                    /* Two action buttons */
                                    <div className="grid grid-cols-2 gap-px bg-amber-200">
                                        <button
                                            onClick={handleCrearFicha}
                                            className="flex flex-col items-center gap-1.5 p-4 bg-white hover:bg-amber-50 transition-all text-center"
                                        >
                                            <UserPlus className="w-5 h-5 text-amber-600" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Crear Ficha</span>
                                            <span className="text-[9px] text-amber-500 font-medium">Nueva con estos datos</span>
                                        </button>
                                        <button
                                            onClick={handleStartSearch}
                                            className="flex flex-col items-center gap-1.5 p-4 bg-white hover:bg-amber-50 transition-all text-center"
                                        >
                                            <Search className="w-5 h-5 text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Buscar por Nombre</span>
                                            <span className="text-[9px] text-blue-400 font-medium">Unir con ficha existente</span>
                                        </button>
                                    </div>
                                ) : (
                                    /* Search mode */
                                    <div className="p-4 bg-white space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <button
                                                onClick={() => setNotFoundMode('options')}
                                                className="text-[9px] font-black text-gray-400 hover:text-black uppercase tracking-widest transition-colors"
                                            >
                                                ← Volver
                                            </button>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Buscar cliente existente</span>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                                            <input
                                                ref={searchRef}
                                                type="text"
                                                placeholder="Nombre, apellido o teléfono..."
                                                value={searchQuery}
                                                onChange={e => handleSearch(e.target.value)}
                                                className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-black/10 transition-all"
                                            />
                                        </div>

                                        {loadingSearch ? (
                                            <div className="flex items-center gap-2 py-2 text-gray-400">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span className="text-xs font-bold">Cargando clientes...</span>
                                            </div>
                                        ) : searchQuery && searchResults.length === 0 ? (
                                            <p className="text-[10px] font-bold text-gray-400 text-center py-3">Sin resultados para "{searchQuery}"</p>
                                        ) : (
                                            <div className="space-y-1 max-h-52 overflow-y-auto">
                                                {searchResults.map(c => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => handleVincularCliente(c)}
                                                        disabled={linkingCliente}
                                                        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all group disabled:opacity-50"
                                                    >
                                                        <div className="text-left">
                                                            <p className="text-xs font-black text-gray-900 group-hover:text-white">{c.nombre} {c.apellido}</p>
                                                            <p className="text-[9px] font-bold text-gray-400 group-hover:text-gray-300">{c.telefono}</p>
                                                        </div>
                                                        <Link2 className="w-3.5 h-3.5 text-gray-300 group-hover:text-white" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {!searchQuery && (
                                            <p className="text-[9px] text-gray-400 font-medium text-center">
                                                Al vincular, se actualizará el teléfono del cliente con el número del turno.
                                            </p>
                                        )}
                                    </div>
                                )}
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

                    {/* Historia Clínica — solo si hay cliente */}
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

                            {/* Form nueva nota */}
                            {showForm && (
                                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4 text-gray-500" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nueva Entrada</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                                            <span className="text-[9px] uppercase tracking-widest text-gray-400 block mb-0.5">Tratamiento</span>
                                            <span className="text-gray-800 font-black text-xs truncate block">{turno.tratamientoAbreviado}</span>
                                        </div>
                                        <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                                            <span className="text-[9px] uppercase tracking-widest text-gray-400 block mb-0.5">Profesional</span>
                                            <span className="text-gray-800 font-black text-xs truncate block">{profesional?.displayName || profesional?.email?.split("@")[0] || "Yo"}</span>
                                        </div>
                                    </div>
                                    <textarea
                                        value={nuevaNota}
                                        onChange={(e) => setNuevaNota(e.target.value)}
                                        placeholder="Observaciones del tratamiento, evolución del cliente, materiales utilizados, indicaciones para próxima sesión..."
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
                                            {savingNota
                                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</>
                                                : <><CheckCircle2 className="w-3.5 h-3.5" /> Guardar Nota</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Lista de entradas */}
                            {loadingHistoria ? (
                                <div className="flex items-center gap-2 py-4 text-gray-400">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-xs font-bold">Cargando historia...</span>
                                </div>
                            ) : historia.length === 0 ? (
                                <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sin entradas anteriores</p>
                                    <p className="text-[9px] text-gray-300 font-medium mt-1">Usá "Agregar Nota" para iniciar la historia clínica</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {historia.map((entrada, idx) => (
                                        <div
                                            key={entrada.id || idx}
                                            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
                                        >
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
                                            <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap border-t border-gray-50 pt-3">
                                                {entrada.nota}
                                            </p>
                                            <div className="mt-3 flex justify-end">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-300">🔒 Solo lectura</span>
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
