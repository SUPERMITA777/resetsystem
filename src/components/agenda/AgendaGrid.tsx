import React, { useState } from 'react';
import { format, addMinutes, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    DndContext,
    DragEndEvent,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { AgendaCell } from './AgendaCell';
import { TurnoCard, TurnoData } from './TurnoCard';
import { useAuth } from '../auth/AuthProvider';
import { Pencil } from 'lucide-react';
interface AgendaGridProps {
    boxesCount: number;
    turnos: TurnoData[];
    onTurnoMove: (turnoId: string, newBoxId: string, newHoraInicio: string, newFecha: string) => Promise<void>;
    config: {
        intervalo: 10 | 15 | 30 | 60;
        horario_inicio: string;
        horario_fin: string;
    };
    view: 'diaria' | 'semanal' | 'mensual';
    currentDate: Date;
    onCellClick: (date: string, boxId: string, hora: string) => void;
    onTurnoClick: (turno: TurnoData) => void;
    onInscriptosClick?: (claseId: string) => void;
    boxNames?: Record<string, string>;
    onBoxNameChange?: (boxId: string, name: string) => void;
}

export function AgendaGrid({ boxesCount = 7, turnos, onTurnoMove, config, view, currentDate, onCellClick, onTurnoClick, onInscriptosClick, boxNames = {}, onBoxNameChange }: AgendaGridProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [localTurnos, setLocalTurnos] = useState<TurnoData[]>(turnos);
    const { isStaff, staffId } = useAuth();
    const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    // Sync local state with props
    React.useEffect(() => {
        setLocalTurnos(turnos);
    }, [turnos]);

    // Generar horas dinámicamente según configuración
    const generateHoras = () => {
        const horas: string[] = [];
        const [startH, startM] = config.horario_inicio.split(':').map(Number);
        const [endH, endM] = config.horario_fin.split(':').map(Number);

        let current = new Date();
        current.setHours(startH, startM, 0, 0);

        const end = new Date();
        end.setHours(endH, endM, 0, 0);

        while (current <= end) {
            horas.push(format(current, 'HH:mm'));
            current = addMinutes(current, config.intervalo);
        }
        return horas;
    };

    const HORAS = generateHoras();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px of movement required before drag starts
            },
        })
    );

    const boxes = Array.from({ length: boxesCount }).map((_, i) => `box-${i + 1}`);

    const handleDragStart = (event: any) => {
        const turnoToDrag = turnos.find(t => t.id === event.active.id);

        // Bloquear Drag si es Empleado y el turno no es suyo
        if (isStaff && turnoToDrag?.profesionalId !== staffId) {
            return;
        }

        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            // over.id es de la forma "yyyy-MM-dd|box-1|09:00"
            const [fecha, boxId, hora] = (over.id as string).split('|');
            
            // Check if it really changed
            const currentTurno = localTurnos.find(t => t.id === active.id);
            if (currentTurno && (currentTurno.boxId !== boxId || currentTurno.horaInicio !== hora || currentTurno.fecha !== fecha)) {
                // Optimistic update
                setLocalTurnos(prev => prev.map(t => 
                    t.id === active.id as string ? { ...t, boxId, horaInicio: hora, fecha } : t
                ));
                await onTurnoMove(active.id as string, boxId, hora, fecha);
            }
        }
    };

    const activeTurno = activeId ? turnos.find(t => t.id === activeId) : null;

    if (view === 'mensual') {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start, end });

        return (
            <div className="flex flex-col h-full bg-white p-4 overflow-y-auto">
                <div className="grid grid-cols-7 border-b border-gray-100 mb-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                        <div key={d} className="p-2 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 grid-rows-5 flex-1 min-h-[500px] border-l border-t border-gray-100">
                    {days.map(day => {
                        const dayTurnos = turnos.filter(t => t.fecha === format(day, 'yyyy-MM-dd'));
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                        return (
                            <div
                                key={day.toString()}
                                className={`border-r border-b border-gray-100 p-2 min-h-[100px] flex flex-col gap-1 transition-colors ${!isCurrentMonth ? 'bg-gray-50/50' : 'hover:bg-gray-50/30'}`}
                            >
                                <span className={`text-xs font-bold ${isToday(day) ? 'bg-black text-white w-6 h-6 flex items-center justify-center rounded-full' : isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}`}>
                                    {format(day, 'd')}
                                </span>
                                <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                                    {dayTurnos.slice(0, 3).map(t => {
                                        const statusColors = {
                                            PENDIENTE: 'bg-amber-50 text-amber-700 border-amber-200',
                                            RESERVADO: 'bg-orange-50 text-orange-700 border-orange-200',
                                            CONFIRMADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                            COMPLETADO: 'bg-blue-50 text-blue-700 border-blue-200',
                                            CANCELADO: 'bg-red-50 text-red-700 border-red-200'
                                        };
                                        let colorClass = statusColors[t.status as keyof typeof statusColors] || statusColors.RESERVADO;
                                        
                                        if (t.claseId && t.claseInfo) {
                                            const isFull = t.claseInfo.inscriptosCount >= t.claseInfo.cupo;
                                            colorClass = isFull 
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                                : 'bg-orange-100 text-orange-700 border-orange-200';
                                        }
                                        
                                        return (
                                            <div 
                                                key={t.id} 
                                                onClick={() => onTurnoClick(t)}
                                                className={`text-[9px] px-1.5 py-0.5 rounded-md truncate font-medium border cursor-pointer transition-colors ${colorClass}`}
                                            >
                                                {t.horaInicio.substring(0, 5)} {t.clienteAbreviado}
                                            </div>
                                        );
                                    })}
                                    {dayTurnos.length > 3 && (
                                        <span className="text-[9px] text-gray-400 font-bold ml-1">+{dayTurnos.length - 3} más</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Weekly or Daily view setup
    const columns = view === 'diaria'
        ? boxes.map((box, i) => ({
            id: box,
            label: boxNames[box] || `Box ${i + 1}`,
            defaultLabel: `Box ${i + 1}`,
            date: currentDate,
            isBox: true
          }))
        : eachDayOfInterval({
            start: startOfWeek(currentDate, { weekStartsOn: 1 }),
            end: endOfWeek(currentDate, { weekStartsOn: 1 })
        }).map(day => ({
            id: format(day, 'yyyy-MM-dd'),
            label: format(day, 'EEEE d', { locale: es }),
            defaultLabel: format(day, 'EEEE d', { locale: es }),
            date: day,
            isBox: false
        }));

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
        >
            <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-[var(--secondary)] overflow-hidden">
                {/* Cabecera */}
                <div className="flex border-b border-gray-100 bg-gray-50/50 sticky top-0 z-30">
                    <div className="w-20 shrink-0 border-r border-gray-100 p-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-tighter flex items-center justify-center bg-gray-50">
                        GMT-3
                    </div>
                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
                        {columns.map((col) => (
                            <div
                                key={col.id}
                                className={`p-3 border-r last:border-0 border-gray-100 text-center flex flex-col items-center justify-center gap-1 min-w-0 ${col.isBox ? 'cursor-pointer group/boxhdr' : ''}`}
                                onDoubleClick={() => {
                                    if (col.isBox && onBoxNameChange) {
                                        setEditingBoxId(col.id);
                                        setEditingName(col.label);
                                    }
                                }}
                            >
                                {editingBoxId === col.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onBlur={() => {
                                            if (onBoxNameChange && editingName.trim()) {
                                                onBoxNameChange(col.id, editingName.trim());
                                            }
                                            setEditingBoxId(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (onBoxNameChange && editingName.trim()) {
                                                    onBoxNameChange(col.id, editingName.trim());
                                                }
                                                setEditingBoxId(null);
                                            }
                                            if (e.key === 'Escape') setEditingBoxId(null);
                                        }}
                                        autoFocus
                                        className="w-full text-center text-sm font-black uppercase tracking-tight bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                ) : (
                                    <>
                                        <span className={`text-[10px] font-black uppercase tracking-widest truncate w-full ${isToday(col.date) ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {col.label.split(' ')[0]}
                                        </span>
                                        <span className={`text-lg font-black leading-none ${isToday(col.date) ? 'text-blue-600' : 'text-gray-900'}`}>
                                            {col.label.split(' ').slice(1).join(' ') || (columns.indexOf(col) + 1)}
                                        </span>
                                        {col.isBox && (
                                            <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover/boxhdr:opacity-100 transition-opacity" />
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Spacer for scrollbar alignment if needed */}
                    <div className="w-4 shrink-0 bg-gray-50/50" />
                </div>

                {/* Grilla principal */}
                <div className="flex-1 overflow-y-auto w-full relative custom-scrollbar">
                    <div className="flex w-full min-h-full">
                        {/* Columna de Horas */}
                        <div className="w-20 shrink-0 flex flex-col border-r border-gray-100 bg-gray-50/30 sticky left-0 z-20">
                            {HORAS.map(hora => (
                                <div key={hora} className="flex-1 border-b border-gray-50 flex items-center justify-center text-[9px] font-bold text-gray-400 bg-gray-50/50 min-h-[32px]">
                                    {hora}
                                </div>
                            ))}
                        </div>

                        {/* Columnas de Datos */}
                        <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
                            <CurrentTimeIndicator config={config} HORAS={HORAS} />

                            {columns.map(col => (
                                <div key={col.id} className="flex flex-col flex-1 border-r last:border-0 border-gray-100">
                                    {HORAS.map(hora => {
                                        let turnosEnCelda = turnos.filter(t => {
                                            const tHora = (t.horaInicio || '').substring(0, 5);
                                            if (view === 'diaria') return t.boxId === col.id && tHora === hora;
                                            return t.fecha === col.id && tHora === hora;
                                        });

                                        return (
                                            <AgendaCell
                                                key={`${col.id}-${hora}`}
                                                boxId={view === 'diaria' ? col.id : 'box-1'}
                                                hora={hora}
                                                fecha={format(col.date, 'yyyy-MM-dd')}
                                                onClick={() => onCellClick(format(col.date, 'yyyy-MM-dd'), view === 'diaria' ? col.id : 'box-1', hora)}
                                            >
                                                <div className="h-8 w-full relative group/cell">
                                                    {turnosEnCelda.map(turno => (
                                                        <TurnoCard
                                                            key={turno.id}
                                                            turno={turno}
                                                            disabled={isStaff && turno.profesionalId !== staffId}
                                                            interval={config.intervalo}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onTurnoClick(turno);
                                                            }}
                                                            onInscriptosClick={onInscriptosClick}
                                                        />
                                                    ))}
                                                </div>
                                            </AgendaCell>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                        {/* Right spacer to match header scrollbar spacer */}
                        <div className="w-4 shrink-0" />
                    </div>
                </div>
            </div>

            <DragOverlay dropAnimation={null}>
                {activeTurno ? (
                    <TurnoCard turno={activeTurno} interval={config.intervalo} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function CurrentTimeIndicator({ config, HORAS }: { config: any, HORAS: string[] }) {
    const [now, setNow] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const [startH, startM] = config.horario_inicio.split(':').map(Number);
    const [endH, endM] = config.horario_fin.split(':').map(Number);

    const currentH = now.getHours();
    const currentM = now.getMinutes();

    // Si no estamos en el horario de la agenda, no mostrar
    if (currentH < startH || currentH > endH) return null;
    if (currentH === endH && currentM > 0) return null;

    const minutesSinceStart = (currentH - startH) * 60 + (currentM - startM);
    const pixelPerMinute = 32 / config.intervalo; // h-8 = 32px
    const top = minutesSinceStart * pixelPerMinute;

    return (
        <div
            className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
            style={{ top: `${top}px` }}
        >
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm -ml-1.25" />
            <div className="flex-1 h-0.5 bg-red-500" />
        </div>
    );
}
