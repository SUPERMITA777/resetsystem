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
    whatsapp?: string;
    email?: string;
    sena?: number;
    total?: number;
    status?: 'PENDIENTE' | 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO';
    subIds?: string[];
    tratamientoId?: string;
}

interface TurnoCardProps {
    turno: TurnoData;
    disabled?: boolean;
    interval?: number; // minutos por celda
    onClick?: (e: React.MouseEvent) => void;
}

export function TurnoCard({ turno, disabled = false, interval, onClick }: TurnoCardProps) {
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

    const statusColors = {
        RESERVADO: 'bg-blue-500',
        CONFIRMADO: 'bg-emerald-500',
        COMPLETADO: 'bg-gray-400',
        CANCELADO: 'bg-red-500'
    };

    const status = (turno as any).status || 'RESERVADO';
    const bgColor = statusColors[status as keyof typeof statusColors] || 'bg-black';

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, height: `${heightPx}px` }}
            onClick={onClick}
            {...listeners}
            {...attributes}
            className={`absolute left-0 right-0 mx-0.5 rounded-md px-1.5 py-1 text-[9px] text-white shadow-xl transition-all pointer-events-auto flex flex-col overflow-hidden
        ${disabled ? 'cursor-not-allowed opacity-60 bg-gray-300 grayscale' : `cursor-grab active:cursor-grabbing hover:brightness-110 ${bgColor}`}
        ${isDragging ? 'z-50 opacity-80 ring-2 ring-white scale-105' : 'z-10'}
      `}
        >
            <div className="font-black truncate leading-none uppercase tracking-tighter">{turno.clienteAbreviado}</div>
            {heightPx >= 25 && (
                <div className="truncate leading-tight mt-1 opacity-90 font-bold flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-white/50" />
                    {turno.tratamientoAbreviado}
                </div>
            )}
        </div>
    );
}
