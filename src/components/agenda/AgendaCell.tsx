import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface AgendaCellProps {
    boxId: string;
    hora: string; // HH:mm
    children?: React.ReactNode;
}

export function AgendaCell({ boxId, hora, children }: AgendaCellProps) {
    const id = `${boxId}-${hora}`;

    const { isOver, setNodeRef } = useDroppable({
        id: id,
        data: {
            boxId,
            hora
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={`border-b border-r border-gray-100 p-1 relative transition-colors h-[80px]
        ${isOver ? 'bg-[var(--secondary)]/50' : 'hover:bg-gray-50'}
      `}
        >
            {/* Contenedor relativo para posicionar los turnos absolutos */}
            <div className="relative w-full h-full">
                {children}
            </div>
        </div>
    );
}
