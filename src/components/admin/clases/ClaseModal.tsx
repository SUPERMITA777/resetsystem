"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Clase, claseService } from "@/lib/services/claseService";
import { getUsersByTenant, UserProfile } from "@/lib/services/userService";
import { MultipleImageUploader } from "@/components/ui/MultipleImageUploader";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Clock, User as UserIcon, Image as ImageIcon, X } from "lucide-react";

interface ClaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    clase?: Clase | null;
}

export function ClaseModal({ isOpen, onClose, onSave, clase }: ClaseModalProps) {
    const { tenantId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [profesionales, setProfesionales] = useState<UserProfile[]>([]);
    const formRef = useRef<HTMLFormElement>(null);
    
    const [formData, setFormData] = useState({
        nombre: "",
        detalle: "",
        cupo: 10,
        valorCreditos: 1,
        boxId: "salon-grupal",
        duracion: 60,
        profesionalId: "",
        profesionalNombre: "",
        imagenes: [] as string[],
        horarios: [] as { id: string, fecha: string, hora: string, inscriptosCount: number }[]
    });

    const [newSchedule, setNewSchedule] = useState({
        fecha: new Date().toISOString().split('T')[0],
        hora: "09:00"
    });

    useEffect(() => {
        async function loadProfesionales() {
            if (tenantId && isOpen) {
                try {
                    const users = await getUsersByTenant(tenantId);
                    setProfesionales(users);
                } catch (error) {
                    console.error("Error cargando profesionales", error);
                }
            }
        }
        loadProfesionales();
    }, [tenantId, isOpen]);

    useEffect(() => {
        if (clase) {
            setFormData({
                nombre: clase.nombre,
                detalle: clase.detalle || "",
                cupo: clase.cupo,
                valorCreditos: clase.valorCreditos,
                boxId: clase.boxId,
                duracion: clase.duracion || 60,
                profesionalId: clase.profesionalId || "",
                profesionalNombre: clase.profesionalNombre || "",
                imagenes: clase.imagenes || [],
                horarios: clase.horarios || []
            });
        } else {
            setFormData({
                nombre: "",
                detalle: "",
                cupo: 10,
                valorCreditos: 1,
                boxId: "salon-grupal",
                duracion: 60,
                profesionalId: "",
                profesionalNombre: "",
                imagenes: [],
                horarios: []
            });
        }
    }, [clase, isOpen]);

    const handleAddSchedule = () => {
        if (!newSchedule.fecha || !newSchedule.hora) return;
        const id = Math.random().toString(36).substr(2, 9);
        setFormData({
            ...formData,
            horarios: [...formData.horarios, { ...newSchedule, id, inscriptosCount: 0 }]
        });
    };

    const handleRemoveSchedule = (id: string) => {
        setFormData({
            ...formData,
            horarios: formData.horarios.filter(h => h.id !== id)
        });
    };

    const handleProfesionalChange = (id: string) => {
        const prof = profesionales.find(p => p.uid === id);
        setFormData({
            ...formData,
            profesionalId: id,
            profesionalNombre: prof ? (prof.displayName || prof.email) : ""
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Verificación crítica de tenantId para el guardado
        if (!tenantId) {
            toast.error("No se pudo identificar el salón. Por favor, reintenta.");
            return;
        }

        setLoading(true);
        try {
            console.log("Guardando clase...", formData);
            if (clase) {
                await claseService.updateClase(tenantId, clase.id, formData);
                toast.success("Clase actualizada");
            } else {
                await claseService.createClase(tenantId, formData);
                toast.success("Clase creada con éxito");
            }
            onSave();
            onClose();
        } catch (error) {
            console.error("Error detallado al guardar:", error);
            toast.error("Error al guardar la clase");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                        {clase ? "Editar Clase" : "Nueva Clase Grupal"}
                    </DialogTitle>
                </DialogHeader>

                <form ref={formRef} onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid gap-5">
                        {/* Información Básica */}
                        <div className="space-y-2">
                            <Label htmlFor="nombre" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre de la Clase</Label>
                            <Input
                                id="nombre"
                                placeholder="Ej: Yoga Flow, Pilates..."
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                required
                                className="h-11 rounded-xl font-bold border-gray-100 focus:ring-black"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="profesional" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Profesional</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                    <select
                                        id="profesional"
                                        className="w-full h-11 rounded-xl border-gray-100 font-bold pl-10 pr-3 outline-none focus:ring-2 focus:ring-black appearance-none bg-white text-sm"
                                        value={formData.profesionalId}
                                        onChange={(e) => handleProfesionalChange(e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {profesionales.map(p => (
                                            <option key={p.uid} value={p.uid}>{p.displayName || p.email}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duracion" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Duración (min)</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <Input
                                        id="duracion"
                                        type="number"
                                        value={formData.duracion}
                                        onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) })}
                                        required
                                        className="h-11 rounded-xl font-bold border-gray-100 pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cupo" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cupo</Label>
                                <Input
                                    id="cupo"
                                    type="number"
                                    value={formData.cupo}
                                    onChange={(e) => setFormData({ ...formData, cupo: parseInt(e.target.value) })}
                                    required
                                    className="h-11 rounded-xl font-bold border-gray-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="creditos" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Créditos</Label>
                                <Input
                                    id="creditos"
                                    type="number"
                                    value={formData.valorCreditos}
                                    onChange={(e) => setFormData({ ...formData, valorCreditos: parseInt(e.target.value) })}
                                    required
                                    className="h-11 rounded-xl font-bold border-gray-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="box" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Box</Label>
                                <select
                                    id="box"
                                    className="w-full h-11 rounded-xl border-gray-100 font-bold px-3 outline-none focus:ring-2 focus:ring-black appearance-none bg-white text-sm"
                                    value={formData.boxId}
                                    onChange={(e) => setFormData({ ...formData, boxId: e.target.value })}
                                >
                                    <option value="salon-grupal">Salón Grupal</option>
                                    <option value="box-1">Box 1</option>
                                    <option value="box-2">Box 2</option>
                                    <option value="box-3">Box 3</option>
                                </select>
                            </div>
                        </div>

                        {/* Gestión de Horarios */}
                        <div className="bg-gray-50/50 p-5 rounded-[2rem] border border-gray-100 space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-amber-500" /> Programación de Horarios
                            </Label>
                            
                            <div className="flex gap-2 items-end">
                                <div className="flex-1 space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400 px-1 uppercase">Fecha</span>
                                    <Input 
                                        type="date" 
                                        value={newSchedule.fecha}
                                        onChange={e => setNewSchedule({...newSchedule, fecha: e.target.value})}
                                        className="h-10 rounded-xl border-gray-200 font-bold"
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400 px-1 uppercase">Hora</span>
                                    <Input 
                                        type="time" 
                                        value={newSchedule.hora}
                                        onChange={e => setNewSchedule({...newSchedule, hora: e.target.value})}
                                        className="h-10 rounded-xl border-gray-200 font-bold"
                                    />
                                </div>
                                <Button 
                                    type="button" 
                                    onClick={handleAddSchedule}
                                    className="h-10 px-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px]"
                                >
                                    Sumar
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {formData.horarios.map((h) => (
                                    <div key={h.id} className="bg-white border border-gray-100 px-3 py-2 rounded-xl flex items-center gap-3 shadow-sm group">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-900">{h.fecha}</span>
                                            <span className="text-[10px] font-black text-gray-400">{h.hora} HS</span>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveSchedule(h.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {formData.horarios.length === 0 && (
                                    <p className="text-[10px] text-gray-400 italic py-2">No hay horarios programados aún.</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="detalle" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Descripción (Opcional)</Label>
                            <Textarea
                                id="detalle"
                                placeholder="..."
                                value={formData.detalle}
                                onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
                                className="rounded-xl font-medium border-gray-100 focus:ring-black min-h-[60px] text-sm"
                            />
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <ImageIcon className="w-3.5 h-3.5" /> Fotos
                            </Label>
                            <MultipleImageUploader
                                existingImages={formData.imagenes}
                                onImagesChange={(urls: string[]) => setFormData({ ...formData, imagenes: urls })}
                                tenantId={tenantId || "default"}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold text-gray-400">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-black text-white hover:bg-gray-800 rounded-xl px-10 h-14 font-black uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all">
                            {loading ? "Procesando..." : (clase ? "Guardar Cambios" : "Crear Clase")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
