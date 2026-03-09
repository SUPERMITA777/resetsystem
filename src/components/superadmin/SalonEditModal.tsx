"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Store,
    Calendar,
    MapPin,
    LayoutGrid,
    AlertTriangle,
    CheckCircle2,
    CalendarClock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TenantData, createOrUpdateTenant } from "@/lib/services/tenantService";
import toast from "react-hot-toast";

interface SalonEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: (TenantData & { id: string }) | null;
    onUpdate: () => void;
}

export function SalonEditModal({ isOpen, onClose, tenant, onUpdate }: SalonEditModalProps) {
    const [formData, setFormData] = useState<Partial<TenantData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (tenant) {
            setFormData({
                nombre_salon: tenant.nombre_salon,
                status: tenant.status || 'active',
                activeUntil: tenant.activeUntil,
                config_boxes: tenant.config_boxes,
                datos_contacto: { ...tenant.datos_contacto }
            });
        }
    }, [tenant]);

    if (!isOpen || !tenant) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createOrUpdateTenant(tenant.id, formData);
            toast.success("Salón actualizado correctamente");
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar el salón");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = (newStatus: 'active' | 'paused' | 'deleted') => {
        setFormData(prev => ({ ...prev, status: newStatus }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
                className="bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#9381FF]/10 flex items-center justify-center">
                            <Store className="w-6 h-6 text-[#9381FF]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Editar Salón</h2>
                            <p className="text-sm text-gray-500 font-mono text-xs">ID: {tenant.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1 leading-none">Nombre del Salón</label>
                            <Input
                                value={formData.nombre_salon || ""}
                                onChange={(e) => setFormData({ ...formData, nombre_salon: e.target.value })}
                                placeholder="Nombre comercial"
                                className="rounded-xl border-gray-200"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none">Estado</label>
                                <div className="flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleStatusChange('active')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${formData.status === 'active'
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-1 ring-emerald-200'
                                                : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                            }`}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Activo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleStatusChange('paused')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${formData.status === 'paused'
                                                ? 'bg-amber-50 border-amber-200 text-amber-700 ring-1 ring-amber-200'
                                                : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                            }`}
                                    >
                                        <CalendarClock className="w-4 h-4" />
                                        Pausado
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleStatusChange('deleted')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${formData.status === 'deleted'
                                                ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200'
                                                : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                            }`}
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        Eliminado
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1 leading-none">Vencimiento</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="date"
                                        className="pl-10 rounded-xl border-gray-200"
                                        onChange={(e) => {
                                            // Simplificado para el demo: convertimos string date a date object
                                            // En Firebase esto se manejaría como Timestamp
                                            setFormData({ ...formData, activeUntil: e.target.value })
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2">Controla el acceso al panel según membresía.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1 leading-none">Dirección</label>
                            <Input
                                value={formData.datos_contacto?.direccion || ""}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    datos_contacto: { ...formData.datos_contacto, direccion: e.target.value }
                                })}
                                placeholder="Calle, Número, Localidad"
                                className="rounded-xl border-gray-200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1 leading-none">Boxes Configuradas</label>
                            <div className="flex items-center gap-4 py-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, config_boxes: Math.max(1, (p.config_boxes || 1) - 1) }))}
                                    className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center font-bold hover:bg-gray-100"
                                >-</button>
                                <span className="text-xl font-bold w-8 text-center">{formData.config_boxes}</span>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, config_boxes: (p.config_boxes || 1) + 1 }))}
                                    className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold hover:bg-gray-800"
                                >+</button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 rounded-2xl h-12"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-[2] rounded-2xl bg-gray-900 text-white hover:bg-gray-800 h-12"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
