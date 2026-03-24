import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { clienteService, Cliente } from '@/lib/services/clienteService';
import { getUsersByTenant, UserProfile } from '@/lib/services/userService';
import { Clock, Tag, User, Phone, DollarSign, Activity, Calendar, UserPlus, MessageSquare, Bell, CreditCard, CheckCircle2 } from 'lucide-react';
import { TurnoData } from './TurnoCard';
import toast from 'react-hot-toast';

interface TurnoClaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (turno: any) => void;
    onDelete?: (turnoId: string) => void;
    editTurno: TurnoData | null;
    agendaConfig?: any;
}

export function TurnoClaseModal({ isOpen, onClose, onSave, onDelete, editTurno, agendaConfig }: TurnoClaseModalProps) {
    const [cliente, setCliente] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('09:00');
    const [sena, setSena] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [status, setStatus] = useState<'PENDIENTE' | 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO'>('RESERVADO');
    const [metodoPagoSena, setMetodoPagoSena] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
    const [metodoPagoSaldo, setMetodoPagoSaldo] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
    const [pagoSaldo, setPagoSaldo] = useState(0);
    const [saldoPagado, setSaldoPagado] = useState(false);
    const [historialPagos, setHistorialPagos] = useState<any[]>([]);
    
    const [profesionales, setProfesionales] = useState<UserProfile[]>([]);
    const [selectedProfesionalId, setSelectedProfesionalId] = useState('');
    const [clientData, setClientData] = useState<Cliente | null>(null);
    const [loadingClient, setLoadingClient] = useState(false);

    const currentTenant = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        if (isOpen && editTurno) {
            setCliente(editTurno.clienteAbreviado || '');
            setTelefono(editTurno.whatsapp || '');
            setEmail(editTurno.email || '');
            setHora(editTurno.horaInicio.substring(0, 5));
            setFecha(editTurno.fecha || '');
            setSena(editTurno.sena || 0);
            setTotal(editTurno.total || 0);
            setStatus(editTurno.status || 'RESERVADO');
            setMetodoPagoSena(editTurno.metodoPagoSena || 'EFECTIVO');
            setMetodoPagoSaldo(editTurno.metodoPagoSaldo || 'EFECTIVO');
            setPagoSaldo(editTurno.pagoSaldo || 0);
            setSaldoPagado(editTurno.saldoPagado || false);
            setHistorialPagos(editTurno.historialPagos || []);
            setSelectedProfesionalId(editTurno.profesionalId || '');
            
            loadProfesionales();
            if (editTurno.whatsapp) {
                fetchClientData(editTurno.whatsapp);
            }
        }
    }, [isOpen, editTurno]);

    const loadProfesionales = async () => {
        try {
            const users = await getUsersByTenant(currentTenant);
            setProfesionales(users.filter(u => u.role === 'staff' || u.role === 'salon_admin'));
        } catch (error) { console.error(error); }
    };

    const fetchClientData = async (phone: string) => {
        setLoadingClient(true);
        try {
            const data = await clienteService.getClienteByTelefono(currentTenant, phone);
            setClientData(data);
        } catch (error) { console.error(error); }
        finally { setLoadingClient(false); }
    };

    const handleDeductCredits = async () => {
        if (!clientData || !editTurno) return;
        const creditsToDeduct = 1; // Default or from class config if available

        if ((clientData.creditos || 0) < creditsToDeduct) {
            toast.error("Créditos insuficientes");
            return;
        }

        try {
            const loader = toast.loading("Descontando créditos...");
            await clienteService.deductCredits(currentTenant, clientData.id, creditsToDeduct);
            
            // Actualizar saldo pagado en el modal
            setSaldoPagado(true);
            setPagoSaldo(total - sena);
            setClientData(prev => prev ? { ...prev, creditos: (prev.creditos || 0) - creditsToDeduct } : null);
            
            toast.success("Créditos descontados", { id: loader });
        } catch (error) {
            toast.error("Error al descontar créditos");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onSave || !editTurno) return;

        const prof = profesionales.find(p => p.uid === selectedProfesionalId);

        onSave({
            ...editTurno,
            clienteAbreviado: cliente,
            whatsapp: telefono,
            email,
            horaInicio: hora,
            fecha,
            sena,
            total,
            status,
            profesionalId: selectedProfesionalId,
            profesionalNombre: prof ? prof.displayName || prof.email : '',
            metodoPagoSena,
            metodoPagoSaldo,
            pagoSaldo,
            saldoPagado,
            historialPagos
        });
        onClose();
    };

    const handleSendReminder = () => {
        if (!telefono) return;
        const message = `Hola! te recordamos tu clase el dia ${fecha} a las ${hora}. ¡Te esperamos!`;
        const waUrl = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Turno de Clase"
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6 py-2">
                {/* Header info con créditos */}
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="relative flex justify-between items-center">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black tracking-tighter uppercase">{cliente}</h3>
                            <div className="flex items-center gap-2 opacity-60 text-[10px] font-bold tracking-widest uppercase">
                                <Phone className="w-3 h-3" /> {telefono}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Créditos Disponibles</p>
                            <div className="flex items-center gap-2 justify-end">
                                <CreditCard className="w-5 h-5 text-emerald-400" />
                                <span className="text-3xl font-black text-emerald-400">
                                    {loadingClient ? "..." : (clientData?.creditos || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fecha y Hora</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1 group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full h-12 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-black/5" />
                            </div>
                            <div className="relative w-32 group">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="w-full h-12 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-black/5" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Estado de Asistencia</label>
                        <div className="relative group">
                            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                            <select 
                                value={status} 
                                onChange={e => setStatus(e.target.value as any)}
                                className="w-full h-12 pl-12 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-black/5 appearance-none"
                            >
                                <option value="RESERVADO">RESERVADO</option>
                                <option value="CONFIRMADO">CONFIRMADO</option>
                                <option value="COMPLETADO">COMPLETADO</option>
                                <option value="CANCELADO">CANCELADO</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Sección de Pago Express */}
                <div className="bg-gray-50 rounded-[2.5rem] p-6 border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Gestión de Pago</h4>
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
                            <DollarSign className="w-4 h-4" />
                            Total: ${total}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                            type="button"
                            onClick={handleDeductCredits}
                            disabled={!clientData || (clientData.creditos || 0) <= 0 || saldoPagado}
                            className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${saldoPagado ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-emerald-100 text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50/50 shadow-sm'}`}
                        >
                            <div className="flex items-center gap-2">
                                {saldoPagado ? <CheckCircle2 className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                <span className="font-black uppercase tracking-widest text-[10px]">Pagar con Créditos</span>
                            </div>
                            <span className="text-[9px] opacity-70 font-bold">-1 Crédito de la cuenta</span>
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                type="button"
                                onClick={() => { setMetodoPagoSaldo('EFECTIVO'); setSaldoPagado(true); setPagoSaldo(total-sena); }}
                                className={`h-16 rounded-2xl border-2 font-black transition-all flex flex-col items-center justify-center gap-1 ${metodoPagoSaldo === 'EFECTIVO' && saldoPagado ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-blue-50 text-blue-600 hover:border-blue-400'}`}
                            >
                                <span className="uppercase tracking-widest text-[10px]">Efectivo</span>
                                <span className="text-[9px] opacity-70">Total ${total}</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setMetodoPagoSaldo('TRANSFERENCIA'); setSaldoPagado(true); setPagoSaldo(total-sena); }}
                                className={`h-16 rounded-2xl border-2 font-black transition-all flex flex-col items-center justify-center gap-1 ${metodoPagoSaldo === 'TRANSFERENCIA' && saldoPagado ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-blue-50 text-blue-600 hover:border-blue-400'}`}
                            >
                                <span className="uppercase tracking-widest text-[10px]">Transf.</span>
                                <span className="text-[9px] opacity-70">CBU / Alias</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="flex gap-3">
                        <Button type="submit" className="flex-1 h-14 bg-black text-white hover:bg-gray-800 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95">
                            Guardar Cambios
                        </Button>
                        <button 
                            type="button" 
                            onClick={handleSendReminder}
                            className="px-6 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all flex items-center gap-2"
                        >
                            <Bell className="w-4 h-4" />
                            WhatsApp
                        </button>
                    </div>
                    <button type="button" onClick={onClose} className="w-full text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest py-1 transition-colors">
                        Cancelar sin guardar
                    </button>
                </div>
            </form>
        </Modal>
    );
}
