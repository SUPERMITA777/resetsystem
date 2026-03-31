"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { serviceManagement, Tratamiento, Subtratamiento } from '@/lib/services/serviceManagement';
import { getTenant, TenantData } from '@/lib/services/tenantService';
import { Card } from '@/components/ui/Card';
import { ChevronRight, Smartphone, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useParams } from 'next/navigation';

interface PublicBookingFlowProps {
    tenantName: string;
}

export function PublicBookingFlow({ tenantName }: PublicBookingFlowProps) {
    const params = useParams();
    const slug = params.slug as string || 'resetspa';
    
    const [tenant, setTenant] = useState<TenantData | null>(null);
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
        async function load() {
            setLoading(true);
            try {
                const [tenantData, treatmentsData] = await Promise.all([
                    getTenant(slug),
                    serviceManagement.getTratamientos(slug)
                ]);
                setTenant(tenantData);
                setTratamientos(treatmentsData || []);
            } catch (error) {
                console.error("Error loading data", error);
                toast.error("Error al cargar los servicios");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [slug]);

    const handleCategorySelect = async (t: Tratamiento) => {
        setSelectedTratamiento(t);
        setLoading(true);
        try {
            const subs = await serviceManagement.getSubtratamientos(slug, t.id);
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
            await addDoc(collection(db, 'tenants', slug, 'leads_whatsapp'), leadData);

            // 2. Preparar mensaje de WhatsApp
            const message = `✨ ¡Nuevo pedido de turno en ${tenantName}! ✨\n\n👤 Cliente: ${name}\n📱 WhatsApp: https://wa.me/${whatsapp.replace(/\D/g, '')}\n💆 Servicio: ${selectedTratamiento?.nombre} > ${selectedService?.nombre}\n💰 Precio: $${selectedService?.precio}\n\nPor favor, confirme este turno en su panel de gestión.`;
            const encodedMessage = encodeURIComponent(message);
            
            // Usar WhatsApp del tenant si existe
            const tenantPhone = tenant?.datos_contacto?.whatsapp || '5491112345678';
            const waLink = `https://wa.me/${tenantPhone.replace(/\D/g, '')}?text=${encodedMessage}`;

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
        if (tratamientos.length === 0) {
            return (
                <div className="text-center py-20 px-6 animate-in fade-in duration-700">
                    <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-6" />
                    <h2 className="text-xl font-black uppercase text-gray-400">Sin Servicios</h2>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto leading-relaxed">
                        Actualmente no hay tratamientos disponibles en línea. Por favor, contáctanos directamente.
                    </p>
                    {tenant?.datos_contacto?.whatsapp && (
                        <Button 
                            className="mt-8 bg-black text-white px-10 rounded-2xl h-14 uppercase text-[10px] font-black tracking-widest shadow-xl"
                            onClick={() => {
                                const phone = tenant?.datos_contacto?.whatsapp || '';
                                window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                            }}
                        >
                            Contactar por WhatsApp
                        </Button>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Elige un Tratamiento</h2>
                <div className="grid gap-4">
                    {tratamientos.map((t, idx) => (
                        <Card
                            key={t.id}
                            className="p-6 flex justify-between items-center hover:shadow-2xl cursor-pointer transition-all border-l-4 border-l-tenant-accent rounded-[2rem] bg-white group animate-in slide-in-from-bottom-2"
                            style={{ animationDelay: `${idx * 100}ms` }}
                            onClick={() => handleCategorySelect(t)}
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xl text-gray-300 group-hover:bg-black group-hover:text-white transition-all duration-500 overflow-hidden">
                                    {t.imagenes && t.imagenes[0] ? (
                                        <img src={t.imagenes[0]} alt={t.nombre} className="w-full h-full object-cover" />
                                    ) : t.nombre.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg leading-none">{t.nombre}</h3>
                                    {t.descripcion && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">{t.descripcion}</p>}
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (step === 'services') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <button onClick={() => setStep('categories')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-2 transition-colors">← Volver</button>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900 leading-none">{selectedTratamiento?.nombre}</h2>
                <div className="grid gap-3">
                    {subtratamientos.length === 0 ? (
                        <p className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-300">No hay servicios específicos en esta categoría</p>
                    ) : (
                        subtratamientos.map((s, idx) => (
                            <Card
                                key={s.id}
                                className="p-6 flex justify-between items-center hover:shadow-2xl cursor-pointer transition-all rounded-[2rem] bg-white group border-2 border-transparent hover:border-black/5 animate-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${idx * 50}ms` }}
                                onClick={() => handleServiceSelect(s)}
                            >
                                <div>
                                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg leading-none">{s.nombre}</h3>
                                    <div className="flex items-center gap-4 mt-3">
                                        <span className="text-sm font-black text-tenant-primary">${s.precio}</span>
                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> {s.duracion_minutos} min</span>
                                    </div>
                                </div>
                                <Button size="sm" className="rounded-2xl h-12 px-6 bg-black text-white font-black uppercase tracking-widest text-[10px] shadow-lg group-hover:scale-105 transition-all">Elegir</Button>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        );
    }

    if (step === 'details') {
        return (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <button onClick={() => setStep('services')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-2 transition-colors">← Volver</button>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-premium-soft">
                    <h3 className="text-[10px] font-black text-tenant-accent uppercase tracking-[0.2em] mb-4">Resumen de tu elección</h3>
                    <p className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">{selectedTratamiento?.nombre} <span className="text-gray-300 mx-2">&gt;</span> {selectedService?.nombre}</p>
                    <div className="flex items-center justify-between mt-6">
                        <span className="text-3xl font-black text-gray-900 tracking-tighter">${selectedService?.precio}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedService?.duracion_minutos} MIN</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Tus Datos de Contacto</h3>
                    <div className="space-y-4">
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"><User className="w-5 h-5" /></span>
                            <input
                                className="w-full bg-white shadow-inner border border-gray-100 rounded-[1.5rem] h-18 pl-14 pr-6 focus:ring-2 focus:ring-black outline-none transition-all font-bold placeholder:text-gray-300"
                                placeholder="Nombre completo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"><Smartphone className="w-5 h-5" /></span>
                            <input
                                className="w-full bg-white shadow-inner border border-gray-100 rounded-[1.5rem] h-18 pl-14 pr-6 focus:ring-2 focus:ring-black outline-none transition-all font-bold placeholder:text-gray-300"
                                placeholder="WhatsApp (ej: +54 ...)"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <Button
                    className="w-full h-20 text-[11px] rounded-[1.5rem] shadow-2xl shadow-black/10 bg-black text-white font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all"
                    onClick={handleRequestTurno}
                >
                    AGENDAR POR WHATSAPP
                </Button>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="text-center space-y-6 py-12 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">¡Solicitud Enviada!</h1>
                <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed text-sm">
                    Excelente. Tu pedido ha sido enviado. Te contactaremos por WhatsApp para coordinar los detalles.
                </p>
                <Button 
                    className="rounded-2xl h-14 px-10 bg-black text-white font-black uppercase tracking-widest text-[10px] mt-8 shadow-xl"
                    onClick={() => window.location.reload()}
                >
                    PEDIR OTRO TURNO
                </Button>
            </div>
        );
    }

    return null;
}
