import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { serviceManagement, Tratamiento, Subtratamiento } from '@/lib/services/serviceManagement';
import { clienteService, Cliente } from '@/lib/services/clienteService';
import { Clock, Tag, Box, User, Phone, DollarSign, Activity, X } from 'lucide-react';
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
    const [email, setEmail] = useState('');
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
    const [selectedTratamientoId, setSelectedTratamientoId] = useState('');
    const [subtratamientos, setSubtratamientos] = useState<Subtratamiento[]>([]);
    const [selectedSubs, setSelectedSubs] = useState<Subtratamiento[]>([]);
    const [hora, setHora] = useState(initialHora || '09:00');
    const [sena, setSena] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [status, setStatus] = useState<'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO'>('RESERVADO');
    const [loading, setLoading] = useState(false);
    
    // Autocomplete state
    const [clientesDb, setClientesDb] = useState<Cliente[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);

    const currentTenant = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        if (isOpen) {
            loadTratamientos();
            loadClientes();
            if (editTurno) {
                setCliente(editTurno.clienteAbreviado);
                setTelefono((editTurno as any).whatsapp || '');
                setEmail((editTurno as any).email || '');
                setHora(editTurno.horaInicio.substring(0, 5));
                setSena((editTurno as any).sena || 0);
                setStatus((editTurno as any).status || 'RESERVADO');
                // Multiple subs handling would go here if in DB
                setSelectedSubs([]); 
            } else {
                setCliente('');
                setTelefono('');
                setEmail('');
                setHora(initialHora || '09:00');
                setSena(0);
                setTotal(0);
                setSelectedSubs([]);
                setStatus('RESERVADO');
            }
        }
    }, [isOpen, editTurno, initialHora]);

    const loadClientes = async () => {
        try {
            const data = await clienteService.getClientes(currentTenant);
            setClientesDb(data);
        } catch (error) {
            console.error(error);
        }
    };

    const loadTratamientos = async () => {
        try {
            const data = await serviceManagement.getTratamientos(currentTenant);
            
            const filtered = data.filter(t => {
                if (!t.habilitado) return false;
                if (initialBox && t.boxId && t.boxId !== initialBox) return false;
                if (t.rangos_disponibilidad && t.rangos_disponibilidad.length > 0) {
                    const selectedDate = initialFecha ? new Date(initialFecha + 'T12:00:00') : new Date();
                    const dayOfWeek = selectedDate.getDay();
                    const isAvailable = t.rangos_disponibilidad.some(rango => {
                        if (!rango.dias.includes(dayOfWeek)) return false;
                        const [h_ini, m_ini] = rango.inicio.split(':').map(Number);
                        const [h_fin, m_fin] = rango.fin.split(':').map(Number);
                        const [h_sel, m_sel] = hora.split(':').map(Number);
                        const startMinutes = h_ini * 60 + m_ini;
                        const endMinutes = h_fin * 60 + m_fin;
                        const selectedMinutes = h_sel * 60 + m_sel;
                        return selectedMinutes >= startMinutes && selectedMinutes < endMinutes;
                    });
                    if (!isAvailable) return false;
                }
                return true;
            });
            setTratamientos(filtered);
        } catch (error) {
            console.error(error);
        }
    };

    const handleClienteInputChange = (val: string) => {
        setCliente(val);
        if (val.length > 1) {
            const filtered = clientesDb.filter(c => 
                `${c.nombre} ${c.apellido}`.toLowerCase().includes(val.toLowerCase()) ||
                c.telefono.includes(val)
            );
            setFilteredClientes(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSelectCliente = (c: Cliente) => {
        setCliente(`${c.nombre} ${c.apellido}`);
        setTelefono(c.telefono);
        setEmail(c.email || '');
        setShowSuggestions(false);
    };

    const handleTratamientoChange = async (id: string) => {
        setSelectedTratamientoId(id);
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

    const handleAddSub = (id: string) => {
        if (!id) return;
        const sub = subtratamientos.find(s => s.id === id);
        if (sub && !selectedSubs.find(s => s.id === id)) {
            const newSelected = [...selectedSubs, sub];
            setSelectedSubs(newSelected);
            updateTotals(newSelected);
        }
    };

    const handleRemoveSub = (id: string) => {
        const newSelected = selectedSubs.filter(s => s.id !== id);
        setSelectedSubs(newSelected);
        updateTotals(newSelected);
    };

    const updateTotals = (subs: Subtratamiento[]) => {
        const newTotal = subs.reduce((acc, s) => acc + s.precio, 0);
        setTotal(newTotal);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onSave) return;

        if (selectedSubs.length === 0) {
            alert("Selecciona al menos un sub-tratamiento");
            return;
        }

        const trat = tratamientos.find(t => t.id === selectedTratamientoId);
        if (!trat) return;

        const nameParts = cliente.trim().split(' ');
        const nombre = nameParts[0] || '';
        const apellido = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        const totalDuration = selectedSubs.reduce((acc, s) => acc + s.duracion_minutos, 0);
        const subNames = selectedSubs.map(s => s.nombre).join(', ');

        onSave({
            clienteAbreviado: cliente,
            nombre,
            apellido,
            whatsapp: telefono,
            email,
            tratamientoAbreviado: subNames,
            duracionMinutos: totalDuration,
            horaInicio: hora,
            boxId: initialBox || trat.boxId || 'box-1',
            fecha: initialFecha || new Date().toISOString().split('T')[0],
            sena,
            total,
            status,
            subIds: selectedSubs.map(s => s.id)
        });

        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editTurno ? "Editar Turno" : "Agendar Nuevo Turno"}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-2 overflow-visible">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Cliente</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    required
                                    placeholder="Nombre y Apellido"
                                    value={cliente}
                                    onChange={(e) => handleClienteInputChange(e.target.value)}
                                    className="pl-12 rounded-2xl bg-gray-50 border-none h-12 font-bold"
                                />
                            </div>
                            {showSuggestions && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
                                    {filteredClientes.map(c => (
                                        <div 
                                            key={c.id} 
                                            onClick={() => handleSelectCliente(c)}
                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">{c.nombre} {c.apellido}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">{c.telefono}</span>
                                            </div>
                                            <Tag className="w-3 h-3 text-gray-300" />
                                        </div>
                                    ))}
                                </div>
                            )}
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
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Categoría</label>
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
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Añadir Sub-item</label>
                            <select
                                disabled={!selectedTratamientoId || loading}
                                className="w-full h-12 rounded-2xl border-none bg-gray-50 px-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none disabled:opacity-50"
                                value=""
                                onChange={(e) => handleAddSub(e.target.value)}
                            >
                                <option value="">{loading ? "Cargando..." : "Seleccionar para sumar"}</option>
                                {subtratamientos.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre} (${s.precio})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Selected Subtratamientos labels */}
                    {selectedSubs.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            {selectedSubs.map(s => (
                                <div key={s.id} className="bg-black text-white px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2 group">
                                    <span>{s.nombre} ({s.duracion_minutos}m)</span>
                                    <X 
                                        className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors" 
                                        onClick={() => handleRemoveSub(s.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

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
                                    value={Math.max(0, total - sena)}
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
