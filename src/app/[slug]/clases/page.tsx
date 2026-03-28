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
    const [expandedClaseId, setExpandedClaseId] = useState<string | null>(null);
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

    const config = tenant.web_config || {};
    const primary = config.primary_color || '#7b5460';
    const accent = config.accent_color || '#D4A5B2';
    const secondary = config.secondary_color || '#faf9f9';
    const font = config.font_family || 'sans';
    const bgImage = config.background_image_url;

    // Dynamic styles based on tenant configuration
    const customStyles = `
        :root {
            --tenant-primary: ${primary};
            --tenant-accent: ${accent};
            --tenant-secondary: ${secondary};
        }
        .tenant-font { 
            font-family: ${
                font === 'serif' ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' : 
                font === 'mono' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' : 
                font === 'display' ? '"Playfair Display", serif' :
                font === 'elegant' ? '"Montserrat", sans-serif' :
                'inherit'
            }; 
            ${font === 'elegant' ? 'letter-spacing: 0.05em;' : ''}
        }
        .bg-tenant-primary { background-color: var(--tenant-primary); }
        .bg-tenant-accent { background-color: var(--tenant-accent); }
        .bg-tenant-secondary { background-color: var(--tenant-secondary); }
        .text-tenant-primary { color: var(--tenant-primary); }
        .text-tenant-accent { color: var(--tenant-accent); }
        .border-tenant-accent { border-color: var(--tenant-accent); }

        ${bgImage ? `
        .tenant-bg-image {
            background-image: url('${bgImage}');
            background-attachment: fixed;
            background-size: cover;
            background-position: center;
        }
        ` : ''}
    `;

    return (
        <div className={`min-h-screen bg-tenant-secondary flex flex-col tenant-font ${bgImage ? 'tenant-bg-image' : ''}`}>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-40 border-b border-tenant-accent/20">
                <div className="max-w-xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href={`/${slug}`} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <h1 className="text-lg font-black uppercase tracking-tighter text-tenant-primary">{tenant.nombre_salon}</h1>
                    <div className="w-9 h-9" /> {/* Spacer */}
                </div>
            </header>

            <main className="flex-1 max-w-xl w-full mx-auto px-6 pt-24 pb-20">
                <div className="mb-12 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-premium-soft border border-tenant-accent/30">
                        <Calendar className="w-10 h-10 text-tenant-accent" />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tight text-tenant-primary mb-2 leading-none">
                        {tenant.config_clases?.public_title || "Cronograma de Clases"}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                        {tenant.config_clases?.public_subtitle || "Encuentra el momento perfecto para renovarte"}
                    </p>
                    {tenant.config_clases?.public_description && (
                        <p className="mt-6 text-sm text-gray-500 font-medium leading-relaxed max-w-sm mx-auto uppercase tracking-widest">
                            {tenant.config_clases.public_description}
                        </p>
                    )}
                </div>

                <div className="space-y-6">
                    {clases.length > 0 ? (
                        clases.map((clase) => {
                            const availableHorarios = (clase.horarios || []).filter(h => {
                                const today = new Date().toISOString().split('T')[0];
                                return h.fecha >= today && (h.inscriptosCount < clase.cupo);
                            }).sort((a,b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

                            if (availableHorarios.length === 0) return null;

                            return (
                                <div key={clase.id} className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-premium-soft border border-white/20 transition-all duration-300">
                                    {/* Imagen Principal */}
                                    <div 
                                        className="relative h-64 w-full cursor-pointer group"
                                        onClick={() => setExpandedClaseId(expandedClaseId === clase.id ? null : clase.id)}
                                    >
                                        {clase.imagenes && clase.imagenes.length > 0 ? (
                                            <img 
                                                src={clase.imagenes[0]} 
                                                alt={clase.nombre} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-tenant-secondary flex items-center justify-center">
                                                <Calendar className="w-12 h-12 text-tenant-accent/20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">{clase.nombre}</h3>
                                                    <p className="text-white/80 text-[10px] font-black uppercase tracking-widest line-clamp-1 mt-1">{clase.detalle}</p>
                                                </div>
                                                <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest border border-white/30">
                                                    {expandedClaseId === clase.id ? "Ocultar" : "Ver Horarios"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {expandedClaseId === clase.id && (
                                        <div className="p-7 space-y-4 animate-in slide-in-from-top-4 duration-300">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-4">
                                                <span>Horarios Disponibles</span>
                                                <span className="text-tenant-accent">{availableHorarios.length} OPCIONES</span>
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
                                                        className="flex items-center justify-between p-4 rounded-[1.5rem] bg-tenant-secondary hover:bg-tenant-accent/10 border border-transparent hover:border-tenant-accent/30 transition-all cursor-pointer group/item"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-sm border border-tenant-accent/20">
                                                                <span className="text-[9px] font-black text-tenant-accent leading-none mb-1">
                                                                    {format(new Date(h.fecha + 'T12:00:00'), "MMM", { locale: es }).toUpperCase()}
                                                                </span>
                                                                <span className="text-sm font-black text-tenant-primary leading-none">
                                                                    {h.fecha.split('-')[2]}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-tenant-primary">{h.hora} HS</span>
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                    {format(new Date(h.fecha + 'T12:00:00'), "EEEE", { locale: es })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Button className="h-9 px-4 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest group-hover/item:bg-tenant-primary transition-all">
                                                            Reservar
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center opacity-30">
                            <Calendar className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-black uppercase tracking-widest text-lg">Próximamente publicaremos más clases</p>
                        </div>
                    )}
                </div>

                <footer className="mt-20 pt-10 border-t border-tenant-accent/20 text-center space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Reset System Experience</p>
                    <div className="flex justify-center gap-6">
                        {tenant.datos_contacto?.instagram && (
                            <a href={`https://instagram.com/${tenant.datos_contacto.instagram.replace('@','')}`} target="_blank" className="text-tenant-accent hover:scale-110 transition-transform">
                                <Instagram className="w-6 h-6" />
                            </a>
                        )}
                        {tenant.datos_contacto?.direccion && (
                            <a href={`https://maps.google.com/?q=${tenant.datos_contacto.direccion}`} target="_blank" className="text-tenant-accent hover:scale-110 transition-transform">
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
