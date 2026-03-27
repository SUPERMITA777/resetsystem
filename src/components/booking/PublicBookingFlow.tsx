"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { serviceManagement, Tratamiento, Subtratamiento } from '@/lib/services/serviceManagement';
import { Card } from '@/components/ui/Card';
import { ChevronRight, Smartphone, User, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useParams } from 'next/navigation';

interface PublicBookingFlowProps {
    tenantName: string;
}

export function PublicBookingFlow({ tenantName }: PublicBookingFlowProps) {
    const params = useParams();
    const tenantId = params.slug as string || 'resetspa';
    
    const [step, setStep] = useState<'categories' | 'services' | 'details' | 'success'>('categories');
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
    const [subtratamientos, setSubtratamientos] = useState<Subtratamiento[]>([]);
    const [selectedTratamiento, setSelectedTratamiento] = useState<Tratamiento | null>(null);
    const [selectedService, setSelectedService] = useState<Subtratamiento | null>(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');

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
    }, [tenantId]);

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
            const message = `✨ ¡Nuevo pedido de turno en ${tenantName}! ✨\n\n👤 Cliente: ${name}\n📱 WhatsApp: https://wa.me/${whatsapp.replace(/\D/g, '')}\n💆 Servicio: ${selectedTratamiento?.nombre} > ${selectedService?.nombre}\n💰 Precio: $${selectedService?.precio}\n\nPor favor, confirme este turno en su panel de gestión.`;
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
        return <div className="p-12 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest text-xs">Cargando catálogo...</div>;
    }

    if (step === 'categories') {
        return (
            <div className="space-y-6">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Elige un Tratamiento</h2>
                <div className="grid gap-4">
                    {tratamientos.map(t => (
                        <Card
                            key={t.id}
                            className="p-6 flex justify-between items-center hover:shadow-xl cursor-pointer transition-all border-l-4 border-l-tenant-accent rounded-[2rem] bg-white group"
                            onClick={() => handleCategorySelect(t)}
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xl text-gray-300 group-hover:bg-tenant-primary group-hover:text-white transition-all">
                                    {t.nombre.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg leading-none">{t.nombre}</h3>
                                    {t.descripcion && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">{t.descripcion}</p>}
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-tenant-primary transition-all" />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (step === 'services') {
        return (
            <div className="space-y-6">
                <button onClick={() => setStep('categories')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-2">← Volver</button>
                <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">{selectedTratamiento?.nombre}</h2>
                <div className="grid gap-3">
                    {subtratamientos.map(s => (
                        <Card
                            key={s.id}
                            className="p-6 flex justify-between items-center hover:shadow-xl cursor-pointer transition-all rounded-[2rem] bg-white group border-2 border-transparent hover:border-tenant-accent"
                            onClick={() => handleServiceSelect(s)}
                        >
                            <div>
                                <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg leading-none">{s.nombre}</h3>
                                <div className="flex items-center gap-4 mt-3">
                                    <span className="text-sm font-black text-tenant-primary">${s.precio}</span>
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> {s.duracion_minutos} min</span>
                                </div>
                            </div>
                            <Button size="sm" className="rounded-2xl h-12 px-6 bg-black text-white font-black uppercase tracking-widest text-[10px] shadow-lg group-hover:bg-tenant-primary transition-all">Elegir</Button>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (step === 'details') {
        return (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <button onClick={() => setStep('services')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-2">← Volver</button>

                <div className="bg-tenant-secondary p-8 rounded-[2.5rem] border border-tenant-accent/20">
                    <h3 className="text-[10px] font-black text-tenant-primary uppercase tracking-[0.2em] mb-4">Resumen de tu elección</h3>
                    <p className="text-2xl font-black text-gray-900 uppercase tracking-tight">{selectedTratamiento?.nombre} &gt; {selectedService?.nombre}</p>
                    <p className="text-3xl font-black mt-4 text-tenant-primary tracking-tight">${selectedService?.precio}</p>
                </div>

                <div className="space-y-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Tus Datos de Contacto</h3>
                    <div className="space-y-4">
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"><User className="w-5 h-5" /></span>
                            <input
                                className="w-full bg-gray-50 border-none rounded-[1.5rem] h-16 pl-14 pr-6 focus:ring-2 focus:ring-tenant-primary outline-none transition-all font-bold"
                                placeholder="Nombre y Apellido"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"><Smartphone className="w-5 h-5" /></span>
                            <input
                                className="w-full bg-gray-50 border-none rounded-[1.5rem] h-16 pl-14 pr-6 focus:ring-2 focus:ring-tenant-primary outline-none transition-all font-bold"
                                placeholder="Tu WhatsApp (ej: +54 9 11 ...)"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <Button
                    className="w-full h-20 text-[11px] rounded-[1.5rem] shadow-2xl shadow-tenant-primary/20 bg-black text-white font-black uppercase tracking-[0.2em] hover:bg-tenant-primary active:scale-95 transition-all"
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
