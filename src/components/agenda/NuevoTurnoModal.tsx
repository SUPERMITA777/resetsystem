import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { serviceManagement, Tratamiento, Subtratamiento } from '@/lib/services/serviceManagement';
import { Clock, Tag, Box, User, Phone, DollarSign, Activity } from 'lucide-react';
import { TurnoData } from './TurnoCard';

interface NuevoTurnoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (turno: any) => void;
    initialHora?: string;
    initialBox?: string;
    initialFecha?: string;
    editTurno?: TurnoData | null;
}

export function NuevoTurnoModal({ isOpen, onClose, onSave, initialHora, initialBox, initialFecha, editTurno }: NuevoTurnoModalProps) {
    const [cliente, setCliente] = useState('');
    const [telefono, setTelefono] = useState('');
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
    const [selectedTratamientoId, setSelectedTratamientoId] = useState('');
    const [subtratamientos, setSubtratamientos] = useState<Subtratamiento[]>([]);
    const [selectedSubId, setSelectedSubId] = useState('');
    const [hora, setHora] = useState(initialHora || '09:00');
    const [sena, setSena] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [status, setStatus] = useState<'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO'>('RESERVADO');
    const [loading, setLoading] = useState(false);

    const currentTenant = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        if (isOpen) {
            loadTratamientos();
            if (editTurno) {
                setCliente(editTurno.clienteAbreviado);
                setTelefono((editTurno as any).whatsapp || '');
                setHora(editTurno.horaInicio.substring(0, 5));
                setSena((editTurno as any).sena || 0);
                setStatus((editTurno as any).status || 'RESERVADO');
                // We'll need to load treatments and then find the right one
            } else {
                setCliente('');
                setTelefono('');
                setHora(initialHora || '09:00');
                setSena(0);
                setStatus('RESERVADO');
            }
        }
    }, [isOpen, editTurno, initialHora]);

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

    const handleSubChange = (id: string) => {
        setSelectedSubId(id);
        const sub = subtratamientos.find(s => s.id === id);
        if (sub) {
            setTotal(sub.precio);
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
            whatsapp: telefono,
            tratamientoAbreviado: sub.nombre,
            duracionMinutos: sub.duracion_minutos,
            horaInicio: hora.includes(':') && hora.length === 5 ? `${hora}:00` : hora,
            boxId: initialBox || trat.boxId || 'box-1',
            fecha: initialFecha || new Date().toISOString().split('T')[0],
            sena,
            total,
            status
        });

        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editTurno ? "Editar Turno" : "Agendar Nuevo Turno"}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-2">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Cliente</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    required
                                    placeholder="Nombre y Apellido"
                                    value={cliente}
                                    onChange={(e) => setCliente(e.target.value)}
                                    className="pl-12 rounded-2xl bg-gray-50 border-none h-12 font-bold"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">WhatsApp</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Ej: +54 9 11..."
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    className="pl-12 rounded-2xl bg-gray-50 border-none h-12 font-bold"
                                />
                            </div>
                        </div>
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
                                onChange={(e) => handleSubChange(e.target.value)}
                            >
                                <option value="">{loading ? "Cargando..." : "Seleccionar..."}</option>
                                {subtratamientos.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre} ({s.duracion_minutos} min)</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Seña ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                <Input
                                    type="number"
                                    value={sena}
                                    onChange={(e) => setSena(Number(e.target.value))}
                                    className="pl-10 rounded-2xl bg-emerald-50/30 border-none h-12 font-bold text-emerald-700"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1 text-blue-500">Saldo ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                <Input
                                    readOnly
                                    value={total - sena}
                                    className="pl-10 rounded-2xl bg-blue-50/30 border-none h-12 font-bold text-blue-700"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Total ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
                                <Input
                                    readOnly
                                    value={total}
                                    className="pl-10 rounded-2xl bg-gray-200 border-none h-12 font-black text-gray-900"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Estado</label>
                            <div className="relative">
                                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <select
                                    className="w-full h-12 rounded-2xl border-none bg-gray-50 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as any)}
                                >
                                    <option value="RESERVADO">RESERVADO</option>
                                    <option value="CONFIRMADO">CONFIRMADO</option>
                                    <option value="COMPLETADO">COMPLETADO</option>
                                    <option value="CANCELADO">CANCELADO</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1 text-black">Hora</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                                <Input
                                    type="time"
                                    value={hora}
                                    onChange={(e) => setHora(e.target.value)}
                                    required
                                    className="pl-12 rounded-2xl bg-black/5 border-none h-12 text-black font-bold focus:ring-black"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <Button type="submit" className="w-full h-14 bg-black text-white hover:bg-gray-800 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all">
                        {editTurno ? "Guardar Cambios" : "Agendar Turno"}
                    </Button>
                    <button type="button" onClick={onClose} className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest">
                        Cancelar
                    </button>
                </div>
            </form>
        </Modal>
    );
}
