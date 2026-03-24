import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface AgendaCellProps {
    boxId: string;
    hora: string; // HH:mm
    fecha: string; // yyyy-MM-dd
    children?: React.ReactNode;
    onClick?: () => void;
}

export function AgendaCell({ boxId, hora, fecha, children, onClick }: AgendaCellProps) {
    const id = `${fecha}|${boxId}|${hora}`;

    const { isOver, setNodeRef } = useDroppable({
        id: id,
        data: {
            boxId,
            hora,
            fecha
        }
    });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={`flex-1 border-b border-r border-gray-50 relative transition-colors cursor-pointer min-h-[20px]
        ${isOver ? 'bg-blue-50/50' : 'hover:bg-gray-50/80'}
      `}
        >
            <div className="relative w-full h-full">
                {children}
            </div>
        </div>
    );
}
