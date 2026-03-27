import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { clienteService, Cliente } from '@/lib/services/clienteService';
import { claseService, Clase } from '@/lib/services/claseService';
import { getInscriptosPorClaseYHorario, updateTurnoPosicion, TurnoDB } from '@/lib/services/agendaService';
import { Clock, User, Phone, MessageSquare, Edit2, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { TurnoData } from './TurnoCard';
import toast from 'react-hot-toast';

interface TurnoClaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (turno: any) => void;
    onRequestCredits?: (cliente: Cliente) => void;
    editTurno: TurnoData | null;
    agendaConfig?: any;
}

export function TurnoClaseModal({ isOpen, onClose, onSave, onRequestCredits, editTurno }: TurnoClaseModalProps) {
    const [inscriptos, setInscriptos] = useState<TurnoData[]>([]);
    const [loading, setLoading] = useState(false);
    const [clase, setClase] = useState<Clase | null>(null);
    
    // Edit/Reschedule state
    const [editingTurno, setEditingTurno] = useState<TurnoData | null>(null);
    const [newFecha, setNewFecha] = useState('');
    const [newHora, setNewHora] = useState('');
    const [selectedSession, setSelectedSession] = useState<any>(null);
    
    // Sesión editing state
    const [isEditingSession, setIsEditingSession] = useState(false);
    const [availableSessions, setAvailableSessions] = useState<Array<{claseNombre: string, fecha: string, hora: string, cupo: number, inscriptos: number, claseId: string, valorCreditos: number, horarioId: string}>>([]);

    const currentTenant = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        if (isOpen && editTurno) {
            loadData();
            loadAvailableSessions();
        }
    }, [isOpen, editTurno]);

    const loadAvailableSessions = async () => {
        try {
            const clases = await claseService.getClases(currentTenant);
            const sessions: any[] = [];
            clases.forEach(c => {
                if (c.status === 'active' && c.horarios) {
                    c.horarios.forEach(h => {
                        sessions.push({
                            claseNombre: c.nombre,
                            claseId: c.id,
                            horarioId: h.id,
                            fecha: h.fecha,
                            hora: h.hora,
                            cupo: c.cupo,
                            inscriptos: h.inscriptosCount || 0,
                            valorCreditos: c.valorCreditos || 1
                        });
                    });
                }
            });
            // Sort by date and time
            sessions.sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
            setAvailableSessions(sessions);
        } catch (error) {
            console.error("Error loading sessions:", error);
        }
    };

    const loadData = async () => {
        if (!editTurno?.claseId) return;
        setLoading(true);
        try {
            const [alumnos, claseData] = await Promise.all([
                getInscriptosPorClaseYHorario(currentTenant, editTurno.claseId, editTurno.fecha, editTurno.horaInicio),
                claseService.getClaseById(currentTenant, editTurno.claseId)
            ]);
            setInscriptos(alumnos as any[]);
            setClase(claseData);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar alumnos");
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsApp = (alumno: TurnoData) => {
        const telefono = alumno.whatsapp || alumno.email; // Fallback to email if phone missing/named differently
        if (!telefono) return;
        const message = `Hola ${alumno.clienteAbreviado}, te recordamos tu clase de ${clase?.nombre} el día ${editTurno?.fecha} a las ${editTurno?.horaInicio}. ¡Te esperamos!`;
        const waUrl = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    const startReschedule = (alumno: TurnoData) => {
        setEditingTurno(alumno);
        setNewFecha(alumno.fecha);
        setNewHora(alumno.horaInicio);
        setSelectedSession(null);
    };

    const confirmReschedule = async () => {
        if (!editingTurno || !selectedSession) {
            toast.error("Por favor selecciona una clase");
            return;
        }

        try {
            const loader = toast.loading("Procesando reprogramación...");
            
            // 1. Verificar créditos si hay diferencia
            const currentCost = editingTurno.valorCreditos || 1;
            const newCost = selectedSession.valorCreditos || 1;
            const diff = newCost - currentCost;

            if (diff > 0) {
                const cliente = await clienteService.getClienteByTelefono(currentTenant, editingTurno.whatsapp || editingTurno.clienteWhatsapp || "");
                if (!cliente) {
                    toast.error("No se encontró el perfil del cliente para validar créditos", { id: loader });
                    return;
                }

                if ((cliente.creditos || 0) < diff) {
                    toast.error(`Créditos insuficientes. El cliente necesita ${diff} créditos adicionales.`, { id: loader });
                    if (onRequestCredits) onRequestCredits(cliente);
                    return;
                }

                // Descontar la diferencia
                await clienteService.deductCredits(currentTenant, cliente.id, diff);
                toast.success(`Se descontaron ${diff} créditos por diferencia de valor de clase`);
            }

            // 2. Mover el turno
            await updateTurnoPosicion(currentTenant, editingTurno.id, editingTurno.boxId, selectedSession.hora, selectedSession.fecha);
            
            // 3. Actualizar contadores de inscritos
            // Decrementar en la clase vieja (si era una clase)
            if (clase) {
                const oldHorario = clase.horarios?.find(h => h.fecha === editingTurno.fecha && h.hora === editingTurno.horaInicio);
                if (oldHorario) {
                    await claseService.incrementInscriptos(currentTenant, clase.id, oldHorario.id, -1);
                }
            }

            // Incrementar en la nueva sesión
            await claseService.incrementInscriptos(currentTenant, selectedSession.claseId, selectedSession.horarioId, 1);
            
            toast.success("Alumno reprogramado correctamente", { id: loader });
            setEditingTurno(null);
            loadData(); // actualiza lista
            if (onSave) onSave({}); // disparar recarga de agenda
        } catch (error) {
            console.error(error);
            toast.error("Error al reprogramar");
        }
    };

    const handleRescheduleSession = async () => {
        if (!clase || !editTurno) return;
        try {
            const loader = toast.loading("Reprogramando sesión de clase...");
            await claseService.rescheduleSession(currentTenant, clase.id, editTurno.fecha, editTurno.horaInicio, newFecha, newHora);
            toast.success("Sesión reprogramada correctamente", { id: loader });
            setIsEditingSession(false);
            if (onSave) onSave({});
            onClose(); // Cerrar porque la sesión ya no es la misma
        } catch (error) {
            toast.error("Error al reprogramar sesión");
        }
    };

    if (!editTurno) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Turno de Clase"
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6 py-2">
                {/* Header info */}
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="relative flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">{clase?.nombre || 'Clase'}</h3>
                            <div className="flex items-center gap-3 mt-2 opacity-90 text-[10px] font-black uppercase tracking-[0.2em]">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {editTurno.fecha}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {editTurno.horaInicio}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            <div className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Cupo</p>
                                <p className="text-xl font-black">{inscriptos.length} / {clase?.cupo || '?'}</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsEditingSession(true);
                                    setNewFecha(editTurno.fecha);
                                    setNewHora(editTurno.horaInicio);
                                }}
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-xl transition-all"
                            >
                                <Edit2 className="w-3 h-3" /> Editar Sesión
                            </button>
                        </div>
                    </div>
                </div>

                {/* Listado de Alumnos */}
                <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Alumnos Inscriptos</h4>
                    
                    {loading ? (
                        <div className="py-10 text-center animate-pulse text-gray-300 font-black uppercase tracking-widest text-xs">Cargando lista...</div>
                    ) : inscriptos.length === 0 ? (
                        <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 font-bold uppercase tracking-widest text-xs">No hay alumnos inscritos</div>
                    ) : (
                        <div className="grid gap-2">
                            {inscriptos.map((alumno) => (
                                <div key={alumno.id} className="group bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/5 transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xl text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
                                                    {alumno.clienteAbreviado.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg leading-none">{alumno.clienteAbreviado}</h3>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${ (alumno.pagoSaldo || 0) <= 0 ? ( (alumno.valorCreditos || 1) > 1 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600' ) : 'bg-emerald-50 text-emerald-600'}`}>
                                                            {alumno.valorCreditos || 1} Créditos
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Phone className="w-3 h-3" /> {alumno.clienteWhatsapp || "-"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleWhatsApp(alumno)}
                                            className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                                            title="Enviar Recordatorio"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => startReschedule(alumno)}
                                            className="p-3 bg-gray-50 text-gray-400 hover:bg-black hover:text-white rounded-xl transition-all shadow-sm"
                                            title="Reprogramar (Mover)"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sub-modal para Reprogramar Sesión COMPLETA */}
                {isEditingSession && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative">
                            <h5 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-2">Reprogramar Sesión</h5>
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-6">Se moverán todos los alumnos inscritos</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nueva Fecha</label>
                                    <input type="date" value={newFecha} onChange={e => setNewFecha(e.target.value)} className="w-full h-12 px-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nueva Hora</label>
                                    <input type="time" value={newHora} onChange={e => setNewHora(e.target.value)} className="w-full h-12 px-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
                                </div>
                                
                                <div className="flex gap-2 pt-4">
                                    <Button onClick={handleRescheduleSession} className="flex-1 bg-black text-white rounded-2xl h-12 font-black uppercase tracking-widest text-[10px]">Guardar Cambios</Button>
                                    <button onClick={() => setIsEditingSession(false)} className="flex-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black">Cerrar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sub-modal/State para Reprogramar Alumno INDIVIDUAL */}
                {editingTurno && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative flex flex-col max-h-[90vh]">
                            <h5 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-1">Reprogramar Alumno</h5>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">{editingTurno.clienteAbreviado}</p>
                            
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                                <h6 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Seleccionar Clase y Horario</h6>
                                <div className="grid gap-2">
                                    {availableSessions
                                        .filter(s => s.claseId === editTurno.claseId) // Solo sesiones del mismo tipo de clase (o quitar este filtro si se permite cambiar de tipo)
                                        .map((s, idx) => {
                                            const isSelected = selectedSession?.claseId === s.claseId && selectedSession?.fecha === s.fecha && selectedSession?.hora === s.hora;
                                            const isFull = s.inscriptos >= s.cupo;
                                            const diff = s.valorCreditos - (editingTurno.valorCreditos || 1);
                                            
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        if (!isFull) {
                                                            setSelectedSession(s);
                                                        }
                                                    }}
                                                    className={`w-full p-4 rounded-2xl border transition-all text-left flex justify-between items-center ${
                                                        isSelected 
                                                            ? 'border-orange-500 bg-orange-50' 
                                                            : isFull 
                                                                ? 'opacity-50 grayscale cursor-not-allowed border-gray-100' 
                                                                : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                                                    }`}
                                                >
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-tight text-gray-900">{format(new Date(s.fecha + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> {s.hora}</span>
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${diff > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                                {diff > 0 ? `+${diff} PTR` : diff < 0 ? `${diff} PTR` : 'Mismo valor'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${isFull ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {s.inscriptos}/{s.cupo}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                            
                            <div className="flex gap-2 pt-6">
                                <Button 
                                    onClick={confirmReschedule} 
                                    disabled={!selectedSession}
                                    className="flex-1 bg-black text-white rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
                                >
                                    Confirmar Cambio
                                </Button>
                                <button onClick={() => setEditingTurno(null)} className="flex-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black">Cerrar</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-4 flex justify-end">
                    <button onClick={onClose} className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest py-1 transition-colors">
                        Cerrar Ventana
                    </button>
                </div>
            </div>
        </Modal>
    );
}
