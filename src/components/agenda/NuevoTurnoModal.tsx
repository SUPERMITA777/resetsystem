import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { serviceManagement, Tratamiento, Subtratamiento } from '@/lib/services/serviceManagement';
import { clienteService, Cliente } from '@/lib/services/clienteService';
import { getUsersByTenant, UserProfile } from '@/lib/services/userService';
import { Clock, Tag, Box, User, Phone, DollarSign, Activity, X, Trash2, Calendar, Plus, UserPlus, MessageSquare, Bell } from 'lucide-react';
import { TurnoData } from './TurnoCard';
import { getTenant } from '@/lib/services/tenantService';
import toast from 'react-hot-toast';

interface NuevoTurnoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (turno: any) => void;
    onDelete?: (turnoId: string) => void;
    initialHora?: string;
    initialBox?: string;
    initialFecha?: string;
    initialTratamientoId?: string;
    editTurno?: TurnoData | null;
    agendaConfig?: any;
}

export function NuevoTurnoModal({ isOpen, onClose, onSave, onDelete, initialHora, initialBox, initialFecha, initialTratamientoId, editTurno, agendaConfig }: NuevoTurnoModalProps) {
    const [cliente, setCliente] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
    const [selectedTratamientoId, setSelectedTratamientoId] = useState('');
    const [subtratamientos, setSubtratamientos] = useState<Subtratamiento[]>([]);
    const [selectedSubs, setSelectedSubs] = useState<Subtratamiento[]>([]);
    const [fecha, setFecha] = useState(initialFecha || '');
    const [hora, setHora] = useState(initialHora || '09:00');
    const [sena, setSena] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [status, setStatus] = useState<'PENDIENTE' | 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO'>('RESERVADO');
    const [ajustePrecio, setAjustePrecio] = useState<number>(0);
    const [motivoSaldo, setMotivoSaldo] = useState('');
    const [metodoPagoSena, setMetodoPagoSena] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
    const [metodoPagoSaldo, setMetodoPagoSaldo] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
    const [pagoSaldo, setPagoSaldo] = useState(0);
    const [saldoPagado, setSaldoPagado] = useState(false);
    const [historialPagos, setHistorialPagos] = useState<any[]>([]);

    const [initialSena, setInitialSena] = useState(0);
    const [initialPagoSaldo, setInitialPagoSaldo] = useState(0);
    const [profesionales, setProfesionales] = useState<UserProfile[]>([]);
    const [selectedProfesionalId, setSelectedProfesionalId] = useState('');
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
            loadProfesionales();
            if (editTurno) {
                setCliente(editTurno.clienteAbreviado || '');
                setTelefono(editTurno.whatsapp || '');
                setEmail(editTurno.email || '');
                setHora(editTurno.horaInicio.substring(0, 5));
                setSena(editTurno.sena || 0);
                setTotal(editTurno.total || 0);
                setAjustePrecio(editTurno.ajustePrecio || 0);
                setMotivoSaldo(editTurno.motivoSaldo || '');
                setMetodoPagoSena(editTurno.metodoPagoSena || 'EFECTIVO');
                setMetodoPagoSaldo(editTurno.metodoPagoSaldo || 'EFECTIVO');
                setPagoSaldo(editTurno.pagoSaldo || 0);
                setSaldoPagado(editTurno.saldoPagado || false);
                setHistorialPagos(editTurno.historialPagos || []);
                setInitialSena(editTurno.sena || 0);
                setInitialPagoSaldo(editTurno.pagoSaldo || 0);
                setStatus(editTurno.status || 'RESERVADO');
                setFecha(editTurno.fecha || '');
                setSelectedTratamientoId(editTurno.tratamientoId || '');
                setSelectedProfesionalId(editTurno.profesionalId || '');
                if (editTurno.tratamientoId) {
                    loadSubAndSync(editTurno.tratamientoId, editTurno.subIds || []);
                }
            } else {
                setCliente('');
                setTelefono('');
                setEmail('');
                setFecha(initialFecha || '');
                setHora(initialHora || '09:00');
                setSena(0);
                setTotal(0);
                setAjustePrecio(0);
                setMotivoSaldo('');
                setMetodoPagoSena('EFECTIVO');
                setMetodoPagoSaldo('EFECTIVO');
                setPagoSaldo(0);
                setSaldoPagado(false);
                setHistorialPagos([]);
                setInitialSena(0);
                setInitialPagoSaldo(0);
                setSelectedSubs([]);
                setStatus('RESERVADO');
                if (initialTratamientoId) {
                    handleTratamientoChange(initialTratamientoId);
                } else {
                    setSelectedTratamientoId('');
                }
                setSelectedProfesionalId('');
            }
        }
    }, [isOpen, editTurno, initialHora, initialTratamientoId]);

    // Tecla ESC para cerrar modal sin guardar
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter') {
                if (document.activeElement?.tagName !== 'TEXTAREA') {
                    handleSubmit(e as any);
                }
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const getArgentinaTimeData = () => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('sv-SE', { // sv-SE gives yyyy-mm-dd
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });
        const parts = formatter.formatToParts(now);
        const getPart = (type: string) => parts.find(p => p.type === type)?.value;
        const fechaStr = `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
        
        return {
            fecha: fechaStr,
            timestamp: now.getTime()
        };
    };

    const loadProfesionales = async () => {
        try {
            const users = await getUsersByTenant(currentTenant);
            const staff = users.filter(u => u.role === 'staff' || u.role === 'salon_admin');
            setProfesionales(staff);
        } catch (error) {
            console.error(error);
        }
    };

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
            
            setTratamientos(data.filter(t => t.habilitado));
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
        setSelectedSubs([]);
        setTotal(0 + ajustePrecio);
        if (!id) return;

        setLoading(true);
        try {
            const data = await serviceManagement.getSubtratamientos(currentTenant, id);
            // Permitimos todos los sub-tratamientos según pedido del usuario
            setSubtratamientos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadSubAndSync = async (tratId: string, subIds: string[]) => {
        setLoading(true);
        try {
            const data = await serviceManagement.getSubtratamientos(currentTenant, tratId);
            setSubtratamientos(data);
            const selected = data.filter(s => subIds.includes(s.id));
            setSelectedSubs(selected);
            // Don't update total here if we already set it from editTurno.total
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
        const subTotal = subs.reduce((acc, s) => acc + s.precio, 0);
        setTotal(subTotal + ajustePrecio);
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
        
        const prof = profesionales.find(p => p.uid === selectedProfesionalId);

        // Snapshot de tratamientos
        const subtratamientosSnap = selectedSubs.map(s => ({
            id: s.id,
            nombre: s.nombre,
            precio: s.precio,
            duracion: s.duracion_minutos
        }));

        let newHistorial = [...historialPagos];
        const argData = getArgentinaTimeData();

        if (sena > initialSena) {
            newHistorial.push({
                monto: sena - initialSena,
                metodo: metodoPagoSena,
                tipo: 'SEÑA',
                fecha: argData.fecha,
                timestamp: argData.timestamp
            });
        }

        if (pagoSaldo > initialPagoSaldo) {
            newHistorial.push({
                monto: pagoSaldo - initialPagoSaldo,
                metodo: metodoPagoSaldo,
                tipo: 'SALDO',
                fecha: argData.fecha,
                timestamp: argData.timestamp
            });
        }

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
            fecha,
            sena,
            total,
            status,
            tratamientoId: selectedTratamientoId,
            subIds: selectedSubs.map(s => s.id),
            profesionalId: selectedProfesionalId,
            profesionalNombre: prof ? prof.displayName || prof.email : '',
            ajustePrecio,
            motivoSaldo: (status === 'COMPLETADO' && total - sena - pagoSaldo > 0) ? motivoSaldo : '',
            subtratamientosSnap,
            metodoPagoSena,
            metodoPagoSaldo,
            pagoSaldo,
            saldoPagado,
            historialPagos: newHistorial
        });

        onClose();
    };

    const handleSendReminder = async () => {
        if (!telefono) {
            toast.error("El cliente no tiene teléfono asignado");
            return;
        }

        let template = agendaConfig?.reminder_message;
        
        if (!template) {
            // Default template if none is configured
            template = "Hola! te recordamos que el turno del dia %fecha% a las %hora% para %tratamiento%. En caso de no poder asistir avisar con antelación mínima de 24 hs, de lo contrario se perderá la seña. La tolerancia es de 15 minutos. Dirección: VELES SARSFIELD 59, entre AVENIDA SAN MARTIN y 25 DE MAYO.";
        }

        const subNames = selectedSubs.map(s => s.nombre).join(', ');
        const trat = tratamientos.find(t => t.id === selectedTratamientoId);
        const fechaFormateada = fecha ? format(new Date(fecha + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es }) : '';
        
        const message = template
            .replace(/%fecha%/g, fechaFormateada)
            .replace(/%hora%/g, hora)
            .replace(/%tratamiento%/g, trat?.nombre || 'Tratamiento')
            .replace(/%subtratamiento%/g, subNames || '');

        const waUrl = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    const handleDelete = () => {
        if (editTurno && onDelete) {
            if (window.confirm("¿Estás seguro de que deseas eliminar este turno?")) {
                onDelete(editTurno.id);
                onClose();
            }
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={editTurno ? "Editar Turno" : "Agendar Nuevo Turno"}
            maxWidth="max-w-3xl"
            extraHeader={editTurno ? (
                <button 
                    type="button" 
                    onClick={handleDelete}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            ) : null}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-0 overflow-visible">
                <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Fecha</label>
                            <div className="relative group/field">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-focus-within/field:bg-black group-focus-within/field:text-white transition-all">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <input 
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    className="w-full h-11 pl-14 pr-4 bg-gray-50 border-none rounded-xl font-bold text-sm outline-none ring-2 ring-transparent focus:ring-black/5 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Hora</label>
                            <div className="relative group/field">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-focus-within/field:bg-black group-focus-within/field:text-white transition-all">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <input 
                                    type="time"
                                    value={hora}
                                    onChange={(e) => setHora(e.target.value)}
                                    className="w-full h-11 pl-14 pr-4 bg-gray-50 border-none rounded-xl font-bold text-sm outline-none ring-2 ring-transparent focus:ring-black/5 transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">WhatsApp Cliente</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Ej: 54911..."
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                        className="pl-12 rounded-2xl bg-gray-50 border-none h-12 font-bold"
                                    />
                                </div>
                                {telefono && (
                                    <button 
                                        type="button"
                                        onClick={() => window.open(`https://wa.me/${telefono.replace(/\D/g, '')}`, '_blank')}
                                        className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 shrink-0"
                                        title="Chatear con cliente"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Tratamiento</label>
                            <div className="relative group/field">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-focus-within/field:bg-black group-focus-within/field:text-white transition-all">
                                    <Tag className="w-4 h-4" />
                                </div>
                                <select 
                                    className="w-full h-11 pl-14 pr-4 bg-gray-50 border-none rounded-xl font-bold text-sm outline-none ring-2 ring-transparent focus:ring-black/5 transition-all appearance-none disabled:opacity-50"
                                    value={selectedTratamientoId}
                                    onChange={(e) => handleTratamientoChange(e.target.value)}
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {tratamientos.map(t => (
                                        <option key={t.id} value={t.id}>{t.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Añadir Sub-tratamiento</label>
                            <div className="relative group/field">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-focus-within/field:bg-black group-focus-within/field:text-white transition-all">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <select
                                    disabled={!selectedTratamientoId || loading}
                                    className="w-full h-11 pl-14 pr-4 bg-gray-50 border-none rounded-xl font-bold text-sm outline-none ring-2 ring-transparent focus:ring-black/5 transition-all appearance-none disabled:opacity-50 cursor-pointer"
                                    value=""
                                    onChange={(e) => handleAddSub(e.target.value)}
                                >
                                    <option value="">{loading ? "Cargando..." : "Seleccionar..."}</option>
                                    {subtratamientos.map(s => (
                                        <option key={s.id} value={s.id}>{s.nombre} (${s.precio})</option>
                                    ))}
                                </select>
                            </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Ajuste ($)</label>
                            <Input 
                                type="number"
                                value={ajustePrecio}
                                onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    setAjustePrecio(val);
                                    const subTotal = selectedSubs.reduce((acc, s) => acc + s.precio, 0);
                                    setTotal(subTotal + val);
                                }}
                                placeholder="+/-"
                                className="h-11 rounded-xl text-sm font-bold bg-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-2">Seña ($)</label>
                            <div className="flex flex-col gap-1">
                                <Input 
                                    type="number"
                                    value={sena}
                                    onChange={(e) => {
                                        const val = Number(e.target.value) || 0;
                                        setSena(val);
                                        if (val > 1 && status === 'RESERVADO') {
                                            setStatus('CONFIRMADO');
                                        }
                                    }}
                                    className="h-11 rounded-xl text-sm font-bold text-emerald-600 bg-white"
                                />
                                <div className="flex gap-1">
                                    <button 
                                        type="button"
                                        onClick={() => setMetodoPagoSena('EFECTIVO')}
                                        className={`flex-1 py-1 text-[9px] font-black rounded-lg transition-all ${metodoPagoSena === 'EFECTIVO' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-400 border border-gray-100'}`}
                                    >
                                        EFEC
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setMetodoPagoSena('TRANSFERENCIA')}
                                        className={`flex-1 py-1 text-[9px] font-black rounded-lg transition-all ${metodoPagoSena === 'TRANSFERENCIA' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-400 border border-gray-100'}`}
                                    >
                                        TRANSF
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between items-center pr-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-2">Abona Saldo ($)</label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={saldoPagado}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setSaldoPagado(checked);
                                            if (checked) setPagoSaldo(total - sena);
                                        }}
                                        className="w-3 h-3 rounded"
                                    />
                                    <span className="text-[8px] font-black text-gray-400 uppercase">Todo</span>
                                </label>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Input 
                                    type="number"
                                    value={pagoSaldo}
                                    onChange={(e) => {
                                        const val = Number(e.target.value) || 0;
                                        setPagoSaldo(val);
                                        setSaldoPagado(val > 0 && val === (total - sena));
                                    }}
                                    className="h-11 rounded-xl text-sm font-bold text-blue-600 bg-white"
                                />
                                <div className="flex gap-1">
                                    <button 
                                        type="button"
                                        onClick={() => setMetodoPagoSaldo('EFECTIVO')}
                                        className={`flex-1 py-1 text-[9px] font-black rounded-lg transition-all ${metodoPagoSaldo === 'EFECTIVO' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-400 border border-gray-100'}`}
                                    >
                                        EFEC
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setMetodoPagoSaldo('TRANSFERENCIA')}
                                        className={`flex-1 py-1 text-[9px] font-black rounded-lg transition-all ${metodoPagoSaldo === 'TRANSFERENCIA' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-400 border border-gray-100'}`}
                                    >
                                        TRANSF
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Saldo Final ($)</label>
                            <Input 
                                value={Math.max(0, total - sena - pagoSaldo)}
                                readOnly
                                className="h-11 rounded-xl text-sm font-black text-gray-600 bg-gray-100/50 pointer-events-none"
                            />
                        </div>
                    </div>

                    {status === 'COMPLETADO' && (total - sena - pagoSaldo > 0) && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                                <Bell className="w-3 h-3" />
                                Saldo Pendiente: Justificar Motivo
                            </p>
                            <textarea
                                value={motivoSaldo}
                                onChange={(e) => setMotivoSaldo(e.target.value)}
                                className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-orange-400 outline-none transition-all resize-none h-16"
                                placeholder="Ej: Se abona en la próxima sesión, Transferencia pendiente..."
                                required
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Estado</label>
                            <div className="relative group/field">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-focus-within/field:bg-black group-focus-within/field:text-white transition-all">
                                    <Activity className="w-4 h-4" />
                                </div>
                                <select 
                                    className="w-full h-11 pl-14 pr-4 bg-gray-50 border-none rounded-xl font-bold text-sm outline-none ring-2 ring-transparent focus:ring-black/5 transition-all appearance-none"
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

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Asignar Profesional</label>
                            <div className="relative group/field">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-focus-within/field:bg-black group-focus-within/field:text-white transition-all">
                                    <UserPlus className="w-4 h-4" />
                                </div>
                                <select 
                                    className="w-full h-11 pl-14 pr-4 bg-gray-50 border-none rounded-xl font-bold text-sm outline-none ring-2 ring-transparent focus:ring-black/5 transition-all appearance-none"
                                    value={selectedProfesionalId}
                                    onChange={(e) => setSelectedProfesionalId(e.target.value)}
                                >
                                    <option value="">Cualquiera / Sin asignar</option>
                                    {profesionales.map(p => (
                                        <option key={p.uid} value={p.uid}>{p.displayName || p.email}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="pt-2 pb-2 flex items-center justify-between border-t border-gray-100 mt-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Duración</p>
                            <p className="text-xs font-black text-blue-600">{selectedSubs.reduce((acc, s) => acc + s.duracion_minutos, 0)} min</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 rounded-lg">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total</p>
                            <p className="text-xs font-black text-emerald-600">${total}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <Button type="submit" className="flex-1 h-11 bg-black text-white hover:bg-gray-800 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95">
                            {editTurno ? "Guardar Cambios" : "Agendar Turno"}
                        </Button>
                        {editTurno && (
                            <button 
                                type="button" 
                                onClick={handleSendReminder}
                                className="px-4 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all flex items-center gap-2"
                            >
                                <Bell className="w-4 h-4" />
                                Recordatorio
                            </button>
                        )}
                    </div>
                    <button type="button" onClick={onClose} className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest py-1 transition-colors">
                        Cancelar
                    </button>
                </div>
            </form>
        </Modal>
    );
}
