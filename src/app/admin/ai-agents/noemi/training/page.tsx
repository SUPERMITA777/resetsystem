"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
    Send, 
    Bot, 
    Sparkles, 
    User, 
    Loader2, 
    BookOpen, 
    Settings, 
    BrainCircuit,
    Wand2,
    RefreshCw,
    Database
} from "lucide-react";
import { geminiService, ChatMessage } from "@/lib/services/geminiService";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface LocalMessage {
    role: "user" | "model";
    text: string;
}

export default function NoemiTrainingPage() {
    const [messages, setMessages] = useState<LocalMessage[]>([]);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        getTenant(tenantId).then(setTenant);
    }, [tenantId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue.trim();
        setMessages(prev => [...prev, { role: "user", text: userText }]);
        setInputValue("");
        setIsLoading(true);

        try {
            const response = await geminiService.chatAdmin(tenantId, userText, history);
            if (response) {
                const cleanText = response.replace(/^⚡\s*/, "");
                setMessages(prev => [...prev, { role: "model", text: cleanText }]);
                setHistory(prev => [
                    ...prev,
                    { role: "user", parts: [{ text: userText }] },
                    { role: "model", parts: [{ text: cleanText }] }
                ]);
                
                // Recargar tenant para ver el conocimiento actualizado si Noemí lo guardó
                if (cleanText.includes("conocimiento") || cleanText.includes("guardado")) {
                    getTenant(tenantId).then(setTenant);
                }
            }
        } catch (error) {
            console.error("Error en entrenamiento:", error);
            setMessages(prev => [...prev, { role: "model", text: "Hubo un error al procesar tu instrucción. ¿Podrías intentar de nuevo?" }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
            {/* Panel de Información & Estado */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-black/10">
                            <BrainCircuit className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900 leading-none">Centro de Entrenamiento</h1>
                        <p className="text-gray-500 mt-4 text-sm font-medium">
                            Enseña a Noemí sobre tu salón. Lo que le digas aquí se guardará en su base de conocimiento permanente.
                        </p>
                    </div>
                </div>

                <div className="bg-black text-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                            <Database className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="font-black text-xs uppercase tracking-[0.2em]">Conocimiento Actual</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <p className="text-xs text-gray-400 font-medium leading-relaxed italic">
                                {tenant?.ai_knowledge ? (
                                    tenant.ai_knowledge.split('\n').filter(Boolean).map((k, i) => (
                                        <span key={i} className="block mb-2">• {k}</span>
                                    ))
                                ) : (
                                    "Noemí aún no tiene instrucciones personalizadas guardadas. ¡Empieza a entrenarla!"
                                )}
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Capacidad de Tareas</span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Activo</span>
                            </div>
                            <div className="bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full w-[85%]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-[2.5rem] border border-purple-100">
                    <h3 className="text-purple-900 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Wand2 className="w-4 h-4" /> Sugerencias de Entrenamiento
                    </h3>
                    <ul className="space-y-3">
                        {[
                            "\"Si preguntan por promos, diles que los martes hay 20% off en manicura.\"",
                            "\"Nuestra dirección es Av. Santa Fe 1234, CABA.\"",
                            "\"Aumenta el precio del servicio ID XXX a $5000.\"",
                            "\"Pregúntame sobre qué métodos de pago aceptamos.\""
                        ].map((s, i) => (
                            <li key={i} className="text-[11px] font-bold text-purple-700 bg-white/50 p-3 rounded-xl border border-purple-100 cursor-pointer hover:bg-white transition-all">
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Chat de Entrenamiento */}
            <div className="lg:col-span-2 flex flex-col h-[800px] bg-white rounded-[3rem] border border-gray-100 shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-gray-900 uppercase tracking-widest text-sm">Noemí AI</span>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Modo Avanzado: Administrador</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => { setMessages([]); setHistory([]); }}
                        className="p-3 text-gray-400 hover:text-black transition-all bg-gray-50 rounded-2xl"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {/* Mensajes */}
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-10 space-y-8 bg-gray-50/20"
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-purple-200" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Inicio de Sesión Directa</h3>
                                <p className="text-gray-500 text-sm font-medium max-w-sm mt-2">
                                    Hola Jefe. Estoy lista para recibir tus instrucciones o realizar tareas en el sistema. ¿Por dónde empezamos?
                                </p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div 
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse text-right' : 'flex-row'}`}>
                                    <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                                        msg.role === 'user' ? 'bg-black text-white' : 'bg-white border border-gray-100 text-emerald-600'
                                    }`}>
                                        {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                    </div>
                                    <div className={`p-6 rounded-3xl shadow-sm text-sm font-bold leading-relaxed ${
                                        msg.role === 'user' 
                                            ? 'bg-black text-white rounded-tr-none' 
                                            : 'bg-white text-gray-800 border border-gray-50 rounded-tl-none ring-1 ring-emerald-500/10'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex gap-4 items-center bg-white border border-gray-100 p-6 rounded-3xl rounded-tl-none shadow-sm">
                                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Noemí está procesando...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <form 
                    onSubmit={handleSendMessage}
                    className="p-8 bg-white border-t border-gray-100 shrink-0"
                >
                    <div className="flex gap-4 p-2 bg-gray-50 rounded-[2rem] border border-gray-100 focus-within:ring-2 focus-within:ring-black transition-all">
                        <Input 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Escribe una instrucción o pide algo..."
                            className="flex-1 bg-transparent border-none px-6 text-sm font-bold focus-visible:ring-0 shadow-none h-14"
                            disabled={isLoading}
                        />
                        <Button 
                            type="submit"
                            disabled={isLoading || !inputValue.trim()}
                            className="w-14 h-14 rounded-[1.5rem] bg-black hover:bg-gray-800 text-white flex items-center justify-center p-0 transition-all active:scale-90"
                        >
                            <Send className="w-6 h-6" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
