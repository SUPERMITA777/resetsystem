"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createOrUpdateTenant } from "@/lib/services/tenantService";
import { toast, Toaster } from "react-hot-toast";

export default function SuperAdminSetupPage() {
    const [loading, setLoading] = useState(false);

    const handleSeedResetSpa = async () => {
        try {
            setLoading(true);
            await createOrUpdateTenant("resetspa", {
                slug: "resetspa",
                nombre_salon: "RESET SPA",
                huso_horario_global: "America/Argentina/Buenos_Aires",
                config_boxes: 7,
                tema_visual: "nude",
                datos_contacto: {
                    direccion: "Buenos Aires, Argentina",
                    descripcion: "Centro de Estética Premium",
                }
            });
            toast.success("Tenant 'resetspa' configurado correctamente.");
        } catch (error) {
            console.error(error);
            toast.error("Error al configurar tenant. Revisa la consola.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <Toaster />
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full text-center">
                <h1 className="text-2xl font-bold mb-2">SuperAdmin Setup</h1>
                <p className="text-gray-500 mb-8 text-sm">Panel de inicialización del sistema multinivel. Requiere configuración Firebase activa.</p>

                <div className="flex flex-col gap-4">
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 text-left">
                        <h3 className="font-semibold text-orange-800 text-sm mb-1">Seed Tenant: resetspa</h3>
                        <ul className="text-xs text-orange-600 list-disc list-inside">
                            <li>7 Boxes</li>
                            <li>Zona Horaria: Buenos Aires</li>
                            <li>Tema: Nude & Rose Gold</li>
                        </ul>
                    </div>

                    <Button
                        onClick={handleSeedResetSpa}
                        disabled={loading}
                        className="w-full bg-slate-900 text-white hover:bg-slate-800"
                    >
                        {loading ? "Configurando..." : "Inicializar Base de Datos"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
