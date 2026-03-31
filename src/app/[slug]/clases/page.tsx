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

    useEffect(() => {
        async function load() {
            if (!slug) return;
            const data = await getTenant(slug);
            setTenant(data);
            setLoading(false);
        }
        load();
    }, [slug]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando clases...</div>;
    if (!tenant) return <div className="min-h-screen flex items-center justify-center">Salón no encontrado</div>;

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
