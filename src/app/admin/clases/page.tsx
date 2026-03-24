"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Calendar, Clock, Users, Trash2, Edit3, Tag, Search, Filter } from "lucide-react";
import { Clase, claseService } from "@/lib/services/claseService";
import { useAuth } from "@/components/auth/AuthProvider";
import { ClaseModal } from "@/components/admin/clases/ClaseModal";
import toast, { Toaster } from "react-hot-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ClasesAdminPage() {
    const { tenantId } = useAuth();
    const [clases, setClases] = useState<Clase[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClase, setSelectedClase] = useState<Clase | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const loadClases = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const data = await claseService.getClases(tenantId);
            setClases(data);
        } catch (error) {
            toast.error("Error al cargar las clases");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClases();
    }, [tenantId]);

    const handleDelete = async (clase: Clase) => {
        if (!confirm(`¿Estás seguro de eliminar la clase "${clase.nombre}"?`)) return;
        if (!tenantId) return;
        
        try {
            await claseService.deleteClase(tenantId, clase.id);
            toast.success("Clase eliminada");
            loadClases();
        } catch (error) {
            toast.error("Error al eliminar la clase");
        }
    };

    const filteredClases = clases.filter(c => 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
                <Toaster />
                
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Clases Grupales</h1>
                        <p className="text-gray-500 font-medium">Gestiona el cronograma de clases y cupos disponibles.</p>
                    </div>
                    <Button 
                        onClick={() => { setSelectedClase(null); setIsModalOpen(true); }}
                        className="bg-black text-white hover:bg-gray-800 rounded-2xl h-14 px-8 font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5 mr-3" />
                        Nueva Clase
                    </Button>
                </div>

                <div className="flex bg-white p-2 rounded-[2rem] shadow-premium-soft border border-gray-100 gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                        <input 
                            className="w-full h-14 pl-14 pr-6 bg-gray-50/50 border-none rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-black transition-all" 
                            placeholder="Buscar clase por nombre..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" className="h-14 px-6 rounded-[1.5rem] font-bold text-gray-400">
                        <Filter className="w-5 h-5 mr-2" />
                        Filtros
                    </Button>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Cargando Cronograma</span>
                    </div>
                ) : filteredClases.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClases.map(clase => (
                            <Card key={clase.id} className="p-6 border-none shadow-premium-soft rounded-[2rem] group hover:shadow-premium transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-black group-hover:text-white transition-all overflow-hidden relative">
                                        {clase.imagenes && clase.imagenes.length > 0 ? (
                                            <img src={clase.imagenes[0]} alt={clase.nombre} className="w-full h-full object-cover" />
                                        ) : (
                                            <Calendar className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => { setSelectedClase(clase); setIsModalOpen(true); }}
                                            className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(clase)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-xl font-black text-gray-900 leading-tight underline decoration-[var(--primary)] decoration-4 underline-offset-4">
                                        {clase.nombre}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-2 font-medium line-clamp-2">
                                        {clase.detalle || "Sin descripción disponible."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="flex flex-col p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Fecha</span>
                                        <span className="text-sm font-bold text-gray-700">
                                            {format(new Date(clase.fecha + 'T12:00:00'), "dd 'de' MMM", { locale: es })}
                                        </span>
                                    </div>
                                    <div className="flex flex-col p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Hora</span>
                                        <span className="text-sm font-bold text-gray-700">{clase.hora} HS</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="flex flex-col p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Profesional</span>
                                        <span className="text-sm font-bold text-gray-700 truncate">{clase.profesionalNombre || "Sin asignar"}</span>
                                    </div>
                                    <div className="flex flex-col p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Duración</span>
                                        <span className="text-sm font-bold text-gray-700">{clase.duracion || 60} MIN</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-50">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Users className="w-3.5 h-3.5" />
                                            <span>Cupo:</span>
                                        </div>
                                        <span className="text-gray-900">{clase.inscriptosCount} / {clase.cupo} alumnos</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Tag className="w-3.5 h-3.5" />
                                            <span>Créditos:</span>
                                        </div>
                                        <span className="text-[var(--primary)] font-black uppercase">{clase.valorCreditos} PTR</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center opacity-20">
                        <Calendar className="w-20 h-20 mx-auto mb-4" />
                        <p className="font-black uppercase tracking-widest">No hay clases programadas</p>
                    </div>
                )}

                <ClaseModal 
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setSelectedClase(null); }}
                    onSave={loadClases}
                    clase={selectedClase}
                />
            </div>
        </AdminLayout>
    );
}
