"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { Clase, claseService } from "@/lib/services/claseService";
import { Button } from "@/components/ui/Button";
import { MapPin, Instagram, Calendar, Clock, Users, Tag, ChevronLeft, User as UserIcon } from "lucide-react";
import { ClaseBookingModal } from "@/components/booking/ClaseBookingModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

export default function PublicClasesPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [clases, setClases] = useState<Clase[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClase, setSelectedClase] = useState<Clase | null>(null);
    const [selectedHorario, setSelectedHorario] = useState<{id: string, fecha: string, hora: string, inscriptosCount: number} | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        async function loadData() {
            if (!slug) return;
            try {
                const tenantData = await getTenant(slug);
                if (tenantData) {
                    setTenant(tenantData);
                    const classesData = await claseService.getClases(slug);
                    setClases(classesData);
                }
            } catch (error) {
                console.error("Error loading data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#faf9f9] flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-[#D4A5B2] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!tenant) return <div className="p-20 text-center">Salón no encontrado</div>;

    return (
        <div className="min-h-screen bg-[#faf9f9] flex flex-col font-sans">
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-40 border-b border-[#f4d0d9]/20">
                <div className="max-w-xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href={`/salon/${slug}`} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <h1 className="text-lg font-serif italic text-[#7b5460]">{tenant.nombre_salon}</h1>
                    <div className="w-9 h-9" /> {/* Spacer */}
                </div>
            </header>

            <main className="flex-1 max-w-xl w-full mx-auto px-6 pt-24 pb-20">
                <div className="mb-12 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-premium-soft border border-[#f4d0d9]/30">
                        <Calendar className="w-10 h-10 text-[#D4A5B2]" />
                    </div>
                    <h2 className="text-4xl font-serif italic text-[#7b5460] mb-2 tracking-tight leading-none uppercase">Cronograma de Clases</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Encuentra el momento perfecto para renovarte</p>
                </div>

                <div className="space-y-6">
                    {clases.length > 0 ? (                        clases.map((clase) => {
                            const availableHorarios = (clase.horarios || []).filter(h => {
                                const today = new Date().toISOString().split('T')[0];
                                return h.fecha >= today && (h.inscriptosCount < clase.cupo);
                            }).sort((a,b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

                            if (availableHorarios.length === 0) return null;

                            return (
                                <div key={clase.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-premium-soft border border-[#f4d0d9]/10 transition-all duration-300">
                                    {/* Imagen Principal */}
                                    <div className="relative h-64 w-full">
                                        {clase.imagenes && clase.imagenes.length > 0 ? (
                                            <img 
                                                src={clase.imagenes[0]} 
                                                alt={clase.nombre} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#faf9f9] flex items-center justify-center">
                                                <Calendar className="w-12 h-12 text-[#D4A5B2]/20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8">
                                            <h3 className="text-3xl font-serif italic text-white leading-tight">{clase.nombre}</h3>
                                            <p className="text-white/80 text-xs font-medium line-clamp-1 mt-1">{clase.detalle}</p>
                                        </div>
                                    </div>

                                    <div className="p-7 space-y-4">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-4">
                                            <span>Horarios Disponibles</span>
                                            <span className="text-[#D4A5B2]">{availableHorarios.length} OPCIONES</span>
                                        </div>

                                        <div className="grid gap-3">
                                            {availableHorarios.map((h) => (
                                                <div 
                                                    key={h.id}
                                                    onClick={() => { 
                                                        setSelectedClase(clase); 
                                                        setSelectedHorario(h);
                                                        setIsModalOpen(true); 
                                                    }}
                                                    className="flex items-center justify-between p-4 rounded-[1.5rem] bg-[#faf9f9] hover:bg-[#f4d0d9]/10 border border-transparent hover:border-[#f4d0d9]/30 transition-all cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-sm border border-[#f4d0d9]/20">
                                                            <span className="text-[9px] font-black text-[#D4A5B2] leading-none mb-1">
                                                                {format(new Date(h.fecha + 'T12:00:00'), "MMM", { locale: es }).toUpperCase()}
                                                            </span>
                                                            <span className="text-sm font-black text-[#7b5460] leading-none">
                                                                {h.fecha.split('-')[2]}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-[#7b5460]">{h.hora} HS</span>
                                                            <span className="text-[10px] font-bold text-gray-400 capitalize">
                                                                {format(new Date(h.fecha + 'T12:00:00'), "EEEE", { locale: es })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button className="h-9 px-4 rounded-full bg-[#7b5460] text-white text-[10px] font-black uppercase tracking-widest group-hover:scale-105 transition-transform">
                                                        Cupos: {clase.cupo - h.inscriptosCount}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center opacity-30">
                            <Calendar className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-serif italic text-lg">Próximamente publicaremos más clases</p>
                        </div>
                    )}
                </div>

                <footer className="mt-20 pt-10 border-t border-[#f4d0d9]/20 text-center space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Reset System Experience</p>
                    <div className="flex justify-center gap-6">
                        {tenant.datos_contacto?.instagram && (
                            <a href={`https://instagram.com/${tenant.datos_contacto.instagram.replace('@','')}`} target="_blank" className="text-[#D4A5B2] hover:scale-110 transition-transform">
                                <Instagram className="w-6 h-6" />
                            </a>
                        )}
                        {tenant.datos_contacto?.direccion && (
                            <a href={`https://maps.google.com/?q=${tenant.datos_contacto.direccion}`} target="_blank" className="text-[#D4A5B2] hover:scale-110 transition-transform">
                                <MapPin className="w-6 h-6" />
                            </a>
                        )}
                    </div>
                </footer>
            </main>

            <ClaseBookingModal 
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedClase(null); setSelectedHorario(null); }}
                clase={selectedClase}
                horario={selectedHorario}
                tenantId={slug}
                tenantName={tenant.nombre_salon}
                salonWhatsapp={tenant.datos_contacto?.whatsapp}
            />
        </div>
    );
}
