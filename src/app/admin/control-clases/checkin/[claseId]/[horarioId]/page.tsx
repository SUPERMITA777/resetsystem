"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { use } from "react";
import { getInscriptosPorClaseYHorario, updateTurno, TurnoDB } from "@/lib/services/agendaService";
import { claseService, Clase } from "@/lib/services/claseService";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle, Clock, User, Phone, ArrowLeft, QrCode, Search } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface CheckinPageProps {
    params: Promise<{
        claseId: string;
        horarioId: string;
    }>;
}

export default function CheckinPage({ params }: CheckinPageProps) {
    const { claseId, horarioId: rawHorarioId } = use(params);
    const horarioId = rawHorarioId.replace('-', ':'); // reverse transformation if needed
    
    const [alumnos, setAlumnos] = useState<TurnoDB[]>([]);
    const [clase, setClase] = useState<Clase | null>(null);
    const [loading, setLoading] = useState(true);
    const [bgStatus, setBgStatus] = useState<'default' | 'success' | 'error'>('default');
    const [codeInput, setCodeInput] = useState("");

    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        loadData();
    }, [claseId, horarioId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [data, claseInfo] = await Promise.all([
                getInscriptosPorClaseYHorario(tenantId, claseId, hoyStr(), horarioId),
                claseService.getClaseById(tenantId, claseId)
            ]);
            setAlumnos(data);
            setClase(claseInfo);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar alumnos");
        } finally {
            setLoading(false);
        }
    };

    const hoyStr = () => {
        return new Date().toISOString().split('T')[0];
    };

    const handleCheckin = async (turnoId: string) => {
        try {
            await updateTurno(tenantId, turnoId, { status: 'COMPLETADO' });
            loadData();
        } catch (error) {
            toast.error("Error al registrar asistencia");
        }
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = codeInput.toUpperCase().trim();
        
        // Buscar alumno que coincida con el código (y que no esté ya COMPLETADO)
        const target = alumnos.find(a => a.checkinCode === code && a.status !== 'COMPLETADO');

        if (target) {
            setBgStatus('success');
            await handleCheckin(target.id);
            toast.success(`¡Bienvenida ${target.clienteAbreviado}!`);
            setCodeInput("");
            setTimeout(() => setBgStatus('default'), 2000);
        } else {
            setBgStatus('error');
            toast.error("Código incorrecto o alumno ya registrado");
            setTimeout(() => setBgStatus('default'), 2000);
        }
    };

    return (
        <AdminLayout>
            <div className={`min-h-screen transition-colors duration-500 ${
                bgStatus === 'success' ? 'bg-emerald-500' : 
                bgStatus === 'error' ? 'bg-red-500' : 'bg-transparent'
            }`}>
                <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pt-8 pb-20 px-4">
                    <Link href="/admin/control-clases" className={`flex items-center gap-2 font-black uppercase tracking-widest text-[10px] transition-colors ${bgStatus !== 'default' ? 'text-white' : 'text-gray-400 hover:text-black'}`}>
                        <ArrowLeft className="w-4 h-4" /> Volver al listado
                    </Link>

                    <div className="flex justify-between items-start">
                        <div className={bgStatus !== 'default' ? 'text-white' : ''}>
                            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{clase?.nombre || "Cargando..."}</h1>
                            <p className={`text-xs font-black uppercase tracking-[0.3em] mt-3 ${bgStatus !== 'default' ? 'text-white/80' : 'text-gray-400'}`}>
                                HOY {horarioId} HS • {alumnos.length} inscritos
                            </p>
                        </div>
                    </div>

                    {/* Alphanumeric Code Input */}
                    <div className={`${bgStatus !== 'default' ? 'bg-white/10 backdrop-blur-md border-white/20' : 'bg-white border-gray-50'} rounded-[2.5rem] p-8 shadow-xl border transition-all`}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className={`text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${bgStatus !== 'default' ? 'text-white' : 'text-gray-400'}`}>
                                <QrCode className="w-4 h-4" /> Registro por Código
                            </h2>
                        </div>

                        <form onSubmit={handleCodeSubmit} className="max-w-md mx-auto space-y-6">
                            <p className={`text-center text-sm font-black uppercase tracking-widest ${bgStatus !== 'default' ? 'text-white' : 'text-gray-500'}`}>
                                Ingresa el código de 4 dígitos
                            </p>
                            <div className="flex flex-col gap-4">
                                <input 
                                    autoFocus
                                    maxLength={4}
                                    placeholder="####"
                                    value={codeInput}
                                    onChange={e => setCodeInput(e.target.value.toUpperCase())}
                                    className={`h-24 w-full text-center text-5xl font-black rounded-3xl outline-none transition-all shadow-inner tracking-[0.5em] pl-[0.5em] ${
                                        bgStatus === 'success' ? 'bg-white text-emerald-600' :
                                        bgStatus === 'error' ? 'bg-white text-red-600' :
                                        'bg-gray-50 text-gray-900 focus:ring-4 focus:ring-black/5'
                                    }`}
                                />
                                <Button 
                                    type="submit" 
                                    className={`h-16 w-full font-black uppercase tracking-[0.2em] text-sm rounded-2xl shadow-xl active:scale-95 transition-all ${
                                        bgStatus === 'success' ? 'bg-white text-emerald-600 hover:bg-gray-100' :
                                        bgStatus === 'error' ? 'bg-white text-red-600 hover:bg-gray-100' :
                                        'bg-black text-white hover:bg-gray-800'
                                    }`}
                                >
                                    Validar Acceso
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className={`${bgStatus !== 'default' ? 'bg-white/10 backdrop-blur-md border-white/20' : 'bg-white border-gray-50'} rounded-[2.5rem] p-8 shadow-xl border transition-all`}>
                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-6 ${bgStatus !== 'default' ? 'text-white' : 'text-gray-400'}`}>Lista de Alumnos</h3>
                        <div className="divide-y divide-gray-100/10">
                        {loading ? (
                            <div className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-xs animate-pulse">Cargando alumnos...</div>
                        ) : alumnos.length === 0 ? (
                            <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No hay alumnos en esta clase</div>
                        ) : (
                            alumnos.map((alumno) => (
                                <div key={alumno.id} className="py-6 flex items-center justify-between group">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl transition-all ${alumno.status === 'COMPLETADO' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400 group-hover:bg-black group-hover:text-white'}`}>
                                            {alumno.clienteAbreviado.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg leading-none">{alumno.clienteAbreviado}</h3>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {alumno.whatsapp || alumno.email || "-"}
                                                </span>
                                                {alumno.status === 'COMPLETADO' && (
                                                    <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Presente
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {alumno.status !== 'COMPLETADO' && (
                                        <button 
                                            onClick={() => handleCheckin(alumno.id)}
                                            className="px-6 h-12 bg-white border border-gray-100 hover:border-black rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:shadow-xl active:scale-95"
                                        >
                                            Confirmar Asistencia
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
</AdminLayout>
    );
}
