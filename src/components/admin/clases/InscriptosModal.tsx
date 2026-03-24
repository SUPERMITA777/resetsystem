"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Clase, claseService } from "@/lib/services/claseService";
import { X, Phone, CheckCircle2, Circle, MessageSquare } from "lucide-react";
import { TurnoDB } from "@/lib/services/agendaService";

interface InscriptosModalProps {
    isOpen: boolean;
    onClose: () => void;
    clase: Clase | null;
    tenantId: string;
}

export function InscriptosModal({ isOpen, onClose, clase, tenantId }: InscriptosModalProps) {
    const [inscriptos, setInscriptos] = useState<TurnoDB[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && clase && tenantId) {
            loadInscriptos();
        }
    }, [isOpen, clase, tenantId]);

    const loadInscriptos = async () => {
        if (!clase) return;
        setLoading(true);
        try {
            const data = await claseService.getInscriptos(tenantId, clase.id);
            setInscriptos(data);
        } catch (error) {
            console.error("Error cargando inscriptos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsApp = (telefono: string, nombre: string) => {
        if (!telefono) return;
        const msg = encodeURIComponent(`Hola ${nombre}, te recordamos tu clase de ${clase?.nombre} para el día ${clase?.fecha} a las ${clase?.hora} hs. ¡Te esperamos!`);
        window.open(`https://wa.me/${telefono.replace(/\D/g, '')}?text=${msg}`, '_blank');
    };

    if (!clase) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-8 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <DialogTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                Alumnos Inscriptos
                            </DialogTitle>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                                {clase.nombre} • {clase.hora} HS
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="py-10 text-center animate-pulse uppercase font-black text-gray-300 tracking-widest text-xs">
                            Cargando lista...
                        </div>
                    ) : inscriptos.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                            No hay alumnos confirmados aún.
                        </div>
                    ) : (
                        inscriptos.map((alumno) => (
                            <div key={alumno.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-black transition-all">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 truncate max-w-[180px]">
                                        {alumno.nombre || alumno.clienteAbreviado}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                        {alumno.saldoPagado ? (
                                            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-green-500 tracking-widest">
                                                <CheckCircle2 className="w-3 h-3" /> Pagado
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-orange-400 tracking-widest">
                                                <Circle className="w-3 h-3" /> Pendiente
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => handleWhatsApp(alumno.clienteWhatsapp || alumno.whatsapp || '', alumno.nombre || alumno.clienteAbreviado)}
                                    className="p-3 bg-white hover:bg-black hover:text-white text-gray-400 rounded-xl transition-all shadow-sm border border-gray-100"
                                >
                                    <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                    <Button onClick={onClose} className="rounded-xl font-bold uppercase tracking-widest text-xs bg-black text-white px-8">
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
