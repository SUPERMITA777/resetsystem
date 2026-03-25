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
    whatsapp?: string;
    email?: string;
    sena?: number;
    total?: number;
    status?: 'PENDIENTE' | 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO';
    subIds?: string[];
    tratamientoId?: string;
    profesionalId?: string;
    profesionalNombre?: string;
    ajustePrecio?: number;
    motivoSaldo?: string;
    claseId?: string; // New
    claseInfo?: {    // New for intelligent agenda
        inscriptosCount: number;
        cupo: number;
    };
    valorCreditos?: number;
    clienteWhatsapp?: string;
    subtratamientosSnap?: Array<{
        id: string;
        nombre: string;
        precio: number;
        duracion: number;
    }>;
    metodoPagoSena?: 'EFECTIVO' | 'TRANSFERENCIA';
    metodoPagoSaldo?: 'EFECTIVO' | 'TRANSFERENCIA';
    pagoSaldo?: number;
    saldoPagado?: boolean;
    historialPagos?: Array<{
        monto: number;
        metodo: 'EFECTIVO' | 'TRANSFERENCIA';
        tipo: 'SEÑA' | 'SALDO';
        fecha: string;
        timestamp: number;
    }>;
}

interface TurnoCardProps {
    turno: TurnoData;
    disabled?: boolean;
    interval?: number; // minutos por celda
    onClick?: (e: React.MouseEvent) => void;
    onInscriptosClick?: (claseId: string) => void; // New
}

export function TurnoCard({ turno, disabled = false, interval, onClick, onInscriptosClick }: TurnoCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: turno.id,
        data: turno,
        disabled: disabled // Prop native de dnd-kit
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    // Base cell height is 20px (matching h-5 in AgendaGrid)
    const intervalToUse = interval || 60;
    const heightPercent = (turno.duracionMinutos / intervalToUse) * 100;

    const statusColors = {
        PENDIENTE: 'bg-amber-400',
        RESERVADO: 'bg-orange-500',
        CONFIRMADO: 'bg-emerald-500',
        COMPLETADO: 'bg-blue-500',
        CANCELADO: 'bg-red-500'
    };

    const status = (turno as any).status || 'RESERVADO';
    let bgColor = statusColors[status as keyof typeof statusColors] || 'bg-black';

    // Inteligencia de Clases: Naranja (incompleto), Verde (completo)
    const isClase = !!turno.claseId;
    if (isClase && turno.claseInfo) {
        const isFull = turno.claseInfo.inscriptosCount >= turno.claseInfo.cupo;
        bgColor = isFull ? 'bg-green-500' : 'bg-orange-500';
    }

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, height: `${heightPercent}%` }}
            onClick={onClick}
            {...listeners}
            {...attributes}
            className={`absolute left-0 right-0 mx-0.5 rounded-md px-1.5 py-1 text-[9px] text-white shadow-xl transition-all pointer-events-auto flex flex-col overflow-hidden
        ${disabled ? 'cursor-not-allowed opacity-60 bg-gray-300 grayscale' : `cursor-grab active:cursor-grabbing hover:brightness-110 ${bgColor}`}
        ${isDragging ? 'z-50 opacity-80 ring-2 ring-white scale-105' : 'z-10'}
        ${isClase ? 'border-l-4 border-white/30' : ''}
      `}
        >
            <div className="flex justify-between items-start w-full">
                <div className="font-black truncate leading-none uppercase tracking-tighter flex-1">
                    {isClase ? turno.tratamientoAbreviado : turno.clienteAbreviado}
                </div>
                {isClase && turno.claseInfo && (
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onInscriptosClick && turno.claseId) onInscriptosClick(turno.claseId);
                        }}
                        className="bg-white/20 hover:bg-white/40 px-1 rounded flex items-center gap-0.5 cursor-pointer transition-colors ml-1"
                        title="Ver inscriptos"
                    >
                        <span className="font-black">{turno.claseInfo.inscriptosCount}/{turno.claseInfo.cupo}</span>
                    </div>
                )}
            </div>
            {heightPercent >= 125 && !isClase && (
                <div className="truncate leading-tight mt-1 opacity-90 font-bold flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-white/50" />
                    {turno.tratamientoAbreviado}
                </div>
            )}
            {heightPercent >= 200 && turno.profesionalNombre && (
                <div className="truncate leading-tight mt-0.5 opacity-70 font-black flex items-center gap-1 italic">
                    @{turno.profesionalNombre.split(' ')[0]}
                </div>
            )}
        </div>
    );
}
