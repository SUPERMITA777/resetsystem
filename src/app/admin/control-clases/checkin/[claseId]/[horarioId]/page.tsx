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
    const [scanMode, setScanMode] = useState(false);
    const [scanInput, setScanInput] = useState("");

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
            const loader = toast.loading("Registrando asistencia...");
            await updateTurno(tenantId, turnoId, { status: 'COMPLETADO' });
            toast.success("Asistencia confirmada", { id: loader });
            loadData();
        } catch (error) {
            toast.error("Error al registrar asistencia");
        }
    };

    const handleScanSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // QR Data format: CLASE|turnoId|claseId|horarioId
        const parts = scanInput.split('|');
        if (parts[0] === 'CLASE' && parts[1]) {
            const turnoId = parts[1];
            const target = alumnos.find(a => a.id === turnoId);
            if (target) {
                handleCheckin(turnoId);
                setScanInput("");
                setScanMode(false);
            } else {
                toast.error("Alumno no encontrado en esta sesión");
            }
        } else {
            toast.error("QR inválido o formato incorrecto");
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
                <Link href="/admin/control-clases" className="flex items-center gap-2 text-gray-400 hover:text-black font-black uppercase tracking-widest text-[10px] transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver al listado
                </Link>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">{clase?.nombre || "Cargando..."}</h1>
                        <p className="text-gray-400 text-xs font-black uppercase tracking-[0.3em] mt-3">
                            HOY {horarioId} HS • {alumnos.length} inscritos
                        </p>
                    </div>
                </div>

                {/* Scan Simulator / Input */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-orange-500" /> Registro de Asistencia
                        </h2>
                        <button 
                            onClick={() => setScanMode(!scanMode)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scanMode ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:text-black'}`}
                        >
                            {scanMode ? "Cerrar Scanner" : "Escanear QR"}
                        </button>
                    </div>

                    {scanMode && (
                        <form onSubmit={handleScanSubmit} className="mb-8 p-6 bg-orange-50 rounded-3xl border border-orange-100 animate-in zoom-in duration-300">
                            <p className="text-xs font-black text-orange-800 uppercase tracking-widest mb-3">Escanea el código del alumno</p>
                            <div className="flex gap-2">
                                <input 
                                    autoFocus
                                    placeholder="Datos del QR..."
                                    value={scanInput}
                                    onChange={e => setScanInput(e.target.value)}
                                    className="flex-1 h-14 px-6 bg-white border-none rounded-2xl font-bold text-sm shadow-inner outline-none focus:ring-2 focus:ring-orange-500/20"
                                />
                                <Button type="submit" className="h-14 px-8 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl">Confirmar</Button>
                            </div>
                        </form>
                    )}

                    <div className="divide-y divide-gray-100">
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
        </AdminLayout>
    );
}
