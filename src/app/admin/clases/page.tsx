"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Calendar, Clock, Users, Trash2, Edit3, Tag, Search, Filter, ExternalLink } from "lucide-react";
import { Clase, claseService } from "@/lib/services/claseService";
import { useAuth } from "@/components/auth/AuthProvider";
import { ClaseModal } from "@/components/admin/clases/ClaseModal";
import { InscriptosModal } from "@/components/admin/clases/InscriptosModal";
import toast, { Toaster } from "react-hot-toast";
import { format, addDays, startOfToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ClasesPublicConfigModal } from "@/components/admin/clases/ClasesPublicConfigModal";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { Settings } from "lucide-react";

export default function ClasesAdminPage() {
    const { tenantId } = useAuth();
    const [clases, setClases] = useState<Clase[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClase, setSelectedClase] = useState<Clase | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDate, setSelectedDate] = useState<string>("");

    // Inscriptos Modal state
    const [isInscriptosModalOpen, setIsInscriptosModalOpen] = useState(false);
    const [claseForInscriptos, setClaseForInscriptos] = useState<Clase | null>(null);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [tenant, setTenant] = useState<TenantData | null>(null);

    const loadData = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [classesData, tenantData] = await Promise.all([
                claseService.getClases(tenantId),
                getTenant(tenantId)
            ]);
            setClases(classesData);
            setTenant(tenantData);
        } catch (error: any) {
            console.error("Error cargando datos:", error);
            toast.error("Error al cargar los datos. " + (error.message || ""));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [tenantId]);

    const handleDelete = async (clase: Clase) => {
        if (!confirm(`¿Estás seguro de eliminar la clase "${clase.nombre}"?`)) return;
        if (!tenantId) return;
        
        try {
            await claseService.deleteClase(tenantId, clase.id);
            toast.success("Clase eliminada");
            loadData();
        } catch (error) {
            toast.error("Error al eliminar la clase");
        }
    };

    const filteredClases = clases.filter(c => {
        const matchesSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = !selectedDate || (c.horarios || []).some(h => h.fecha === selectedDate);
        return matchesSearch && matchesDate;
    });

    const dateFilters = [
        { label: 'TODAS', value: '' },
        { label: 'HOY', value: format(startOfToday(), 'yyyy-MM-dd') },
        { label: 'MAÑANA', value: format(addDays(startOfToday(), 1), 'yyyy-MM-dd') },
    ];

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
                <Toaster />
                
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Clases Grupales</h1>
                        <p className="text-gray-500 font-medium">Gestiona el cronograma de clases y cupos disponibles.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            onClick={() => window.open(`/${tenantId}/clases`, "_blank")}
                            variant="outline"
                            className="rounded-2xl h-14 px-6 font-bold uppercase tracking-widest border-2 hover:bg-gray-50 transition-all border-gray-100 hidden md:flex"
                        >
                            <ExternalLink className="w-5 h-5 mr-3" />
                            Ver Web Pública
                        </Button>
                        <Button
                            onClick={() => setIsConfigModalOpen(true)}
                            variant="outline"
                            className="rounded-2xl h-14 px-6 font-bold uppercase tracking-widest border-2 hover:bg-gray-50 transition-all border-gray-100"
                        >
                            <Settings className="w-5 h-5 mr-3" />
                            Configurar
                        </Button>
                        <Button 
                            onClick={() => { setSelectedClase(null); setIsModalOpen(true); }}
                            className="bg-black text-white hover:bg-gray-800 rounded-2xl h-14 px-8 font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                        >
                            <Plus className="w-5 h-5 mr-3" />
                            Nueva Clase
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex bg-white p-2 rounded-[2rem] shadow-premium-soft border border-gray-100 gap-2 flex-1 w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                            <input 
                                className="w-full h-14 pl-14 pr-6 bg-gray-50/50 border-none rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-black transition-all" 
                                placeholder="Buscar clase por nombre..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex bg-white p-2 rounded-[2rem] shadow-premium-soft border border-gray-100 gap-2 overflow-x-auto no-scrollbar max-w-full">
                        {dateFilters.map((filter) => (
                            <button
                                key={filter.label}
                                onClick={() => setSelectedDate(filter.value)}
                                className={`px-6 h-14 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                                    selectedDate === filter.value 
                                        ? 'bg-black text-white shadow-lg' 
                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input 
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className={`pl-10 pr-4 h-14 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all outline-none border-none ${
                                    !dateFilters.some(f => f.value === selectedDate && f.value !== '') && selectedDate !== ''
                                        ? 'bg-black text-white shadow-lg' 
                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                }`}
                            />
                        </div>
                    </div>
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
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Programación</span>
                                        <span className="text-sm font-bold text-gray-700">
                                            {selectedDate 
                                                ? (clase.horarios?.filter(h => h.fecha === selectedDate).length || 0) + " Turnos Hoy"
                                                : (clase.horarios?.length || 0) + " Horarios"
                                            }
                                        </span>
                                    </div>
                                    <div className="flex flex-col p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">
                                            {selectedDate ? "Horario" : "Próxima"}
                                        </span>
                                        <span className="text-sm font-bold text-gray-700">
                                            {selectedDate 
                                                ? (clase.horarios?.find(h => h.fecha === selectedDate)?.hora || "Sin turno")
                                                : (clase.horarios && clase.horarios.length > 0 
                                                    ? format(parseISO(clase.horarios[0].fecha), "dd/MM", { locale: es }) + " " + clase.horarios[0].hora
                                                    : "Sin fecha")
                                            }
                                        </span>
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
                                    {(() => {
                                        const schedulesForDate = selectedDate 
                                            ? (clase.horarios || []).filter(h => h.fecha === selectedDate)
                                            : (clase.horarios || []);
                                        
                                        const totalInscriptos = schedulesForDate.reduce((acc, h) => acc + (h.inscriptosCount || 0), 0);
                                        const totalCupos = selectedDate 
                                            ? (schedulesForDate.length * clase.cupo)
                                            : ((clase.horarios || []).length * clase.cupo);

                                        return (
                                            <div 
                                                onClick={() => { setClaseForInscriptos(clase); setIsInscriptosModalOpen(true); }}
                                                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-95 bg-gray-50 text-gray-600 border border-gray-100`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {selectedDate ? "Inscriptos Hoy:" : "Inscriptos Totales:"}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-black">{totalInscriptos} alumnos</span>
                                            </div>
                                        );
                                    })()}
                                    <div className="flex items-center justify-between text-xs font-bold px-3">
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
                    onSave={loadData}
                    clase={selectedClase}
                />

                <ClasesPublicConfigModal 
                    isOpen={isConfigModalOpen}
                    onClose={() => setIsConfigModalOpen(false)}
                    tenant={tenant}
                    onSaveSuccess={loadData}
                />

                <InscriptosModal
                    isOpen={isInscriptosModalOpen}
                    onClose={() => { setIsInscriptosModalOpen(false); setClaseForInscriptos(null); }}
                    clase={claseForInscriptos}
                    tenantId={tenantId || ''}
                />
            </div>
        </AdminLayout>
    );
}
