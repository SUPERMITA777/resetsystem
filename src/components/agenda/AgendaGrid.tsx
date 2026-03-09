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

interface AgendaGridProps {
    boxesCount: number;
}

// Datos de mock para probar el drag and drop
const initialTurnos: TurnoData[] = [
    { id: 't1', clienteAbreviado: 'Ana G.', tratamientoAbreviado: 'Dep. Láser Rostro', duracionMinutos: 30, boxId: 'box-1', horaInicio: '09:00' },
    { id: 't2', clienteAbreviado: 'Carlos M.', tratamientoAbreviado: 'Masaje Descontract.', duracionMinutos: 60, boxId: 'box-2', horaInicio: '10:00' },
    { id: 't3', clienteAbreviado: 'Lucía P.', tratamientoAbreviado: 'Limpieza Facial', duracionMinutos: 45, boxId: 'box-1', horaInicio: '11:00' }
];

const HORAS = Array.from({ length: 12 }).map((_, i) => {
    const h = i + 9;
    return `${h.toString().padStart(2, '0')}:00`;
});

export function AgendaGrid({ boxesCount = 7 }: AgendaGridProps) {
    const [turnos, setTurnos] = useState<TurnoData[]>(initialTurnos);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px of movement required before drag starts
            },
        })
    );

    const boxes = Array.from({ length: boxesCount }).map((_, i) => `box-${i + 1}`);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            // over.id es de la forma "box-1-09:00"
            const [boxId, hora] = (over.id as string).split('-');
            const formattedHora = `${hora}:00`;

            setTurnos((items) =>
                items.map(t => t.id === active.id
                    ? { ...t, boxId: `box-${boxId}`, horaInicio: formattedHora }
                    : t
                )
            );
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
                                        const turnosEnCelda = turnos.filter(t => t.boxId === box && t.horaInicio === hora);
                                        return (
                                            <AgendaCell key={`${box}-${hora}`} boxId={box} hora={hora}>
                                                {turnosEnCelda.map(turno => (
                                                    <TurnoCard key={turno.id} turno={turno} />
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
