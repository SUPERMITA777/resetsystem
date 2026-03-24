"use client";

import React, { useState, useEffect } from "react";
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
import { Clock, User as UserIcon, Image as ImageIcon } from "lucide-react";

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
    
    const [formData, setFormData] = useState({
        nombre: "",
        detalle: "",
        cupo: 10,
        valorCreditos: 1,
        boxId: "box-1",
        fecha: "",
        hora: "",
        duracion: 60,
        profesionalId: "",
        profesionalNombre: "",
        imagenes: [] as string[]
    });

    useEffect(() => {
        async function loadProfesionales() {
            if (tenantId && isOpen) {
                try {
                    const users = await getUsersByTenant(tenantId);
                    // Filtrar por roles que pueden ser profesionales (staff o salon_admin)
                    const filtered = users.filter(u => u.role === 'staff' || u.role === 'salon_admin');
                    setProfesionales(filtered);
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
                fecha: clase.fecha,
                hora: clase.hora,
                duracion: clase.duracion || 60,
                profesionalId: clase.profesionalId || "",
                profesionalNombre: clase.profesionalNombre || "",
                imagenes: clase.imagenes || []
            });
        } else {
            setFormData({
                nombre: "",
                detalle: "",
                cupo: 10,
                valorCreditos: 1,
                boxId: "box-1",
                fecha: new Date().toISOString().split('T')[0],
                hora: "09:00",
                duracion: 60,
                profesionalId: "",
                profesionalNombre: "",
                imagenes: []
            });
        }
    }, [clase, isOpen]);

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

        if (!formData.profesionalId) {
            toast.error("Debes seleccionar un profesional");
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

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="nombre" className="text-xs font-black uppercase tracking-widest text-gray-400">Nombre de la Clase</Label>
                            <Input
                                id="nombre"
                                placeholder="Ej: Yoga Flow, Pilates..."
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                required
                                className="h-12 rounded-xl font-bold border-gray-100 focus:ring-black"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="profesional" className="text-xs font-black uppercase tracking-widest text-gray-400">Profesional</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                    <select
                                        id="profesional"
                                        required
                                        className="w-full h-12 rounded-xl border-gray-100 font-bold pl-10 pr-3 outline-none focus:ring-2 focus:ring-black appearance-none bg-white"
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
                                <Label htmlFor="duracion" className="text-xs font-black uppercase tracking-widest text-gray-400">Duración (min)</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <Input
                                        id="duracion"
                                        type="number"
                                        value={formData.duracion}
                                        onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) })}
                                        required
                                        className="h-12 rounded-xl font-bold border-gray-100 pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="detalle" className="text-xs font-black uppercase tracking-widest text-gray-400">Descripción / Detalles</Label>
                            <Textarea
                                id="detalle"
                                placeholder="Describe brevemente de qué trata la clase..."
                                value={formData.detalle}
                                onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
                                className="rounded-xl font-medium border-gray-100 focus:ring-black min-h-[80px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cupo" className="text-xs font-black uppercase tracking-widest text-gray-400">Cupo (Alumnos)</Label>
                                <Input
                                    id="cupo"
                                    type="number"
                                    value={formData.cupo}
                                    onChange={(e) => setFormData({ ...formData, cupo: parseInt(e.target.value) })}
                                    required
                                    className="h-12 rounded-xl font-bold border-gray-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="creditos" className="text-xs font-black uppercase tracking-widest text-gray-400">Valor en Créditos</Label>
                                <Input
                                    id="creditos"
                                    type="number"
                                    value={formData.valorCreditos}
                                    onChange={(e) => setFormData({ ...formData, valorCreditos: parseInt(e.target.value) })}
                                    required
                                    className="h-12 rounded-xl font-bold border-gray-100"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="box" className="text-xs font-black uppercase tracking-widest text-gray-400">Box / Salón</Label>
                            <select
                                id="box"
                                className="w-full h-12 rounded-xl border-gray-100 font-bold px-3 outline-none focus:ring-2 focus:ring-black"
                                value={formData.boxId}
                                onChange={(e) => setFormData({ ...formData, boxId: e.target.value })}
                            >
                                <option value="box-1">Box 1</option>
                                <option value="box-2">Box 2</option>
                                <option value="box-3">Box 3</option>
                                <option value="salon-grupal">Salón Grupal</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fecha" className="text-xs font-black uppercase tracking-widest text-gray-400">Fecha</Label>
                                <Input
                                    id="fecha"
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    required
                                    className="h-12 rounded-xl font-bold border-gray-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hora" className="text-xs font-black uppercase tracking-widest text-gray-400">Hora</Label>
                                <Input
                                    id="hora"
                                    type="time"
                                    value={formData.hora}
                                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                                    required
                                    className="h-12 rounded-xl font-bold border-gray-100"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                                <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Fotos de la Clase</Label>
                            </div>
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
