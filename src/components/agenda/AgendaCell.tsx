import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface AgendaCellProps {
    boxId: string;
    hora: string; // HH:mm
    children?: React.ReactNode;
    onClick?: () => void;
}

export function AgendaCell({ boxId, hora, children, onClick }: AgendaCellProps) {
    const id = `${boxId}|${hora}`;

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
            onClick={onClick}
            className={`h-5 border-b border-r border-gray-50 relative transition-colors cursor-pointer
        ${isOver ? 'bg-blue-50/50' : 'hover:bg-gray-50/80'}
      `}
        >
            <div className="relative w-full h-full pointer-events-none">
                {children}
            </div>
        </div>
    );
}
