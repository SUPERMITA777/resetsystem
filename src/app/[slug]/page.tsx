"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { Button } from "@/components/ui/Button";
import { Clock, MapPin, Instagram, Phone, Globe, ChevronDown, Calendar, Users, Star, ArrowRight, XCircle } from "lucide-react";
import { PublicBookingFlow } from "@/components/booking/PublicBookingFlow";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PublicNavbar } from "@/components/layout/public/Navbar";
import { PublicFooter } from "@/components/layout/public/Footer";

export default function SalonPublicPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!slug) return;
        
        console.log("Iniciando listener para salón:", slug);
        const unsubscribe = onSnapshot(doc(db, "tenants", slug), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as TenantData;
                console.log("Datos del salón recibidos (Real-time):", data);
                setTenant(data);

                // Handle default view redirection
                const webConfig = data?.web_config;
                const defaultView = webConfig?.default_view || 'tratamientos';
                
                if (defaultView === 'clases' && pathname === `/${slug}`) {
                    router.push(`/${slug}/clases`);
                } else if (defaultView === 'productos' && pathname === `/${slug}`) {
                    router.push(`/${slug}/productos`);
                }
                
                // Actualizar título de la página
                if (data?.nombre_salon) {
                    const seoTitle = webConfig?.seo_title || `${data.nombre_salon} | RESETSYSTEM`;
                    if (document.title !== seoTitle) {
                        document.title = seoTitle;
                    }
                }
            } else {
                console.warn("El salón no existe en Firestore:", slug);
                setTenant(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error en onSnapshot:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [slug, router, pathname]);

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
    const primary = config.primary_color || (tenant.tema_visual === 'nude' ? '#7b5460' : tenant.tema_visual === 'lavender' ? '#9381FF' : '#7D9D9C');
    const accent = config.accent_color || (tenant.tema_visual === 'nude' ? '#D4A5B2' : tenant.tema_visual === 'lavender' ? '#B8B8FF' : '#B4CFB0');
    const secondary = config.secondary_color || '#faf9f9';
    const font = config.font_family || 'sans';
    const layout = config.layout_type || 'classic';
    const bgImage = config.background_image_url;

    // Dynamic styles based on tenant configuration
    const customStyles = `
        :root, .theme-nude, .theme-lavender, .theme-sage {
            --tenant-primary: ${primary} !important;
            --tenant-accent: ${accent} !important;
            --tenant-secondary: ${secondary} !important;
            
            /* Sincronizar con variables globales usadas por componentes */
            --primary: ${primary} !important;
            --accent: ${accent} !important;
            --background: ${secondary} !important;
            --foreground: ${primary} !important;
            --border-soft: rgba(0, 0, 0, 0.05) !important;
        }
        
        body {
            background-color: var(--tenant-secondary) !important;
            color: var(--tenant-primary) !important;
        }

        .tenant-font { 
            font-family: ${
                font === 'serif' ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' : 
                font === 'mono' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' : 
                font === 'display' ? '"Playfair Display", serif' :
                font === 'elegant' ? '"Montserrat", sans-serif' :
                'inherit'
            } !important; 
            ${font === 'elegant' ? 'letter-spacing: 0.05em;' : ''}
        }
        
        /* Overrides para asegurar que los componentes usen los colores del salón */
        .text-tenant-primary, .text-\\[var\\(--primary\\)\\], .text-\\[var\\(--foreground\\)\\] { color: var(--tenant-primary) !important; }
        .text-tenant-accent, .text-\\[var\\(--accent\\)\\] { color: var(--tenant-accent) !important; }
        .bg-tenant-primary, .bg-\\[var\\(--primary\\)\\], .bg-\\[var\\(--foreground\\)\\] { background-color: var(--tenant-primary) !important; }
        .bg-tenant-accent, .bg-\\[var\\(--accent\\)\\] { background-color: var(--tenant-accent) !important; }
        .bg-tenant-secondary, .bg-\\[var\\(--background\\)\\], .bg-\\[var\\(--secondary\\)\\] { background-color: var(--tenant-secondary) !important; }
        .border-tenant-accent, .border-\\[var\\(--accent\\)\\] { border-color: var(--tenant-accent) !important; }
        
        /* Glass effect overrides */
        .glass {
            background-color: rgba(255, 255, 255, 0.4) !important;
            backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        ${bgImage ? `
        .tenant-bg-image {
            background-image: url('${bgImage}');
            background-attachment: fixed;
            background-size: cover;
            background-position: center;
        }
        ` : ''}
    `;

    const renderLayout = () => {
        const commonElements = (
            <>
                <PublicNavbar 
                    salonName={tenant.nombre_salon} 
                    logoUrl={tenant.logo_url} 
                    slug={slug}
                />
            </>
        );

        switch (layout) {
            case 'modern':
                return (
                    <div className={\`flex flex-col min-h-screen bg-tenant-secondary tenant-font animate-in fade-in duration-700 \${bgImage ? 'tenant-bg-image' : ''}\`}>
                        {commonElements}
                        {/* Modern Layout: Hero Full Screen */}
                        <section className="relative h-[70vh] w-full overflow-hidden flex items-center justify-center pt-20">
                            {config.hero_image_url ? (
                                <img src={config.hero_image_url} className="absolute inset-0 w-full h-full object-cover" alt="Hero" />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/20" />
                            )}
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                            
                            <div className="relative z-10 text-center px-6 max-w-4xl animate-in slide-in-from-bottom-10 duration-1000">
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
                            <div className="bg-white/90 backdrop-blur-xl rounded-[3rem] shadow-2xl p-8 md:p-12 border border-white/20">
                                <PublicBookingFlow tenantName={tenant.nombre_salon} />
                            </div>
                        </main>
                        <PublicFooter logoUrl={tenant.logo_url} />
                    </div>
                );
            case 'minimal':
                return (
                    <div className={\`min-h-screen bg-white tenant-font flex flex-col animate-in fade-in duration-500 \${bgImage ? 'tenant-bg-image' : ''}\`}>
                        {commonElements}
                        <div className="flex-1 flex flex-col items-center justify-center p-6 pt-32">
                            <header className="text-center mb-16">
                                <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 mb-2">{tenant.nombre_salon}</h1>
                                <div className="w-12 h-1 bg-tenant-accent mx-auto rounded-full" />
                            </header>
                            
                            <main className="w-full max-w-xl bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-xl border border-white/20">
                                <PublicBookingFlow tenantName={tenant.nombre_salon} />
                            </main>
                        </div>
                        <PublicFooter logoUrl={tenant.logo_url} />
                    </div>
                );
            default: // Classic
                return (
                    <div className={\`min-h-screen flex flex-col bg-tenant-secondary tenant-font animate-in fade-in duration-500 \${bgImage ? 'tenant-bg-image' : ''}\`}>
                        {commonElements}
                        {/* Classic Layout: Soft cover and centered logo */}
                        <header className="relative bg-white pt-40 pb-16 px-6 text-center shadow-sm rounded-b-[4rem] overflow-hidden">
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

                        <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-10 mt-10">
                            {/* Titulo de Tratamientos similar a la foto */}
                            <div className="text-center mb-8">
                                <h2 className="text-5xl md:text-7xl font-serif italic leading-none uppercase text-tenant-primary" style={{ color: primary }}>
                                    <span className="not-italic text-tenant-accent" style={{ color: accent }}>Tratamientos</span>
                                </h2>
                            </div>
                            
                            <div className="bg-white/90 backdrop-blur-xl rounded-[3rem] p-10 shadow-premium-soft border border-white/20">
                                <PublicBookingFlow tenantName={tenant.nombre_salon} />
                            </div>
                        </main>
                        <PublicFooter logoUrl={tenant.logo_url} />
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
