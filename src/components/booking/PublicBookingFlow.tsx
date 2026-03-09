"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Clock, Calendar as CalendarIcon, ArrowLeft, ChevronRight } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface Service {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
}

interface PublicBookingFlowProps {
    tenantName: string;
}

// Moqueando datos de servicios
const mockServices: Service[] = [
    { id: 's1', name: 'Depilación Láser Rostro', durationMinutes: 30, price: 5500 },
    { id: 's2', name: 'Masaje Relajante', durationMinutes: 60, price: 12000 },
    { id: 's3', name: 'Limpieza Facial Profunda', durationMinutes: 45, price: 8000 },
];

// Moqueando días disponibles (Próximos 7 días)
const mockAvailableDates = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i + 1));

// Moqueando horas para un día
const mockAvailableTimes = ["09:00", "10:30", "14:00", "16:00", "17:30"];

export function PublicBookingFlow({ tenantName }: PublicBookingFlowProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const handleServiceSelect = (service: Service) => {
        setSelectedService(service);
        setStep(2);
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        // Para simplificar, asumimos que siempre elige la fecha y luego la hora en el mismo paso 2,
        // Aquí solo lo seteamos y mostramos horas.
        setSelectedTime(null);
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
        setStep(3);
    };

    const generateWhatsAppLink = () => {
        if (!selectedService || !selectedDate || !selectedTime) return "#";

        const formattedDate = format(selectedDate, "EEEE d 'de' MMMM", { locale: es });
        const message = `Hola ${tenantName}! Tienen lugar disponible para un turno de *${selectedService.name}* el día *${formattedDate}* a las *${selectedTime}* hs? Mi nombre es: `;

        // Aquí idealmente vendría el número del tenant desde DB. Usando uno de prueba o redirigiendo genérico.
        const waUrl = `https://wa.me/5491100000000?text=${encodeURIComponent(message)}`;
        return waUrl;
    };

    return (
        <div className="w-full">
            {/* Header de navegación interna */}
            {step > 1 && (
                <button
                    onClick={() => setStep(prev => (prev - 1) as 1 | 2 | 3)}
                    className="flex items-center gap-2 text-sm text-[var(--foreground)] opacity-70 hover:opacity-100 transition-opacity mb-4"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver
                </button>
            )}

            {/* STEP 1: Selección de Servicio */}
            {step === 1 && (
                <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xl font-bold mb-4 border-b border-[var(--secondary)] pb-2 flex items-center justify-between">
                        <span>Selecciona un Servicio</span>
                        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Paso 1/3</span>
                    </h2>

                    <div className="grid gap-3">
                        {mockServices.map(service => (
                            <div
                                key={service.id}
                                onClick={() => handleServiceSelect(service)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-[var(--secondary)] flex justify-between items-center transition-all hover:shadow-md cursor-pointer hover:border-[var(--primary)] group"
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-900 group-hover:text-[var(--primary)] transition-colors">{service.name}</h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.durationMinutes} min</span>
                                        <span className="text-[var(--primary)] font-medium">${service.price.toLocaleString('es-AR')}</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[var(--primary)] transition-colors" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* STEP 2: Selección de Fecha y Hora */}
            {step === 2 && selectedService && (
                <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xl font-bold mb-4 border-b border-[var(--secondary)] pb-2 flex items-center justify-between">
                        <span>¿Cuándo te esperamos?</span>
                        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Paso 2/3</span>
                    </h2>

                    {/* Card Resumen Servicio Seleccionado */}
                    <div className="bg-[var(--secondary)]/30 border border-[var(--secondary)] p-3 rounded-lg mb-6 flex justify-between items-center">
                        <span className="text-sm font-medium">{selectedService.name}</span>
                        <span className="text-sm text-gray-500">{selectedService.durationMinutes} min</span>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Fechas Disponibles</h3>
                    <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
                        {mockAvailableDates.map(date => {
                            const isSelected = selectedDate?.toDateString() === date.toDateString();
                            return (
                                <button
                                    key={date.toISOString()}
                                    onClick={() => handleDateSelect(date)}
                                    className={`flex-shrink-0 flex flex-col items-center justify-center p-3 w-20 h-24 rounded-2xl border transition-all
                      ${isSelected
                                            ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md scale-105'
                                            : 'border-[var(--secondary)] bg-white text-gray-600 hover:border-[var(--primary)] hover:text-[var(--primary)]'}
                    `}
                                >
                                    <span className="text-xs uppercase font-medium opacity-80">{format(date, 'eee', { locale: es })}</span>
                                    <span className="text-2xl font-bold my-1">{format(date, 'd')}</span>
                                    <span className="text-xs capitalize opacity-80">{format(date, 'MMM', { locale: es })}</span>
                                </button>
                            )
                        })}
                    </div>

                    {selectedDate && (
                        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Horarios Visibles
                            </h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {mockAvailableTimes.map(time => (
                                    <button
                                        key={time}
                                        onClick={() => handleTimeSelect(time)}
                                        className="p-3 bg-white border border-[var(--secondary)] rounded-xl font-medium text-gray-700 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm transition-all"
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* STEP 3: Confirmación y Envío WhatsApp */}
            {step === 3 && selectedService && selectedDate && selectedTime && (
                <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xl font-bold mb-4 border-b border-[var(--secondary)] pb-2 flex items-center justify-between">
                        <span>Confirma tu Turno</span>
                        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Final</span>
                    </h2>

                    <div className="bg-white border-2 border-[var(--primary)]/20 p-6 rounded-2xl shadow-sm text-center">
                        <div className="w-16 h-16 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarIcon className="w-8 h-8" />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-1 capitalize">
                            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                        </h3>
                        <p className="text-xl font-medium text-[var(--primary)] mb-6">a las {selectedTime} hs</p>

                        <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100 mb-8">
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                                <span className="text-gray-500">Servicio</span>
                                <span className="font-semibold">{selectedService.name}</span>
                            </div>
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                                <span className="text-gray-500">Duración</span>
                                <span className="font-semibold">{selectedService.durationMinutes} min</span>
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-gray-500 font-medium">Total Estimado</span>
                                <span className="font-bold text-[var(--primary)]">${selectedService.price.toLocaleString('es-AR')}</span>
                            </div>
                        </div>

                        <a
                            href={generateWhatsAppLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-full gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-md shadow-green-500/20"
                        >
                            Solicitar por WhatsApp
                        </a>
                        <p className="text-xs text-gray-400 mt-4">Serás redirigido/a al chat de WhatsApp oficial del salón para confirmar la cita.</p>
                    </div>
                </section>
            )}

        </div>
    );
}
