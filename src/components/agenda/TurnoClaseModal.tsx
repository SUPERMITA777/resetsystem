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
    editTurno: TurnoData | null;
    agendaConfig?: any;
}

export function TurnoClaseModal({ isOpen, onClose, onSave, editTurno }: TurnoClaseModalProps) {
    const [inscriptos, setInscriptos] = useState<TurnoData[]>([]);
    const [loading, setLoading] = useState(false);
    const [clase, setClase] = useState<Clase | null>(null);
    
    // Edit/Reschedule state
    const [editingTurno, setEditingTurno] = useState<TurnoData | null>(null);
    const [newFecha, setNewFecha] = useState('');
    const [newHora, setNewHora] = useState('');

    const currentTenant = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        if (isOpen && editTurno) {
            loadData();
        }
    }, [isOpen, editTurno]);

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
    };

    const confirmReschedule = async () => {
        if (!editingTurno) return;
        try {
            const loader = toast.loading("Moviendo alumno...");
            await updateTurnoPosicion(currentTenant, editingTurno.id, editingTurno.boxId, newHora, newFecha);
            toast.success("Alumno reprogramado correctamente", { id: loader });
            setEditingTurno(null);
            loadData(); // actualiza lista
            if (onSave) onSave({}); // disparar recarga de agenda
        } catch (error) {
            toast.error("Error al reprogramar");
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
                        <div className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Cupo</p>
                            <p className="text-xl font-black">{inscriptos.length} / {clase?.cupo || '?'}</p>
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

                {/* Sub-modal/State para Reprogramar */}
                {editingTurno && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative">
                            <h5 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-6">Reprogramar Alumno</h5>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{editingTurno.clienteAbreviado}</p>
                            
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
                                    <Button onClick={confirmReschedule} className="flex-1 bg-black text-white rounded-2xl h-12 font-black uppercase tracking-widest text-[10px]">Confirmar Cambio</Button>
                                    <button onClick={() => setEditingTurno(null)} className="flex-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black">Cerrar</button>
                                </div>
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
