import React, { useState } from 'react';
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
}

const HORAS = Array.from({ length: 12 }).map((_, i) => {
    const h = i + 9;
    return `${h.toString().padStart(2, '0')}:00`;
});

export function AgendaGrid({ boxesCount = 7, turnos, onTurnoMove }: AgendaGridProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const { isStaff, staffId } = useAuth();

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

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
        >
            <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-[var(--secondary)] overflow-hidden">
                {/* Cabecera de Boxes */}
                <div className="flex border-b border-[var(--secondary)]">
                    <div className="w-16 shrink-0 border-r border-[var(--secondary)] p-3 text-center text-sm font-semibold text-gray-500 bg-gray-50">
                        Hora
                    </div>
                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${boxesCount}, minmax(0, 1fr))` }}>
                        {boxes.map((box, idx) => (
                            <div key={box} className="p-3 border-r last:border-0 border-[var(--secondary)] text-center text-sm font-semibold text-[var(--foreground)] bg-[var(--secondary)]/30">
                                Box {idx + 1}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grilla principal */}
                <div className="flex-1 overflow-y-auto w-full relative">
                    <div className="flex w-full">
                        {/* Columna de Horas */}
                        <div className="w-16 shrink-0 flex flex-col border-r border-[var(--secondary)] bg-gray-50">
                            {HORAS.map(hora => (
                                <div key={hora} className="h-[80px] border-b border-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                                    {hora}
                                </div>
                            ))}
                        </div>

                        {/* Columnas de Boxes */}
                        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${boxesCount}, minmax(0, 1fr))` }}>
                            {boxes.map(box => (
                                <div key={box} className="flex flex-col border-r last:border-0 border-[var(--secondary)]">
                                    {HORAS.map(hora => {
                                        let turnosEnCelda = turnos.filter(t => t.boxId === box && t.horaInicio === hora);

                                        // Si es staff, solo ve y edita un turno si le pertenece a él. 
                                        // De lo contrario puede verlo pero bloqueado (o en un futuro "ocupado")

                                        return (
                                            <AgendaCell key={`${box}-${hora}`} boxId={box} hora={hora}>
                                                {turnosEnCelda.map(turno => (
                                                    <TurnoCard
                                                        key={turno.id}
                                                        turno={turno}
                                                        disabled={isStaff && turno.profesionalId !== staffId}
                                                    />
                                                ))}
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
                    <TurnoCard turno={activeTurno} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
