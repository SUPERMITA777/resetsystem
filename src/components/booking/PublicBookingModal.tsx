"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, ChevronLeft, ChevronRight, Send, User, Phone } from "lucide-react";
import { format, addDays, startOfToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Tratamiento, Subtratamiento } from "@/lib/services/serviceManagement";
import { getTurnosPorFecha, createTurno } from "@/lib/services/agendaService";
import { getTenant } from "@/lib/services/tenantService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tratamiento: Tratamiento;
  subtratamiento: Subtratamiento;
  tenantId: string;
}

export function PublicBookingModal({ isOpen, onClose, tratamiento, subtratamiento, tenantId }: Props) {
  const [step, setStep] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHora, setSelectedHora] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedDate(null);
      setSelectedHora(null);
      setNombre("");
      setWhatsapp("");
      setDone(false);
    }
  }, [isOpen]);

  const isDateAvailable = (date: Date) => {
    if (!tratamiento.rangos_disponibilidad || tratamiento.rangos_disponibilidad.length === 0) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();
    if (date < startOfToday()) return false;

    return tratamiento.rangos_disponibilidad.some(r => {
      if (!r.dias.includes(dayOfWeek)) return false;
      const startStr = r.fecha_inicio || null;
      const endStr = r.fecha_fin || null;
      if (startStr && dateStr < startStr) return false;
      if (endStr && dateStr > endStr) return false;
      return true;
    });
  };

  const generateSlots = async (date: Date) => {
    setLoadingSlots(true);
    const slots: string[] = [];
    const dateStr = format(date, 'yyyy-MM-dd');

    const dayTurnos = await getTurnosPorFecha(tenantId, dateStr);
    const occupied: Record<string, string[]> = {};
    dayTurnos.forEach(t => {
      if (!occupied[t.horaInicio]) occupied[t.horaInicio] = [];
      occupied[t.horaInicio].push(t.boxId || 'box-1');
    });

    if (tratamiento.rangos_disponibilidad && tratamiento.rangos_disponibilidad.length > 0) {
      const dayOfWeek = date.getDay();
      const ranges = tratamiento.rangos_disponibilidad.filter(r => {
        if (!r.dias.includes(dayOfWeek)) return false;
        if (r.fecha_inicio && dateStr < r.fecha_inicio) return false;
        if (r.fecha_fin && dateStr > r.fecha_fin) return false;
        return true;
      });

      ranges.forEach(range => {
        let start = new Date(`${dateStr}T${range.inicio.padStart(5, '0')}:00`);
        const end = new Date(`${dateStr}T${range.fin.padStart(5, '0')}:00`);
        while (start < end) {
          const hora = format(start, 'HH:mm');
          const takenInBoxes = occupied[hora] || [];
          const targetBox = tratamiento.boxId || 'box-1';
          const isOccupied = tratamiento.boxId ? takenInBoxes.includes(targetBox) : takenInBoxes.length >= 3;
          if (!isOccupied) {
            slots.push(hora);
          }
          start = new Date(start.getTime() + 30 * 60000);
        }
      });
    }

    setAvailableSlots([...new Set(slots)].sort());
    setLoadingSlots(false);
  };

  const handleDateClick = (date: Date) => {
    if (!isDateAvailable(date)) return;
    setSelectedDate(date);
    setSelectedHora(null);
    generateSlots(date);
    setStep(2);
  };

  const handleHoraClick = (hora: string) => {
    setSelectedHora(hora);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedHora || !nombre.trim() || !whatsapp.trim()) return;
    setSending(true);

    try {
      const fechaStr = format(selectedDate, 'yyyy-MM-dd');
      await createTurno(tenantId, {
        clienteAbreviado: nombre.trim(),
        tratamientoAbreviado: tratamiento.nombre,
        subtratamientoAbreviado: subtratamiento.nombre,
        duracionMinutos: subtratamiento.duracion_minutos,
        boxId: tratamiento.boxId || 'box-1',
        fecha: fechaStr,
        horaInicio: selectedHora,
        clienteWhatsapp: whatsapp.trim(),
        whatsapp: whatsapp.trim(),
        status: 'PENDIENTE',
        tratamientoId: tratamiento.id,
      });

      // WhatsApp
      const tenant = await getTenant(tenantId);
      const salonWa = tenant?.datos_contacto?.whatsapp || '';
      if (salonWa) {
        const fechaDisplay = format(selectedDate, "EEEE d 'de' MMMM", { locale: es });
        const msg = encodeURIComponent(
          `¡HOLA! Soy ${nombre.trim()} y quiero reservar ${tratamiento.nombre} - ${subtratamiento.nombre} para el día ${fechaDisplay} a las ${selectedHora}.`
        );
        window.open(`https://wa.me/${salonWa.replace(/\D/g, '')}?text=${msg}`, '_blank');
      }

      setDone(true);
      setStep(4);
    } catch (error) {
      console.error("Error creating booking:", error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart); // 0=Sun

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Agendar Cita</p>
          <h2 className="text-2xl font-black uppercase tracking-tight">{subtratamiento.nombre}</h2>
          <p className="text-xs text-gray-400 font-bold mt-1">{tratamiento.nombre} · {subtratamiento.duracion_minutos} min · ${subtratamiento.precio}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? 'bg-black' : 'bg-gray-100'}`} />
          ))}
        </div>

        {/* Step 1: Calendar */}
        {step === 1 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-black uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h3>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
                <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-gray-300 py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />)}
              {daysInMonth.map(day => {
                const available = isDateAvailable(day);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    disabled={!available}
                    className={`aspect-square flex items-center justify-center rounded-2xl text-sm transition-all
                      ${isSelected ? 'bg-black text-white scale-110 shadow-lg' : ''}
                      ${available && !isSelected ? 'font-black hover:bg-gray-100 cursor-pointer text-black' : ''}
                      ${!available ? 'text-gray-200 cursor-default font-normal' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Time slots */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-6 hover:text-black transition-colors">
              <ChevronLeft className="w-4 h-4" /> Cambiar Fecha
            </button>
            <p className="text-sm font-black mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </p>
            {loadingSlots ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {availableSlots.map(hora => (
                  <button
                    key={hora}
                    onClick={() => handleHoraClick(hora)}
                    className={`p-4 rounded-2xl font-black text-sm transition-all border-2 ${
                      selectedHora === hora ? 'bg-black text-white border-black' : 'bg-white border-gray-100 hover:border-black hover:scale-105'
                    }`}
                  >
                    {hora}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest">No hay horarios disponibles</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Client data */}
        {step === 3 && (
          <div className="space-y-6">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2 hover:text-black transition-colors">
              <ChevronLeft className="w-4 h-4" /> Cambiar Horario
            </button>
            <div className="bg-gray-50 p-6 rounded-[2rem] space-y-1">
              <p className="text-xs text-gray-400 font-bold">{selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} · {selectedHora}</p>
              <p className="text-sm font-black">{tratamiento.nombre} — {subtratamiento.nombre}</p>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                <User className="w-3 h-3 inline mr-1" /> Tu Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full h-14 px-6 bg-gray-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-black transition-all border-none"
                placeholder="Ingresa tu nombre"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                <Phone className="w-3 h-3 inline mr-1" /> Tu WhatsApp
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full h-14 px-6 bg-gray-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-black transition-all border-none"
                placeholder="+54 11 1234 5678"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!nombre.trim() || !whatsapp.trim() || sending}
              className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              {sending ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Send className="w-4 h-4" /> Confirmar & Enviar WhatsApp</>}
            </button>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 mx-auto bg-emerald-50 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">¡Solicitud Enviada!</h3>
              <p className="text-gray-400 text-sm font-medium mt-2">Tu cita quedó como pendiente. El salón te confirmará por WhatsApp a la brevedad.</p>
            </div>
            <button onClick={onClose} className="h-12 px-8 bg-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
