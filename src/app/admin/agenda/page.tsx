"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { AgendaGrid } from "@/components/agenda/AgendaGrid";
import { NuevoTurnoModal } from "@/components/agenda/NuevoTurnoModal";
import { getTurnosPorFecha, createTurno, updateTurnoPosicion, TurnoDB } from "@/lib/services/agendaService";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { TurnoData } from "@/components/agenda/TurnoCard";
import toast, { Toaster } from "react-hot-toast";

// MOCK CONSTANTE PARA ESTA PRUEBA TENANT (En producción esto vendría del contexto/store del admin)
const CURRENT_TENANT = "resetspa";

export default function AgendaPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [turnos, setTurnos] = useState<TurnoData[]>([]);
    const [loading, setLoading] = useState(true);
    const [boxesCount, setBoxesCount] = useState(3);

    const loadData = async (date: Date) => {
        setLoading(true);
        try {
            // Cargar configuración de boxes
            const tenantData = await getTenant(CURRENT_TENANT);
            if (tenantData?.config_boxes) {
                setBoxesCount(tenantData.config_boxes);
            }

            // Cargar turnos
            const dateString = format(date, 'yyyy-MM-dd');
            const turnosDb = await getTurnosPorFecha(CURRENT_TENANT, dateString);
            setTurnos(turnosDb as TurnoData[]);
        } catch (error) {
            console.error("Error cargando datos:", error);
            toast.error("Error al cargar la agenda");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData(currentDate);
    }, [currentDate]);

    const handleCrearTurno = async (turnoData: any) => {
        try {
            const loadingToast = toast.loading("Guardando turno...");
            const dateString = format(currentDate, 'yyyy-MM-dd');

            await createTurno(CURRENT_TENANT, {
                ...turnoData,
                fecha: dateString
            });

            toast.success("Turno guardado", { id: loadingToast });
            setIsModalOpen(false);
            loadData(currentDate); // refetch
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el turno");
        }
    };

    const handleMoverTurno = async (turnoId: string, newBoxId: string, newHoraInicio: string) => {
        try {
            // Optimistic update
            setTurnos(prev => prev.map(t =>
                t.id === turnoId ? { ...t, boxId: newBoxId, horaInicio: newHoraInicio } : t
            ));

            await updateTurnoPosicion(CURRENT_TENANT, turnoId, newBoxId, newHoraInicio);
            toast.success("Turno actualizado");
        } catch (error) {
            console.error(error);
            toast.error("Error al mover el turno. Restaurando...");
            loadData(currentDate); // revert on error
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col h-full w-full animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--foreground)]">Agenda</h1>
                        <p className="text-gray-500 mt-1">Gestión de turnos diarios.</p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Toaster />
                        <div className="flex items-center bg-white border border-[var(--secondary)] rounded-lg p-1">
                            <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="px-4 py-1 flex items-center gap-2 font-medium min-w-[140px] justify-center">
                                <CalendarIcon className="w-4 h-4 text-[var(--primary)]" />
                                <span className="capitalize">{format(currentDate, "EEEE d 'de' MMMM", { locale: es })}</span>
                            </div>
                            <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Turno
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden mt-4 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                            <div className="animate-spin w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
                        </div>
                    ) : null}
                    <AgendaGrid boxesCount={boxesCount} turnos={turnos} onTurnoMove={handleMoverTurno} />
                </div>
            </div>

            <NuevoTurnoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCrearTurno}
            />
        </AdminLayout>
    );
}
