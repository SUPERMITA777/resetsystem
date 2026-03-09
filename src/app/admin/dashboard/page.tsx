import React from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Users, CalendarCheck, TrendingUp } from "lucide-react";

export default function DashboardPage() {
    return (
        <AdminLayout>
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)]">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Resumen general de tu salón.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-[var(--secondary)] p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm font-medium">Turnos Hoy</span>
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                                <CalendarCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <span className="text-3xl font-bold text-[var(--foreground)]">24</span>
                        <span className="text-xs text-green-500 font-medium">+12% vs ayer</span>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-[var(--secondary)] p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm font-medium">Nuevos Clientes</span>
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <span className="text-3xl font-bold text-[var(--foreground)]">8</span>
                        <span className="text-xs text-green-500 font-medium">+2 esta semana</span>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-[var(--secondary)] p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm font-medium">Ingresos Mes</span>
                            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <span className="text-3xl font-bold text-[var(--foreground)]">$1.240K</span>
                        <span className="text-xs text-green-500 font-medium">+8% vs mes anterior</span>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
