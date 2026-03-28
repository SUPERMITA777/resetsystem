"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Smartphone, Instagram, Facebook, Globe, Image as ImageIcon, Search, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function MarketingPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState({
        description: '',
        instagram: '',
        facebook: '',
        tiktok: '',
        whatsapp_public: '',
        seo_title: '',
        seo_description: ''
    });

    const tenantId = 'resetspa'; // Mocked

    useEffect(() => {
        async function loadMarketingData() {
            setLoading(true);
            try {
                const docRef = doc(db, 'tenants', tenantId);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const tenantData = snap.data();
                    setData({
                        description: tenantData.descripcion || '',
                        instagram: tenantData.redes?.instagram || '',
                        facebook: tenantData.redes?.facebook || '',
                        tiktok: tenantData.redes?.tiktok || '',
                        whatsapp_public: tenantData.datos_contacto?.whatsapp || '',
                        seo_title: tenantData.seo?.title || '',
                        seo_description: tenantData.seo?.description || ''
                    });
                }
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar datos de marketing");
            } finally {
                setLoading(false);
            }
        }
        loadMarketingData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, 'tenants', tenantId);
            await updateDoc(docRef, {
                descripcion: data.description,
                "redes.instagram": data.instagram,
                "redes.facebook": data.facebook,
                "redes.tiktok": data.tiktok,
                "datos_contacto.whatsapp": data.whatsapp_public,
                "seo.title": data.seo_title,
                "seo.description": data.seo_description
            });
            toast.success("¡Configuración de Marketing guardada!");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 animate-pulse text-gray-400">Cargando configuración...</div>;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-montserrat text-gray-900">Marketing & Web Pública</h1>
                    <p className="text-gray-500">Personaliza cómo te ven tus clientes en internet.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#9381FF] hover:bg-[#8371ef] text-white rounded-full px-8 shadow-lg shadow-[#9381FF]/20"
                >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                    <Save className="ml-2 w-4 h-4" />
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Columna Izquierda: Redes y Contacto */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-6 space-y-6">
                        <div className="flex items-center gap-2 border-b pb-4">
                            <Globe className="text-[#9381FF] w-5 h-5" />
                            <h2 className="font-bold text-lg">Información Visual y RRSS</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Salón</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-[#9381FF] outline-none transition-all"
                                    placeholder="Cuéntale a tus clientes qué hace especial a tu salón..."
                                    value={data.description}
                                    onChange={(e) => setData({ ...data, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram (Usuario)</label>
                                    <div className="relative">
                                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            className="pl-10"
                                            placeholder="@tu_salon"
                                            value={data.instagram}
                                            onChange={(e) => setData({ ...data, instagram: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Facebook (Link)</label>
                                    <div className="relative">
                                        <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            className="pl-10"
                                            placeholder="facebook.com/tu_salon"
                                            value={data.facebook}
                                            onChange={(e) => setData({ ...data, facebook: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6">
                        <div className="flex items-center gap-2 border-b pb-4">
                            <Search className="text-[#9381FF] w-5 h-5" />
                            <h2 className="font-bold text-lg">SEO & Buscadores</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Página (SEO)</label>
                                <Input
                                    placeholder="Ej: El mejor salón de belleza en CABA | Reset Spa"
                                    value={data.seo_title}
                                    onChange={(e) => setData({ ...data, seo_title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Descripción</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[80px] text-sm focus:ring-2 focus:ring-[#9381FF] outline-none transition-all"
                                    placeholder="Breve resumen para Google..."
                                    value={data.seo_description}
                                    onChange={(e) => setData({ ...data, seo_description: e.target.value })}
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Columna Derecha: Galería y Preview */}
                <div className="space-y-6">
                    <Card className="p-6 space-y-6 bg-gray-900 text-white">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="text-[#9381FF] w-5 h-5" />
                            <h2 className="font-bold text-lg">Galería Visual</h2>
                        </div>
                        <p className="text-xs text-gray-400">Sube hasta 6 fotos de tu salón para mostrar en la web.</p>

                        <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center border border-dashed border-gray-700 hover:border-[#9381FF] cursor-pointer transition-all">
                                    <ImageIcon className="w-6 h-6 text-gray-600" />
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">Gestionar Imágenes</Button>
                    </Card>

                    <div className="p-6 bg-[#F8F7FF] rounded-3xl border border-[#E6E6FA] text-center">
                        <h3 className="font-bold text-[#9381FF] mb-2 uppercase tracking-tighter text-xs">Tu Web es:</h3>
                        <p className="text-sm font-mono truncate mb-4">resetsystem.vercel.app/{tenantId}</p>
                        <Button className="w-full rounded-full" variant="outline" onClick={() => window.open(`/${tenantId}`, '_blank')}>
                            Ver mi Página <Globe className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
