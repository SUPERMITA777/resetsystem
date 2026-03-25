"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar as CalendarIcon, Clock, User, Tag, Search, Filter, Plus, ChevronRight, CalendarDays, List, CheckCircle2, AlertCircle, Check, X as XIcon, Phone, Edit3, Zap } from "lucide-react";
import { getTenant } from "@/lib/services/tenantService";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { serviceManagement, Tratamiento, Subtratamiento } from "@/lib/services/serviceManagement";
import { getTurnosPorFecha, getTurnosPorRango, createTurno, updateTurno, deleteTurno, TurnoDB } from "@/lib/services/agendaService";
import { NuevoTurnoModal } from "@/components/agenda/NuevoTurnoModal";
import { AddCreditsModal } from "@/components/admin/clientes/AddCreditsModal";
import { clienteService } from "@/lib/services/clienteService";
import { claseService } from "@/lib/services/claseService";
import toast, { Toaster } from "react-hot-toast";

export default function TurnosPage() {
    const [activeTab, setActiveTab] = useState<'pendientes' | 'reservar' | 'listado'>('pendientes');
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
    const [selectedTratamiento, setSelectedTratamiento] = useState<Tratamiento | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [occupiedSlots, setOccupiedSlots] = useState<Record<string, string[]>>({});
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<any>(null);
    const [selectedClienteForCredits, setSelectedClienteForCredits] = useState<any>(null);
    
    // List state
    const [allTurnos, setAllTurnos] = useState<TurnoDB[]>([]);
    const [listadoDate, setListadoDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendientesTurnos, setPendientesTurnos] = useState<TurnoDB[]>([]);
    const [loadingPendientes, setLoadingPendientes] = useState(false);

    const currentTenant = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        loadTratamientos();
    }, []);

    useEffect(() => {
        if (activeTab === 'listado') {
            loadAllTurnos();
        }
        if (activeTab === 'pendientes') {
            loadPendientes();
        }
    }, [activeTab, listadoDate]);

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
            // Cargar turnos para la fecha seleccionada en el listado
            const data = await getTurnosPorFecha(currentTenant, listadoDate);
            // Filtrar para mostrar solo los que NO están pendientes
            setAllTurnos(data.filter(t => t.status !== 'PENDIENTE').sort((a,b) => a.horaInicio.localeCompare(b.horaInicio)));
        } catch (error) {
            toast.error("Error al cargar listado");
        } finally {
            setLoading(false);
        }
    };

    const loadPendientes = async () => {
        setLoadingPendientes(true);
        try {
            const start = format(new Date(), 'yyyy-MM-dd');
            const end = format(addDays(new Date(), 60), 'yyyy-MM-dd');
            const data = await getTurnosPorRango(currentTenant, start, end);
            setPendientesTurnos(data.filter(t => t.status === 'PENDIENTE').sort((a,b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`)));
        } catch (error) {
            toast.error("Error al cargar pendientes");
        } finally {
            setLoadingPendientes(false);
        }
    };

    const generateCheckinCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like 0, O, 1, I
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleAceptarTurno = async (turno: TurnoDB) => {
        try {
            // 1. Lógica de Créditos - Verificar ANTES de cambiar el estado
            let clienteId = '';
            const checkinCode = turno.claseId ? generateCheckinCode() : null;
            
            if (turno.claseId) {
                const wa = (turno.clienteWhatsapp || turno.whatsapp || '').replace(/\D/g, '');
                if (wa) {
                    let cliente = await clienteService.getClienteByTelefono(currentTenant, wa);
                    
                    if (!cliente) {
                        // Crear cliente con 1 crédito por defecto si no existe
                        const nuevoId = await clienteService.createCliente(currentTenant, {
                            nombre: turno.nombre || turno.clienteAbreviado.split(' ')[0] || 'Cliente',
                            apellido: turno.apellido || turno.clienteAbreviado.split(' ').slice(1).join(' ') || '',
                            telefono: wa,
                            tenantId: currentTenant,
                            creditos: 1
                        });
                        cliente = { id: nuevoId, creditos: 1 } as any;
                        toast.success("Nuevo cliente creado con 1 crédito");
                    }
                    
                    clienteId = cliente!.id;
                    const costo = turno.valorCreditos || 1;
                    if ((cliente?.creditos || 0) < costo) {
                        toast.error(`Saldo insuficiente (${cliente?.creditos || 0}). El cliente necesita al menos ${costo} créditos.`);
                        // El turno permanece PENDIENTE porque no llamamos a updateTurno
                        return; 
                    }
                    
                    // Descontar créditos
                    await clienteService.deductCredits(currentTenant, clienteId, costo);
                    toast.success(`${costo} créditos descontados`);
                }
            }

            // 2. Si pasó los créditos (o no es clase), actualizar estado
            await updateTurno(currentTenant, turno.id, { 
                status: 'CONFIRMADO',
                ...(checkinCode ? { checkinCode } : {})
            });
            
            // 3. Incrementar inscriptos si es clase
            if (turno.claseId) {
                const clase = await claseService.getClaseById(currentTenant, turno.claseId);
                if (clase) {
                    const matchingHorario = (clase.horarios || []).find(h => h.fecha === turno.fecha && h.hora === turno.horaInicio);
                    if (matchingHorario) {
                        await claseService.incrementInscriptos(currentTenant, turno.claseId, matchingHorario.id);
                    }
                }

                const clienteWa = turno.clienteWhatsapp || turno.whatsapp || '';
                if (clienteWa) {
                    const msg = encodeURIComponent(`✅ ¡Tu clase de ${turno.tratamientoAbreviado} ha sido confirmada!
📅 Fecha: ${turno.fecha}
⏰ Hora: ${turno.horaInicio}
👤 Cliente: ${turno.clienteAbreviado}

🔑 Tu código de acceso es: *${checkinCode}*
Preséntalo al profesor al llegar.`);
                    
                    // Abrir WhatsApp
                    window.open(`https://wa.me/${clienteWa.replace(/\D/g, '')}?text=${msg}`, '_blank');
                }
            } else {
                // For non-class turnos, just open WhatsApp link
                const clienteWa = turno.clienteWhatsapp || turno.whatsapp || '';
                if (clienteWa) {
                    const msg = encodeURIComponent(`¡Hola! Tu turno fue aceptado y agendado. ¡Te esperamos!`);
                    window.open(`https://wa.me/${clienteWa.replace(/\D/g, '')}?text=${msg}`, '_blank');
                }
            }

            toast.success("Turno aceptado y confirmado");
            loadPendientes();
        } catch (error: any) {
            console.error(error);
            toast.error("Error al aceptar turno: " + (error.message || ""));
        }
    };

    const handleRechazarTurno = async (turno: TurnoDB) => {
        try {
            await updateTurno(currentTenant, turno.id, { status: 'CANCELADO' });
            toast.success("Turno rechazado");
            loadPendientes();
        } catch (error) {
            toast.error("Error al rechazar turno");
        }
    };

    const isDateAvailable = (trat: Tratamiento, date: Date) => {
        if (!trat.rangos_disponibilidad || trat.rangos_disponibilidad.length === 0) return false;
        
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOfWeek = date.getDay();
        
        return trat.rangos_disponibilidad.some(r => {
            // Check day of week
            if (!r.dias.includes(dayOfWeek)) return false;
            
            // Check date range if present
            const startStr = r.fecha_inicio || null;
            const endStr = r.fecha_fin || null;
            
            if (startStr && dateStr < startStr) return false;
            if (endStr && dateStr > endStr) return false;
            
            return true;
        });
    };

    const handleSelectTratamiento = (t: Tratamiento) => {
        setSelectedTratamiento(t);
        
        // Find first available date starting from today
        let targetDate = startOfToday();
        let found = false;
        for (let i = 0; i < 30; i++) { // Look ahead 30 days
            const d = addDays(startOfToday(), i);
            if (isDateAvailable(t, d)) {
                targetDate = d;
                found = true;
                break;
            }
        }
        
        setSelectedDate(targetDate);
        generateSlots(t, targetDate);
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
            
            const ranges = trat.rangos_disponibilidad.filter(r => {
                if (!r.dias.includes(dayOfWeek)) return false;
                if (r.fecha_inicio && dateStr < r.fecha_inicio) return false;
                if (r.fecha_fin && dateStr > r.fecha_fin) return false;
                return true;
            });
            
            ranges.forEach(range => {
                let start = new Date(`${dateStr}T${range.inicio.padStart(5, '0')}:00`);
                const end = new Date(`${dateStr}T${range.fin.padStart(5, '0')}:00`);
                
                while (start < end) {
                    slots.push(format(start, 'HH:mm'));
                    start = new Date(start.getTime() + 30 * 60000); // 30 min intervals
                }
            });
        }
        
        // Removed the "else" default range logic for strictness.
        // If no slots generated, it correctly shows "No hay horarios disponibles".

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
                            onClick={() => setActiveTab('pendientes')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all relative ${activeTab === 'pendientes' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Pendientes
                            {pendientesTurnos.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">{pendientesTurnos.length}</span>
                            )}
                        </button>
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
                                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(i => {
                                                const d = addDays(startOfToday(), i);
                                                const isAvailable = isDateAvailable(selectedTratamiento, d);
                                                if (!isAvailable) return null;

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
                        <div className="flex flex-col md:flex-row bg-white p-4 rounded-[2rem] shadow-premium-soft border border-gray-50 gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                <input 
                                    className="w-full h-14 pl-14 pr-6 bg-gray-50 border-none rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-black transition-all" 
                                    placeholder="Buscar por cliente o tratamiento..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setListadoDate(format(new Date(), 'yyyy-MM-dd'))}
                                    className={`h-14 px-6 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${listadoDate === format(new Date(), 'yyyy-MM-dd') ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                >
                                    Hoy
                                </button>
                                <div className="relative h-14">
                                    <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input 
                                        type="date"
                                        value={listadoDate}
                                        onChange={(e) => setListadoDate(e.target.value)}
                                        className="h-full pl-12 pr-6 bg-gray-50 border-none rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 flex flex-col items-center gap-4">
                                <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Cargando Turnos</span>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {allTurnos
                                    .filter(t => 
                                        t.clienteAbreviado?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        t.tratamientoAbreviado?.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map(t => (
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

                {activeTab === 'pendientes' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            <p className="text-sm font-bold text-gray-500">Turnos solicitados desde la web que requieren tu acción.</p>
                        </div>

                        {loadingPendientes ? (
                            <div className="py-20 flex flex-col items-center gap-4">
                                <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Cargando Pendientes</span>
                            </div>
                        ) : pendientesTurnos.length > 0 ? (
                            <div className="grid gap-4">
                                {pendientesTurnos.map(t => (
                                    <Card key={t.id} className="p-6 border-none shadow-premium-soft rounded-[2rem] border-l-4 border-l-amber-400">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex flex-col items-center justify-center border border-amber-100">
                                                    <span className="text-[10px] font-black uppercase leading-none mb-1 text-amber-600">{format(new Date(t.fecha + 'T12:00:00'), 'MMM', { locale: es })}</span>
                                                    <span className="text-xl font-black leading-none text-amber-700">{format(new Date(t.fecha + 'T12:00:00'), 'dd')}</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-gray-900">{t.clienteAbreviado}</h3>
                                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                            <Clock className="w-3.5 h-3.5" /> {t.horaInicio}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                            <Tag className="w-3.5 h-3.5" /> {t.tratamientoAbreviado}
                                                        </span>
                                                        {t.subtratamientoAbreviado && (
                                                            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                                <ChevronRight className="w-3.5 h-3.5" /> {t.subtratamientoAbreviado}
                                                            </span>
                                                        )}
                                                        {(t.clienteWhatsapp || t.whatsapp) && (
                                                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                                                                <Phone className="w-3.5 h-3.5" /> {t.clienteWhatsapp || t.whatsapp}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleAceptarTurno(t)}
                                                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95"
                                                >
                                                    <Check className="w-4 h-4" /> Aceptar
                                                </button>
                                                <button
                                                    onClick={async () => { 
                                                        const wa = (t.clienteWhatsapp || t.whatsapp || '').replace(/\D/g, '');
                                                        if (wa) {
                                                            const cliente = await clienteService.getClienteByTelefono(currentTenant, wa);
                                                            if (cliente) {
                                                                setSelectedClienteForCredits(cliente);
                                                                setIsCreditsModalOpen(true);
                                                            } else {
                                                                toast.error("No se encontró ficha de cliente para este teléfono");
                                                            }
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-100 text-amber-700 font-black text-[10px] uppercase tracking-widest hover:bg-amber-200 transition-all"
                                                    title="Sumar Créditos"
                                                >
                                                    <Zap className="w-4 h-4" /> Créditos
                                                </button>
                                                <button
                                                    onClick={() => { setModalData({ turno: t }); setIsModalOpen(true); }}
                                                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                                                >
                                                    <Edit3 className="w-4 h-4" /> Modificar
                                                </button>
                                                <button
                                                    onClick={() => handleRechazarTurno(t)}
                                                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all"
                                                >
                                                    <XIcon className="w-4 h-4" /> Rechazar
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <CheckCircle2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No hay turnos pendientes</p>
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
                <AddCreditsModal 
                    isOpen={isCreditsModalOpen}
                    onClose={() => {
                        setIsCreditsModalOpen(false);
                        setSelectedClienteForCredits(null);
                    }}
                    onSave={() => {
                        if (activeTab === 'pendientes') loadPendientes();
                    }}
                    cliente={selectedClienteForCredits}
                    tenantId={currentTenant}
                />
            </div>
        </AdminLayout>
    );
}
