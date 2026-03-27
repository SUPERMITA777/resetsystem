import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Users, CalendarCheck, TrendingUp, Globe, ArrowRight } from "lucide-react";
import { WebConfigModal } from "@/components/admin/web/WebConfigModal";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
    const [isWebModalOpen, setIsWebModalOpen] = useState(false);
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10 w-full animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">Dashboard</h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em] mt-3">Resumen general de tu salón.</p>
                    </div>

                    <Button 
                        onClick={() => setIsWebModalOpen(true)}
                        className="bg-black text-white hover:bg-gray-800 rounded-2xl h-14 px-8 font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-3"
                    >
                        <Globe className="w-5 h-5" />
                        Configurar mi Web
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stats cards... (no changes here to keep it concise) */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Turnos Hoy</span>
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                <CalendarCheck className="w-6 h-6" />
                            </div>
                        </div>
                        <span className="text-4xl font-black text-gray-900 tracking-tight">24</span>
                        <span className="text-xs text-green-500 font-bold uppercase tracking-widest">+12% vs ayer</span>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Nuevos Clientes</span>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                        <span className="text-4xl font-black text-gray-900 tracking-tight">8</span>
                        <span className="text-xs text-green-500 font-bold uppercase tracking-widest">+2 esta semana</span>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Ingresos Mes</span>
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                        <span className="text-4xl font-black text-gray-900 tracking-tight">$1.240K</span>
                        <span className="text-xs text-green-500 font-bold uppercase tracking-widest">+8% vs mes anterior</span>
                    </div>
                </div>

                {/* Banner Web Preview */}
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-md text-center md:text-left">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Tu presencia digital</span>
                            <h2 className="text-3xl font-black uppercase tracking-tight mt-4 mb-4">Personaliza la web de tu salón</h2>
                            <p className="text-white/60 text-sm font-medium leading-relaxed">
                                Cambia logos, portadas, colores y la descripción que ven tus clientes al reservar desde el dashboard.
                            </p>
                            <Button 
                                onClick={() => setIsWebModalOpen(true)}
                                variant="outline"
                                className="mt-8 rounded-2xl border-white/20 text-white hover:bg-white hover:text-black h-12 px-8 font-black uppercase tracking-widest text-[10px]"
                            >
                                Empezar a editar
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                        <div className="w-full md:w-72 aspect-[9/16] bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center backdrop-blur-sm">
                            <Smartphone className="w-12 h-12 text-white/20" />
                        </div>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                </div>

                <WebConfigModal 
                    isOpen={isWebModalOpen}
                    onClose={() => setIsWebModalOpen(false)}
                    tenantId={tenantId}
                    onSaveSuccess={() => {}}
                />
            </div>
        </AdminLayout>
    );
}
