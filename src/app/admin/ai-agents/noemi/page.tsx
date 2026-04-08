"use client";

import React, { useState, useEffect } from "react";
import { Bot, Link as LinkIcon, Smartphone, Mail, Phone, Settings, AlertCircle, Save, Check, RefreshCw } from "lucide-react";
import { getTenant, createOrUpdateTenant, TenantData } from "@/lib/services/tenantService";
import Link from "next/link";

export default function NoemiAIPage() {
    const [isActive, setIsActive] = useState(false);
    const [tone, setTone] = useState<'profesional' | 'amigable' | 'casual'>("amigable");
    const [rules, setRules] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState<TenantData | null>(null);

    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await getTenant(tenantId);
                if (data) {
                    setTenant(data);
                    if (data.ai_config?.noemi) {
                        setIsActive(data.ai_config.noemi.active);
                        setTone(data.ai_config.noemi.tone);
                        setRules(data.ai_config.noemi.rules || "");
                    }
                }
            } catch (err) {
                console.error("Error loading admin data:", err);
            }
            setLoading(false);
        }
        load();
    }, [tenantId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedData: Partial<TenantData> = {
                ai_config: {
                    ...tenant?.ai_config,
                    noemi: {
                        ...tenant?.ai_config?.noemi,
                        active: isActive,
                        tone: tone,
                        rules: rules
                    }
                }
            };

            await createOrUpdateTenant(tenantId, updatedData);
            setTenant(prev => prev ? ({ ...prev, ...updatedData }) : null);
        } catch (error) {
            console.error("Error saving Noemi config:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-[var(--secondary)]/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#7209b7] to-[#39008c] rounded-3xl flex items-center justify-center shadow-lg shadow-[#7209b7]/20 border border-white/20">
                        <Bot className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-3">
                            Noemí
                            <span className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-black uppercase tracking-widest rounded-full">
                                IA Ventas
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-2 font-medium max-w-lg">
                            Tu experta en ventas 24/7. Capta leads, responde dudas y cierra turnos en tu agenda de forma autónoma. Los turnos creados quedarán pendientes de tu aprobación.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-[var(--secondary)]/30 p-2 rounded-full border border-[var(--secondary)] relative z-10">
                    <span className={`text-sm font-bold pl-4 ${isActive ? 'text-[var(--primary)]' : 'text-gray-400'}`}>
                        {isActive ? 'Agente Activo' : 'Agente Pausado'}
                    </span>
                    <button 
                        onClick={() => setIsActive(!isActive)}
                        className={`w-16 h-8 rounded-full relative p-1 transition-colors duration-300 ${isActive ? 'bg-[var(--primary)]' : 'bg-gray-300'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${isActive ? 'translate-x-8' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            {/* Configuraciones */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Canales */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-[var(--primary)]" />
                        Canales Vinculados
                    </h2>
                    
                    <div className="bg-white rounded-3xl border border-[var(--secondary)]/50 p-6 space-y-4 shadow-sm">
                        <Link 
                            href="/admin/ai-agents/connections"
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:border-[var(--primary)]/30 ${tenant?.ai_config?.noemi?.whatsapp_connected ? 'bg-[#25D366]/5 border-[#25D366]/20' : 'bg-gray-50 border-gray-100 opacity-60'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 ${tenant?.ai_config?.noemi?.whatsapp_connected ? 'bg-[#25D366]' : 'bg-gray-400'} rounded-xl flex items-center justify-center text-white`}>
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">WhatsApp Business</p>
                                    <p className={`text-xs ${tenant?.ai_config?.noemi?.whatsapp_connected ? 'text-[#25D366] font-semibold' : 'text-gray-500 font-medium'} mt-0.5`}>
                                        {tenant?.ai_config?.noemi?.whatsapp_connected ? 'Conectado' : 'No Vinculado'}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-xs font-bold ${tenant?.ai_config?.noemi?.whatsapp_connected ? 'text-gray-400 hover:text-black hover:underline' : 'text-[var(--primary)] hover:underline'}`}>
                                {tenant?.ai_config?.noemi?.whatsapp_connected ? 'Cambiar' : 'Conectar'}
                            </span>
                        </Link>

                        <div className={`flex items-center justify-between p-4 rounded-2xl border ${tenant?.ai_config?.noemi?.instagram_connected ? 'bg-gradient-to-tr from-[#f9ce34]/5 via-[#ee2a7b]/5 to-[#6228d7]/5 border-[#ee2a7b]/20' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 ${tenant?.ai_config?.noemi?.instagram_connected ? 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' : 'bg-gray-400'} rounded-xl flex items-center justify-center text-white`}>
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Instagram Direct</p>
                                    <p className={`text-xs ${tenant?.ai_config?.noemi?.instagram_connected ? 'text-[#ee2a7b] font-semibold' : 'text-gray-500 font-medium'} mt-0.5`}>
                                        {tenant?.ai_config?.noemi?.instagram_connected ? 'Conectado' : 'No Vinculado'}
                                    </p>
                                </div>
                            </div>
                            <button className={`text-xs font-bold ${tenant?.ai_config?.noemi?.instagram_connected ? 'text-gray-400 hover:text-black hover:underline' : 'text-[var(--primary)] hover:underline'}`}>
                                {tenant?.ai_config?.noemi?.instagram_connected ? 'Cambiar' : 'Conectar'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-[var(--primary)]/5 rounded-3xl p-6 border border-[var(--primary)]/10 text-sm font-medium text-[var(--primary)] flex gap-3 leading-relaxed">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>Noemí intentará agendar el turno automáticamente. Se creará con el estado "Pendiente" para que tú lo confirmes finalmente.</p>
                    </div>
                </div>

                {/* Personalidad y Reglas */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Settings className="w-5 h-5 text-[var(--primary)]" />
                        Comportamiento de Noemí
                    </h2>

                    <div className="bg-white rounded-3xl border border-[var(--secondary)]/50 p-6 lg:p-8 space-y-8 shadow-sm">
                        
                        {/* Tono de voz */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700">Tono de Voz</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(['profesional', 'amigable', 'casual'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTone(t)}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${tone === t ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold capitalize">{t}</span>
                                            {tone === t && <Check className="w-4 h-4 text-[var(--primary)]" />}
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">
                                            {t === 'profesional' && 'Usted, con respeto y lenguaje técnico del salón.'}
                                            {t === 'amigable' && 'Cálido, usa emojis y trata de tú al cliente. Empático.'}
                                            {t === 'casual' && 'Súper relajado, juvenil, ideal para barberías o estudios.'}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reglas de agendamiento */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700">Reglas de Agendamiento Automático</label>
                            <div className="space-y-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" defaultChecked />
                                    <span className="text-sm font-medium">Ofrecer turnos solo en mis Huecos Libres.</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" defaultChecked />
                                    <span className="text-sm font-medium">Requerir confirmación humana (Estatus Pendiente).</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                                    <span className="text-sm font-medium">Ofrecer pago con seña automáticamente.</span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-700">Base de Conocimiento y Entrenamiento (Prompt)</label>
                            <p className="text-xs text-gray-500">
                                Escribe aquí cualquier detalle, regla o política del salón que la IA deba tener en cuenta para responder. 
                                Puedes agregar direcciones, métodos de pago, promociones actuales, o cómo manejar ciertos servicios.
                            </p>
                            <textarea 
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none font-medium text-gray-700"
                                rows={6}
                                value={rules}
                                onChange={(e) => setRules(e.target.value)}
                                placeholder="Ej: No ofrezcas turnos los lunes porque cerramos. Para uñas esculpidas, siempre avisa que demora 2 horas. Si preguntan formas de pago, diles que aceptamos Efectivo y Transferencia con 10% off."
                            />
                        </div>

                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-[#1c1c3c] text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-[var(--primary)] active:scale-95 transition-all flex items-center gap-2 shadow-lg disabled:opacity-70"
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
