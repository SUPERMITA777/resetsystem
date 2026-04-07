"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, User as UserIcon, Users, LayoutDashboard, Settings, Sparkles, Activity, FileBarChart, Globe, ExternalLink, ShoppingBag, Gift, Dumbbell, LogOut, QrCode, Bot, MessageSquare } from "lucide-react";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/components/auth/AuthProvider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export function Sidebar() {
    const [tenantName, setTenantName] = useState("RESET SYSTEM");
    const [tenantId, setTenantId] = useState("resetspa");

    const { user } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
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

    return (
        <aside className="w-72 bg-[var(--background)]/80 backdrop-blur-xl border-r border-[var(--secondary)] flex flex-col py-8 h-screen sticky top-0 hidden md:flex overflow-y-auto no-scrollbar shadow-2xl shadow-black/5 z-30">
            <div className="mb-12 w-full px-8">
                <div className="flex flex-col items-start group">
                    <div className="font-heading font-extrabold text-3xl text-[var(--foreground)] tracking-tighter uppercase leading-none group-hover:scale-[1.02] transition-transform duration-500">
                        {tenantName}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 opacity-50">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--primary)] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground)]">by resetsystem</span>
                    </div>
                </div>
            </div>

            <div className="w-full px-6 mb-8">
                <div className="p-1 rounded-2xl bg-[var(--secondary)]/30 border border-[var(--secondary)]">
                    <GlobalSearch />
                </div>
            </div>

            <nav className="flex flex-col gap-1.5 w-full px-6 flex-1">
                <p className="px-5 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 opacity-70">Operaciones</p>
                <Link href="/admin/turnos" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group">
                    <Activity className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                    Turnos
                </Link>
                <Link href="/admin/agenda" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group">
                    <CalendarDays className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                    Agenda
                </Link>
                <Link href="/admin/clientes" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group">
                    <UserIcon className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                    Clientes
                </Link>
                <Link href="/admin/staff" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group">
                    <Users className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                    Profesionales
                </Link>
                <Link href="/admin/tratamientos" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group">
                    <Sparkles className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                    Tratamientos
                </Link>
                <Link href="/admin/clases" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group">
                    <Dumbbell className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                    Clases
                </Link>
                <Link href="/admin/control-clases" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group border-b border-[var(--secondary)]/30 mb-2">
                    <QrCode className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                    CONTROL CLASES
                </Link>
                <Link href="/admin/productos" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group">
                    <ShoppingBag className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                    Productos
                </Link>
                <Link href="/admin/fitness" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group">
                    <Dumbbell className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                    Fitness
                </Link>

                <div className="pt-6 mt-4 border-t border-[var(--secondary)]/50">
                    <p className="px-5 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 opacity-70">Marketing & Web</p>
                    <Link href="/admin/web" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group">
                        <Globe className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                        Configuración Web
                    </Link>
                    <Link href="/admin/promos-web" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group">
                        <Gift className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                        Promos Web
                    </Link>
                    <a 
                        href={`/${tenantId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-[0.98] transition-all text-xs font-black uppercase tracking-widest mt-4 group"
                    >
                        <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Ver mi Web Pública
                    </a>
                </div>

                <div className="pt-6 mt-4 border-t border-[var(--secondary)]/50">
                    <p className="px-5 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 opacity-70">Agentes IA</p>
                    <Link href="/admin/ai-agents/julia" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group">
                        <Bot className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                        Julia - Ventas
                    </Link>
                    <Link href="/admin/ai-agents/sofia" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group">
                        <MessageSquare className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                        Sofía - Recordatorios
                    </Link>
                </div>

                <div className="mt-auto pt-6 border-t border-[var(--secondary)]/50">
                    <Link href="/admin/reportes" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group mb-1">
                        <FileBarChart className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                        Reportes
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl hover:bg-[var(--secondary)] active:scale-95 transition-all text-sm font-bold group">
                        <Settings className="w-5 h-5 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                        Ajustes
                    </Link>
                </div>
            </nav>

            {/* Current User & Logout */}
            <div className="w-full px-6 mt-8 pt-6 border-t border-[var(--secondary)]/50">
                <div className="bg-[var(--secondary)]/30 backdrop-blur-lg rounded-3xl p-5 flex items-center justify-between border border-[var(--secondary)]/30">
                    <div className="flex items-center gap-3.5 overflow-hidden">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--foreground)] text-[var(--background)] flex items-center justify-center font-black shrink-0 shadow-lg">
                            {user?.email?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-black text-[var(--foreground)] truncate uppercase tracking-tight">
                                {user?.displayName || "Usuario Admin"}
                            </span>
                            <span className="text-[9px] text-gray-500 truncate font-bold">
                                {user?.email}
                            </span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all active:scale-90"
                        title="Cerrar Sessión"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
