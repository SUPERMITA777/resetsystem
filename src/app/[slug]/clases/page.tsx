"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { PublicNavbar } from "@/components/layout/public/Navbar";
import { PublicFooter } from "@/components/layout/public/Footer";
import { XCircle, Calendar, Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PublicClasesPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);

    useEffect(() => {
        async function load() {
            if (!slug) {
                setDebugInfo({ slug: "null", page: "clases" });
                setLoading(false);
                return;
            }
            
            console.log("DEBUG: Loading clases for:", slug);
            setDebugInfo({ slug, page: "clases", status: "loading" });

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
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cargando clases...</p>
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
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-gray-900 italic">Nuestras Clases</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">RESERVA TU LUGAR EN NUESTRAS SESIONES GRUPALES</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Placeholder for real classes data if available in Firestore */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8 group hover:scale-[1.02] transition-all">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-3xl group-hover:bg-black group-hover:text-white transition-all">🧘</div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black uppercase tracking-tight">Yoga & Bienestar</h3>
                            <p className="text-sm text-gray-500 leading-relaxed font-medium">Una sesión diseñada para reconectar con tu interior y equilibrar tu energía.</p>
                        </div>
                        <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                            <span className="font-black text-xl">$1200</span>
                            <Button className="rounded-2xl h-12 px-8 bg-black text-white font-black uppercase tracking-widest text-[10px]">Reservar</Button>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter logoUrl={tenant.logo_url} />
        </div>
    );
}
