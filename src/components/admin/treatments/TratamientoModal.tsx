"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { serviceManagement, Tratamiento } from "@/lib/services/serviceManagement";
import { getUsersByTenant, UserProfile } from "@/lib/services/userService";
import { X, Save, Clock, Box, User, Plus, Trash2, Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface TratamientoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    tratamiento: Tratamiento | null;
    tenantId: string;
}

export function TratamientoModal({ isOpen, onClose, onSave, tratamiento, tenantId }: TratamientoModalProps) {
    const [profesionales, setProfesionales] = useState<UserProfile[]>([]);
    const [formData, setFormData] = useState<Partial<Tratamiento>>({
        nombre: "",
        descripcion: "",
        habilitado: true,
        boxId: "box-1",
        profesionalId: "",
        rangos_disponibilidad: [
            {
                inicio: "09:00",
                fin: "21:00",
                dias: [0, 1, 2, 3, 4, 5, 6] // Default all days
            }
        ]
    });

    useEffect(() => {
        if (isOpen && tenantId) {
            getUsersByTenant(tenantId).then(users => {
                const staff = users.filter(u => u.role === 'staff' || u.role === 'salon_admin');
                setProfesionales(staff);
            });
        }
    }, [isOpen, tenantId]);

    useEffect(() => {
        if (tratamiento) {
            setFormData(tratamiento);
        } else {
            setFormData({
                nombre: "",
                descripcion: "",
                habilitado: true,
                boxId: "box-1",
                profesionalId: "",
                rangos_disponibilidad: [
                    {
                        inicio: "09:00",
                        fin: "21:00",
                        dias: [0, 1, 2, 3, 4, 5, 6]
                    }
                ]
            });
        }
    }, [tratamiento, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Limpieza de datos antes de enviar a Firestore
            const cleanData = {
                ...formData,
                rangos_disponibilidad: formData.rangos_disponibilidad?.map(r => ({
                    inicio: r.inicio || "09:00",
                    fin: r.fin || "18:00",
                    dias: r.dias || [0, 1, 2, 3, 4, 5, 6],
                    fecha_inicio: r.fecha_inicio || null,
                    fecha_fin: r.fecha_fin || null
                }))
            };

            if (tratamiento) {
                await serviceManagement.updateTratamiento(tenantId, tratamiento.id, cleanData);
                toast.success("Tratamiento actualizado");
            } else {
                await serviceManagement.createTratamiento(tenantId, cleanData as Omit<Tratamiento, "id">);
                toast.success("Tratamiento creado");
            }
            onSave();
            onClose();
        } catch (error: any) {
            console.error("Firestore Save Error:", error);
            toast.error(`Error al guardar: ${error.message || "Error desconocido"}`);
        }
    };

    const addRango = () => {
        setFormData(prev => ({
            ...prev,
            rangos_disponibilidad: [
                ...(prev.rangos_disponibilidad || []),
                { inicio: "09:00", fin: "18:00", dias: [0, 1, 2, 3, 4, 5, 6] }
            ]
        }));
    };

    const removeRango = (index: number) => {
        setFormData(prev => ({
            ...prev,
            rangos_disponibilidad: prev.rangos_disponibilidad?.filter((_, i) => i !== index)
        }));
    };

    const updateRango = (index: number, data: any) => {
        setFormData(prev => {
            const newRangos = [...(prev.rangos_disponibilidad || [])];
            newRangos[index] = { ...newRangos[index], ...data };
            return { ...prev, rangos_disponibilidad: newRangos };
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                            {tratamiento ? "Editar Tratamiento" : "Nuevo Tratamiento"}
                        </h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Configuración general</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Nombre</label>
                            <input
                                required
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none"
                                placeholder="Ej: Depilación Laser"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Box Defecto</label>
                                <div className="relative">
                                    <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <select
                                        value={formData.boxId}
                                        onChange={e => setFormData({ ...formData, boxId: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none appearance-none"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={`box-${n}`}>Box {n}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1 text-gray-300">Profesional</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <select
                                        value={formData.profesionalId}
                                        onChange={e => setFormData({ ...formData, profesionalId: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none appearance-none"
                                    >
                                        <option value="">Seleccionar Profesional</option>
                                        {profesionales.map(p => (
                                            <option key={p.uid} value={p.uid}>{p.displayName || p.email}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Disponibilidad Horaria
                                </h3>
                                <button type="button" onClick={addRango} className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1 hover:text-blue-700 transition-all">
                                    <Plus className="w-3 h-3" /> Añadir Rango
                                </button>
                            </div>

                            {formData.rangos_disponibilidad?.map((rango, idx) => (
                                <div key={idx} className="bg-gray-50/50 p-6 rounded-[1.5rem] space-y-4 relative group/rango border border-transparent hover:border-gray-200 transition-all">
                                    {idx > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => removeRango(idx)}
                                            className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Fecha Inicio (Opcional)</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                                                <input
                                                    type="date"
                                                    value={rango.fecha_inicio || ""}
                                                    onChange={e => updateRango(idx, { fecha_inicio: e.target.value })}
                                                    className="w-full bg-white border-none rounded-xl pl-9 pr-3 py-2 text-[11px] font-bold focus:ring-1 focus:ring-black outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Fecha Fin (Opcional)</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                                                <input
                                                    type="date"
                                                    value={rango.fecha_fin || ""}
                                                    onChange={e => updateRango(idx, { fecha_fin: e.target.value })}
                                                    className="w-full bg-white border-none rounded-xl pl-9 pr-3 py-2 text-[11px] font-bold focus:ring-1 focus:ring-black outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Días Disponibles</label>
                                        <div className="flex gap-1.5">
                                            {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, dIdx) => {
                                                const isSelected = rango.dias.includes(dIdx);
                                                return (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => {
                                                            const newDays = isSelected 
                                                                ? rango.dias.filter(d => d !== dIdx)
                                                                : [...rango.dias, dIdx].sort();
                                                            updateRango(idx, { dias: newDays });
                                                        }}
                                                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all border ${isSelected ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="time"
                                            value={rango.inicio}
                                            onChange={e => updateRango(idx, { inicio: e.target.value })}
                                            className="bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-black shadow-sm"
                                        />
                                        <input
                                            type="time"
                                            value={rango.fin}
                                            onChange={e => updateRango(idx, { fin: e.target.value })}
                                            className="bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-black shadow-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, habilitado: !formData.habilitado })}
                                className={`w-12 h-6 rounded-full transition-all relative ${formData.habilitado ? 'bg-emerald-500' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.habilitado ? 'left-7' : 'left-1'}`} />
                            </button>
                            <span className="text-xs font-bold text-gray-600">Tratamiento Habilitado</span>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800 h-14 rounded-2xl font-bold shadow-2xl shadow-black/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                            <Save className="w-5 h-5" />
                            {tratamiento ? "Guardar Cambios" : "Crear Tratamiento"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
