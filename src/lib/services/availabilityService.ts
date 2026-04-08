import { format, startOfToday } from 'date-fns';
import { getTurnosPorFecha } from './agendaService';
import { serviceManagement, Tratamiento } from './serviceManagement';

export const availabilityService = {
    /**
     * Calcula los horarios disponibles para un tratamiento en una fecha específica.
     * Basado en la lógica de PublicBookingFlow.tsx
     */
    async getAvailableSlots(tenantId: string, tratamientoId: string, date: Date): Promise<string[]> {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOfWeek = date.getDay();

        // 1. Obtener datos del tratamiento
        const tratamientos = await serviceManagement.getTratamientos(tenantId);
        const tratamiento = tratamientos.find(t => t.id === tratamientoId);
        
        if (!tratamiento || !tratamiento.habilitado) return [];
        if (!tratamiento.rangos_disponibilidad || tratamiento.rangos_disponibilidad.length === 0) return [];

        // 2. Obtener turnos existentes
        const dayTurnos = await getTurnosPorFecha(tenantId, dateStr);
        const occupied: Record<string, string[]> = {};
        dayTurnos.forEach(t => {
            if (!occupied[t.horaInicio]) occupied[t.horaInicio] = [];
            occupied[t.horaInicio].push(t.boxId || 'box-1');
        });

        const slots: string[] = [];
        
        // 3. Filtrar rangos por día de la semana y fecha
        const ranges = tratamiento.rangos_disponibilidad.filter(r => {
            if (!r.dias.includes(dayOfWeek)) return false;
            if (r.fecha_inicio && dateStr < r.fecha_inicio) return false;
            if (r.fecha_fin && dateStr > r.fecha_fin) return false;
            return true;
        });

        // 4. Generar slots en intervalos de 30 minutos
        ranges.forEach(range => {
            let start = new Date(`${dateStr}T${range.inicio.padStart(5, '0')}:00`);
            const end = new Date(`${dateStr}T${range.fin.padStart(5, '0')}:00`);
            
            while (start < end) {
                const hora = format(start, 'HH:mm');
                const takenInBoxes = occupied[hora] || [];
                const targetBox = tratamiento.boxId || 'box-1';
                
                // Si hay box específico, verificamos ese. Si no, máximo 3 boxes por defecto.
                const isOccupied = tratamiento.boxId ? takenInBoxes.includes(targetBox) : takenInBoxes.length >= 3;
                
                if (!isOccupied) {
                    slots.push(hora);
                }
                start = new Date(start.getTime() + 30 * 60000);
            }
        });

        return [...new Set(slots)].sort();
    }
};
