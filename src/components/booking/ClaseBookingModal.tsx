"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Clase, claseService } from "@/lib/services/claseService";
import { createTurno } from "@/lib/services/agendaService";
import toast from "react-hot-toast";
import { CheckCircle2, MessageCircle, User, Calendar, Clock, X } from "lucide-react";

interface ClaseBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    clase: Clase | null;
    horario: { id: string, fecha: string, hora: string, inscriptosCount: number } | null;
    tenantId: string;
    tenantName: string;
    salonWhatsapp?: string;
}

export function ClaseBookingModal({ isOpen, onClose, clase, horario, tenantId, tenantName, salonWhatsapp }: ClaseBookingModalProps) {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: "",
        whatsapp: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clase || !horario) return;

        setLoading(true);
        try {
            // Create a pending turno linked to this class and specific schedule
            await createTurno(tenantId, {
                nombre: formData.nombre,
                whatsapp: formData.whatsapp,
                fecha: horario.fecha,
                horaInicio: horario.hora,
                clienteAbreviado: formData.nombre.slice(0, 10),
                tratamientoAbreviado: "CLASE",
                subtratamientoAbreviado: clase.nombre.slice(0, 20),
                duracionMinutos: clase.duracion || 60,
                boxId: clase.boxId || "salon-grupal",
                status: 'PENDIENTE',
                claseId: clase.id,
                valorCreditos: clase.valorCreditos
            });

            // Increment inscriptos for this specific schedule
            await claseService.incrementInscriptos(tenantId, clase.id, horario.id);

            // Send WhatsApp to local
            if (salonWhatsapp) {
                const text = encodeURIComponent(`NUEVA INSCRIPCIÓN\n\nClase: ${clase.nombre}\nFecha: ${horario.fecha} ${horario.hora}\nCliente: ${formData.nombre}\nWhatsApp: ${formData.whatsapp}`);
                window.open(`https://wa.me/${salonWhatsapp.replace(/\D/g, '')}?text=${text}`, '_blank');
            }

            setStep('success');
            toast.success("Solicitud enviada");
        } catch (error) {
            console.error(error);
            toast.error("Error al enviar la solicitud");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep('form');
        setFormData({ nombre: "", whatsapp: "" });
        onClose();
    };

    if (!clase) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[450px] rounded-[3rem] p-0 overflow-hidden border-none shadow-premium">
                {step === 'form' ? (
                    <div className="bg-[#faf9f9]">
                        <div className="p-8 pt-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-serif italic text-[#7b5460] leading-none mb-2">{clase.nombre}</h2>
                                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[#9086AB]">
                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {clase.fecha}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {clase.hora} HS</span>
                                    </div>
                                </div>
                                <button onClick={handleClose} className="p-2 hover:bg-white rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-300" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                                {clase.detalle || "Una experiencia revitalizante diseñada para resetear tu cuerpo y mente en un ambiente exclusivo."}
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5 px-1">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7b5460]/60">Nombre y Apellido</Label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A5B2]/40" />
                                            <Input 
                                                required
                                                value={formData.nombre}
                                                onChange={e => setFormData({...formData, nombre: e.target.value})}
                                                placeholder="Tu nombre completo"
                                                className="h-14 pl-12 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-[#D4A5B2] transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 px-1">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7b5460]/60">WhatsApp</Label>
                                        <div className="relative">
                                            <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A5B2]/40" />
                                            <Input 
                                                required
                                                type="tel"
                                                value={formData.whatsapp}
                                                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                                                placeholder="Ej: +54 9 11 1234 5678"
                                                className="h-14 pl-12 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-[#D4A5B2] transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full h-16 bg-gradient-to-r from-[#7b5460] to-[#6e4954] text-white rounded-full font-serif italic text-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        {loading ? "Procesando..." : "Solicitar Inscripción"}
                                    </Button>
                                    <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mt-4">
                                        Sujeto a confirmación por el salón
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#faf9f9] p-12 text-center py-20 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-premium-soft border border-[#f4d0d9]/30">
                            <CheckCircle2 className="w-12 h-12 text-[#D4A5B2]" />
                        </div>
                        <h2 className="text-4xl font-serif italic text-[#7b5460] mb-4">¡Inscripción Enviada!</h2>
                        <p className="text-gray-500 font-medium leading-relaxed max-w-xs mx-auto mb-10">
                            Te enviaremos la confirmación por WhatsApp a la brevedad. ¡Gracias por elegirnos!
                        </p>
                        <Button 
                            onClick={handleClose}
                            className="h-14 px-10 bg-[#635a7c] text-white rounded-full font-black uppercase tracking-widest text-xs hover:bg-[#524a68] transition-all shadow-md"
                        >
                            Volver al Inicio
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
