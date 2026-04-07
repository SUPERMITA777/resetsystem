"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { claseService, Clase, Horario } from "@/lib/services/claseService";
import { createTurno } from "@/lib/services/agendaService";
import { PublicNavbar } from "@/components/layout/public/Navbar";
import { PublicFooter } from "@/components/layout/public/Footer";
import { XCircle, Calendar, Clock, Users, ArrowRight, CheckCircle2, User, Smartphone, ChevronLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type Step = 'list' | 'sessions' | 'form' | 'success';

export default function PublicClasesPage() {
    const params = useParams();
    const slugRaw = params.slug as string;
    const slug = decodeURIComponent(slugRaw);
    
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [clases, setClases] = useState<Clase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Flow State
    const [step, setStep] = useState<Step>('list');
    const [selectedClase, setSelectedClase] = useState<Clase | null>(null);
    const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null);
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function load() {
            if (!slug) {
                setLoading(false);
                return;
            }
            
            try {
                const [tenantData, clasesData] = await Promise.all([
                    getTenant(slug),
                    claseService.getClases(slug)
                ]);

                if (tenantData) {
                    setTenant(tenantData);
                    setClases(clasesData || []);
                    document.title = `Clases - ${tenantData.nombre_salon} | RESETSYSTEM`;
                } else {
                    setError("Salón no encontrado.");
                }
            } catch (err: any) {
                setError(`Error de conexión: ${err.message}`);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [slug]);

    const handleClaseSelect = (clase: Clase) => {
        setSelectedClase(clase);
        setStep('sessions');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleHorarioSelect = (horario: Horario) => {
        setSelectedHorario(horario);
        setStep('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClase || !selectedHorario || !name || !whatsapp) {
            toast.error("Por favor completa todos los datos");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create Turno in Firestore (Agenda)
            await createTurno(slug, {
                nombre: name,
                whatsapp,
                fecha: selectedHorario.fecha,
                horaInicio: selectedHorario.hora,
                clienteAbreviado: name.split(' ')[0],
                tratamientoAbreviado: selectedClase.nombre,
                subtratamientoAbreviado: selectedClase.nombre,
                duracionMinutos: selectedClase.duracion || 60,
                boxId: selectedClase.boxId || "salon-grupal",
                status: 'PENDIENTE',
                claseId: selectedClase.id,
                valorCreditos: selectedClase.valorCreditos || 0
            });

            // 2. Increment Inscriptos
            await claseService.incrementInscriptos(slug, selectedClase.id, selectedHorario.id);

            // 3. WhatsApp Redirect
            const phone = tenant?.datos_contacto?.whatsapp || '5491112345678';
            const formattedDate = format(parseISO(selectedHorario.fecha), "eeee dd 'de' MMMM", { locale: es });
            const message = encodeURIComponent(
                `✨ *SOLICITUD DE INSCRIPCIÓN* ✨\n\n` +
                `👤 *Cliente:* ${name}\n` +
                `🧘 *Clase:* ${selectedClase.nombre}\n` +
                `📅 *Fecha:* ${formattedDate}\n` +
                `⏰ *Horario:* ${selectedHorario.hora} HS\n\n` +
                `_Quedo a la espera de la confirmación. ¡Gracias!_`
            );
            window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');

            setStep('success');
        } catch (err) {
            console.error(err);
            toast.error("Hubo un error al procesar tu solicitud");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
            <div className="animate-spin w-10 h-10 border-4 border-black border-t-transparent rounded-full shadow-lg"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-4">Cargando cronograma...</p>
        </div>
    );
    
    if (error || !tenant) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center">
            <XCircle className="w-16 h-16 text-red-500 mb-6 drop-shadow-xl" />
            <h1 className="text-2xl font-black uppercase mb-2 tracking-tighter">Hubo un problema</h1>
            <p className="text-gray-500 text-sm mb-10 max-w-xs mx-auto font-medium">{error || "No pudimos encontrar la información del salón."}</p>
            <Button className="bg-black text-white px-10 rounded-2xl h-14 uppercase text-[10px] font-black tracking-widest shadow-xl" onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
    );

    const renderStep = () => {
        switch (step) {
            case 'list':
                return (
                    <div className="animate-in fade-in duration-700">
                        <div className="text-center mb-20 space-y-4">
                            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-gray-900 italic">Nuestras Clases</h1>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] max-w-sm mx-auto leading-relaxed">
                                ELIGE UNA ACTIVIDAD PARA VER LOS DÍAS Y HORARIOS DISPONIBLES
                            </p>
                        </div>

                        {clases.length === 0 ? (
                            <div className="bg-white p-24 rounded-[4rem] text-center border border-gray-100 shadow-premium-soft max-w-3xl mx-auto">
                                <Calendar className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                                <h2 className="text-2xl font-black uppercase text-gray-300">Próximamente</h2>
                                <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mt-2">Estamos actualizando nuestra agenda de clases grupales</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {clases.map((clase, idx) => (
                                    <Card 
                                        key={clase.id} 
                                        className="bg-white p-10 rounded-[3.5rem] shadow-premium-soft border border-gray-100 space-y-8 cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-500 group"
                                        onClick={() => handleClaseSelect(clase)}
                                    >
                                        {clase.imagenes && clase.imagenes.length > 0 ? (
                                            <div className="w-full h-48 rounded-[2.5rem] overflow-hidden mb-6">
                                                <img 
                                                    src={clase.imagenes[0]} 
                                                    alt={clase.nombre} 
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center text-4xl group-hover:bg-black group-hover:text-white transition-all duration-500 shadow-inner mb-6">
                                                {clase.nombre.charAt(0)}
                                            </div>
                                        )}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-tenant-accent px-3 py-1 bg-tenant-accent/10 rounded-lg">
                                                    {clase.horarios.length} Sesiones
                                                </span>
                                            </div>
                                            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none group-hover:translate-x-1 transition-transform">{clase.nombre}</h3>
                                            <p className="text-sm text-gray-400 leading-relaxed font-medium line-clamp-3 uppercase tracking-tighter">{clase.detalle || "Una experiencia revitalizante diseñada para resetear tu cuerpo y mente."}</p>
                                        </div>
                                        <div className="pt-8 border-t border-gray-50">
                                            <Button className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl group-hover:bg-tenant-accent transition-all duration-500">
                                                CONSULTAR HORARIOS
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'sessions':
                return (
                    <div className="max-w-4xl mx-auto animate-in slide-in-from-right-10 fade-in duration-500 pb-20">
                        <button onClick={() => setStep('list')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-3 mb-12 py-2 transition-all group">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al listado
                        </button>
                        
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-l-4 border-tenant-accent pl-8 py-2">
                            <div>
                                <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-gray-900 leading-none mb-4 italic">{selectedClase?.nombre}</h1>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] leading-relaxed max-w-lg">SELECCIONA EL DÍA Y HORARIO EN EL QUE DESEAS PARTICIPAR</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(selectedClase?.horarios || []).length === 0 ? (
                                <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-gray-100 rounded-[3rem] animate-in zoom-in-95 duration-500">
                                    <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-6" />
                                    <h3 className="text-xl font-black uppercase text-gray-400 tracking-tight">Sin Cupos o Sesiones</h3>
                                    <p className="text-[10px] text-gray-300 font-bold uppercase mt-2 max-w-xs mx-auto leading-relaxed">
                                        No encontramos sesiones disponibles para {selectedClase?.nombre} en este momento.
                                    </p>
                                    
                                    <div className="flex flex-col gap-4 mt-10 max-w-xs mx-auto px-6">
                                        <Button 
                                            className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                                            onClick={() => {
                                                const message = `✨ ¡Hola! Te contacto desde la web de ${tenant?.nombre_salon}. ✨\n\nMe interesa participar en la clase de "${selectedClase?.nombre}", pero no encontré horarios con cupo disponibles online. ¿Podrían avisarme si se libera alguno?`;
                                                const encoded = encodeURIComponent(message);
                                                const phone = tenant?.datos_contacto?.whatsapp || '5491112345678';
                                                window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encoded}`, '_blank');
                                            }}
                                        >
                                            <Smartphone className="w-4 h-4" />
                                            Consultar Disponibilidad
                                        </Button>
                                        
                                        <Button 
                                            variant="ghost" 
                                            className="text-[10px] font-black uppercase tracking-widest text-gray-400 underline decoration-2 underline-offset-4" 
                                            onClick={() => setStep('list')}
                                        >
                                            Ver otras actividades
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                selectedClase?.horarios
                                    .sort((a,b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
                                    .map((horario, idx) => {
                                        const isFull = horario.inscriptosCount >= (selectedClase.cupo || 999);
                                        return (
                                            <Card 
                                                key={horario.id}
                                                className={`p-8 rounded-[2.5rem] border transition-all duration-500 group flex items-center justify-between ${
                                                    isFull 
                                                    ? 'bg-gray-50 border-gray-100 opacity-60 grayscale scale-95 pointer-events-none' 
                                                    : 'bg-white border-white hover:shadow-2xl hover:border-tenant-accent cursor-pointer shadow-premium-soft'
                                                }`}
                                                onClick={() => !isFull && handleHorarioSelect(horario)}
                                            >
                                                <div className="flex gap-6 items-center">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-900 group-hover:bg-black group-hover:text-white transition-all duration-500 shadow-inner">
                                                        <span className="text-[10px] font-black uppercase leading-none mb-1">{format(parseISO(horario.fecha), "EEE", {locale: es})}</span>
                                                        <span className="text-2xl font-black leading-none">{format(parseISO(horario.fecha), "dd")}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">{horario.hora} HS</h3>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                                <Users className="w-3 h-3" /> {horario.inscriptosCount} / {selectedClase.cupo} Cupos
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button size="icon" className="w-12 h-12 rounded-xl bg-gray-50 text-gray-300 group-hover:bg-tenant-accent group-hover:text-white transition-all">
                                                    <ArrowRight className="w-5 h-5" />
                                                </Button>
                                            </Card>
                                        );
                                    })
                            )}
                        </div>
                    </div>
                );

            case 'form':
                return (
                    <div className="max-w-xl mx-auto animate-in zoom-in-95 fade-in duration-500 pb-20">
                        <button onClick={() => setStep('sessions')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-3 mb-12 py-2 transition-all group">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver a horarios
                        </button>

                        <div className="bg-white p-12 rounded-[4rem] shadow-premium-soft border border-gray-50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-tenant-accent/5 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
                            
                            <div className="text-center mb-10 space-y-2">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-tenant-accent italic">Confirma tu lugar</h2>
                                <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900 leading-none">Tus detalles</h1>
                            </div>

                            <form onSubmit={handleBooking} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2 px-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Nombre Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-200" />
                                            <input 
                                                required
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder="Ej: Sofía Pérez"
                                                className="w-full h-18 bg-gray-50 rounded-[2rem] pl-16 pr-8 text-sm font-bold border-none focus:ring-4 focus:ring-black/5 outline-none transition-all placeholder:text-gray-200 shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 px-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">WhatsApp de contacto</label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-200" />
                                            <input 
                                                required
                                                type="tel"
                                                value={whatsapp}
                                                onChange={e => setWhatsapp(e.target.value)}
                                                placeholder="+54 9 11 ..."
                                                className="w-full h-18 bg-gray-50 rounded-[2rem] pl-16 pr-8 text-sm font-bold border-none focus:ring-4 focus:ring-black/5 outline-none transition-all placeholder:text-gray-200 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-4 shadow-inner border border-white/50">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                                        <span>Sesión Seleccionada</span>
                                        <span>{selectedHorario?.hora} HS</span>
                                    </div>
                                    <div className="text-xl font-black uppercase tracking-tight text-gray-900 leading-tight">
                                        {selectedClase?.nombre} <br/>
                                        <span className="text-tenant-accent italic">{selectedHorario && format(parseISO(selectedHorario.fecha), "EEEE dd 'de' MMMM", {locale: es})}</span>
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full h-20 bg-black text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "Procesando solicitud..." : "SOLICITAR INSCRIPCIÓN VÍA WHATSAPP"}
                                </Button>
                                
                                <p className="text-[10px] text-center text-gray-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Clock className="w-3 h-3" /> Sujeto a disponibilidad de cupos
                                </p>
                            </form>
                        </div>
                    </div>
                );

            case 'success':
                return (
                    <div className="max-w-xl mx-auto py-20 text-center animate-in zoom-in-95 fade-in duration-700">
                        <div className="w-32 h-32 bg-white rounded-[4rem] flex items-center justify-center mx-auto mb-10 shadow-premium-soft border border-emerald-50 text-emerald-500 overflow-hidden relative">
                            <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                            <CheckCircle2 className="w-16 h-16 relative z-10" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-gray-900 leading-tight italic mb-6">¡Solicitud<br/>Enviada!</h1>
                        <p className="text-gray-500 font-medium leading-relaxed max-w-sm mx-auto mb-12 text-sm">
                            Excelente. Hemos recibido tu solicitud para <span className="text-black font-bold">"{selectedClase?.nombre}"</span>. Te contactaremos por WhatsApp para confirmar tu cupo final.
                        </p>
                        <Button 
                            onClick={() => window.location.reload()}
                            className="h-16 px-12 bg-black text-white rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            VOLVER AL INICIO
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PublicNavbar 
                salonName={tenant.nombre_salon} 
                logoUrl={tenant.logo_url} 
                slug={slug}
            />
            
            <main className="flex-1 max-w-7xl mx-auto px-6 py-32 w-full">
                {renderStep()}
            </main>

            <PublicFooter logoUrl={tenant.logo_url} />
        </div>
    );
}
