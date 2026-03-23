"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, User as UserIcon, Users, LayoutDashboard, Settings, Sparkles, Activity, FileBarChart, Globe, ExternalLink, ShoppingBag, Gift, Dumbbell, LogOut } from "lucide-react";
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
        <aside className="w-64 bg-[var(--background)] border-r border-[var(--secondary)] flex flex-col items-center py-6 h-screen sticky top-0 hidden md:flex overflow-y-auto">
            <div className="mb-10 w-full px-6">
                <div className="flex flex-col items-start">
                    <div className="font-heading font-extrabold text-2xl text-[var(--foreground)] tracking-tight uppercase leading-none">
                        {tenantName}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 opacity-40">
                        <Sparkles className="w-3 h-3 text-[var(--primary)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)]">by resetsystem</span>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 mb-6">
                <GlobalSearch />
            </div>

            <nav className="flex flex-col gap-2 w-full px-4">
                <Link href="/admin/turnos" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                    <Activity className="w-5 h-5 text-[var(--primary)]" />
                    Turnos
                </Link>
                <Link href="/admin/agenda" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                    <CalendarDays className="w-5 h-5 text-[var(--primary)]" />
                    Agenda
                </Link>
                <Link href="/admin/clientes" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                    <UserIcon className="w-5 h-5 text-[var(--primary)]" />
                    Clientes
                </Link>
                <Link href="/admin/staff" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                    <Users className="w-5 h-5 text-[var(--primary)]" />
                    Profesionales
                </Link>
                <Link href="/admin/tratamientos" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                    <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                    Tratamientos
                </Link>
                <Link href="/admin/productos" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                    <ShoppingBag className="w-5 h-5 text-[var(--primary)]" />
                    Productos
                </Link>
                <Link href="/admin/fitness" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                    <Dumbbell className="w-5 h-5 text-[var(--primary)]" />
                    Fitness
                </Link>

                <div className="pt-4 mt-2 border-t border-[var(--secondary)]">
                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Presencia Web</p>
                    <Link href="/admin/web" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                        <Globe className="w-5 h-5 text-[var(--primary)]" />
                        Configuración Web
                    </Link>
                    <Link href="/admin/promos-web" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                        <Gift className="w-5 h-5 text-[var(--primary)]" />
                        Promos Web
                    </Link>
                    <Link href="/admin/tarot" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                        <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                        Tarot Web
                    </Link>
                    <a 
                        href={`/${tenantId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-all text-xs font-black uppercase tracking-widest mt-2 group"
                    >
                        <ExternalLink className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                        Ver mi Web
                    </a>
                </div>

                <Link href="/admin/reportes" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium mt-auto">
                    <FileBarChart className="w-5 h-5 text-[var(--primary)]" />
                    Reportes
                </Link>
                <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                    <Settings className="w-5 h-5 text-[var(--primary)]" />
                    Configuración
                </Link>
            </nav>

            {/* Current User & Logout */}
            <div className="w-full px-4 mt-auto pt-6 border-t border-[var(--secondary)]">
                <div className="bg-[var(--secondary)]/30 rounded-2xl p-4 flex items-center justify-between border border-[var(--secondary)]/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--background)] flex items-center justify-center font-bold shrink-0">
                            {user?.email?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-[var(--foreground)] truncate">
                                {user?.displayName || "Usuario"}
                            </span>
                            <span className="text-[10px] text-gray-500 truncate">
                                {user?.email}
                            </span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                        title="Cerrar Sessión"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
