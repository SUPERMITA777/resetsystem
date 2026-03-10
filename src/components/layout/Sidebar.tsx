"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, User, Users, LayoutDashboard, Settings, Sparkles, Activity, FileBarChart } from "lucide-react";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { GlobalSearch } from "./GlobalSearch";

export function Sidebar() {
    const [tenantName, setTenantName] = useState("RESET SYSTEM");

    useEffect(() => {
        const tenantId = localStorage.getItem('currentTenant') || 'resetspa';
        getTenant(tenantId).then(data => {
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
                    <User className="w-5 h-5 text-[var(--primary)]" />
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
                <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium mt-auto">
                    <FileBarChart className="w-5 h-5 text-[var(--primary)]" />
                    Reportes
                </Link>
                <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium mb-4">
                    <Settings className="w-5 h-5 text-[var(--primary)]" />
                    Configuración
                </Link>
            </nav>
        </aside>
    );
}
