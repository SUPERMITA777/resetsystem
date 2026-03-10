"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar as CalendarIcon, Clock, User, Tag, Search, Filter, Plus, ChevronRight, CalendarDays, List, CheckCircle2 } from "lucide-react";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { serviceManagement, Tratamiento, Subtratamiento } from "@/lib/services/serviceManagement";
import { getTurnosPorFecha, getTurnosPorRango, createTurno, updateTurno, deleteTurno, TurnoDB } from "@/lib/services/agendaService";
import { NuevoTurnoModal } from "@/components/agenda/NuevoTurnoModal";
import toast, { Toaster } from "react-hot-toast";

export default function TurnosPage() {
    const [activeTab, setActiveTab] = useState<'reservar' | 'listado'>('reservar');
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
    const [selectedTratamiento, setSelectedTratamiento] = useState<Tratamiento | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [occupiedSlots, setOccupiedSlots] = useState<Record<string, string[]>>({});
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<any>(null);
    
    // List state
    const [allTurnos, setAllTurnos] = useState<TurnoDB[]>([]);
    const [loading, setLoading] = useState(false);

    const currentTenant = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        loadTratamientos();
        if (activeTab === 'listado') {
            loadAllTurnos();
        }
    }, [activeTab]);

    const loadTratamientos = async () => {
        try {
            const data = await serviceManagement.getTratamientos(currentTenant);
            setTratamientos(data.filter(t => t.habilitado));
        } catch (error) {
            toast.error("Error al cargar tratamientos");
        }
    };

    const loadAllTurnos = async () => {
        setLoading(true);
        try {
            // Cargar turnos de los próximos 30 días para el listado
            const start = format(new Date(), 'yyyy-MM-dd');
            const end = format(addDays(new Date(), 30), 'yyyy-MM-dd');
            const data = await getTurnosPorRango(currentTenant, start, end);
            setAllTurnos(data.sort((a,b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`)));
        } catch (error) {
            toast.error("Error al cargar listado");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTratamiento = (t: Tratamiento) => {
        setSelectedTratamiento(t);
        generateSlots(t, selectedDate);
    };

    const generateSlots = async (trat: Tratamiento, date: Date) => {
        const slots: string[] = [];
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // 1. Fetch occupied slots for this date across all boxes
        const dayTurnos = await getTurnosPorFecha(currentTenant, dateStr);
        const occupied: Record<string, string[]> = {}; // { hora: [boxId, boxId] }
        dayTurnos.forEach(t => {
            if (!occupied[t.horaInicio]) occupied[t.horaInicio] = [];
            occupied[t.horaInicio].push(t.boxId || 'box-1');
        });
        setOccupiedSlots(occupied);
        
        const totalBoxes = 3; // TODO: Get from salon config

        // 2. Filter availability by treatment ranges
        if (trat.rangos_disponibilidad && trat.rangos_disponibilidad.length > 0) {
            const dayOfWeek = date.getDay();
            const ranges = trat.rangos_disponibilidad.filter(r => r.dias.includes(dayOfWeek));
            
            ranges.forEach(range => {
                let start = new Date(`${dateStr}T${range.inicio.padStart(5, '0')}:00`);
                const end = new Date(`${dateStr}T${range.fin.padStart(5, '0')}:00`);
                
                while (start < end) {
                    slots.push(format(start, 'HH:mm'));
                    start = new Date(start.getTime() + 30 * 60000); // 30 min intervals
                }
            });
        } else {
            // Default range if none specified
            let start = new Date(`${dateStr}T09:00:00`);
            const end = new Date(`${dateStr}T21:00:00`);
            while (start < end) {
                slots.push(format(start, 'HH:mm'));
                start = new Date(start.getTime() + 60 * 60000);
            }
        }
        setAvailableSlots([...new Set(slots)].sort());
    };

    const handleSlotClick = (hora: string) => {
        if (!selectedTratamiento) return;
        const targetBox = selectedTratamiento.boxId || 'box-1';
        setModalData({
            fecha: format(selectedDate, 'yyyy-MM-dd'),
            hora: hora.padStart(5, '0'),
            boxId: targetBox,
            tratamientoId: selectedTratamiento.id
        });
        setIsModalOpen(true);
    };

    const handleDeleteTurno = async (id: string) => {
        try {
            await deleteTurno(currentTenant, id);
            toast.success("Turno eliminado");
            loadAllTurnos();
            if (selectedTratamiento) {
                generateSlots(selectedTratamiento, selectedDate);
            }
        } catch (error) {
            toast.error("Error al eliminar el turno");
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
                <Toaster />
                
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Turnos</h1>
                        <p className="text-gray-500 font-medium">Gestiona tus reservas y disponibilidad.</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-2xl">
                        <button 
                            onClick={() => setActiveTab('reservar')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'reservar' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Reservar
                        </button>
                        <button 
                            onClick={() => setActiveTab('listado')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'listado' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Listado
                        </button>
                    </div>
                </div>

                {activeTab === 'reservar' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Step 1: Treatments */}
                        <div className="lg:col-span-4 space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">1. Seleccionar Tratamiento</h3>
                            <div className="grid gap-3">
                                {tratamientos.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleSelectTratamiento(t)}
                                        className={`p-4 rounded-[1.5rem] border-2 transition-all flex items-center justify-between group ${selectedTratamiento?.id === t.id ? 'border-black bg-black text-white' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedTratamiento?.id === t.id ? 'bg-white/20' : 'bg-gray-50'}`}>
                                                <Tag className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold">{t.nombre}</span>
                                        </div>
                                        {selectedTratamiento?.id === t.id && <CheckCircle2 className="w-5 h-5" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Date & Slots */}
                        <div className="lg:col-span-8 space-y-6">
                            {selectedTratamiento ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">2. Disponibilidad</h3>
                                        <div className="flex gap-2">
                                            {[0, 1, 2, 3, 4, 5, 6].map(i => {
                                                const d = addDays(startOfToday(), i);
                                                const isSelected = isSameDay(d, selectedDate);
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => { setSelectedDate(d); generateSlots(selectedTratamiento, d); }}
                                                        className={`flex flex-col items-center p-3 rounded-2xl min-w-[70px] transition-all ${isSelected ? 'bg-black text-white shadow-xl scale-105' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'}`}
                                                    >
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{format(d, 'eee', { locale: es })}</span>
                                                        <span className="text-xl font-black">{format(d, 'dd')}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-premium-soft border border-gray-50">
                                        {availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                {availableSlots.map(hora => {
                                                    // Buscamos si el box específico está ocupado, o si TODOS están ocupados si no hay boxId
                                                    const takenInBoxes = occupiedSlots[hora] || [];
                                                    const isOccupied = selectedTratamiento.boxId 
                                                        ? takenInBoxes.includes(selectedTratamiento.boxId)
                                                        : takenInBoxes.length >= 3; // Asumiendo 3 boxes por ahora

                                                    if (isOccupied) return null;
                                                    return (
                                                        <button
                                                            key={hora}
                                                            onClick={() => handleSlotClick(hora)}
                                                            className="p-4 rounded-2xl font-black text-sm transition-all border-2 bg-white border-gray-100 text-gray-900 hover:border-black hover:scale-105 shadow-sm active:scale-95"
                                                        >
                                                            {hora}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center">
                                                <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No hay horarios disponibles para este día</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                                    <CalendarDays className="w-20 h-20 mb-4" />
                                    <p className="font-black uppercase tracking-[0.2em] text-sm">Selecciona un tratamiento para ver disponibilidad</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Listado View */}
                        <div className="flex bg-white p-4 rounded-[2rem] shadow-premium-soft border border-gray-50 gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                <input className="w-full h-14 pl-14 pr-6 bg-gray-50 border-none rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-black transition-all" placeholder="Buscar por cliente o tratamiento..." />
                            </div>
                            <Button className="h-14 px-8 rounded-[1.5rem] bg-black text-white font-bold hovre:bg-gray-800">
                                <Filter className="w-5 h-5 mr-2" />
                                Filtros
                            </Button>
                        </div>

                        {loading ? (
                            <div className="py-20 flex flex-col items-center gap-4">
                                <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Cargando Turnos</span>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {allTurnos.map(t => (
                                    <Card 
                                        key={t.id} 
                                        className="p-6 border-none shadow-premium-soft rounded-[2rem] hover:shadow-premium transition-all group cursor-pointer"
                                        onClick={() => {
                                            setModalData({ turno: t });
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 group-hover:bg-black group-hover:text-white transition-colors">
                                                    <span className="text-[10px] font-black uppercase leading-none mb-1">{format(new Date(t.fecha + 'T12:00:00'), 'MMM', { locale: es })}</span>
                                                    <span className="text-xl font-black leading-none">{format(new Date(t.fecha + 'T12:00:00'), 'dd')}</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-gray-900 group-hover:text-black">{t.clienteAbreviado}</h3>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {t.horaInicio}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                            <Tag className="w-3.5 h-3.5" />
                                                            {t.tratamientoAbreviado}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border-2 
                                                    ${t.status === 'CONFIRMADO' ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 
                                                      t.status === 'CANCELADO' ? 'border-red-100 text-red-600 bg-red-50' : 
                                                      'border-blue-100 text-blue-600 bg-blue-50'}`}
                                                >
                                                    {t.status || 'RESERVADO'}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <NuevoTurnoModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialFecha={modalData?.fecha}
                    initialHora={modalData?.hora}
                    initialBox={modalData?.boxId}
                    initialTratamientoId={modalData?.tratamientoId}
                    editTurno={modalData?.turno}
                    onDelete={handleDeleteTurno}
                    onSave={async (data) => {
                        try {
                            if (modalData?.turno) {
                                await updateTurno(currentTenant, modalData.turno.id, data);
                                toast.success("Turno actualizado");
                            } else {
                                await createTurno(currentTenant, data);
                                toast.success("Turno reservado con éxito");
                            }
                            setIsModalOpen(false);
                            if (activeTab === 'reservar') {
                                generateSlots(selectedTratamiento!, selectedDate);
                            } else {
                                loadAllTurnos();
                            }
                        } catch (error) {
                            toast.error("Error al guardar el turno");
                        }
                    }}
                />
            </div>
        </AdminLayout>
    );
}
