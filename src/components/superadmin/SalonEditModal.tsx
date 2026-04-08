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
    Save,
    Users,
    User,
    Sparkles,
    ShoppingBag,
    Dumbbell,
    Globe,
    Bot,
    FileBarChart,
    Check
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
                datos_contacto: { ...tenant.datos_contacto },
                modules: tenant.modules || {
                    turnos_agenda: true,
                    clientes: true,
                    staff: true,
                    tratamientos: true,
                    clases: true,
                    productos: true,
                    fitness: false,
                    marketing: true,
                    ai_agents: false,
                    reportes: true,
                },
                ai_usage: tenant.ai_usage || {
                    tokens_spent: 0,
                    ars_spent: 0,
                    ars_limit: 0
                }
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

    const toggleModule = (moduleId: keyof NonNullable<TenantData['modules']>) => {
        setFormData(prev => ({
            ...prev,
            modules: {
                ...((prev.modules || {}) as any),
                [moduleId]: !((prev.modules as any)?.[moduleId])
            }
        }));
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

                <div className="space-y-4">
                    <div className="flex flex-col px-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-900 leading-none mb-1">Módulos Habilitados</label>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Estructura permitida para este salón</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'turnos_agenda', label: 'Turnos & Agenda', icon: Calendar },
                            { id: 'clientes', label: 'Clientes', icon: Users },
                            { id: 'staff', label: 'Profesionales', icon: User },
                            { id: 'tratamientos', label: 'Tratamientos', icon: Sparkles },
                            { id: 'clases', label: 'Clases & Gym', icon: Dumbbell },
                            { id: 'productos', label: 'Inventario & Prod.', icon: ShoppingBag },
                            { id: 'fitness', label: 'Fitness', icon: Dumbbell },
                            { id: 'marketing', label: 'Marketing Web', icon: Globe },
                            { id: 'ai_agents', label: 'Agentes IA', icon: Bot },
                            { id: 'reportes', label: 'Reportes', icon: FileBarChart },
                        ].map((m) => {
                            const Icon = m.icon;
                            const isEnabled = !!(formData.modules as any)?.[m.id];
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => toggleModule(m.id as any)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                                        isEnabled 
                                            ? 'bg-white border-black text-gray-900 shadow-sm' 
                                            : 'bg-gray-50/30 border-transparent text-gray-400'
                                    }`}
                                >
                                    <div className={`p-2 rounded-xl ${isEnabled ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tight text-left leading-tight">{m.label}</span>
                                    {isEnabled && <Check className="w-3 h-3 text-emerald-500 ml-auto" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sección de Presupuesto IA */}
                <div className="pt-4 border-t border-dashed border-gray-100 space-y-4">
                    <div className="flex flex-col px-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-900 leading-none mb-1">Presupuesto Agente IA</label>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Control de gastos en Pesos Argentinos (ARS)</p>
                    </div>

                    <div className="bg-black rounded-[2rem] p-6 text-white overflow-hidden relative shadow-xl shadow-black/10">
                        {/* Shimmer background effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
                        
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Consumo Actual</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black italic">
                                            $ {Math.round(formData.ai_usage?.ars_spent || 0).toLocaleString('es-AR')}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">ARS</span>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Tokens Usados</span>
                                    <span className="text-xl font-bold italic opacity-80">
                                        {(formData.ai_usage?.tokens_spent || 0).toLocaleString('es-AR')}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span>Progreso del límite</span>
                                    <span>
                                        {formData.ai_usage?.ars_limit 
                                            ? `${Math.min(100, Math.round(((formData.ai_usage?.ars_spent || 0) / formData.ai_usage.ars_limit) * 100))}%`
                                            : 'Sin Límite'
                                        }
                                    </span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                        style={{ 
                                            width: `${formData.ai_usage?.ars_limit 
                                                ? Math.min(100, Math.round(((formData.ai_usage?.ars_spent || 0) / formData.ai_usage.ars_limit) * 100)) 
                                                : 0}%` 
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Establecer Límite Mensual (ARS)</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</div>
                                    <Input
                                        type="number"
                                        value={formData.ai_usage?.ars_limit || 0}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            ai_usage: {
                                                ...(formData.ai_usage as any || { tokens_spent: 0, ars_spent: 0 }),
                                                ars_limit: Number(e.target.value)
                                            }
                                        })}
                                        className="h-12 bg-white/5 border-none rounded-xl pl-8 font-black text-white focus:ring-1 focus:ring-emerald-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-gray-500 mt-2 italic">* El agente dejará de responder al alcanzar este monto</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
