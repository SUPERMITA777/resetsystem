"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Settings, LayoutGrid, CalendarDays, Calendar as CalendarMonth } from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { AgendaGrid } from "@/components/agenda/AgendaGrid";
import { NuevoTurnoModal } from "@/components/agenda/NuevoTurnoModal";
import { TurnoClaseModal } from "@/components/agenda/TurnoClaseModal";
import { InscriptosModal } from "@/components/admin/clases/InscriptosModal";
import { AddCreditsModal } from "@/components/admin/clientes/AddCreditsModal";
import { AgendaSettingsModal } from "@/components/agenda/AgendaSettingsModal";
import { clienteService, Cliente } from "@/lib/services/clienteService";
import { claseService, Clase } from "@/lib/services/claseService";
import { getTurnosPorFecha, getTurnosPorRango, createTurno, updateTurno, updateTurnoPosicion } from "@/lib/services/agendaService";
import { getTenant, createOrUpdateTenant, TenantData } from "@/lib/services/tenantService";
import { getBoxNames, setBoxName } from "@/lib/services/boxNamesService";
import { TurnoData } from "@/components/agenda/TurnoCard";
import toast from "react-hot-toast";

export default function AgendaPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClaseModalOpen, setIsClaseModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [view, setView] = useState<'diaria' | 'semanal' | 'mensual'>('diaria');
    const [turnos, setTurnos] = useState<TurnoData[]>([]);
    const [loading, setLoading] = useState(true);
    const [boxesCount, setBoxesCount] = useState(3);
    const [agendaConfig, setAgendaConfig] = useState<any>({
        intervalo: 60,
        horario_inicio: "09:00",
        horario_fin: "21:00"
    });
    const [modalInitialData, setModalInitialData] = useState<{ fecha?: string, boxId?: string, hora?: string, turno?: TurnoData | null }>({
        fecha: format(new Date(), 'yyyy-MM-dd'),
        boxId: 'box-1',
        hora: '09:00',
        turno: null
    });
    const [boxNames, setBoxNames] = useState<Record<string, string>>({});
    
    // Inscriptos Modal
    const [isInscriptosModalOpen, setIsInscriptosModalOpen] = useState(false);
    const [selectedClaseForInscriptos, setSelectedClaseForInscriptos] = useState<Clase | null>(null);

    // Add Credits Modal
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
    const [selectedClienteForCredits, setSelectedClienteForCredits] = useState<Cliente | null>(null);

    // In production, current tenant would come from auth context
    const currentTenant = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    const loadData = async (date: Date, currentView: string) => {
        setLoading(true);
        try {
            // Cargar configuración del tenant
            const tenantData = await getTenant(currentTenant);
            if (tenantData) {
                if (tenantData.config_boxes) setBoxesCount(tenantData.config_boxes);
                if (tenantData.agenda_config) setAgendaConfig(tenantData.agenda_config);
            }

            // Cargar turnos según la vista
            let turnosDb: TurnoData[] = [];
            if (currentView === 'diaria') {
                const dateString = format(date, 'yyyy-MM-dd');
                turnosDb = await getTurnosPorFecha(currentTenant, dateString);
            } else if (currentView === 'semanal') {
                const start = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                const end = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                turnosDb = await getTurnosPorRango(currentTenant, start, end);
            } else if (currentView === 'mensual') {
                const start = format(startOfMonth(date), 'yyyy-MM-dd');
                const end = format(endOfMonth(date), 'yyyy-MM-dd');
                turnosDb = await getTurnosPorRango(currentTenant, start, end);
            }

            // Cargar clases para cruzar datos de cupo
            const clasesDb = await claseService.getClases(currentTenant);

            // 1. Generar "Turnos de Clase" virtuales a partir de los horarios definidos en las clases
            const classSessions: TurnoData[] = [];
            clasesDb.forEach(clase => {
                if (clase.status === 'active' && clase.horarios) {
                    clase.horarios.forEach(h => {
                        // Verificar si el horario cae dentro del rango de la vista actual
                        let isInView = false;
                        if (currentView === 'diaria') {
                            isInView = h.fecha === format(date, 'yyyy-MM-dd');
                        } else if (currentView === 'semanal') {
                            const start = startOfWeek(date, { weekStartsOn: 1 });
                            const end = endOfWeek(date, { weekStartsOn: 1 });
                            const hDate = new Date(h.fecha + 'T12:00:00');
                            isInView = hDate >= start && hDate <= end;
                        } else if (currentView === 'mensual') {
                            const start = startOfMonth(date);
                            const end = endOfMonth(date);
                            const hDate = new Date(h.fecha + 'T12:00:00');
                            isInView = hDate >= start && hDate <= end;
                        }

                        if (isInView) {
                            classSessions.push({
                                id: `session-${clase.id}-${h.fecha}-${h.hora}`, // ID virtual único
                                claseId: clase.id,
                                fecha: h.fecha,
                                horaInicio: h.hora,
                                boxId: clase.boxId || 'box-1',
                                duracionMinutos: clase.duracion || 60,
                                clienteAbreviado: clase.nombre,
                                tratamientoAbreviado: clase.nombre,
                                claseInfo: {
                                    inscriptosCount: h.inscriptosCount || 0,
                                    cupo: clase.cupo
                                },
                                status: 'CONFIRMADO',
                                profesionalId: clase.profesionalId,
                                profesionalNombre: clase.profesionalNombre
                            } as TurnoData);
                        }
                    });
                }
            });

            // 2. Filtrar turnos regulares para NO mostrar duplicados de alumnos que ya están en una clase
            // ya que ahora mostramos la "Sesión de Clase" como un bloque único
            const turnosRegulares = turnosDb.filter(t => !t.claseId);

            // 3. Combinar turnos regulares con las sesiones de clase
            const turnosFinales = [...turnosRegulares, ...classSessions];

            setTurnos(turnosFinales);

            // Load box names for the current date (daily view)
            if (currentView === 'diaria') {
                const dateStr = format(date, 'yyyy-MM-dd');
                const names = await getBoxNames(currentTenant, dateStr);
                setBoxNames(names);
            } else {
                setBoxNames({});
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
            toast.error("Error al cargar la agenda");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData(currentDate, view);
    }, [currentDate, currentTenant, view]);

    const handleCrearTurno = async (turnoData: any) => {
        try {
            const loadingToast = toast.loading(modalInitialData.turno ? "Actualizando turno..." : "Guardando turno...");
            const dateString = turnoData.fecha || format(currentDate, 'yyyy-MM-dd');

            // 1. Persistir o actualizar Cliente
            if (turnoData.whatsapp) {
                const { clienteService } = await import("@/lib/services/clienteService");
                const existing = await clienteService.getClienteByTelefono(currentTenant, turnoData.whatsapp);
                if (!existing) {
                    await clienteService.createCliente(currentTenant, {
                        nombre: turnoData.nombre || turnoData.clienteAbreviado,
                        apellido: turnoData.apellido || '',
                        telefono: turnoData.whatsapp,
                        tenantId: currentTenant,
                        ultimaVisita: dateString
                    });
                } else {
                    await clienteService.updateCliente(currentTenant, existing.id, {
                        ultimaVisita: dateString
                    });
                }
            }

            // 2. Guardar Turno
            if (modalInitialData.turno) {
                await updateTurno(currentTenant, modalInitialData.turno.id, {
                    ...turnoData,
                    fecha: dateString
                });
            } else {
                await createTurno(currentTenant, {
                    ...turnoData,
                    fecha: dateString
                });
            }

            toast.success(modalInitialData.turno ? "Turno actualizado" : "Turno guardado", { id: loadingToast });
            setIsModalOpen(false);
            loadData(currentDate, view); // refetch
        } catch (error) {
            console.error(error);
            toast.error("Error al procesar el turno");
        }
    };

    const handleMoverTurno = async (turnoId: string, newBoxId: string, newHoraInicio: string, newFecha: string) => {
        try {
            const turno = turnos.find(t => t.id === turnoId);
            
            // Optimistic update
            setTurnos(prev => prev.map(t =>
                t.id === turnoId ? { ...t, boxId: newBoxId, horaInicio: newHoraInicio, fecha: newFecha } : t
            ));

            if (turno?.id.startsWith('session-') && turno.claseId) {
                // Es una sesión de clase (virtual)
                await claseService.rescheduleSession(currentTenant, turno.claseId, turno.fecha, turno.horaInicio, newFecha, newHoraInicio, newBoxId);
                toast.success("Sesión de clase y alumnos reprogramados");
            } else {
                // Es un turno regular
                await updateTurnoPosicion(currentTenant, turnoId, newBoxId, newHoraInicio, newFecha);
                toast.success("Turno actualizado");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al mover el turno. Restaurando...");
            loadData(currentDate, view); // revert on error
        }
    };

    const handleSaveSettings = async (newConfig: any) => {
        try {
            const loadingToast = toast.loading("Actualizando configuración...");
            await createOrUpdateTenant(currentTenant, { agenda_config: newConfig });
            setAgendaConfig(newConfig);
            toast.success("Configuración actualizada", { id: loadingToast });
            loadData(currentDate, view);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar configuración");
        }
    };

    const handleNext = () => {
        if (view === 'diaria') setCurrentDate(addDays(currentDate, 1));
        else if (view === 'semanal') setCurrentDate(addWeeks(currentDate, 1));
        else if (view === 'mensual') setCurrentDate(addMonths(currentDate, 1));
    };

    const handlePrev = () => {
        if (view === 'diaria') setCurrentDate(subDays(currentDate, 1));
        else if (view === 'semanal') setCurrentDate(subWeeks(currentDate, 1));
        else if (view === 'mensual') setCurrentDate(subMonths(currentDate, 1));
    };

    const getFormattedDate = () => {
        if (view === 'diaria') return format(currentDate, "EEEE d 'de' MMMM", { locale: es });
        if (view === 'semanal') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            return `${format(start, "d 'de' MMM", { locale: es })} - ${format(end, "d 'de' MMM", { locale: es })}`;
        }
        if (view === 'mensual') return format(currentDate, "MMMM yyyy", { locale: es });
        return "";
    };

    const topbarControls = (
        <div className="flex items-center gap-4 w-full justify-end">
            {/* View Switcher - Compact */}
            <div className="hidden lg:flex p-1 bg-gray-100 rounded-2xl">
                <button
                    onClick={() => setView('diaria')}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center gap-2 ${view === 'diaria' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <LayoutGrid className="w-3 h-3" />
                    DIARIA
                </button>
                <button
                    onClick={() => setView('semanal')}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center gap-2 ${view === 'semanal' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <CalendarDays className="w-3 h-3" />
                    SEMANAL
                </button>
                <button
                    onClick={() => setView('mensual')}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center gap-2 ${view === 'mensual' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <CalendarMonth className="w-3 h-3" />
                    MENSUAL
                </button>
            </div>

            {/* Selector de Fecha */}
            <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-0.5 shadow-sm">
                <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                </button>
                <div className="px-4 py-1 flex items-center gap-2 font-black text-gray-800 min-w-[160px] justify-center border-x border-gray-50">
                    <CalendarIcon className="w-3.5 h-3.5 text-black" />
                    <span className="capitalize text-[11px] tracking-tight">{getFormattedDate()}</span>
                </div>
                <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-10 h-10 rounded-xl border border-gray-100 bg-white flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition-all shadow-sm active:scale-90"
                >
                    <Settings className="w-4 h-4" />
                </button>

                <Button
                    className="shrink-0 bg-black text-white hover:bg-gray-800 h-10 px-6 rounded-xl shadow-xl shadow-black/5 font-black uppercase tracking-widest text-[10px]"
                    onClick={() => {
                        setModalInitialData({ fecha: format(currentDate, 'yyyy-MM-dd'), boxId: 'box-1', hora: '09:00', turno: null });
                        setIsModalOpen(true);
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Turno
                </Button>
            </div>

        </div>
    );

    return (
        <AdminLayout topbarContent={topbarControls}>
            <div className="flex flex-col h-full w-full animate-in fade-in duration-500 pt-0">
                {/* Grid Section */}
                <div className="flex-1 overflow-hidden relative bg-white rounded-[2rem] shadow-2xl shadow-gray-200 border border-gray-50 -mt-2">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin w-12 h-12 border-[5px] border-black border-t-transparent rounded-full shadow-lg shadow-black/10"></div>
                                <span className="text-xs font-extrabold text-black uppercase tracking-widest">Cargando Agenda</span>
                            </div>
                        </div>
                    ) : null}

                    <AgendaGrid
                        boxesCount={boxesCount}
                        turnos={turnos}
                        onTurnoMove={handleMoverTurno}
                        config={agendaConfig}
                        view={view}
                        currentDate={currentDate}
                        boxNames={boxNames}
                        onBoxNameChange={async (boxId, name) => {
                            const dateStr = format(currentDate, 'yyyy-MM-dd');
                            await setBoxName(currentTenant, dateStr, boxId, name);
                            setBoxNames(prev => ({ ...prev, [boxId]: name }));
                            toast.success(`Box renombrado a "${name}" para ${dateStr}`);
                        }}
                        onCellClick={(fecha, boxId, hora) => {
                            setModalInitialData({ fecha, boxId, hora, turno: null });
                            setIsModalOpen(true);
                        }}
                        onTurnoClick={(turno) => {
                            setModalInitialData({ fecha: turno.fecha, boxId: turno.boxId, hora: turno.horaInicio, turno });
                            if (turno.claseId) {
                                setIsClaseModalOpen(true);
                            } else {
                                setIsModalOpen(true);
                            }
                        }}
                        onInscriptosClick={async (claseId) => {
                            const clase = await claseService.getClaseById(currentTenant, claseId);
                            if (clase) {
                                setSelectedClaseForInscriptos(clase);
                                setIsInscriptosModalOpen(true);
                            }
                        }}
                    />
                </div>
            </div>

            <NuevoTurnoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCrearTurno}
                initialFecha={modalInitialData.fecha}
                initialBox={modalInitialData.boxId}
                initialHora={modalInitialData.hora}
                editTurno={modalInitialData.turno}
                agendaConfig={agendaConfig}
            />

            <TurnoClaseModal
                isOpen={isClaseModalOpen}
                onClose={() => setIsClaseModalOpen(false)}
                onSave={handleCrearTurno}
                onRequestCredits={(cliente) => {
                    setSelectedClienteForCredits(cliente);
                    setIsCreditsModalOpen(true);
                }}
                editTurno={modalInitialData.turno || null}
                agendaConfig={agendaConfig}
            />

            <AgendaSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentConfig={agendaConfig}
                onSave={handleSaveSettings}
            />

            <InscriptosModal
                isOpen={isInscriptosModalOpen}
                onClose={() => setIsInscriptosModalOpen(false)}
                clase={selectedClaseForInscriptos}
                tenantId={currentTenant}
            />

            <AddCreditsModal 
                isOpen={isCreditsModalOpen}
                onClose={() => {
                    setIsCreditsModalOpen(false);
                    setSelectedClienteForCredits(null);
                }}
                onSave={() => {
                    loadData(currentDate, view);
                }}
                cliente={selectedClienteForCredits}
                tenantId={currentTenant}
            />
        </AdminLayout>
    );
}
