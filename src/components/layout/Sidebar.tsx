import React from "react";
import Link from "next/link";
import { CalendarDays, Users, LayoutDashboard, Settings } from "lucide-react";

export function Sidebar() {
    return (
        <aside className="w-64 bg-[var(--background)] border-r border-[var(--secondary)] flex flex-col items-center py-6 h-screen sticky top-0 hidden md:flex">
            <div className="font-heading font-bold text-xl mb-12 text-[var(--foreground)] tracking-wide">
                RESET<span className="text-[var(--primary)]">SYSTEM</span>
            </div>

            <nav className="flex flex-col gap-2 w-full px-4">
                <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                    <LayoutDashboard className="w-5 h-5 text-[var(--primary)]" />
                    General
                </Link>
                <Link href="/admin/agenda" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                    <CalendarDays className="w-5 h-5 text-[var(--primary)]" />
                    Agenda
                </Link>
                <Link href="/admin/staff" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium">
                    <Users className="w-5 h-5 text-[var(--primary)]" />
                    Staff
                </Link>
                <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--secondary)] transition-colors text-sm font-medium mt-auto mb-4">
                    <Settings className="w-5 h-5 text-[var(--primary)]" />
                    Configuración
                </Link>
            </nav>
        </aside>
    );
}
