"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { serviceManagement, Tratamiento, Subtratamiento } from '@/lib/services/serviceManagement';
import { Card } from '@/components/ui/Card';
import { ChevronRight, Smartphone, User, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface PublicBookingFlowProps {
    tenantName: string;
}

export function PublicBookingFlow({ tenantName }: PublicBookingFlowProps) {
    const [step, setStep] = useState<'categories' | 'services' | 'details' | 'success'>('categories');
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
    const [subtratamientos, setSubtratamientos] = useState<Subtratamiento[]>([]);
    const [selectedTratamiento, setSelectedTratamiento] = useState<Tratamiento | null>(null);
    const [selectedService, setSelectedService] = useState<Subtratamiento | null>(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');

    const tenantId = 'resetspa'; // En un entorno real, vendría del slug

    useEffect(() => {
        async function loadCategories() {
            setLoading(true);
            try {
                const data = await serviceManagement.getTratamientos(tenantId);
                setTratamientos(data);
            } catch (error) {
                console.error("Error loading categories", error);
                toast.error("Error al cargar los servicios");
            } finally {
                setLoading(false);
            }
        }
        loadCategories();
    }, []);

    const handleCategorySelect = async (t: Tratamiento) => {
        setSelectedTratamiento(t);
        setLoading(true);
        try {
            const subs = await serviceManagement.getSubtratamientos(tenantId, t.id);
            setSubtratamientos(subs);
            setStep('services');
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar sub-servicios");
        } finally {
            setLoading(false);
        }
    };

    const handleServiceSelect = (s: Subtratamiento) => {
        setSelectedService(s);
        setStep('details');
    };

    const handleRequestTurno = async () => {
        if (!name || !whatsapp) {
            toast.error("Por favor completa tus datos");
            return;
        }

        const leadData = {
            cliente_nombre: name,
            whatsapp,
            tratamiento: selectedTratamiento?.nombre,
            servicio: selectedService?.nombre,
            precio: selectedService?.precio,
            duracion: selectedService?.duracion_minutos,
            status: 'pendiente',
            createdAt: serverTimestamp()
        };

        try {
            // 1. Guardar en leads_whatsapp subcollection
            await addDoc(collection(db, 'tenants', tenantId, 'leads_whatsapp'), leadData);

            // 2. Preparar mensaje de WhatsApp
            const message = `✨ ¡Nuevo pedido de turno en RESET SYSTEM! ✨\n\n👤 Cliente: ${name}\n📱 WhatsApp: https://wa.me/${whatsapp.replace(/\D/g, '')}\n💆 Servicio: ${selectedTratamiento?.nombre} > ${selectedService?.nombre}\n💰 Precio: $${selectedService?.precio}\n\nPor favor, confirme este turno en su panel de gestión.`;
            const encodedMessage = encodeURIComponent(message);
            const waLink = `https://wa.me/5491112345678?text=${encodedMessage}`; // Número del salón mockeado

            // 3. Abrir WhatsApp
            window.open(waLink, '_blank');

            setStep('success');
        } catch (error) {
            console.error(error);
            toast.error("Hubo un problema al procesar tu pedido");
        }
    };

    if (loading) {
        return <div className="p-12 text-center animate-pulse text-gray-500">Cargando catálogo...</div>;
    }

    if (step === 'categories') {
        return (
            <div className="space-y-6">
                <h2 className="text-xl font-heading font-bold">Elige un Tratamiento</h2>
                <div className="grid gap-4">
                    {tratamientos.map(t => (
                        <Card
                            key={t.id}
                            className="p-4 flex justify-between items-center hover:shadow-md cursor-pointer transition-all border-l-4 border-l-[var(--primary)]"
                            onClick={() => handleCategorySelect(t)}
                        >
                            <div>
                                <h3 className="font-bold">{t.nombre}</h3>
                                {t.descripcion && <p className="text-xs text-gray-500">{t.descripcion}</p>}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (step === 'services') {
        return (
            <div className="space-y-6">
                <Button variant="ghost" size="sm" onClick={() => setStep('categories')}>← Volver</Button>
                <h2 className="text-xl font-heading font-bold">{selectedTratamiento?.nombre}</h2>
                <div className="grid gap-3">
                    {subtratamientos.map(s => (
                        <Card
                            key={s.id}
                            className="p-4 flex justify-between items-center hover:shadow-md cursor-pointer transition-all"
                            onClick={() => handleServiceSelect(s)}
                        >
                            <div>
                                <h3 className="font-semibold">{s.nombre}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs font-bold text-[var(--primary)]">${s.precio}</span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {s.duracion_minutos} min</span>
                                </div>
                            </div>
                            <Button size="sm" className="rounded-full">Elegir</Button>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (step === 'details') {
        return (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <Button variant="ghost" size="sm" onClick={() => setStep('services')}>← Volver</Button>

                <div className="bg-[var(--secondary)]/20 p-6 rounded-2xl border border-[var(--primary)]/10">
                    <h3 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-2">Resumen de tu elección</h3>
                    <p className="text-lg font-bold">{selectedTratamiento?.nombre} &gt; {selectedService?.nombre}</p>
                    <p className="text-2xl font-bold mt-2 text-[var(--foreground)]">${selectedService?.precio}</p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-heading font-bold">Tus Datos de Contacto</h3>
                    <div className="space-y-4">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><User className="w-5 h-5" /></span>
                            <input
                                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
                                placeholder="Nombre y Apellido"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Smartphone className="w-5 h-5" /></span>
                            <input
                                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
                                placeholder="Tu WhatsApp (con código de área)"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <Button
                    className="w-full h-16 text-lg rounded-2xl shadow-lg shadow-[var(--primary)]/20 font-bold"
                    onClick={handleRequestTurno}
                >
                    PEDIR TURNO POR WHATSAPP
                </Button>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="text-center space-y-6 py-12 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-heading font-bold">¡Solicitud Enviada!</h1>
                <p className="text-gray-600 max-w-sm mx-auto">
                    Tu pedido ha sido enviado. El salón se contactará contigo por WhatsApp para confirmar el horario final.
                </p>
                <Button variant="outline" className="rounded-full px-8" onClick={() => window.location.reload()}>Pedir otro turno</Button>
            </div>
        );
    }

    return null;
}
