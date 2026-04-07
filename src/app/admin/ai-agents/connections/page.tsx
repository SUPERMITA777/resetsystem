"use client";

import React, { useState, useEffect } from "react";
import { Phone, Smartphone, RefreshCw, CheckCircle2, AlertCircle, QrCode, LogOut, ShieldCheck, Zap, Bot } from "lucide-react";
import { getTenant, createOrUpdateTenant, TenantData } from "@/lib/services/tenantService";

export default function ConnectionsPage() {
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [loading, setLoading] = useState(true);

    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getTenant(tenantId);
            if (data) {
                setTenant(data);
                if (data.ai_config?.noemi?.whatsapp_connected) {
                    setStatus('connected');
                }
            }
            setLoading(false);
        }
        load();
    }, [tenantId]);

    const handleConnect = () => {
        setStatus('connecting');
        // Simular obtención de QR de Evolution API
        setTimeout(() => {
            setQrCode("https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=EvolutionAPI_Mock_Connection_12345");
        }, 1500);

        // Simular conexión exitosa después de 15 segundos
        setTimeout(async () => {
            if (status === 'connecting') {
                setStatus('connected');
                setQrCode(null);
                await createOrUpdateTenant(tenantId, {
                    ai_config: {
                        ...tenant?.ai_config,
                        noemi: {
                            ...tenant?.ai_config?.noemi!,
                            whatsapp_connected: true
                        }
                    }
                });
            }
        }, 15000);
    };

    const handleDisconnect = async () => {
        if (!confirm("¿Estás seguro de desconectar WhatsApp? Las agentes Noemí y Verónica dejarán de funcionar.")) return;
        
        setStatus('disconnected');
        setQrCode(null);
        await createOrUpdateTenant(tenantId, {
            ai_config: {
                ...tenant?.ai_config,
                noemi: {
                    ...tenant?.ai_config?.noemi!,
                    whatsapp_connected: false
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-white p-8 rounded-[2rem] border border-[var(--secondary)]/50 shadow-sm">
                <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-3">
                    Conexiones de Agentes
                </h1>
                <p className="text-gray-500 mt-2 font-medium">
                    Vincula tus redes sociales para que Noemí y Verónica puedan interactuar con tus clientes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* WhatsApp Card */}
                <div className={`bg-white rounded-[2rem] border-2 p-8 transition-all ${status === 'connected' ? 'border-[#25D366]/30 shadow-lg shadow-[#25D366]/5' : 'border-[var(--secondary)]/50'}`}>
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 ${status === 'connected' ? 'bg-[#25D366]' : 'bg-gray-100'} rounded-2xl flex items-center justify-center text-white transition-colors`}>
                                <Phone className={`w-7 h-7 ${status === 'connected' ? 'text-white' : 'text-gray-400'}`} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">WhatsApp Business</h2>
                                <p className="text-sm font-medium text-gray-500 mt-1">Vía Evolution API</p>
                            </div>
                        </div>
                        {status === 'connected' && (
                            <div className="bg-[#25D366]/10 text-[#25D366] px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border border-[#25D366]/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Activo
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {status === 'disconnected' && (
                            <div className="space-y-6">
                                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                    Conecta tu WhatsApp para habilitar los recordatorios automáticos y la venta asistida por IA.
                                </p>
                                <button 
                                    onClick={handleConnect}
                                    className="w-full bg-[#1c1c3c] text-white py-4 rounded-2xl font-bold hover:bg-[var(--primary)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1c1c3c]/10"
                                >
                                    <QrCode className="w-5 h-5" />
                                    Generar Código QR
                                </button>
                            </div>
                        )}

                        {status === 'connecting' && (
                            <div className="flex flex-col items-center justify-center py-4 space-y-6">
                                {qrCode ? (
                                    <>
                                        <div className="p-4 bg-white border-4 border-gray-100 rounded-[2rem] shadow-sm relative group">
                                            <img src={qrCode} alt="WhatsApp QR" className="w-48 h-48 rounded-xl" />
                                            <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.8rem] flex items-center justify-center cursor-pointer">
                                                <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin-slow" />
                                            </div>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="text-sm font-bold text-gray-800">Escanea el código QR</p>
                                            <p className="text-xs text-gray-400 font-medium max-w-[200px]">Abre WhatsApp en tu teléfono {'>'} Dispositivos vinculados {'>'} Vincular un dispositivo.</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-12 space-y-4">
                                        <RefreshCw className="w-10 h-10 text-[var(--primary)] animate-spin" />
                                        <p className="text-sm font-bold text-gray-400">Solicitando instancia...</p>
                                    </div>
                                )}
                                <button 
                                    onClick={() => setStatus('disconnected')}
                                    className="text-sm font-bold text-gray-400 hover:text-red-500"
                                >
                                    Cancelar conexión
                                </button>
                            </div>
                        )}

                        {status === 'connected' && (
                            <div className="space-y-6">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-tighter">
                                        <span>Instancia</span>
                                        <span className="text-gray-800">{tenantId}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-tighter">
                                        <span>Estado</span>
                                        <span className="text-[#25D366]">Operativo</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleDisconnect}
                                    className="w-full bg-white border-2 border-red-500/20 text-red-500 py-4 rounded-2xl font-bold hover:bg-red-50 hover:border-red-500/40 transition-all flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Desconectar WhatsApp
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Instagram Card */}
                <div className="bg-white rounded-[2rem] border border-[var(--secondary)]/50 p-8 opacity-60">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-2xl flex items-center justify-center text-white">
                                <Smartphone className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Instagram Direct</h2>
                                <p className="text-sm font-medium text-gray-500 mt-1">Próximamente</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed mb-8">
                        Integración directa con Meta Graph API para que Noemí pueda vender a través de tus DMs de Instagram.
                    </p>
                    <button disabled className="w-full bg-gray-100 text-gray-400 py-4 rounded-2xl font-bold cursor-not-allowed">
                        Próximamente
                    </button>
                </div>

            </div>

            {/* Info Section */}
            <div className="bg-[#1c1c3c] rounded-[2rem] p-8 text-white relative overflow-hidden">
                <Zap className="absolute top-0 right-0 w-64 h-64 text-white/5 -translate-y-1/2 translate-x-1/4" />
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold">Seguro y Privado</h3>
                        <p className="text-xs text-white/60 leading-relaxed font-medium">Tus datos y conversaciones están encriptados y protegidos bajo protocolos de seguridad bancaria.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 font-black">
                            %
                        </div>
                        <h3 className="font-bold">Ahorro de Tiempo</h3>
                        <p className="text-xs text-white/60 leading-relaxed font-medium">Las agentes atienden el 80% de las consultas repetitivas sin que tengas que tocar el celular.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="w-10 h-10 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center">
                            <Bot className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <h3 className="font-bold">Multi-agente</h3>
                        <p className="text-xs text-white/60 leading-relaxed font-medium">Noemí y Verónica trabajan en equipo sobre la misma línea de WhatsApp para una experiencia fluida.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
