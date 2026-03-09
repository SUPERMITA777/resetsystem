import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { serviceManagement, Tratamiento, Subtratamiento } from '@/lib/services/serviceManagement';
import { Clock, Tag, Box, User } from 'lucide-react';

interface NuevoTurnoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (turno: any) => void;
    initialHora?: string;
    initialBox?: string;
    initialFecha?: string;
}

export function NuevoTurnoModal({ isOpen, onClose, onSave, initialHora, initialBox, initialFecha }: NuevoTurnoModalProps) {
    const [cliente, setCliente] = useState('');
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
    const [selectedTratamientoId, setSelectedTratamientoId] = useState('');
    const [subtratamientos, setSubtratamientos] = useState<Subtratamiento[]>([]);
    const [selectedSubId, setSelectedSubId] = useState('');
    const [hora, setHora] = useState(initialHora || '09:00');
    const [loading, setLoading] = useState(false);

    const currentTenant = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        if (isOpen) {
            loadTratamientos();
        }
    }, [isOpen]);

    const loadTratamientos = async () => {
        try {
            const data = await serviceManagement.getTratamientos(currentTenant);
            setTratamientos(data.filter(t => t.habilitado));
        } catch (error) {
            console.error(error);
        }
    };

    const handleTratamientoChange = async (id: string) => {
        setSelectedTratamientoId(id);
        setSelectedSubId('');
        setSubtratamientos([]);
        if (!id) return;

        setLoading(true);
        try {
            const data = await serviceManagement.getSubtratamientos(currentTenant, id);
            setSubtratamientos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onSave) return;

        const sub = subtratamientos.find(s => s.id === selectedSubId);
        const trat = tratamientos.find(t => t.id === selectedTratamientoId);

        if (!sub || !trat) return;

        onSave({
            clienteAbreviado: cliente,
            tratamientoAbreviado: sub.nombre,
            duracionMinutos: sub.duracion_minutos,
            horaInicio: hora,
            boxId: initialBox || trat.boxId || 'box-1',
            fecha: initialFecha || new Date().toISOString().split('T')[0]
        });

        setCliente('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Agendar Nuevo Turno">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-2">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Cliente</label>
                        <Input
                            required
                            placeholder="Nombre completo o Apodo"
                            value={cliente}
                            onChange={(e) => setCliente(e.target.value)}
                            className="rounded-2xl bg-gray-50 border-none h-12 px-4 font-bold"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Tratamiento</label>
                            <select
                                required
                                className="w-full h-12 rounded-2xl border-none bg-gray-50 px-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none"
                                value={selectedTratamientoId}
                                onChange={(e) => handleTratamientoChange(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                {tratamientos.map(t => (
                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Sub-item</label>
                            <select
                                required
                                disabled={!selectedTratamientoId || loading}
                                className="w-full h-12 rounded-2xl border-none bg-gray-50 px-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none disabled:opacity-50"
                                value={selectedSubId}
                                onChange={(e) => setSelectedSubId(e.target.value)}
                            >
                                <option value="">{loading ? "Cargando..." : "Seleccionar..."}</option>
                                {subtratamientos.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre} ({s.duracion_minutos} min)</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Box / Ubicación</label>
                            <div className="relative">
                                <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    readOnly
                                    value={initialBox || tratamientos.find(t => t.id === selectedTratamientoId)?.boxId || "Automático"}
                                    className="pl-12 rounded-2xl bg-gray-50 border-none h-12 text-gray-500 font-bold"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1 text-blue-500">Hora de Inicio</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                <Input
                                    type="time"
                                    value={hora}
                                    onChange={(e) => setHora(e.target.value)}
                                    required
                                    className="pl-12 rounded-2xl bg-blue-50/50 border-blue-100 h-12 text-blue-600 font-bold focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <Button type="submit" className="w-full h-14 bg-black text-white hover:bg-gray-800 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all">
                        Agendar Turno
                    </Button>
                    <button type="button" onClick={onClose} className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest">
                        Cancelar
                    </button>
                </div>
            </form>
        </Modal>
    );
}
