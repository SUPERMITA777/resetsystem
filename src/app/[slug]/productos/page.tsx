"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { PublicNavbar } from "@/components/layout/public/Navbar";
import { PublicFooter } from "@/components/layout/public/Footer";
import { XCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PublicProductosPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);

    useEffect(() => {
        async function load() {
            if (!slug) {
                setDebugInfo({ slug: "null", page: "productos" });
                setLoading(false);
                return;
            }
            
            console.log("DEBUG: Loading productos for:", slug);
            setDebugInfo({ slug, page: "productos", status: "loading" });

            try {
                const data = await getTenant(slug);
                if (data) {
                    setTenant(data);
                    setDebugInfo((prev: any) => ({ ...prev, status: "ready" }));
                } else {
                    setError("Salón no encontrado.");
                    setDebugInfo((prev: any) => ({ ...prev, status: "not_found" }));
                }
            } catch (err: any) {
                console.error("DEBUG Error:", err);
                setError(`Error de conexión: ${err.message}`);
                setDebugInfo((prev: any) => ({ ...prev, status: "error", msg: err.message }));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [slug]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cargando productos...</p>
        </div>
    );
    
    if (error || !tenant) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h1 className="text-xl font-black uppercase mb-2">Hubo un problema</h1>
            <p className="text-gray-500 text-sm mb-8">{error || "No pudimos encontrar la información del salón."}</p>
            <div className="p-4 bg-white border border-gray-100 rounded-2xl text-[8px] font-mono text-gray-400 max-w-xs break-all">
                DEBUG: {JSON.stringify(debugInfo)}
            </div>
            <Button className="mt-8 bg-black text-white px-8 rounded-xl h-12 uppercase text-[10px] font-black tracking-widest" onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PublicNavbar 
                salonName={tenant.nombre_salon} 
                logoUrl={tenant.logo_url} 
                slug={slug}
            />
            
            <main className="flex-1 max-w-7xl mx-auto px-6 py-32 w-full">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-gray-900 italic">Nuestros Productos</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">CUIDA TU PIEL CON LO MEJOR EN ESTÉTICA PROFESIONAL</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     <div className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-gray-100 space-y-6 group hover:shadow-2xl transition-all">
                        <div className="aspect-square bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-5xl group-hover:bg-black group-hover:text-white transition-all transform group-hover:scale-105 duration-500">✨</div>
                        <div className="space-y-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-tenant-accent">Skin Care</span>
                            <h3 className="text-xl font-black uppercase tracking-tight">Serum Revitalizante</h3>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Para pieles sensibles</p>
                            <p className="text-2xl font-black text-gray-900">$3.500</p>
                        </div>
                        <Button 
                            className="w-full rounded-2xl h-14 bg-black text-white font-black uppercase tracking-widest text-[10px]"
                            onClick={() => window.open(`https://wa.me/?text=Hola! Quiero consultar por el Serum Revitalizante en ${tenant.nombre_salon}`)}
                        >
                            Consultar por WhatsApp
                        </Button>
                    </div>
                </div>
            </main>

            <PublicFooter logoUrl={tenant.logo_url} />
        </div>
    );
}
