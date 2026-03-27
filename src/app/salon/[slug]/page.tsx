"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { Button } from "@/components/ui/Button";
import { Clock, MapPin, Instagram, Phone, Globe, ChevronDown, Calendar, Users, Star, ArrowRight } from "lucide-react";
import { PublicBookingFlow } from "@/components/booking/PublicBookingFlow";
import Head from "next/head";

export default function SalonPublicPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadTenant() {
            if (!slug) return;
            try {
                const data = await getTenant(slug);
                if (data) {
                    setTenant(data);
                }
            } catch (error) {
                console.error("Error loading tenant", error);
            } finally {
                setLoading(false);
            }
        }
        loadTenant();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin w-10 h-10 border-4 border-black border-t-transparent rounded-full shadow-lg"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cargando experiencia...</p>
                </div>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-gray-50">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-6">
                    <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 mb-2">Salón no encontrado</h1>
                <p className="text-gray-500 font-medium max-w-xs mx-auto">Parece que el enlace no existe o el salón no está disponible actualmente.</p>
                <Button className="mt-8 bg-black text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" onClick={() => window.location.href = '/'}>Volver al Inicio</Button>
            </div>
        );
    }

    const config = tenant.web_config || {};
    const primary = config.primary_color || '#000000';
    const accent = config.accent_color || '#D4A5B2';
    const secondary = config.secondary_color || '#faf9f9';
    const font = config.font_family || 'sans';
    const layout = config.layout_type || 'classic';

    // Dynamic styles based on tenant configuration
    const customStyles = `
        :root {
            --tenant-primary: ${primary};
            --tenant-accent: ${accent};
            --tenant-secondary: ${secondary};
        }
        .tenant-font { font-family: ${font === 'serif' ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' : font === 'mono' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' : 'inherit'}; }
        .bg-tenant-primary { background-color: var(--tenant-primary); }
        .bg-tenant-accent { background-color: var(--tenant-accent); }
        .bg-tenant-secondary { background-color: var(--tenant-secondary); }
        .text-tenant-primary { color: var(--tenant-primary); }
        .text-tenant-accent { color: var(--tenant-accent); }
        .border-tenant-accent { border-color: var(--tenant-accent); }
    `;

    const renderLayout = () => {
        switch (layout) {
            case 'modern':
                return (
                    <div className="flex flex-col min-h-screen bg-tenant-secondary tenant-font animate-in fade-in duration-700">
                        {/* Modern Layout: Hero Full Screen */}
                        <section className="relative h-[70vh] w-full overflow-hidden flex items-center justify-center">
                            {config.hero_image_url ? (
                                <img src={config.hero_image_url} className="absolute inset-0 w-full h-full object-cover" alt="Hero" />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/20" />
                            )}
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                            
                            <div className="relative z-10 text-center px-6 max-w-4xl animate-in slide-in-from-bottom-10 duration-1000">
                                {tenant.logo_url && (
                                    <img src={tenant.logo_url} className="w-24 h-24 rounded-full mx-auto mb-8 border-4 border-white/20 shadow-2xl" alt="Logo" />
                                )}
                                <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-6">
                                    {tenant.config_clases?.public_title || tenant.nombre_salon}
                                </h1>
                                <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto mb-10 leading-relaxed uppercase tracking-widest">
                                    {tenant.config_clases?.public_subtitle}
                                </p>
                                <button 
                                    onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="h-16 px-12 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl"
                                >
                                    Reservar Experiencia
                                </button>
                            </div>
                            
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                                <ChevronDown className="text-white w-8 h-8 opacity-50" />
                            </div>
                        </section>

                        <main id="booking" className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12 -mt-20 relative z-20">
                            <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 border border-gray-50">
                                <PublicBookingFlow tenantName={tenant.nombre_salon} />
                            </div>
                        </main>

                        <footer className="py-20 px-6 text-center bg-white border-t border-gray-100">
                            <div className="max-w-4xl mx-auto space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-3">
                                        <MapPin className="w-6 h-6 mx-auto text-tenant-accent" />
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Ubicación</p>
                                        <p className="text-sm font-bold">{tenant.datos_contacto?.direccion || "Próximamente"}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <Instagram className="w-6 h-6 mx-auto text-tenant-accent" />
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Instagram</p>
                                        <p className="text-sm font-bold">@{tenant.datos_contacto?.instagram || "resetsystem"}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <Phone className="w-6 h-6 mx-auto text-tenant-accent" />
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">WhatsApp</p>
                                        <p className="text-sm font-bold">{tenant.datos_contacto?.whatsapp || "No disponible"}</p>
                                    </div>
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">© 2026 {tenant.nombre_salon} • Powered by RESETSYSTEM</p>
                            </div>
                        </footer>
                    </div>
                );
            case 'minimal':
                return (
                    <div className="min-h-screen bg-white tenant-font flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                        <header className="text-center mb-16">
                            {tenant.logo_url && (
                                <img src={tenant.logo_url} className="w-20 h-20 rounded-full mx-auto mb-8 shadow-sm" alt="Logo" />
                            )}
                            <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 mb-2">{tenant.nombre_salon}</h1>
                            <div className="w-12 h-1 bg-tenant-accent mx-auto rounded-full" />
                        </header>
                        
                        <main className="w-full max-w-xl">
                            <PublicBookingFlow tenantName={tenant.nombre_salon} />
                        </main>
                        
                        <footer className="mt-20 flex gap-6 grayscale opacity-40">
                            {tenant.datos_contacto?.instagram && <Instagram className="w-5 h-5" />}
                            {tenant.datos_contacto?.whatsapp && <Phone className="w-5 h-5" />}
                            <MapPin className="w-5 h-5" />
                        </footer>
                    </div>
                );
            default: // Classic
                return (
                    <div className="min-h-screen flex flex-col bg-tenant-secondary tenant-font animate-in fade-in duration-500">
                        {/* Classic Layout: Soft cover and centered logo */}
                        <header className="relative bg-white pt-24 pb-16 px-6 text-center shadow-sm rounded-b-[4rem] overflow-hidden">
                            {config.hero_image_url && (
                                <img src={config.hero_image_url} className="absolute inset-0 w-full h-full object-cover opacity-10 blur-sm scale-110" alt="Bg" />
                            )}
                            <div className="relative z-10 max-w-2xl mx-auto">
                                <div className="w-28 h-28 bg-white rounded-full mx-auto mb-8 flex items-center justify-center font-black text-4xl text-tenant-primary shadow-2xl border-4 border-gray-50 overflow-hidden">
                                    {tenant.logo_url ? <img src={tenant.logo_url} className="w-full h-full object-cover" alt="Logo" /> : tenant.nombre_salon.charAt(0)}
                                </div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900 leading-none">{tenant.nombre_salon}</h1>
                                {tenant.datos_contacto?.descripcion && (
                                    <p className="text-gray-400 text-sm font-medium mt-6 leading-relaxed uppercase tracking-widest">{tenant.datos_contacto.descripcion}</p>
                                )}

                                <div className="flex flex-wrap justify-center gap-6 mt-10">
                                    {tenant.datos_contacto?.direccion && (
                                        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400"><MapPin className="w-4 h-4 text-tenant-accent" /> {tenant.datos_contacto.direccion}</span>
                                    )}
                                    {tenant.datos_contacto?.instagram && (
                                        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400"><Instagram className="w-4 h-4 text-tenant-accent" /> @{tenant.datos_contacto.instagram}</span>
                                    )}
                                </div>
                            </div>
                        </header>

                        <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col gap-10 mt-10">
                            <div className="bg-white rounded-[3rem] p-10 shadow-premium-soft border border-gray-50">
                                <PublicBookingFlow tenantName={tenant.nombre_salon} />
                            </div>
                        </main>
                        
                        <footer className="py-12 text-center opacity-30 grayscale">
                             <p className="text-[9px] font-black uppercase tracking-[0.4em]">Powered by RESETSYSTEM</p>
                        </footer>
                    </div>
                );
        }
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            {renderLayout()}
        </>
    );
}
