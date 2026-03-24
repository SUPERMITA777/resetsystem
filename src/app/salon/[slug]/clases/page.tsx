"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { Clase, claseService } from "@/lib/services/claseService";
import { Button } from "@/components/ui/Button";
import { MapPin, Instagram, Calendar, Clock, Users, Tag, ChevronLeft } from "lucide-react";
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
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        async function loadData() {
            if (!slug) return;
            try {
                const tenantData = await getTenant(slug);
                if (tenantData) {
                    setTenant(tenantData);
                    const classesData = await claseService.getClases(slug);
                    // Filter for future classes only
                    const today = new Date().toISOString().split('T')[0];
                    setClases(classesData.filter(c => c.fecha >= today).sort((a,b) => a.fecha.localeCompare(b.fecha)));
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
                    {clases.length > 0 ? (
                        clases.map((clase) => {
                            const isFull = clase.inscriptosCount >= clase.cupo;
                            const isLastSpots = !isFull && (clase.cupo - clase.inscriptosCount) <= 3;

                            return (
                                <div key={clase.id} className="bg-white rounded-[2.5rem] p-7 shadow-premium-soft border border-[#f4d0d9]/10 group transition-all duration-300 active:scale-[0.98]">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-serif italic text-[#7b5460] leading-tight">{clase.nombre}</h3>
                                            <div className="flex items-center gap-3 text-xs font-bold text-[#9086AB]">
                                                <span className="flex items-center gap-1">
                                                    {format(new Date(clase.fecha + 'T12:00:00'), "EEEE dd", { locale: es })}
                                                </span>
                                                <span className="w-1 h-1 bg-[#f4d0d9] rounded-full" />
                                                <span>{clase.hora} HS</span>
                                            </div>
                                        </div>
                                        {isFull ? (
                                            <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                CUPOS AGOTADOS
                                            </span>
                                        ) : isLastSpots ? (
                                            <span className="px-3 py-1 bg-[#fccad8] text-[#7b5460] rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                                                ÚLTIMOS CUPOS
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                DISPONIBLE
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                <Users className="w-3 h-3" />
                                                <span>Restantes: {clase.cupo - clase.inscriptosCount} cupos</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-[#635a7c] uppercase tracking-[0.2em] bg-[#e8ddff] w-fit px-2 py-0.5 rounded-lg mt-1">
                                                <Tag className="w-3 h-3" />
                                                <span>{clase.valorCreditos} PTR</span>
                                            </div>
                                        </div>

                                        <Button 
                                            disabled={isFull}
                                            onClick={() => { setSelectedClase(clase); setIsModalOpen(true); }}
                                            className={`h-12 px-8 rounded-full font-serif italic text-lg transition-all shadow-md active:scale-95 
                                                ${isFull ? 'bg-gray-100 text-gray-300' : 'bg-white text-[#7b5460] border border-[#f4d0d9] hover:bg-[#7b5460] hover:text-white'}`}
                                        >
                                            Inscribirme
                                        </Button>
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
                onClose={() => { setIsModalOpen(false); setSelectedClase(null); }}
                clase={selectedClase}
                tenantId={slug}
                tenantName={tenant.nombre_salon}
                salonWhatsapp={tenant.datos_contacto?.whatsapp}
            />
        </div>
    );
}
