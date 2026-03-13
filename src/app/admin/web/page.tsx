"use client";

import React from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Globe, Layout as LayoutIcon, Palette, Image as ImageIcon, MessageSquare, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function WebConfigPage() {
    const [tenantId, setTenantId] = React.useState("resetspa");

    React.useEffect(() => {
        const id = localStorage.getItem('currentTenant') || 'resetspa';
        setTenantId(id);
    }, []);

    const previewUrl = `https://${tenantId}.resetsystem.vercel.app`;

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter">Configuración Web</h1>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <Globe className="w-3 h-3 text-black" /> Personaliza tu presencia online
                        </p>
                    </div>
                    <Button className="bg-black text-white h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-black/10 active:scale-95 transition-all flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Guardar Cambios
                    </Button>
                </div>

                {/* Grid of options */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: <LayoutIcon />, title: "Estructura & Layout", desc: "Elige entre diferentes plantillas para tu página principal." },
                        { icon: <Palette />, title: "Colores & Estética", desc: "Define tu paleta de colores, tipografía y estilo visual." },
                        { icon: <ImageIcon />, title: "Banner & Multimedia", desc: "Gestiona las imágenes principales del hero y secciones." },
                        { icon: <MessageSquare />, title: "Contacto & Redes", desc: "Configura tus links de WhatsApp, Instagram y ubicación." },
                        { icon: <Globe />, title: "Dominio & SEO", desc: "Personaliza tu URL y metadatos para buscadores." }
                    ].map((item, i) => (
                        <div key={i} className="p-8 bg-white border border-gray-100 rounded-[2.5rem] hover:shadow-2xl hover:shadow-gray-100/50 transition-all group cursor-pointer">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-black group-hover:text-white transition-colors">
                                {React.cloneElement(item.icon as React.ReactElement<{ className: string }>, { className: "w-5 h-5" })}
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight mb-2">{item.title}</h3>
                            <p className="text-gray-400 text-xs font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Preview Banner */}
                <div className="bg-gray-50 rounded-[3rem] p-12 border border-dashed border-gray-200 text-center space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vista Previa en Tiempo Real</p>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Mira cómo luce tu web ahora mismo</h2>
                    <div className="pt-4">
                        <Button 
                            onClick={() => window.open(previewUrl, '_blank')}
                            variant="outline" 
                            className="h-14 px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 hover:bg-black hover:text-white transition-all shadow-lg"
                        >
                            Ver Landing Page
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
