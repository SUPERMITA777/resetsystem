import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Clase, claseService } from "@/lib/services/claseService";
import { getUsersByTenant, UserProfile } from "@/lib/services/userService";
import { MultipleImageUploader } from "@/components/ui/MultipleImageUploader";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Clock, User as UserIcon, Image as ImageIcon, X, Calendar, Plus, Save } from "lucide-react";

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
        if (e) e.preventDefault();
        
        if (!tenantId) {
            toast.error("No se pudo identificar el salón. Por favor, reintenta.");
            return;
        }

        setLoading(true);
        try {
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

    const ModalFooter = (
        <div className="flex gap-3 pt-2">
            <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose} 
                className="flex-1 h-12 rounded-2xl font-bold text-gray-400 border border-gray-100"
            >
                Cancelar
            </Button>
            <Button 
                onClick={() => handleSubmit(undefined as any)} 
                disabled={loading} 
                className="flex-[2] h-14 bg-black text-white hover:bg-gray-800 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-black/20"
            >
                {loading ? "Procesando..." : (clase ? "Guardar Cambios" : "Crear Clase")}
            </Button>
        </div>
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={clase ? "Editar Clase" : "Nueva Clase Grupal"}
            maxWidth="max-w-xl"
            footer={ModalFooter}
        >
            <div className="space-y-6 pb-2">
                {/* Información Básica */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="nombre" className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 ml-1">Nombre de la Clase</Label>
                        <Input
                            id="nombre"
                            placeholder="Ej: Yoga Flow, Pilates..."
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                            className="h-14 rounded-2xl font-bold border-none bg-gray-50/50 pl-4"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="profesional" className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 ml-1">Profesional</Label>
                            <div className="relative group/field">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400 group-focus-within/field:bg-black group-focus-within/field:text-white transition-all">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <select
                                    id="profesional"
                                    className="w-full h-14 rounded-2xl border-none font-bold pl-14 pr-3 outline-none bg-gray-50/50 text-sm appearance-none"
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
                        <div className="space-y-1">
                            <Label htmlFor="duracion" className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 ml-1">Duración (min)</Label>
                            <div className="relative group/field">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400 group-focus-within/field:bg-black group-focus-within/field:text-white transition-all">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <Input
                                    id="duracion"
                                    type="number"
                                    value={formData.duracion}
                                    onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) || 0 })}
                                    required
                                    className="h-14 rounded-2xl font-bold border-none bg-gray-50/50 pl-14"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="cupo" className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 ml-1">Cupo Máximo</Label>
                            <Input
                                id="cupo"
                                type="number"
                                value={formData.cupo}
                                onChange={(e) => setFormData({ ...formData, cupo: parseInt(e.target.value) || 0 })}
                                required
                                className="h-14 rounded-2xl font-bold border-none bg-gray-50/50 pl-4"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="creditos" className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 ml-1">Valor Créditos</Label>
                            <Input
                                id="creditos"
                                type="number"
                                value={formData.valorCreditos}
                                onChange={(e) => setFormData({ ...formData, valorCreditos: parseInt(e.target.value) || 0 })}
                                required
                                className="h-14 rounded-2xl font-bold border-none bg-gray-50/50 pl-4"
                            />
                        </div>
                    </div>
                </div>

                {/* Gestión de Horarios */}
                <div className="bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100 space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-900 flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-emerald-500" /> Programación de Horarios
                    </Label>
                    
                    <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                            <span className="text-[9px] font-black text-gray-400 px-1 uppercase tracking-tighter">Fecha</span>
                            <Input 
                                type="date" 
                                value={newSchedule.fecha}
                                onChange={e => setNewSchedule({...newSchedule, fecha: e.target.value})}
                                className="h-12 rounded-xl border-none bg-white font-bold"
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <span className="text-[9px] font-black text-gray-400 px-1 uppercase tracking-tighter">Hora</span>
                            <Input 
                                type="time" 
                                value={newSchedule.hora}
                                onChange={e => setNewSchedule({...newSchedule, hora: e.target.value})}
                                className="h-12 rounded-xl border-none bg-white font-bold"
                            />
                        </div>
                        <Button 
                            type="button" 
                            onClick={handleAddSchedule}
                            className="h-12 w-12 bg-black text-white rounded-xl font-black flex items-center justify-center p-0"
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {formData.horarios.map((h) => (
                            <div key={h.id} className="bg-white border border-gray-100 px-4 py-3 rounded-2xl flex items-center gap-4 shadow-sm group animate-in zoom-in-95 duration-200">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-gray-900 uppercase tracking-tighter">{h.fecha}</span>
                                    <span className="text-[10px] font-bold text-blue-500">{h.hora} HS</span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveSchedule(h.id)}
                                    className="w-7 h-7 bg-red-50 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {formData.horarios.length === 0 && (
                            <div className="w-full py-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl">
                                <Clock className="w-8 h-8 text-gray-200 mb-2" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">No hay horarios programados</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="detalle" className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 ml-1">Descripción de la Clase</Label>
                    <Textarea
                        id="detalle"
                        placeholder="De qué trata la clase..."
                        value={formData.detalle}
                        onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
                        className="rounded-2xl font-bold border-none bg-gray-50/50 min-h-[100px] text-sm p-4"
                    />
                </div>

                <div className="space-y-4 pt-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1 ml-1">
                        <ImageIcon className="w-4 h-4" /> Galería de Fotos
                    </Label>
                    <div className="bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100">
                        <MultipleImageUploader
                            existingImages={formData.imagenes}
                            onImagesChange={(urls: string[]) => setFormData({ ...formData, imagenes: urls })}
                            tenantId={tenantId || "default"}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}
