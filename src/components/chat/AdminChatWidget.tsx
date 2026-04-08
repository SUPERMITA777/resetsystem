"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
    MessageSquare, 
    X, 
    Send, 
    Sparkles, 
    Bot,
    User,
    Loader2,
    Move,
    BrainCircuit,
    Wand2
} from "lucide-react";
import { geminiService, ChatMessage } from "@/lib/services/geminiService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TenantData } from "@/lib/services/tenantService";

interface Message {
    id: string;
    role: "user" | "model";
    text: string;
}

interface AdminChatWidgetProps {
    tenant: TenantData & { id: string };
}

export function AdminChatWidget({ tenant }: AdminChatWidgetProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const scrollRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<HTMLDivElement>(null);

    // Cargar datos persistentes al montar
    useEffect(() => {
        setIsMounted(true);
        
        // Cargar posición
        const savedPos = localStorage.getItem("noemi_admin_pos");
        if (savedPos) {
            setPosition(JSON.parse(savedPos));
        } else {
            setPosition({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
        }

        // Cargar estado de apertura
        const savedOpen = localStorage.getItem("noemi_admin_isOpen");
        if (savedOpen === "true") setIsOpen(true);

        // Cargar mensajes e historial
        const savedMessages = localStorage.getItem("noemi_admin_messages");
        const savedHistory = localStorage.getItem("noemi_admin_history");
        if (savedMessages) setMessages(JSON.parse(savedMessages));
        if (savedHistory) setHistory(JSON.parse(savedHistory));
    }, []);

    // Guardar cambios en persistencia
    useEffect(() => {
        if (!isMounted) return;
        localStorage.setItem("noemi_admin_isOpen", isOpen.toString());
        localStorage.setItem("noemi_admin_messages", JSON.stringify(messages));
        localStorage.setItem("noemi_admin_history", JSON.stringify(history));
    }, [isOpen, messages, history, isMounted]);

    // Auto-scroll al final
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Lógica de Draggable
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isOpen) return; // Deshabilitar drag si está abierto el panel para evitar conflictos
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                localStorage.setItem("noemi_admin_pos", JSON.stringify(position));
            }
        };

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragOffset, position]);

    if (!isMounted || !tenant.modules?.ai_agents) return null;

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue.trim();
        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            text: userText
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsLoading(true);

        try {
            const response = await geminiService.chatAdmin(tenant.id, userText, history);
            if (response) {
                const cleanText = response.replace(/^⚡\s*/, "");
                const modelMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "model",
                    text: cleanText
                };

                setMessages(prev => [...prev, modelMsg]);
                setHistory(prev => [
                    ...prev,
                    { role: "user", parts: [{ text: userText }] },
                    { role: "model", parts: [{ text: cleanText }] }
                ]);
            }
        } catch (error) {
            console.error("Error en AdminChatWidget:", error);
            setMessages(prev => [...prev, { id: "err", role: "model", text: "Lo siento, tuve un error procesando eso." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            ref={widgetRef}
            className="fixed z-[99999] pointer-events-none"
            style={{ 
                left: position.x, 
                top: position.y,
                transform: 'translate(-50%, -50%)'
            }}
        >
            {/* Ventana de Chat */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-[90vw] md:w-[380px] h-[600px] bg-black rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200 origin-bottom-right">
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                                <BrainCircuit className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-white font-black text-xs uppercase tracking-widest">Asistente Ejecutivo</span>
                                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-tighter mt-1">Noemí está atenta</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mensajes */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/5 custom-scrollbar"
                    >
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                                <Wand2 className="w-10 h-10 text-white/10" />
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                                    Hola jefe. Pídeme un cambio de precio, que aprenda algo nuevo o un resumen del día.
                                </p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div 
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-lg ${
                                    msg.role === 'user' 
                                        ? 'bg-white text-black rounded-tr-none' 
                                        : 'bg-white/10 text-white border border-white/10 rounded-tl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2 items-center bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                                    <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Noemí está haciendo...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form 
                        onSubmit={handleSendMessage}
                        className="p-6 bg-black border-t border-white/10 flex gap-2"
                    >
                        <Input 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Instrucción ejecutiva..."
                            className="h-12 rounded-2xl bg-white/5 border-none px-6 text-xs font-bold text-white placeholder:text-gray-600 focus-visible:ring-purple-500"
                            disabled={isLoading}
                        />
                        <Button 
                            type="submit"
                            disabled={isLoading || !inputValue.trim()}
                            className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center p-0 hover:bg-purple-400 transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            )}

            {/* Botón Flotante */}
            <div 
                onMouseDown={handleMouseDown}
                onClick={(e) => {
                    if (!isDragging) setIsOpen(!isOpen);
                    e.stopPropagation();
                }}
                className={`w-16 h-16 rounded-[1.5rem] bg-black text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer group relative overflow-hidden ${isDragging ? 'cursor-grabbing scale-110 ring-4 ring-purple-500/50' : 'cursor-grab'}`}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {isOpen ? <X className="relative z-10 w-8 h-8" /> : (
                    <div className="relative z-10 flex flex-col items-center">
                        <Bot className="w-7 h-7" />
                        {!isDragging && <Move className="w-2.5 h-2.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />}
                    </div>
                )}
                
                {/* Halo animado */}
                {!isOpen && (
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping opacity-20 scale-150 pointer-events-none" />
                )}
            </div>
        </div>
    );
}
