"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Calendar, Clock, User, ArrowRight, Bot, Trash2, Search, RefreshCw } from "lucide-react";
import { chatLogService, ChatLog } from "@/lib/services/chatLogService";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ChatHistoryPage() {
    const [logs, setLogs] = useState<ChatLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        loadLogs();
    }, [tenantId]);

    async function loadLogs() {
        setLoading(true);
        try {
            const data = await chatLogService.getLogsByTenant(tenantId);
            // Ordenar por fecha descendente
            const sorted = data.sort((a, b) => {
                const getTime = (date: any) => {
                    if (!date) return 0;
                    if (date.toDate) return date.toDate().getTime();
                    const d = new Date(date);
                    return isNaN(d.getTime()) ? 0 : d.getTime();
                };
                return getTime(b.createdAt) - getTime(a.createdAt);
            });
            setLogs(sorted);
        } catch (error) {
            console.error("Error loading chat logs:", error);
        } finally {
            setLoading(false);
        }
    }

    const filteredLogs = logs.filter(log => 
        log.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.sessionId?.includes(searchTerm)
    );

    const parseDate = (date: any) => {
        if (!date) return null;
        if (date.toDate) return date.toDate();
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : d;
    };

    const formatDate = (date: any) => {
        const d = parseDate(date);
        if (!d) return "Fecha no disp.";
        return format(d, "PPP", { locale: es });
    };

    const formatTime = (date: any) => {
        const d = parseDate(date);
        if (!d) return "-";
        return format(d, "HH:mm");
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-3">
                        Historial de Chats
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            Monitor de IA
                        </span>
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">
                        Supervisa las conversaciones entre Noemí y tus clientes en tiempo real.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Buscar por cliente o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all"
                        />
                    </div>
                    <button 
                        onClick={loadLogs}
                        className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-all"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Listado de Logs */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Conversaciones Recientes</h2>
                    </div>
                    
                    <div className="divide-y divide-gray-50">
                        {loading ? (
                            <div className="p-20 flex flex-col items-center justify-center gap-4 text-gray-400">
                                <RefreshCw className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-bold uppercase tracking-widest">Cargando historial...</span>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="p-20 flex flex-col items-center justify-center gap-4 text-gray-400">
                                <MessageSquare className="w-12 h-12 opacity-20" />
                                <span className="text-sm font-bold uppercase tracking-widest">No hay chats registrados</span>
                            </div>
                        ) : filteredLogs.map((log) => (
                            <button
                                key={log.id}
                                onClick={() => setSelectedLog(log)}
                                className={`w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-all group ${selectedLog?.id === log.id ? 'bg-gray-50 ring-2 ring-inset ring-black' : ''}`}
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${log.platform === 'whatsapp' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {log.platform === 'whatsapp' ? <User className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 leading-tight">{log.clientName || "Cliente Web"}</p>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(log.createdAt)}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(log.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${log.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {log.status === 'active' ? 'En vivo' : 'Finalizado'}
                                    </span>
                                    <ArrowRight className={`w-5 h-5 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all ${selectedLog?.id === log.id ? 'text-black translate-x-1' : ''}`} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Detalle del Chat */}
                <div className="sticky top-8">
                    {selectedLog ? (
                        <div className="bg-black rounded-[2.5rem] shadow-2xl overflow-hidden h-[700px] flex flex-col animate-in zoom-in-95 duration-300">
                            {/* Header del Chat */}
                            <div className="p-8 border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-white font-black uppercase tracking-widest leading-none">{selectedLog.clientName}</p>
                                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                            Transcripción de Noemí
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Mensajes */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                {selectedLog.messages.map((msg, i) => (
                                    <div 
                                        key={i}
                                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`flex items-center gap-2 mb-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                                                {msg.role === 'user' ? 'Cliente' : 'Noemí'}
                                            </span>
                                            <span className="text-[8px] text-gray-600 font-bold">
                                                {formatTime(msg.timestamp)}
                                            </span>
                                        </div>
                                        <div className={`max-w-[85%] p-5 rounded-3xl text-sm font-bold leading-relaxed ${
                                            msg.role === 'user' 
                                                ? 'bg-white text-black rounded-tr-none shadow-xl shadow-white/5' 
                                                : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                                        }`}>
                                            {msg.parts[0].text}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer informativo */}
                            <div className="p-8 bg-white/5 border-t border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Plataforma</span>
                                        <span className="text-xs font-bold text-white capitalize">{selectedLog.platform}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ID Sesión</span>
                                        <span className="text-xs font-bold text-white truncate max-w-[100px]">{selectedLog.sessionId}</span>
                                    </div>
                                </div>
                                <Bot className="w-8 h-8 text-emerald-400 opacity-50" />
                            </div>
                        </div>
                    ) : (
                        <div className="h-[600px] bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center group">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                <MessageSquare className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Selecciona un chat</h3>
                            <p className="text-gray-500 mt-2 text-sm font-medium max-w-[250px]">
                                Haz clic en una conversación a la izquierda para ver el historial completo y lo que respondió Noemí.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
