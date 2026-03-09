"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Clock, Tag, Box, User } from "lucide-react";
import { serviceManagement, Tratamiento, Subtratamiento } from "@/lib/services/serviceManagement";
import { TratamientoModal } from "../../../components/admin/treatments/TratamientoModal";
import { SubtratamientoModal } from "../../../components/admin/treatments/SubtratamientoModal";
import toast, { Toaster } from "react-hot-toast";

export default function TratamientosPage() {
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTratamientoModalOpen, setIsTratamientoModalOpen] = useState(false);
    const [isSubtratamientoModalOpen, setIsSubtratamientoModalOpen] = useState(false);
    const [selectedTratamiento, setSelectedTratamiento] = useState<Tratamiento | null>(null);
    const [selectedSubtratamiento, setSelectedSubtratamiento] = useState<Subtratamiento | null>(null);
    const [subItems, setSubItems] = useState<Record<string, Subtratamiento[]>>({});

    const currentTenant = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await serviceManagement.getTratamientos(currentTenant);
            setTratamientos(data);

            // Cargar subtratamientos para los expandidos
            const subs: Record<string, Subtratamiento[]> = {};
            for (const t of data) {
                const s = await serviceManagement.getSubtratamientos(currentTenant, t.id);
                subs[t.id] = s;
            }
            setSubItems(subs);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar tratamientos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDeleteTratamiento = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este tratamiento y todos sus sub-tratamientos?")) return;
        const loadingToast = toast.loading("Eliminando tratamiento...");
        try {
            await serviceManagement.deleteTratamiento(currentTenant, id);
            toast.success("Tratamiento eliminado", { id: loadingToast });
            loadData();
        } catch (error: any) {
            console.error(error);
            toast.error(`Error al eliminar: ${error.message || "Error desconocido"}`, { id: loadingToast });
        }
    };

    const handleDeleteSubtratamiento = async (tId: string, sId: string) => {
        if (!confirm("¿Estás seguro de eliminar este sub-tratamiento?")) return;
        const loadingToast = toast.loading("Eliminando sub-tratamiento...");
        try {
            await serviceManagement.deleteSubtratamiento(currentTenant, tId, sId);
            toast.success("Sub-tratamiento eliminado", { id: loadingToast });
            loadData();
        } catch (error: any) {
            console.error(error);
            toast.error(`Error al eliminar: ${error.message || "Error desconocido"}`, { id: loadingToast });
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
                <Toaster />
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-montserrat uppercase">Tratamientos</h1>
                        <p className="text-gray-500 mt-1">Gestiona tus servicios, boxes y profesionales.</p>
                    </div>
                    <Button
                        onClick={() => {
                            setSelectedTratamiento(null);
                            setIsTratamientoModalOpen(true);
                        }}
                        className="bg-black text-white hover:bg-gray-800 rounded-2xl px-6 font-bold shadow-xl transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nuevo Tratamiento
                    </Button>
                </div>

                <div className="grid gap-6">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">Cargando...</div>
                    ) : tratamientos.length === 0 ? (
                        <Card className="p-12 text-center">
                            <p className="text-gray-400 font-medium italic">No hay tratamientos creados aún.</p>
                        </Card>
                    ) : (
                        tratamientos.map(t => (
                            <Card key={t.id} className="overflow-hidden border-none shadow-premium-soft transition-all hover:shadow-premium group">
                                <div className="flex items-center justify-between p-6 cursor-pointer" onClick={() => toggleExpand(t.id)}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${t.habilitado ? 'bg-emerald-500 shadow-emerald-200' : 'bg-gray-300'} shadow-lg`} />
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">{t.nombre}</h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                {t.boxId && <span className="flex items-center gap-1"><Box className="w-3 h-3" /> {t.boxId}</span>}
                                                {t.profesionalId && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {t.profesionalId}</span>}
                                                {t.rangos_disponibilidad?.map((r, i) => (
                                                    <span key={i} className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md text-[9px]">
                                                        <Clock className="w-2.5 h-2.5" /> {r.inicio}-{r.fin}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTratamiento(t);
                                                setIsTratamientoModalOpen(true);
                                            }}
                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTratamiento(t.id);
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="w-px h-6 bg-gray-100 mx-1" />
                                        {expandedIds.includes(t.id) ? <ChevronUp className="w-5 h-5 text-gray-300" /> : <ChevronDown className="w-5 h-5 text-gray-300" />}
                                    </div>
                                </div>

                                {expandedIds.includes(t.id) && (
                                    <div className="bg-gray-50/50 border-t border-gray-50 p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Sub-tratamientos</h4>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-xs font-bold text-black border border-black/5 hover:bg-black hover:text-white transition-all rounded-xl"
                                                onClick={() => {
                                                    setSelectedTratamiento(t);
                                                    setSelectedSubtratamiento(null);
                                                    setIsSubtratamientoModalOpen(true);
                                                }}
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1" /> Añadir
                                            </Button>
                                        </div>

                                        <div className="grid gap-3">
                                            {subItems[t.id]?.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic">No hay sub-tratamientos asignados.</p>
                                            ) : (
                                                subItems[t.id]?.map(s => (
                                                    <div key={s.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group/sub transition-all hover:border-black/10 hover:shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover/sub:bg-black group-hover/sub:text-white transition-all">
                                                                <Tag className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{s.nombre}</p>
                                                                <div className="flex items-center gap-3 mt-0.5">
                                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                                                                        <Clock className="w-3 h-3" /> {s.duracion_minutos} min
                                                                    </span>
                                                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                                        ${s.precio}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTratamiento(t);
                                                                    setSelectedSubtratamiento(s);
                                                                    setIsSubtratamientoModalOpen(true);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-black transition-all"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSubtratamiento(t.id, s.id)}
                                                                className="p-2 text-gray-400 hover:text-red-500 transition-all"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {isTratamientoModalOpen && (
                <TratamientoModal
                    isOpen={isTratamientoModalOpen}
                    onClose={() => setIsTratamientoModalOpen(false)}
                    onSave={loadData}
                    tratamiento={selectedTratamiento}
                    tenantId={currentTenant}
                />
            )}

            {isSubtratamientoModalOpen && selectedTratamiento && (
                <SubtratamientoModal
                    isOpen={isSubtratamientoModalOpen}
                    onClose={() => setIsSubtratamientoModalOpen(false)}
                    onSave={loadData}
                    tratamientoId={selectedTratamiento.id}
                    subtratamiento={selectedSubtratamiento}
                    tenantId={currentTenant}
                />
            )}
        </AdminLayout>
    );
}
