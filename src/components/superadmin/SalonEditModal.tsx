import React, { useState, useEffect } from "react";
import {
    Store,
    Calendar,
    MapPin,
    LayoutGrid,
    AlertTriangle,
    CheckCircle2,
    CalendarClock,
    X,
    Plus,
    Minus,
    Save
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
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
                activeUntil: tenant.activeUntil || null,
                config_boxes: tenant.config_boxes,
                datos_contacto: { ...tenant.datos_contacto }
            });
        }
    }, [tenant, isOpen]);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!tenant) return;

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

    if (!tenant) return null;

    const ModalFooter = (
        <div className="flex gap-3">
            <Button
                type="button"
                variant="ghost"
                className="flex-1 rounded-2xl h-14 font-bold text-gray-400 border border-gray-100"
                onClick={onClose}
            >
                Cancelar
            </Button>
            <Button
                onClick={() => handleSave()}
                className="flex-[2] rounded-2xl bg-black text-white hover:bg-gray-800 h-14 font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-black/20"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
        </div>
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Configuración de Salón"
            maxWidth="max-w-xl"
            footer={ModalFooter}
        >
            <div className="space-y-6 pb-2">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nombre del Salón</label>
                    <div className="relative group/field">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-focus-within/field:bg-black group-focus-within/field:text-white transition-all">
                            <Store className="w-4 h-4" />
                        </div>
                        <Input
                            value={formData.nombre_salon || ""}
                            onChange={(e) => setFormData({ ...formData, nombre_salon: e.target.value })}
                            placeholder="Nombre comercial"
                            className="h-14 rounded-2xl border-none bg-gray-50/50 pl-14 font-bold"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Estado del Sistema</label>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { id: 'active', label: 'ACTIVO', icon: CheckCircle2, color: 'emerald' },
                                { id: 'paused', label: 'PAUSADO', icon: CalendarClock, color: 'amber' },
                                { id: 'deleted', label: 'BAJA', icon: AlertTriangle, color: 'red' }
                            ].map((s) => {
                                const Icon = s.icon;
                                const isActive = formData.status === s.id;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => handleStatusChange(s.id as any)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
                                            isActive 
                                                ? `bg-black border-black text-white shadow-lg` 
                                                : `bg-gray-50/50 border-transparent text-gray-400 hover:border-gray-100`
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : `text-${s.color}-500 opacity-50`}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                                        </div>
                                        {isActive && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Vencimiento Plan</label>
                        <div className="relative group/field">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-focus-within/field:bg-black group-focus-within/field:text-white transition-all">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <Input
                                type="date"
                                className="h-14 rounded-2xl border-none bg-gray-50/50 pl-14 font-bold"
                                value={formData.activeUntil || ""}
                                onChange={(e) => setFormData({ ...formData, activeUntil: e.target.value })}
                            />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 mt-2 px-2 uppercase tracking-tighter italic">Bloquea acceso al panel automáticamente</p>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Dirección Física</label>
                    <div className="relative group/field">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-focus-within/field:bg-black group-focus-within/field:text-white transition-all">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <Input
                            value={formData.datos_contacto?.direccion || ""}
                            onChange={(e) => setFormData({
                                ...formData,
                                datos_contacto: { ...formData.datos_contacto, direccion: e.target.value }
                            })}
                            placeholder="Calle, Número, Localidad"
                            className="h-14 rounded-2xl border-none bg-gray-50/50 pl-14 font-bold"
                        />
                    </div>
                </div>

                <div className="bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100 flex items-center justify-between">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-900 leading-none mb-1">Capacidad Operativa</label>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Cantidad de boxes/sectores</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, config_boxes: Math.max(1, (p.config_boxes || 1) - 1) }))}
                            className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-all"
                        >
                            <Minus className="w-4 h-4 text-gray-400" />
                        </button>
                        <span className="text-2xl font-black w-8 text-center">{formData.config_boxes}</span>
                        <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, config_boxes: (p.config_boxes || 1) + 1 }))}
                            className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-black/10"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
