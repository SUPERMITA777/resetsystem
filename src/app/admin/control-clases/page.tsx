"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { claseService, Clase } from "@/lib/services/claseService";
import { getTurnosPorFecha, TurnoDB } from "@/lib/services/agendaService";
import { format, addDays, startOfToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { QrCode, Users, Clock, ChevronRight, Search, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";

export default function ControlClasesPage() {
    const [clasesList, setClasesList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>(format(startOfToday(), 'yyyy-MM-dd'));
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        loadClases();
    }, [selectedDate]);

    const loadClases = async () => {
        setLoading(true);
        try {
            // Cargar datos de la clase para obtener el cupo y horarios definidos
            const clasesDb = await claseService.getClases(tenantId);
            
            // Si no hay fecha seleccionada (TODAS), mostramos todas las sesiones programadas
            // Si hay fecha, filtramos por esa fecha.
            
            const sessions: any[] = [];
            
            clasesDb.forEach(clase => {
                if (clase.status === 'active' && clase.horarios) {
                    clase.horarios.forEach(h => {
                        if (!selectedDate || h.fecha === selectedDate) {
                            sessions.push({
                                claseId: clase.id,
                                nombre: clase.nombre,
                                hora: h.hora,
                                fecha: h.fecha,
                                inscriptos: h.inscriptosCount || 0,
                                cupo: clase.cupo,
                                id: `${clase.id}-${h.fecha}-${h.hora}`
                            });
                        }
                    });
                }
            });

            setClasesList(sessions.sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const dateFilters = [
        { label: 'TODAS', value: '' },
        { label: 'HOY', value: format(startOfToday(), 'yyyy-MM-dd') },
        { label: 'MAÑANA', value: format(addDays(startOfToday(), 1), 'yyyy-MM-dd') },
    ];

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">Control de Clases</h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                             <Clock className="w-3 h-3" /> {selectedDate ? format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es }) : "Todas las Clases"}
                        </p>
                    </div>
                    <Link 
                        href="/admin/control-clases/scanner"
                        className="bg-black text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                        <QrCode className="w-5 h-5" />
                        Abrir Scanner
                    </Link>
                </div>

                {/* Filtros de Fecha */}
                <div className="flex bg-white p-2 rounded-[2rem] shadow-premium-soft border border-gray-100 gap-2 overflow-x-auto no-scrollbar">
                    {dateFilters.map((filter) => (
                        <button
                            key={filter.label}
                            onClick={() => setSelectedDate(filter.value)}
                            className={`px-8 h-14 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                                selectedDate === filter.value 
                                    ? 'bg-black text-white shadow-lg' 
                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                    <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input 
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className={`pl-10 pr-4 h-14 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all outline-none border-none ${
                                !dateFilters.some(f => f.value === selectedDate && f.value !== '') && selectedDate !== ''
                                    ? 'bg-black text-white shadow-lg' 
                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
                        />
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 border border-gray-50">
                        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Users className="w-4 h-4 text-orange-500" /> {selectedDate ? `Clases Programadas para el ${format(parseISO(selectedDate), "dd/MM")}` : "Todas las Clases Programadas"}
                        </h2>

                        {loading ? (
                            <div className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-xs animate-pulse">Cargando agenda...</div>
                        ) : clasesList.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-gray-200" />
                                </div>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No hay clases programadas para esta fecha</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {clasesList.map((clase) => (
                                    <Link 
                                        key={clase.id}
                                        href={`/admin/control-clases/checkin/${clase.claseId}/${clase.fecha}/${clase.hora.replace(':', '-')}`}
                                        className="group flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-black hover:bg-white transition-all"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm group-hover:bg-black group-hover:text-white transition-colors text-center px-1">
                                                {!selectedDate && <span className="text-[8px] font-black uppercase opacity-40">{format(parseISO(clase.fecha), "dd/MM")}</span>}
                                                <span className="text-[8px] font-black uppercase opacity-40">{selectedDate ? "Hora" : ""}</span>
                                                <span className="text-md font-black">{clase.hora}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 group-hover:text-black uppercase tracking-tight">{clase.nombre}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Users className="w-3 h-3" /> {clase.inscriptos} de {clase.cupo}
                                                    </span>
                                                    {!selectedDate && (
                                                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                                                            <CalendarIcon className="w-3 h-3" /> {format(parseISO(clase.fecha), "EEEE d", { locale: es })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white border border-gray-100 group-hover:bg-black group-hover:border-black text-gray-400 group-hover:text-white transition-all">
                                            <ChevronRight className="w-6 h-6" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
