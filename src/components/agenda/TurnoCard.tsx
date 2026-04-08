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
    carrito?: Array<{
        productoId: string;
        nombre: string;
        marca?: string;
        precio: number;
        cantidad: number;
    }>;
    subtotalProductos?: number;
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
        CANCELADO: 'bg-red-100 text-red-800 border-red-200',
        PENDIENTE: 'bg-orange-100 text-orange-800 border-orange-200',
        COMPLETADO: 'bg-green-100 text-green-800 border-green-200',
        CONFIRMADO: 'bg-sky-100 text-sky-800 border-sky-200',
        RESERVADO: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const status = (turno as any).status || 'RESERVADO';
    let colorClasses = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';

    // Inteligencia de Clases: Naranja (incompleto), Verde (completo)
    const isClase = !!turno.claseId;
    let isFull = false;
    if (isClase && turno.claseInfo) {
        isFull = turno.claseInfo.inscriptosCount >= turno.claseInfo.cupo;
        colorClasses = isFull ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-orange-100 text-orange-800 border-orange-200';
    }

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, height: `${heightPercent}%` }}
            onClick={onClick}
            {...listeners}
            {...attributes}
            className={`absolute left-0 right-0 mx-0.5 rounded-md px-1.5 py-1 text-[9px] shadow-sm transition-all pointer-events-auto flex flex-col overflow-hidden border
        ${disabled
                ? isClase
                    ? `cursor-not-allowed opacity-60 ${colorClasses}`
                    : 'cursor-not-allowed opacity-60 bg-gray-50 text-gray-400 border-gray-100 grayscale'
                : `cursor-grab active:cursor-grabbing hover:brightness-105 ${colorClasses}`
            }
        ${isDragging ? 'z-50 opacity-80 ring-2 ring-white scale-105' : 'z-10'}
        ${isClase ? 'border-l-4' : ''}
      `}
        >
            <div className="flex justify-between items-start w-full">
                <div className={`${isClase ? 'font-bold' : 'font-black'} truncate leading-none uppercase tracking-tighter flex-1`}>
                    {isClase ? turno.tratamientoAbreviado : turno.clienteAbreviado}
                </div>
                {isClase && turno.claseInfo && (
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onInscriptosClick && turno.claseId) onInscriptosClick(turno.claseId);
                        }}
                        className={`${isFull ? 'bg-emerald-200/50' : 'bg-orange-200/50'} hover:bg-white/40 px-1 rounded flex items-center gap-0.5 cursor-pointer transition-colors ml-1`}
                        title="Ver inscriptos"
                    >
                        <span className="font-bold">{turno.claseInfo.inscriptosCount}/{turno.claseInfo.cupo}</span>
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
