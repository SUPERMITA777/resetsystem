"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { clienteService } from "@/lib/services/clienteService";
import { X, Save, User, Phone, Mail, FileText, MapPin, Map, CheckCircle } from "lucide-react";
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
        direccion: "",
        provincia: "",
        direccionValidada: false,
        notas: ""
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
        
        if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.telefono.trim()) {
            toast.error("Nombre, apellido y teléfono son obligatorios");
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading("Creando cliente...");

        try {
            await clienteService.createCliente(tenantId, {
                nombre: formData.nombre.trim(),
                apellido: formData.apellido.trim(),
                telefono: formData.telefono.trim(),
                email: formData.email.trim(),
                direccion: formData.direccion.trim(),
                provincia: formData.provincia.trim(),
                direccionValidada: formData.direccionValidada,
                notas: formData.notas.trim(),
                tenantId: tenantId
            });
            
            toast.success("Cliente creado exitosamente", { id: loadingToast });
            setFormData({ nombre: "", apellido: "", email: "", telefono: "", direccion: "", provincia: "", direccionValidada: false, notas: "" });
            onSave();
            onClose();
        } catch (error: any) {
            console.error("Error creating cliente:", error);
            toast.error("Error al crear cliente: " + (error.message || "Error desconocido"), { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleValidateAddress = () => {
        if (!formData.direccion.trim() || !formData.provincia.trim()) {
            toast.error("Ingresa dirección y provincia para validar en mapas");
            return;
        }
        const query = encodeURIComponent(`${formData.direccion}, ${formData.provincia}`);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
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
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Apellido *</label>
                                <div className="relative">
                                    <input
                                        required
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
                        
                        {/* Dirección Section */}
                        <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 space-y-4">
                            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-blue-500" /> Dirección (Para Google Maps)
                            </h3>
                            <div className="grid grid-cols-[2fr_1fr] gap-4">
                                <div>
                                    <input
                                        value={formData.direccion}
                                        onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                                        className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none shadow-sm"
                                        placeholder="Dirección exacta"
                                    />
                                </div>
                                <div>
                                    <select
                                        value={formData.provincia}
                                        onChange={e => setFormData({ ...formData, provincia: e.target.value })}
                                        className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none shadow-sm appearance-none"
                                    >
                                        <option value="">ELEGIR PROVINCIA</option>
                                        <option value="Capital Federal">Capital Federal</option>
                                        <option value="Buenos Aires">Buenos Aires</option>
                                        <option value="Catamarca">Catamarca</option>
                                        <option value="Chaco">Chaco</option>
                                        <option value="Chubut">Chubut</option>
                                        <option value="Córdoba">Córdoba</option>
                                        <option value="Corrientes">Corrientes</option>
                                        <option value="Entre Ríos">Entre Ríos</option>
                                        <option value="Formosa">Formosa</option>
                                        <option value="Jujuy">Jujuy</option>
                                        <option value="La Pampa">La Pampa</option>
                                        <option value="La Rioja">La Rioja</option>
                                        <option value="Mendoza">Mendoza</option>
                                        <option value="Misiones">Misiones</option>
                                        <option value="Neuquén">Neuquén</option>
                                        <option value="Río Negro">Río Negro</option>
                                        <option value="Salta">Salta</option>
                                        <option value="San Juan">San Juan</option>
                                        <option value="San Luis">San Luis</option>
                                        <option value="Santa Cruz">Santa Cruz</option>
                                        <option value="Santa Fe">Santa Fe</option>
                                        <option value="Santiago del Estero">Santiago del Estero</option>
                                        <option value="Tierra del Fuego">Tierra del Fuego</option>
                                        <option value="Tucumán">Tucumán</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={handleValidateAddress}
                                    className="h-10 text-[10px] font-bold uppercase tracking-widest rounded-xl text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                    <Map className="w-4 h-4 mr-2" />
                                    Validar en Mapas
                                </Button>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${formData.direccionValidada ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-transparent group-hover:bg-gray-300'}`}>
                                        <CheckCircle className="w-3.5 h-3.5" />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${formData.direccionValidada ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {formData.direccionValidada ? "Dirección Correcta" : "Confirmar Dirección"}
                                    </span>
                                    <input 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={formData.direccionValidada}
                                        onChange={e => setFormData({ ...formData, direccionValidada: e.target.checked })}
                                    />
                                </label>
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

