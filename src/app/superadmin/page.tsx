"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar"; // Reusing Sidebar if possible or creating a simpler one
import { Topbar } from "@/components/layout/Topbar";
import { getAllTenants, TenantData } from "@/lib/services/tenantService";
import { Store, MapPin, LayoutGrid, ArrowRight, ShieldCheck, Plus, Settings, Users, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { SalonEditModal } from "@/components/superadmin/SalonEditModal";

export default function SuperadminDashboard() {
    const [tenants, setTenants] = useState<(TenantData & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState<(TenantData & { id: string }) | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const loadTenants = async () => {
        setLoading(true);
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

    useEffect(() => {
        loadTenants();
    }, []);

    const handleEditTenant = (tenant: TenantData & { id: string }) => {
        setSelectedTenant(tenant);
        setIsEditModalOpen(true);
    };

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
                    <Link href="/superadmin" className="flex items-center gap-3 px-4 py-3 bg-[#9381FF]/20 text-[#9381FF] rounded-xl font-medium transition-all">
                        <Store className="w-5 h-5" />
                        Salones Activos
                    </Link>
                    <Link href="/superadmin/users" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all font-medium">
                        <Users className="w-5 h-5" />
                        Gestión Usuarios
                    </Link>
                    <Link href="/superadmin/create-user" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all font-medium">
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
                                <h2 className="text-3xl font-bold text-gray-900 font-montserrat tracking-tight">Salones Registrados</h2>
                                <p className="text-gray-500 mt-1">SaaS Multi-tenant Management Panel</p>
                            </div>
                            <Link href="/superadmin/setup">
                                <Button className="bg-gray-900 hover:bg-gray-800 rounded-full px-6 shadow-lg shadow-gray-200 h-11 transition-all hover:-translate-y-0.5">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Nuevo Salon
                                </Button>
                            </Link>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-64 bg-white/50 animate-pulse rounded-[2.5rem] border border-gray-100" />
                                ))}
                            </div>
                        ) : tenants.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] p-16 text-center border border-gray-100 shadow-sm">
                                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Store className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">No hay salones creados</h3>
                                <p className="text-gray-500 mt-2 max-w-sm mx-auto">Comienza configurando el primer inquilino de tu plataforma multi-tenant.</p>
                                <Link href="/superadmin/setup" className="mt-8 inline-block">
                                    <Button variant="outline" className="rounded-2xl px-8 border-gray-200">Empezar Configuración</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tenants.map(tenant => (
                                    <div key={tenant.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col group relative overflow-hidden transition-all hover:shadow-xl hover:shadow-gray-200/50 hover:border-[#9381FF]/20">

                                        <div className="flex items-start justify-between mb-6 relative z-10">
                                            <div className="w-14 h-14 rounded-2xl bg-[#9381FF]/10 flex items-center justify-center transition-transform group-hover:scale-110">
                                                <Store className="w-7 h-7 text-[#9381FF]" />
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full ${tenant.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                                                        tenant.status === 'deleted' ? 'bg-red-100 text-red-700' :
                                                            'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {tenant.status === 'paused' ? 'Pausado' : tenant.status === 'deleted' ? 'Eliminado' : 'Activo'}
                                                </span>
                                                {tenant.activeUntil && (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-full">
                                                        <Calendar className="w-3 h-3" />
                                                        Exp: {typeof tenant.activeUntil === 'string' ? tenant.activeUntil : '---'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="relative z-10 flex-1">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-[#9381FF] transition-colors">{tenant.nombre_salon}</h3>
                                            <p className="text-[10px] text-gray-400 font-mono mb-6 uppercase tracking-wider">REF: {tenant.id}</p>

                                            <div className="space-y-4 mb-8">
                                                <div className="flex items-start gap-3 text-sm text-gray-600">
                                                    <MapPin className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                                                    <span className="leading-snug">{tenant.datos_contacto?.direccion || 'Sin dirección registrada'}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                                    <LayoutGrid className="w-5 h-5 text-gray-300 shrink-0" />
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900">{tenant.config_boxes}</span>
                                                        <span>Estaciones / Boxes</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 relative z-10">
                                            <Button
                                                variant="outline"
                                                className="flex-1 rounded-2xl h-11 border-gray-100 hover:bg-gray-50 shadow-sm"
                                                onClick={() => handleEditTenant(tenant)}
                                            >
                                                <Settings className="w-4 h-4 mr-2" />
                                                Config
                                            </Button>
                                            <Link href={`/admin/agenda`} className="flex-1" onClick={() => localStorage.setItem('currentTenant', tenant.id)}>
                                                <Button className="w-full rounded-2xl h-11 bg-gray-900 text-white hover:bg-gray-800 shadow-md transition-all hover:translate-x-1">
                                                    Ver Panel
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>

                                        {/* Decorative element */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#9381FF]/5 to-transparent rounded-bl-full -mr-16 -mt-16 group-hover:from-[#9381FF]/10 transition-all duration-500" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <SalonEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                tenant={selectedTenant}
                onUpdate={loadTenants}
            />
        </div>
    );
}
