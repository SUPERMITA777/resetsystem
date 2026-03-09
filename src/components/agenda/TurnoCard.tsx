import React from 'react';
import { useDraggable } from '@dnd-kit/core';

export interface TurnoData {
    id: string;
    clienteAbreviado: string;
    tratamientoAbreviado: string;
    duracionMinutos: number;
    boxId: string;
    fecha: string; // YYYY-MM-DD
    horaInicio: string; // HH:mm
    profesionalId?: string; // Para control de Staff
}

interface TurnoCardProps {
    turno: TurnoData;
    disabled?: boolean;
    interval?: number; // minutos por celda
}

export function TurnoCard({ turno, disabled = false, interval }: TurnoCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: turno.id,
        data: turno,
        disabled: disabled // Prop native de dnd-kit
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    // Base cell height is 20px (matching h-5 in AgendaGrid)
    const CELL_HEIGHT = 20;
    const intervalToUse = interval || 60;
    const heightPx = (turno.duracionMinutos / intervalToUse) * CELL_HEIGHT;

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, height: `${heightPx}px` }}
            {...listeners}
            {...attributes}
            className={`absolute left-0 right-0 mx-0.5 rounded-sm px-1.5 py-0.5 text-[9px] text-white shadow-sm transition-all
        ${disabled ? 'cursor-not-allowed opacity-60 bg-gray-400 grayscale' : 'cursor-grab active:cursor-grabbing hover:brightness-105 bg-[var(--primary)]'}
        ${isDragging ? 'z-50 opacity-80 ring-1 ring-[var(--primary)]' : 'z-10'}
      `}
        >
            <div className={`font-bold truncate leading-none ${disabled ? 'text-gray-100' : ''}`}>{turno.clienteAbreviado}</div>
            {heightPx >= 15 && <div className={`truncate leading-none mt-0.5 ${disabled ? 'text-gray-200' : 'opacity-80'}`}>{turno.tratamientoAbreviado}</div>}
        </div>
    );
}
