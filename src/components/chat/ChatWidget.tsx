"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
    MessageSquare, 
    X, 
    Send, 
    Sparkles, 
    Bot,
    User,
    Loader2
} from "lucide-react";
import { geminiService, ChatMessage as GeminiChatMessage } from "@/lib/services/geminiService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TenantData } from "@/lib/services/tenantService";

interface Message {
    id: string;
    role: "user" | "model";
    text: string;
    timestamp: Date;
}

interface ChatWidgetProps {
    tenant: TenantData & { id: string };
}

export function ChatWidget({ tenant }: ChatWidgetProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<GeminiChatMessage[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Saludo inicial
    useEffect(() => {
        if (isMounted && isOpen && messages.length === 0) {
            const welcomeMsg: Message = {
                id: "welcome",
                role: "model",
                text: `¡Hola! Soy Noemí, tu asistente virtual de ${tenant.nombre_salon}. ✨ ¿En qué puedo ayudarte hoy?`,
                timestamp: new Date()
            };
            setMessages([welcomeMsg]);
        }
    }, [isMounted, isOpen, messages.length, tenant.nombre_salon]);

    // Auto-scroll al final
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    if (!isMounted) return null;
    if (!tenant.modules?.noemi_chat) return null;

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue.trim();
        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            text: userText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsLoading(true);

        try {
            const responseText = await geminiService.chatNoemi(
                tenant.id, 
                userText, 
                history
            );

            if (responseText) {
                // El servicio devuelve el texto con prefijo ⚡
                const cleanText = responseText.replace(/^⚡\s*/, "");
                
                const modelMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "model",
                    text: cleanText,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, modelMsg]);
                
                // Actualizar historial para memoria de contexto
                setHistory(prev => [
                    ...prev,
                    { role: "user", parts: [{ text: userText }] },
                    { role: "model", parts: [{ text: cleanText }] }
                ]);
            }
        } catch (error) {
            console.error("Error en ChatNoemi:", error);
            const errorMsg: Message = {
                id: "error",
                role: "model",
                text: "Lo siento, tuve un problema técnico. ¿Podrías intentar de nuevo?",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 pointer-events-none">
            {/* Ventana de Chat */}
            {isOpen && (
                <div className="w-[90vw] md:w-[400px] h-[70vh] max-h-[600px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col pointer-events-auto overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-black p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-white font-black text-sm uppercase tracking-widest">Noemí AI</span>
                                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-tighter">En línea ahora</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mensajes */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30"
                    >
                        {messages.map((msg) => (
                            <div 
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-1 ${
                                        msg.role === 'user' ? 'bg-black text-white' : 'bg-emerald-500 text-white'
                                    }`}>
                                        {msg.role === 'user' ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                    </div>
                                    <div className={`p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${
                                        msg.role === 'user' 
                                            ? 'bg-black text-white rounded-tr-none' 
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2 items-center bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Noemí está escribiendo...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form 
                        onSubmit={handleSendMessage}
                        className="p-6 bg-white border-t border-gray-100 flex gap-2"
                    >
                        <Input 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Escribe tu mensaje..."
                            className="h-12 rounded-2xl bg-gray-50 border-none px-6 text-sm font-bold"
                            disabled={isLoading}
                        />
                        <Button 
                            type="submit"
                            disabled={isLoading || !inputValue.trim()}
                            className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center p-0"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            )}

            {/* Botón Flotante */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 rounded-full bg-black text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all pointer-events-auto group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {isOpen ? <X className="relative z-10 w-8 h-8" /> : <MessageSquare className="relative z-10 w-8 h-8" />}
            </button>
        </div>
    );
}
