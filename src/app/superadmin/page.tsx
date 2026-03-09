"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar"; // Reusing Sidebar if possible or creating a simpler one
import { Topbar } from "@/components/layout/Topbar";
import { getAllTenants, TenantData } from "@/lib/services/tenantService";
import { Store, MapPin, LayoutGrid, ArrowRight, ShieldCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

export default function SuperadminDashboard() {
    const [tenants, setTenants] = useState<(TenantData & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadTenants() {
            try {
                const data = await getAllTenants();
                setTenants(data);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar salones");
            } finally {
                setLoading(false);
            }
        }
        loadTenants();
    }, []);

    return (
        <div className="flex h-screen bg-[#F0F2F5] overflow-hidden">
            <Toaster />
            {/* Sidebar Simple para Superadmin */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-[#9381FF]">
                        <ShieldCheck className="w-6 h-6" />
                        Superadmin
                    </h2>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/superadmin" className="flex items-center gap-3 px-4 py-3 bg-[#9381FF]/20 text-[#9381FF] rounded-xl font-medium">
                        <Store className="w-5 h-5" />
                        Salones Activos
                    </Link>
                    <Link href="/superadmin/create-user" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all">
                        <Plus className="w-5 h-5" />
                        Crear Usuarios
                    </Link>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
                    <h1 className="text-lg font-bold text-gray-800">Gestión de Tenants</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 font-medium">Reset System Global v1.0</span>
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 font-montserrat">Salones Registrados</h2>
                                <p className="text-gray-500 mt-1">SaaS Multi-tenant Management Panel</p>
                            </div>
                            <Link href="/superadmin/setup">
                                <Button className="bg-gray-900 hover:bg-gray-800 rounded-full px-6">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Nuevo Salon
                                </Button>
                            </Link>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-3xl" />
                                ))}
                            </div>
                        ) : tenants.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                                <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900">No hay salones creados</h3>
                                <p className="text-gray-500 mt-1">Usa el asistente de configuración para crear el primero.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tenants.map(tenant => (
                                    <div key={tenant.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-[#9381FF]/10 flex items-center justify-center">
                                                <Store className="w-6 h-6 text-[#9381FF]" />
                                            </div>
                                            <span className="text-xs font-bold text-[#588157] bg-[#588157]/10 px-3 py-1 rounded-full">Activo</span>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{tenant.nombre_salon}</h3>
                                        <p className="text-xs text-gray-400 font-mono mb-4">ID: {tenant.id}</p>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span className="truncate">{tenant.datos_contacto?.direccion || 'Sin dirección cargada'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <LayoutGrid className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span>{tenant.config_boxes} Boxes configurados</span>
                                            </div>
                                        </div>

                                        <Link href={`/admin/agenda`} onClick={() => localStorage.setItem('currentTenant', tenant.id)}>
                                            <Button variant="outline" className="w-full rounded-2xl group-hover:bg-gray-900 group-hover:text-white transition-all">
                                                Ir a Gestión
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
