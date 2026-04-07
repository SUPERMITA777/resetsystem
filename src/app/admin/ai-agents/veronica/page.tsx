"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, CalendarClock, Phone, RefreshCw, Settings, AlertCircle, Save, Check, Clock } from "lucide-react";
import { getTenant, createOrUpdateTenant, TenantData } from "@/lib/services/tenantService";

export default function VeronicaAIPage() {
    const [isActive, setIsActive] = useState(false);
    const [timing, setTiming] = useState("24h");
    const [autoReschedule, setAutoReschedule] = useState(true);
    const [smartWaitlist, setSmartWaitlist] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState<TenantData | null>(null);

    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getTenant(tenantId);
            if (data) {
                setTenant(data);
                if (data.ai_config?.veronica) {
                    setIsActive(data.ai_config.veronica.active);
                    setTiming(data.ai_config.veronica.timing);
                    setAutoReschedule(data.ai_config.veronica.auto_reschedule);
                    setSmartWaitlist(data.ai_config.veronica.smart_waitlist || false);
                }
            }
            setLoading(false);
        }
        load();
    }, [tenantId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await createOrUpdateTenant(tenantId, {
                ai_config: {
                    ...tenant?.ai_config,
                    veronica: {
                        active: isActive,
                        timing,
                        auto_reschedule: autoReschedule,
                        smart_waitlist: smartWaitlist
                    }
                }
            });
            // Update local state
            setTenant(prev => prev ? ({
                ...prev,
                ai_config: {
                    ...prev.ai_config,
                    veronica: {
                        active: isActive,
                        timing,
                        auto_reschedule: autoReschedule,
                        smart_waitlist: smartWaitlist
                    }
                }
            }) : null);
        } catch (error) {
            console.error("Error saving Veronica config:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-[#ff006e]" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-[var(--secondary)]/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff006e]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#ff006e] to-[#8338ec] rounded-3xl flex items-center justify-center shadow-lg shadow-[#ff006e]/20 border border-white/20">
                        <MessageSquare className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-3">
                            Verónica
                            <span className="px-3 py-1 bg-[#ff006e]/10 text-[#ff006e] text-xs font-black uppercase tracking-widest rounded-full">
                                IA Recordatorios
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-2 font-medium max-w-lg">
                            Tu asistente para evitar inasistencias. Confirma turnos por WhatsApp y re-agenda automáticamente si alguien cancela, llenando tus espacios libres.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-[var(--secondary)]/30 p-2 rounded-full border border-[var(--secondary)] relative z-10">
                    <span className={`text-sm font-bold pl-4 ${isActive ? 'text-[#ff006e]' : 'text-gray-400'}`}>
                        {isActive ? 'Agente Activo' : 'Agente Pausado'}
                    </span>
                    <button 
                        onClick={() => setIsActive(!isActive)}
                        className={`w-16 h-8 rounded-full relative p-1 transition-colors duration-300 ${isActive ? 'bg-[#ff006e]' : 'bg-gray-300'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${isActive ? 'translate-x-8' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            {/* Configuraciones */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Status & Stats Side */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-[#ff006e]" />
                        Estado Operativo
                    </h2>
                    
                    <div className="bg-white rounded-3xl border border-[var(--secondary)]/50 p-6 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center bg-[#25D366]/5 border border-[#25D366]/20 p-4 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-[#25D366]" />
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Línea Emisora</p>
                                    <p className="text-xs text-[#25D366] font-semibold mt-0.5">WhatsApp Conectado</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4 py-4 border-t border-[var(--secondary)]/50">
                            <div className="space-y-1">
                                <p className="text-3xl font-black text-[#1c1c3c]">98%</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tasa Asistencia</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl font-black text-[#ff006e]">12</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Turnos Salvados</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#ff006e]/5 rounded-3xl p-6 border border-[#ff006e]/10 text-sm font-medium text-[#ff006e] flex gap-3 leading-relaxed">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>Verónica escribirá de forma automatizada. Si el cliente responde algo fuera de la confirmación, se derivará al administrador.</p>
                    </div>
                </div>

                {/* Comportamiento */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Settings className="w-5 h-5 text-[#ff006e]" />
                        Reglas de Verónica
                    </h2>

                    <div className="bg-white rounded-3xl border border-[var(--secondary)]/50 p-6 lg:p-8 space-y-8 shadow-sm">
                        
                        {/* Timing */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                ¿Cuándo contactar al cliente?
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {['48h', '24h', '12h', 'Misma Mañana'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTiming(t)}
                                        className={`px-4 py-3 rounded-2xl border-2 text-center transition-all font-bold text-sm ${timing === t ? 'border-[#ff006e] bg-[#ff006e]/5 text-[#ff006e]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700">Acciones Autónomas</label>
                            <div className="space-y-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <div className="pr-4">
                                        <span className="text-sm font-bold block mb-1 text-gray-800">Re-agendamiento Automático</span>
                                        <span className="text-xs text-gray-500 font-medium">Si el cliente cancela, ofrece opciones para la próxima semana.</span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded border-gray-300 text-[#ff006e] focus:ring-[#ff006e]" 
                                        checked={autoReschedule}
                                        onChange={(e) => setAutoReschedule(e.target.checked)}
                                    />
                                </label>
                                <hr className="border-gray-200" />
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <div className="pr-4">
                                        <span className="text-sm font-bold block mb-1 text-gray-800">Lista de Espera Inteligente</span>
                                        <span className="text-xs text-gray-500 font-medium">Si un turno se libera, notificar a los clientes en lista de espera.</span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded border-gray-300 text-[#ff006e] focus:ring-[#ff006e]" 
                                        checked={smartWaitlist}
                                        onChange={(e) => setSmartWaitlist(e.target.checked)}
                                    />
                                </label>
                            </div>
                        </div>
                        
                        {/* Plantilla */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-700">Mensaje Base de Verónica</label>
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 relative">
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                    "Hola <span className="text-[#ff006e] bg-[#ff006e]/10 px-1 rounded">[Nombre]</span>, soy Verónica del equipo de <span className="text-[#ff006e] bg-[#ff006e]/10 px-1 rounded">[Negocio]</span>. Te recuerdo tu turno de <span className="text-[#ff006e] bg-[#ff006e]/10 px-1 rounded">[Servicio]</span> para mañana a las <span className="text-[#ff006e] bg-[#ff006e]/10 px-1 rounded">[Hora]</span>. ¿Confirmas tu asistencia? SI/NO."
                                </p>
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-[#1c1c3c] text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-[#ff006e] active:scale-95 transition-all flex items-center gap-2 shadow-lg disabled:opacity-70"
                        >
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
