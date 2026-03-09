"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UsersManagementTab } from "@/components/admin/settings/UsersManagementTab";
import { Store, Users } from "lucide-react";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'salon' | 'users'>('salon');

    // In production, this would come from a context or auth hook
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 w-full max-w-5xl animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-montserrat">Configuración</h1>
                        <p className="text-gray-500 mt-1">Personaliza y gestiona los accesos de tu salón.</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-gray-100 rounded-2xl self-start">
                    <button
                        onClick={() => setActiveTab('salon')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'salon' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Store className="w-4 h-4" />
                        Detalles del Salón
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users className="w-4 h-4" />
                        Gestión de Usuarios
                    </button>
                </div>

                {activeTab === 'salon' ? (
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 border-b border-gray-50">
                            <h2 className="text-2xl font-bold text-gray-900">Datos Generales</h2>
                            <p className="text-sm text-gray-500 mt-1">Información pública y operativa de la sucursal.</p>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none">Nombre del Salón</label>
                                    <Input defaultValue="RESET SPA" className="rounded-xl border-gray-200 h-12" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none">Cantidad de Boxes / Estaciones</label>
                                    <Input type="number" defaultValue={7} className="rounded-xl border-gray-200 h-12" />
                                    <p className="text-xs text-gray-400 mt-2">Define cuántos turnos simultáneos se pueden agendar.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none">Tema Visual</label>
                                    <select className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
                                        <option value="nude">Nude & Rose Gold (Default)</option>
                                        <option value="lavender">Minimalist Lavender</option>
                                        <option value="sage">Sage & Cream</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none">Zona Horaria</label>
                                    <select className="flex h-12 w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm text-gray-500" disabled>
                                        <option value="UTC-3">Buenos Aires (UTC-3)</option>
                                    </select>
                                    <p className="text-[10px] text-gray-400 mt-2 italic">Ajustable únicamente por Superadmin.</p>
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-4">
                                <Button className="bg-black text-white rounded-2xl px-10 h-14 font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-gray-200">
                                    Actualizar Salón
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <UsersManagementTab tenantId={tenantId} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
