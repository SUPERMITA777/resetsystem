"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { Button } from "@/components/ui/Button";
import { Clock, MapPin, Instagram } from "lucide-react";
import { PublicBookingFlow } from "@/components/booking/PublicBookingFlow";

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
                    // Ensure theme is applied to body based on tenant configuration
                    document.body.className = `theme-${data.tema_visual} font-sans antialiased text-[var(--foreground)] bg-[var(--background)] transition-colors duration-300`;
                }
            } catch (error) {
                console.error("Error loading tenant", error);
            } finally {
                setLoading(false);
            }
        }
        loadTenant();

        // Cleanup theme on unmount
        return () => { document.body.className = "font-sans antialiased"; }
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
                <h1 className="text-2xl font-bold mb-2">Salón no encontrado</h1>
                <p className="text-gray-500">Parece que el enlace no existe o el salón no está disponible.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header Cover */}
            <header className="bg-[var(--secondary)] pt-16 pb-8 px-6 sm:px-12 rounded-b-3xl shadow-sm text-center">
                <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center font-heading font-bold text-2xl text-[var(--primary)] shadow-md">
                    {tenant.nombre_salon.charAt(0)}
                </div>
                <h1 className="text-3xl font-heading font-bold text-[var(--foreground)] mt-2">{tenant.nombre_salon}</h1>
                {tenant.datos_contacto?.descripcion && (
                    <p className="text-[var(--foreground)]/80 mt-2 max-w-md mx-auto">{tenant.datos_contacto.descripcion}</p>
                )}

                <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-[var(--foreground)]/70">
                    {tenant.datos_contacto?.direccion && (
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {tenant.datos_contacto.direccion}</span>
                    )}
                    {tenant.datos_contacto?.instagram && (
                        <span className="flex items-center gap-1"><Instagram className="w-4 h-4" /> {tenant.datos_contacto.instagram}</span>
                    )}
                </div>
            </header>

            {/* Main Content: Booking Flow */}
            <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-8 mt-4">
                <PublicBookingFlow tenantName={tenant.nombre_salon} />
            </main>
        </div>
    );
}
