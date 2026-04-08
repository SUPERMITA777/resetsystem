"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Phone, Smartphone, RefreshCw, CheckCircle2, AlertCircle, QrCode, LogOut, ShieldCheck, Zap, Bot, MessageSquare, Settings, ArrowRight, Cpu } from "lucide-react";
import { getTenant, createOrUpdateTenant, TenantData } from "@/lib/services/tenantService";
import Link from "next/link";

export default function ConnectionsPage() {
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [selectedOS, setSelectedOS] = useState<'Windows' | 'Linux' | 'macOS'>('Windows');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'whatsapp' | 'instagram'>('whatsapp');

    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'instagram') setActiveTab('instagram');
    }, []);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getTenant(tenantId);
            if (data) {
                setTenant(data);
            }
            setLoading(false);
        }
        load();
    }, [tenantId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-[var(--secondary)]/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] flex items-center gap-3">
                            <Zap className="w-8 h-8 text-[var(--primary)]" />
                            Conexiones Multicanal
                        </h1>
                        <p className="text-gray-500 mt-2 font-medium max-w-xl">
                            Gestiona cómo tus agentes interactúan con los clientes en cada plataforma.
                        </p>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                        <button 
                            onClick={() => setActiveTab('whatsapp')}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'whatsapp' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-gray-500'}`}
                        >
                            WhatsApp
                        </button>
                        <button 
                            onClick={() => setActiveTab('instagram')}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'instagram' ? 'bg-white text-[#ee2a7b] shadow-sm' : 'text-gray-500'}`}
                        >
                            Instagram
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Conexión Activa */}
                <div className="lg:col-span-1 space-y-6">
                    {activeTab === 'whatsapp' ? (
                        <div className="bg-white rounded-[2.5rem] border-2 p-8 transition-all sticky top-8 border-[#25D366]/30 shadow-xl shadow-[#25D366]/5">
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="w-20 h-20 bg-[#25D366] rounded-[2rem] flex items-center justify-center text-white transition-all transform hover:scale-105 duration-300">
                                    <Phone className="w-10 h-10 text-white" />
                                </div>
                                
                                <div>
                                    <h2 className="text-2xl font-black">WhatsApp</h2>
                                    <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Standalone Agent</p>
                                </div>

                                <div className="w-full pt-4 space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-black text-gray-400 uppercase">Salón (ID)</span>
                                        <span className="text-xs font-bold text-gray-800">{tenantId}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 bg-[var(--primary)]/5 p-4 rounded-xl border border-[var(--primary)]/10 text-left">
                                        La conexión de WhatsApp ahora se gestiona directamente de forma segura desde la aplicación <b>Plug & Play</b> instalada en tu computadora.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border-2 p-8 transition-all sticky top-8 border-[#ee2a7b]/30 shadow-xl shadow-[#ee2a7b]/5">
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="w-20 h-20 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-[2rem] flex items-center justify-center text-white transition-all transform hover:scale-105 duration-300">
                                    <Smartphone className="w-10 h-10 text-white" />
                                </div>
                                
                                <div>
                                    <h2 className="text-2xl font-black">Instagram</h2>
                                    <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Meta API Bridge</p>
                                </div>

                                <div className="w-full pt-4 space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-black text-gray-400 uppercase">Estado</span>
                                        <span className={`text-xs font-bold ${tenant?.ai_config?.noemi?.instagram_connected ? 'text-green-500' : 'text-amber-500'}`}>
                                            {tenant?.ai_config?.noemi?.instagram_connected ? 'VINCULADO' : 'PENDIENTE'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl border border-gray-100 text-left">
                                        Vincula tu cuenta de Instagram Business para que Noemí pueda responder mensajes directos y captar leads automáticamente.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Detalle de Agentes Activos */}
                <div className="lg:col-span-2 space-y-8">
                    <h2 className="text-xl font-black flex items-center gap-3 text-gray-800">
                        <Bot className="w-6 h-6 text-[var(--primary)]" />
                        Agentes activos en {activeTab}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Noemí */}
                        <div className="bg-white rounded-[2.5rem] border border-[var(--secondary)]/50 p-8 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-5 mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#7209b7] to-[#39008c] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Bot className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl">Noemí</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">Especialista en Ventas</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
                                    <span>Tono: <b className="capitalize">{tenant?.ai_config?.noemi?.tone || 'Amigable'}</b></span>
                                </div>
                                <div className="text-xs text-gray-500 leading-relaxed italic bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    "{tenant?.ai_config?.noemi?.rules || 'Sin instrucciones adicionales configuradas.'}"
                                </div>
                            </div>

                            <Link 
                                href="/admin/ai-agents/noemi"
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl text-xs font-black text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all border border-gray-100"
                            >
                                <Settings className="w-4 h-4" />
                                CONFIGURAR COMPORTAMIENTO
                            </Link>
                        </div>

                        {/* Verónica */}
                        <div className="bg-white rounded-[2.5rem] border border-[var(--secondary)]/50 p-8 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-5 mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#4cc9f0] to-[#4361ee] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Bot className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl">Verónica</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4cc9f0]">Recordatorios</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <CheckCircle2 className="w-4 h-4 text-[#4cc9f0]" />
                                    <span>Objetivo: <b>Confirmar Citas</b></span>
                                </div>
                                <div className="text-xs text-gray-500 leading-relaxed italic bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    "Hola, soy Verónica. Te escribo para confirmar tu turno de mañana..."
                                </div>
                            </div>

                            <Link 
                                href="/admin/ai-agents/veronica"
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl text-xs font-black text-gray-400 hover:text-[#4361ee] hover:bg-[#4361ee]/5 transition-all border border-gray-100"
                            >
                                <Settings className="w-4 h-4" />
                                CONFIGURAR COMPORTAMIENTO
                            </Link>
                        </div>
                    </div>

                    {/* Configuración Avanzada de Agentes */}
                    <div className="bg-white rounded-[2.5rem] border border-[var(--secondary)]/50 p-10 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6 text-black" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">Control de Independencia</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Atención personalizada y frases secretas</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                                    <MessageSquare className="w-4 h-4" /> Frase para MUTE (Hablar con humano)
                                </label>
                                <input 
                                    type="text"
                                    placeholder="Ej: Quiero hablar con Sole"
                                    value={tenant?.ai_config?.noemi?.pause_phrase || ''}
                                    onChange={async (e) => {
                                        const val = e.target.value;
                                        setTenant(prev => prev ? {
                                            ...prev,
                                            ai_config: {
                                                ...prev.ai_config,
                                                noemi: { ...prev.ai_config?.noemi!, pause_phrase: val }
                                            }
                                        } : null);
                                    }}
                                    className="w-full h-16 bg-gray-50 rounded-2xl px-6 font-bold text-sm border-2 border-transparent focus:border-black/5 focus:bg-white transition-all outline-none"
                                />
                                <p className="text-[9px] text-gray-400 font-medium px-1">Si el cliente dice esto, la IA dejará de responder en ese chat.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                                    <Zap className="w-4 h-4" /> Frase para RESUME (Despertar IA)
                                </label>
                                <input 
                                    type="text"
                                    placeholder="Ej: Noemi continua con tu trabajo"
                                    value={tenant?.ai_config?.noemi?.resume_phrase || ''}
                                    onChange={async (e) => {
                                        const val = e.target.value;
                                        setTenant(prev => prev ? {
                                            ...prev,
                                            ai_config: {
                                                ...prev.ai_config,
                                                noemi: { ...prev.ai_config?.noemi!, resume_phrase: val }
                                            }
                                        } : null);
                                    }}
                                    className="w-full h-16 bg-gray-50 rounded-2xl px-6 font-bold text-sm border-2 border-transparent focus:border-black/5 focus:bg-white transition-all outline-none"
                                />
                                <p className="text-[9px] text-gray-400 font-medium px-1">Usa esto para que la IA vuelva a tomar el control del chat.</p>
                            </div>
                        </div>

                        {/* Modo Local Server */}
                        <div className="mt-10 pt-10 border-t border-gray-100">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                    <Cpu className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-tight">Modo Servidor Local</h4>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Apaga la IA automáticamente con tu PC</p>
                                </div>
                            </div>
                            
                            <div className="bg-indigo-50/50 p-6 rounded-3xl mb-8">
                                <p className="text-[11px] text-indigo-900 leading-relaxed font-medium">
                                    Si instalas el motor de mensajería en tu PC del salón, los agentes se desconectarán automáticamente cuando apagues la computadora. Esto te permite usar WhatsApp normalmente en tu celular cuando no estás en el local.
                                </p>
                            </div>

                            <div className="space-y-4 max-w-xl">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                                    URL de Servidor Local (Ej: Cloudflare Tunnel o Ngrok)
                                </label>
                                <input 
                                    type="text"
                                    placeholder="https://tu-pc-local.trycloudflared.com"
                                    value={tenant?.ai_config?.evolution_api_url || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setTenant(prev => prev ? {
                                            ...prev,
                                            ai_config: {
                                                ...prev.ai_config,
                                                evolution_api_url: val
                                            }
                                        } : null);
                                    }}
                                    className="w-full h-16 bg-gray-50 rounded-2xl px-6 font-bold text-sm border-2 border-transparent focus:border-indigo-200 focus:bg-white transition-all outline-none"
                                />
                                <p className="text-[9px] text-gray-400 font-medium px-1">Deja vacío para usar el servidor central por defecto.</p>
                            </div>

                            {/* Nuevo Instalador Plug & Play */}
                            <div className="mt-12 bg-gray-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
                                
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-green-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase tracking-tight">Agente "Plug & Play" Local</h4>
                                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Sin instalaciones - Sin configuraciones técnicas</p>
                                        </div>
                                    </div>

                                    {/* Tabs de SO */}
                                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                                        {['Windows', 'Linux', 'macOS'].map((os) => (
                                            <button
                                                key={os}
                                                onClick={() => setSelectedOS(os as any)}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    selectedOS === os 
                                                    ? 'bg-white text-black shadow-lg' 
                                                    : 'text-gray-500 hover:text-white'
                                                }`}
                                            >
                                                {os === 'Windows' && '🪟 '}
                                                {os === 'Linux' && '🐧 '}
                                                {os === 'macOS' && '🍎 '}
                                                {os}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <div className="bg-black/50 p-6 rounded-2xl border border-white/5">
                                        <h5 className="text-[12px] font-bold text-white mb-2">Instrucciones:</h5>
                                        <ol className="list-decimal list-inside text-[11px] text-gray-400 space-y-2 mb-6">
                                            <li>Haz clic en el botón de descarga inferior.</li>
                                            <li>Abre el programa descargado (haciendo doble clic).</li>
                                            <li>Se abrirá una pequeña ventana en negro, escribe allí tu código de salón: <strong>{tenantId}</strong></li>
                                            <li>Escanea el Código QR con el WhatsApp de tu salón (Dispositivos Vinculados).</li>
                                            <li>¡Listo! Ya puedes minimizar la ventana. La IA funcionará hasta que cierres el programa o apagues tu PC.</li>
                                        </ol>
                                        
                                        <a 
                                            href={`/downloads/ResetAgent${selectedOS === 'Windows' ? '.exe' : selectedOS === 'Linux' ? '_Linux' : '_Mac'}`}
                                            download={`AgenteResetSpa_${selectedOS}${selectedOS === 'Windows' ? '.exe' : ''}`}
                                            className="inline-flex items-center gap-3 px-8 py-4 bg-green-500 text-black rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-green-400 hover:scale-105 active:scale-95 transition-all shadow-xl"
                                        >
                                            <Smartphone className="w-5 h-5" />
                                            Descargar Agente para {selectedOS}
                                        </a>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-full border border-white/5 text-[9px] font-bold text-gray-400">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Standalone (No requiere Docker)
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-full border border-white/5 text-[9px] font-bold text-gray-400">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Se apaga con tu PC
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={async () => {
                                if (tenant && tenantId) {
                                    await createOrUpdateTenant(tenantId, {
                                        ai_config: tenant.ai_config
                                    });
                                    import('react-hot-toast').then(t => t.default.success("Configuración guardada exitosamente"));
                                }
                            }}
                            className="mt-10 flex items-center gap-3 px-10 h-16 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            Guardar Cambios
                        </button>
                    </div>

                    {/* Privacidad Info */}
                    <div className="bg-[#1c1c3c] rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                        <ShieldCheck className="absolute top-0 right-0 w-48 h-48 text-white/5 -translate-y-1/4 translate-x-1/4" />
                        <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center shrink-0">
                            <Smartphone className="w-10 h-10" />
                        </div>
                        <div className="space-y-2 relative z-10">
                            <h4 className="text-lg font-black tracking-tight">Tu privacidad es sagrada</h4>
                            <p className="text-sm text-white/60 leading-relaxed font-medium">
                                Noemí y Verónica solo pueden ver los mensajes de tu salón. La conexión es punto a punto y no almacenamos tus conversaciones privadas de WhatsApp personales.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
