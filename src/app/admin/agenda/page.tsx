"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Settings, LayoutGrid, CalendarDays, Calendar as CalendarMonth } from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { AgendaGrid } from "@/components/agenda/AgendaGrid";
import { NuevoTurnoModal } from "@/components/agenda/NuevoTurnoModal";
import { AgendaSettingsModal } from "@/components/agenda/AgendaSettingsModal";
import { getTurnosPorFecha, getTurnosPorRango, createTurno, updateTurno, updateTurnoPosicion } from "@/lib/services/agendaService";
import { getTenant, createOrUpdateTenant, TenantData } from "@/lib/services/tenantService";
import { TurnoData } from "@/components/agenda/TurnoCard";
import toast, { Toaster } from "react-hot-toast";

export default function AgendaPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
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

            setTurnos(turnosDb as TurnoData[]);
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

    const handleMoverTurno = async (turnoId: string, newBoxId: string, newHoraInicio: string) => {
        try {
            // Optimistic update
            setTurnos(prev => prev.map(t =>
                t.id === turnoId ? { ...t, boxId: newBoxId, horaInicio: newHoraInicio } : t
            ));

            await updateTurnoPosicion(currentTenant, turnoId, newBoxId, newHoraInicio);
            toast.success("Turno actualizado");
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

    return (
        <AdminLayout>
            <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-montserrat">Agenda</h1>
                            <p className="text-gray-500 mt-1">Planificación y gestión de turnos.</p>
                        </div>

                        {/* View Switcher */}
                        <div className="hidden lg:flex p-1 bg-gray-100 rounded-2xl ml-4">
                            <button
                                onClick={() => setView('diaria')}
                                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${view === 'diaria' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                DIARIA
                            </button>
                            <button
                                onClick={() => setView('semanal')}
                                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${view === 'semanal' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <CalendarDays className="w-3.5 h-3.5" />
                                SEMANAL
                            </button>
                            <button
                                onClick={() => setView('mensual')}
                                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${view === 'mensual' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <CalendarMonth className="w-3.5 h-3.5" />
                                MENSUAL
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                        <Toaster />

                        {/* Selector de Fecha */}
                        <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
                            <button onClick={handlePrev} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-xl transition-colors">
                                <ChevronLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <div className="px-6 py-1 flex items-center gap-3 font-bold text-gray-800 min-w-[200px] justify-center border-x border-gray-50">
                                <CalendarIcon className="w-4 h-4 text-black" />
                                <span className="capitalize text-sm">{getFormattedDate()}</span>
                            </div>
                            <button onClick={handleNext} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-xl transition-colors">
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="w-12 h-12 rounded-2xl border border-gray-100 bg-white flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition-all shadow-sm active:scale-90"
                            >
                                <Settings className="w-5 h-5" />
                            </button>

                            <Button
                                className="shrink-0 bg-black text-white hover:bg-gray-800 h-12 px-8 rounded-2xl shadow-xl shadow-gray-200 font-bold"
                                onClick={() => {
                                    setModalInitialData({ fecha: format(currentDate, 'yyyy-MM-dd'), boxId: 'box-1', hora: '09:00', turno: null });
                                    setIsModalOpen(true);
                                }}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Nuevo Turno
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Grid Section */}
                <div className="flex-1 overflow-hidden relative bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200 border border-gray-50">
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
                        onCellClick={(fecha, boxId, hora) => {
                            setModalInitialData({ fecha, boxId, hora, turno: null });
                            setIsModalOpen(true);
                        }}
                        onTurnoClick={(turno) => {
                            setModalInitialData({ fecha: turno.fecha, boxId: turno.boxId, hora: turno.horaInicio, turno });
                            setIsModalOpen(true);
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
            />

            <AgendaSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentConfig={agendaConfig}
                onSave={handleSaveSettings}
            />
        </AdminLayout>
    );
}
