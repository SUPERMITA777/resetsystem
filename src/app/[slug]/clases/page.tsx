"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { claseService, Clase } from "@/lib/services/claseService";
import { PublicNavbar } from "@/components/layout/public/Navbar";
import { PublicFooter } from "@/components/layout/public/Footer";
import { XCircle, Calendar, Clock, Users, ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PublicClasesPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [clases, setClases] = useState<Clase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            if (!slug) {
                setLoading(false);
                return;
            }
            
            try {
                // Fetch tenant and classes in parallel
                const [tenantData, clasesData] = await Promise.all([
                    getTenant(slug),
                    claseService.getClases(slug)
                ]);

                if (tenantData) {
                    setTenant(tenantData);
                    setClases(clasesData || []);
                    
                    // SEO
                    const webConfig = tenantData.web_config;
                    document.title = `Clases - ${tenantData.nombre_salon} | RESETSYSTEM`;
                    const seoDesc = webConfig?.seo_description || 'Reserva tu lugar en nuestras sesiones grupales';
                    const metaDesc = document.querySelector('meta[name="description"]');
                    if (metaDesc) metaDesc.setAttribute('content', seoDesc);
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

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cargando clases...</p>
        </div>
    );
    
    if (error || !tenant) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h1 className="text-xl font-black uppercase mb-2">Hubo un problema</h1>
            <p className="text-gray-500 text-sm mb-8">{error || "No pudimos encontrar la información del salón."}</p>
            <Button className="mt-8 bg-black text-white px-8 rounded-xl h-12 uppercase text-[10px] font-black tracking-widest" onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
    );

    const handleWhatsAppRedirect = (clase: Clase) => {
        const phone = tenant.datos_contacto?.whatsapp || '5491112345678';
        const message = encodeURIComponent(`¡Hola! 👋 Quisiera reservar un lugar en la clase de "${clase.nombre}" en ${tenant.nombre_salon}. ✨`);
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PublicNavbar 
                salonName={tenant.nombre_salon} 
                logoUrl={tenant.logo_url} 
                slug={slug}
            />
            
            <main className="flex-1 max-w-7xl mx-auto px-6 py-32 w-full">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-gray-900 italic animate-in fade-in slide-in-from-bottom-4 duration-700">Nuestras Clases</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-200">
                        RESERVA TU LUGAR EN NUESTRAS SESIONES GRUPALES
                    </p>
                </div>

                {clases.length === 0 ? (
                    <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100 max-w-2xl mx-auto">
                        <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-6" />
                        <h2 className="text-xl font-black uppercase text-gray-400">Próximamente</h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Estamos preparando nuestra agenda de clases.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {clases.map((clase, idx) => (
                            <div 
                                key={clase.id} 
                                className="bg-white p-10 rounded-[3rem] shadow-premium-soft border border-gray-100 space-y-8 group hover:scale-[1.02] hover:shadow-2xl transition-all duration-500 animate-in fade-in zoom-in-95"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-3xl group-hover:bg-black group-hover:text-white transition-all duration-500">
                                    {clase.nombre.charAt(0)}
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-tenant-accent">
                                        <Users className="w-3 h-3" /> {clase.cupo > 0 ? `${clase.cupo} Lugares de cupo` : 'Sesión Personalizada'}
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">{clase.nombre}</h3>
                                    {clase.detalle && <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-3">{clase.detalle}</p>}
                                </div>
                                <div className="pt-6 border-t border-gray-50 flex justify-between items-center group-hover:border-black/5 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Duración</span>
                                        <span className="font-black text-lg tracking-tighter">{clase.duracion} MIN</span>
                                    </div>
                                    <Button 
                                        className="rounded-2xl h-14 px-8 bg-black text-white font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl"
                                        onClick={() => handleWhatsAppRedirect(clase)}
                                    >
                                        RESERVAR
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <PublicFooter logoUrl={tenant.logo_url} />
        </div>
    );
}
