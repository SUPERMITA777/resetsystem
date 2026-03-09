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

interface AgendaGridProps {
    boxesCount: number;
    turnos: TurnoData[];
    onTurnoMove: (turnoId: string, newBoxId: string, newHoraInicio: string) => Promise<void>;
    config: {
        intervalo: 10 | 15 | 30 | 60;
        horario_inicio: string;
        horario_fin: string;
    };
    view: 'diaria' | 'semanal' | 'mensual';
    currentDate: Date;
}

export function AgendaGrid({ boxesCount = 7, turnos, onTurnoMove, config, view, currentDate }: AgendaGridProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const { isStaff, staffId } = useAuth();

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
            // over.id es de la forma "box-1-09:00"
            const [boxId, hora] = (over.id as string).split('-');
            const formattedHora = `${hora}:00`;

            const parsedBoxId = `box-${boxId}`;

            // Check if it really changed
            const currentTurno = turnos.find(t => t.id === active.id);
            if (currentTurno && (currentTurno.boxId !== parsedBoxId || currentTurno.horaInicio !== formattedHora)) {
                await onTurnoMove(active.id as string, parsedBoxId, formattedHora);
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
                                    {dayTurnos.slice(0, 3).map(t => (
                                        <div key={t.id} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md truncate font-medium border border-blue-100">
                                            {t.horaInicio.substring(0, 5)} {t.clienteAbreviado}
                                        </div>
                                    ))}
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
        ? boxes.map((box, i) => ({ id: box, label: `Box ${i + 1}`, date: currentDate }))
        : eachDayOfInterval({
            start: startOfWeek(currentDate, { weekStartsOn: 1 }),
            end: endOfWeek(currentDate, { weekStartsOn: 1 })
        }).map(day => ({
            id: format(day, 'yyyy-MM-dd'),
            label: format(day, 'EEEE d', { locale: es }),
            date: day
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
                <div className="flex border-b border-[var(--secondary)]">
                    <div className="w-16 shrink-0 border-r border-[var(--secondary)] p-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter bg-gray-50 flex items-center justify-center">
                        GMT-3
                    </div>
                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
                        {columns.map((col) => (
                            <div key={col.id} className={`p-4 border-r last:border-0 border-[var(--secondary)] text-center bg-[var(--secondary)]/10 flex flex-col items-center justify-center gap-0.5`}>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday(col.date) ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {col.label.split(' ')[0]}
                                </span>
                                <span className={`text-xl font-black ${isToday(col.date) ? 'text-blue-600' : 'text-gray-900'}`}>
                                    {col.label.split(' ')[1] || (columns.indexOf(col) + 1)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grilla principal */}
                <div className="flex-1 overflow-y-auto w-full relative group">
                    <div className="flex w-full min-h-full relative">
                        {/* Columna de Horas */}
                        <div className="w-16 shrink-0 flex flex-col border-r border-[var(--secondary)] bg-gray-50/50 sticky left-0 z-10 backdrop-blur-sm">
                            {HORAS.map(hora => (
                                <div key={hora} className="h-10 border-b border-gray-100 flex items-start justify-center pt-1 text-[10px] font-bold text-gray-400">
                                    {hora}
                                </div>
                            ))}
                        </div>

                        {/* Columnas de Datos */}
                        <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
                            <CurrentTimeIndicator config={config} HORAS={HORAS} />

                            {columns.map(col => (
                                <div key={col.id} className="flex flex-col border-r last:border-0 border-gray-100 bg-white/50">
                                    {HORAS.map(hora => {
                                        let turnosEnCelda = turnos.filter(t => {
                                            if (view === 'diaria') return t.boxId === col.id && t.horaInicio === hora;
                                            return t.fecha === col.id && t.horaInicio === hora;
                                        });

                                        return (
                                            <AgendaCell key={`${col.id}-${hora}`} boxId={view === 'diaria' ? col.id : 'box-1'} hora={hora}>
                                                <div className="h-10 w-full relative group/cell">
                                                    <div className="absolute inset-0 border-b border-gray-50 bg-transparent group-hover/cell:bg-gray-50/30 transition-colors pointer-events-none" />
                                                    {turnosEnCelda.map(turno => (
                                                        <TurnoCard
                                                            key={turno.id}
                                                            turno={turno}
                                                            disabled={isStaff && turno.profesionalId !== staffId}
                                                            interval={config.intervalo}
                                                        />
                                                    ))}
                                                </div>
                                            </AgendaCell>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
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
    const pixelPerMinute = 40 / config.intervalo; // h-10 = 40px
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
