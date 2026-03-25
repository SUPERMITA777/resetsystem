"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { clienteService } from "@/lib/services/clienteService";
import { X, Save, User, Phone, Mail, FileText, Zap, DollarSign, Wallet, Cake, Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface NuevoClienteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    tenantId: string;
}

export function NuevoClienteModal({ isOpen, onClose, onSave, tenantId }: NuevoClienteModalProps) {
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        notas: "",
        // Créditos fields
        creditos: 0,
        montoPagado: 0,
        metodoPago: "EFECTIVO",
        duracionDias: 30,
        fechaNacimiento: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "Enter" && !isSubmitting) {
                if (e.target instanceof HTMLTextAreaElement) return;
                e.preventDefault();
                formRef.current?.requestSubmit();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, isSubmitting]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.nombre.trim() || !formData.telefono.trim()) {
            toast.error("Nombre y teléfono son obligatorios");
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading("Creando cliente...");

        try {
            const clientId = await clienteService.createCliente(tenantId, {
                nombre: formData.nombre.trim(),
                apellido: formData.apellido.trim(),
                telefono: formData.telefono.trim(),
                email: formData.email.trim(),
                fechaNacimiento: formData.fechaNacimiento,
                notas: formData.notas.trim(),
                tenantId: tenantId
            });

            // Si se ingresaron créditos, registrarlos
            if (formData.creditos > 0) {
                await clienteService.addCredits(tenantId, clientId, formData.creditos, {
                    monto: formData.montoPagado,
                    metodo: formData.metodoPago,
                    fecha: new Date().toISOString().split('T')[0]
                }, formData.duracionDias);
            }
            
            toast.success("Cliente creado exitosamente", { id: loadingToast });
            setFormData({ nombre: "", apellido: "", email: "", telefono: "", notas: "", creditos: 1, montoPagado: 0, metodoPago: "EFECTIVO", duracionDias: 30, fechaNacimiento: "" });

            onSave();
            onClose();
        } catch (error: any) {
            console.error("Error creating cliente:", error);
            toast.error("Error al crear cliente: " + (error.message || "Error desconocido"), { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                            Nuevo Cliente
                        </h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Ingresa los datos</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Nombre *</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input
                                        required
                                        value={formData.nombre}
                                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl pl-10 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none"
                                        placeholder="Ej: Juan"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Apellido (Opcional)</label>
                                <div className="relative">
                                    <input
                                        value={formData.apellido}
                                        onChange={e => setFormData({ ...formData, apellido: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none"
                                        placeholder="Ej: Pérez"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Teléfono (WhatsApp) *</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input
                                        required
                                        type="tel"
                                        value={formData.telefono}
                                        onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl pl-10 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none"
                                        placeholder="Ej: 5491122334455"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Email (Opcional)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl pl-10 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none"
                                        placeholder="Ej: juan@email.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Fecha de Nacimiento (Opcional)</label>
                            <div className="relative">
                                <Cake className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <input
                                    type="date"
                                    value={formData.fechaNacimiento}
                                    onChange={e => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl pl-10 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none"
                                />
                            </div>
                        </div>
                                             {/* Gestión de Créditos Section */}
                        <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
                            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-amber-500" /> Gestión de Créditos
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Créditos a Comprar</label>
                                    <div className="relative">
                                        <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input
                                            type="number"
                                            value={formData.creditos}
                                            onChange={e => setFormData({ ...formData, creditos: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none shadow-sm"
                                            placeholder="Cantidad"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Dinero Pagado ($)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input
                                            type="number"
                                            value={formData.montoPagado}
                                            onChange={e => setFormData({ ...formData, montoPagado: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none shadow-sm"
                                            placeholder="Monto"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Vencimiento (Días)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input
                                            type="number"
                                            value={formData.duracionDias}
                                            onChange={e => setFormData({ ...formData, duracionDias: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none shadow-sm"
                                            placeholder="Días"
                                        />
                                    </div>
                                </div>
                            </div>

                            
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Medio de Pago</label>
                                <div className="flex gap-2">
                                    {["EFECTIVO", "TRANSFERENCIA", "TARJETA"].map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, metodoPago: m })}
                                            className={`flex-1 h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2
                                                ${formData.metodoPago === m ? 'border-black bg-black text-white' : 'border-gray-50 bg-white text-gray-400 hover:border-gray-200'}`}
                                        >
                                            <Wallet className="w-3 h-3" />
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Notas (Opcional)</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-4 w-4 h-4 text-gray-300" />
                                <textarea
                                    value={formData.notas}
                                    onChange={e => setFormData({ ...formData, notas: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl pl-10 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none resize-none h-24"
                                    placeholder="Información adicional del cliente..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-black text-white hover:bg-gray-800 h-14 rounded-2xl font-bold shadow-2xl shadow-black/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {isSubmitting ? "Guardando..." : "Crear Cliente"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

