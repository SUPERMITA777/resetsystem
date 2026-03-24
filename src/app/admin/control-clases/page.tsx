"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { claseService, Clase } from "@/lib/services/claseService";
import { getTurnosPorFecha, TurnoDB } from "@/lib/services/agendaService";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QrCode, Users, Clock, ChevronRight, Search } from "lucide-react";
import Link from "next/link";

export default function ControlClasesPage() {
    const [clasesHoy, setClasesHoy] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';
    const hoyStr = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        loadClases();
    }, []);

    const loadClases = async () => {
        setLoading(true);
        try {
            // Obtener todos los turnos de tipo clase para hoy
            const turnos = await getTurnosPorFecha(tenantId, hoyStr);
            const turnosClase = turnos.filter(t => !!t.claseId);

            // Agrupar por clase y horario
            const grupos: Record<string, any> = {};
            turnosClase.forEach(t => {
                const key = `${t.claseId}-${t.horaInicio}`;
                if (!grupos[key]) {
                    grupos[key] = {
                        claseId: t.claseId,
                        nombre: t.tratamientoAbreviado,
                        hora: t.horaInicio,
                        inscriptos: 0,
                        id: key
                    };
                }
                grupos[key].inscriptos++;
            });

            // Cargar datos de la clase para obtener el cupo
            const clasesDb = await claseService.getClases(tenantId);
            const final = Object.values(grupos).map(g => {
                const c = clasesDb.find(cl => cl.id === g.claseId);
                return { ...g, cupo: c?.cupo || 0 };
            });

            setClasesHoy(final.sort((a, b) => a.hora.localeCompare(b.hora)));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">Control de Clases</h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                             <Clock className="w-3 h-3" /> {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
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

                <div className="grid gap-4">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 border border-gray-50">
                        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Users className="w-4 h-4 text-orange-500" /> Clases Programadas para Hoy
                        </h2>

                        {loading ? (
                            <div className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-xs animate-pulse">Cargando agenda...</div>
                        ) : clasesHoy.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-gray-200" />
                                </div>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No hay clases programadas para hoy</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {clasesHoy.map((clase) => (
                                    <Link 
                                        key={clase.id}
                                        href={`/admin/control-clases/checkin/${clase.claseId}/${clase.hora.replace(':', '-')}`}
                                        className="group flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-black hover:bg-white transition-all"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm group-hover:bg-black group-hover:text-white transition-colors">
                                                <span className="text-[10px] font-black uppercase opacity-40">Hora</span>
                                                <span className="text-lg font-black">{clase.hora}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 group-hover:text-black uppercase tracking-tight">{clase.nombre}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Users className="w-3 h-3" /> {clase.inscriptos} de {clase.cupo}
                                                    </span>
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
