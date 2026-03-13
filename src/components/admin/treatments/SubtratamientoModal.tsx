"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { serviceManagement, Subtratamiento } from "@/lib/services/serviceManagement";
import { X, Save, Clock, DollarSign, FileText, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { MultipleImageUploader } from "@/components/ui/MultipleImageUploader";

interface SubtratamientoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    tratamientoId: string;
    subtratamiento: Subtratamiento | null;
    tenantId: string;
}

export function SubtratamientoModal({ isOpen, onClose, onSave, tratamientoId, subtratamiento, tenantId }: SubtratamientoModalProps) {
    const [activeTab, setActiveTab] = useState<"general" | "detalles">("general");
    const [formData, setFormData] = useState<Partial<Subtratamiento>>({
        nombre: "",
        precio: 0,
        duracion_minutos: 30,
        profesional_asignado: "",
        descripcion: "",
        imagenes: []
    });

    useEffect(() => {
        if (subtratamiento) {
            setFormData(subtratamiento);
        }
    }, [subtratamiento]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (subtratamiento) {
                await serviceManagement.updateSubtratamiento(tenantId, tratamientoId, subtratamiento.id, formData);
                toast.success("Sub-tratamiento actualizado");
            } else {
                await serviceManagement.createSubtratamiento(tenantId, tratamientoId, formData as Omit<Subtratamiento, "id">);
                toast.success("Sub-tratamiento creado");
            }
            onSave();
            onClose();
        } catch (error) {
            toast.error("Error al guardar");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                            {subtratamiento ? "Editar Sub-item" : "Añadir Sub-item"}
                        </h2>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Detalles del servicio</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-8 pt-4 flex gap-6 border-b border-gray-50">
                    <button
                        type="button"
                        onClick={() => setActiveTab("general")}
                        className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'general' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        General
                        {activeTab === 'general' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("detalles")}
                        className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'detalles' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Página Pública
                        {activeTab === 'detalles' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />
                        )}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    {activeTab === "general" ? (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Nombre</label>
                            <input
                                required
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-300"
                                placeholder="Ej: Depilación de Piernas"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Precio</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        required
                                        value={formData.precio}
                                        onChange={e => setFormData({ ...formData, precio: Number(e.target.value) })}
                                        className="w-full bg-gray-50 border-none rounded-2xl pl-10 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Duración (min)</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        required
                                        step="5"
                                        value={formData.duracion_minutos}
                                        onChange={e => setFormData({ ...formData, duracion_minutos: Number(e.target.value) })}
                                        className="w-full bg-gray-50 border-none rounded-2xl pl-10 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none font-montserrat"
                                        placeholder="30"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 px-1">Profesional Asignado (Opcional)</label>
                            <input
                                value={formData.profesional_asignado}
                                onChange={e => setFormData({ ...formData, profesional_asignado: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                                placeholder="ID del Profesional"
                            />
                        </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1 flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> Descripción Pública
                                </label>
                                <textarea
                                    value={formData.descripcion || ""}
                                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none resize-none h-32"
                                    placeholder="Describe este item para la reserva online..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1 flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" /> Galería de Fotos
                                </label>
                                <MultipleImageUploader
                                    tenantId={tenantId}
                                    existingImages={formData.imagenes || []}
                                    onImagesChange={urls => setFormData({ ...formData, imagenes: urls })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-4">
                        <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800 h-14 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                            <Save className="w-5 h-5" />
                            {subtratamiento ? "Actualizar" : "Crear Sub-item"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
