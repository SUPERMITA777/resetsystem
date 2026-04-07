"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
    CalendarDays, User as UserIcon, Users, Activity, 
    FileBarChart, Globe, ExternalLink, ShoppingBag, 
    Gift, Dumbbell, LogOut, QrCode, Sparkles, X, Settings, Bot, MessageSquare, Smartphone
} from "lucide-react";
import { getTenant } from "@/lib/services/tenantService";
import { useAuth } from "@/components/auth/AuthProvider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
    const [tenantName, setTenantName] = useState("RESET SYSTEM");
    const [tenantId, setTenantId] = useState("resetspa");

    const { user } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
            onClose();
        } catch (error) {
            console.error("Error logging out", error);
        }
    };

    useEffect(() => {
        const id = localStorage.getItem('currentTenant') || 'resetspa';
        setTenantId(id);
        getTenant(id).then(data => {
            if (data?.nombre_salon) {
                setTenantName(data.nombre_salon);
            }
        });
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[var(--background)] shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-500">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col">
                        <div className="font-heading font-extrabold text-xl text-[var(--foreground)] tracking-tight uppercase leading-none">
                            {tenantName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 opacity-40">
                            <Sparkles className="w-3 h-3 text-[var(--primary)]" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)]">by resetsystem</span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-[var(--secondary)] rounded-full text-gray-400 hover:text-black transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex flex-col gap-1 w-full overflow-y-auto no-scrollbar pb-6 flex-1">
                    {[
                        { href: "/admin/turnos", icon: Activity, label: "Turnos" },
                        { href: "/admin/agenda", icon: CalendarDays, label: "Agenda" },
                        { href: "/admin/clientes", icon: UserIcon, label: "Clientes" },
                        { href: "/admin/staff", icon: Users, label: "Profesionales" },
                        { href: "/admin/tratamientos", icon: Sparkles, label: "Tratamientos" },
                        { href: "/admin/clases", icon: Dumbbell, label: "Clases" },
                        { href: "/admin/control-clases", icon: QrCode, label: "CONTROL CLASES" },
                        { href: "/admin/productos", icon: ShoppingBag, label: "Productos" },
                        { href: "/admin/fitness", icon: Dumbbell, label: "Fitness" }
                    ].map((item) => (
                        <Link 
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-[var(--secondary)] transition-all text-sm font-bold active:scale-[0.98]"
                        >
                            <item.icon className="w-5 h-5 text-[var(--primary)]" />
                            {item.label}
                        </Link>
                    ))}

                    <div className="pt-4 mt-2 border-t border-[var(--secondary)]">
                        <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Presencia Web</p>
                        <Link href="/admin/web" onClick={onClose} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-[var(--secondary)] transition-all text-sm font-bold">
                            <Globe className="w-5 h-5 text-[var(--primary)]" />
                            Configuración Web
                        </Link>
                        <Link href="/admin/promos-web" onClick={onClose} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-[var(--secondary)] transition-all text-sm font-bold">
                            <Gift className="w-5 h-5 text-[var(--primary)]" />
                            Promos Web
                        </Link>
                        <a 
                            href={`/${tenantId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-black text-white hover:bg-gray-800 transition-all text-xs font-black uppercase tracking-widest mt-4"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Ver mi Web Pública
                        </a>
                    </div>

                    <div className="pt-4 mt-2 border-t border-[var(--secondary)]">
                        <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Agentes IA</p>
                        <Link href="/admin/ai-agents/noemi" onClick={onClose} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-[var(--secondary)] transition-all text-sm font-bold">
                            <Bot className="w-5 h-5 text-[var(--primary)]" />
                            Noemi - Ventas
                        </Link>
                        <Link href="/admin/ai-agents/veronica" onClick={onClose} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-[var(--secondary)] transition-all text-sm font-bold">
                            <MessageSquare className="w-5 h-5 text-[var(--primary)]" />
                            Verónica - Recordatorios
                        </Link>
                        <Link href="/admin/ai-agents/connections" onClick={onClose} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-[var(--secondary)] transition-all text-sm font-bold">
                            <Smartphone className="w-5 h-5 text-[var(--primary)]" />
                            Mis Conexiones (QR)
                        </Link>
                    </div>
                </nav>

                <div className="pt-6 border-t border-[var(--secondary)] mt-auto">
                    <div className="bg-[var(--secondary)]/40 rounded-2xl p-4 flex items-center justify-between border border-[var(--secondary)]">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shrink-0">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-[var(--foreground)] truncate">
                                    {user?.displayName || "Usuario"}
                                </span>
                                <span className="text-[9px] text-gray-500 truncate">
                                    {user?.email}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-xl transition-colors shrink-0"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
