"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UsersManagementTab } from "@/components/admin/settings/UsersManagementTab";
import { Store, Users, Save, Phone, Image as ImageIcon } from "lucide-react";
import { getTenant, createOrUpdateTenant, TenantData } from "@/lib/services/tenantService";
import { LogoUploader } from "@/components/ui/LogoUploader";
import toast, { Toaster } from "react-hot-toast";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'salon' | 'users'>('salon');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [nombreSalon, setNombreSalon] = useState('');
    const [configBoxes, setConfigBoxes] = useState(7);
    const [temaVisual, setTemaVisual] = useState<'nude' | 'lavender' | 'sage'>('nude');
    const [whatsapp, setWhatsapp] = useState('');
    const [direccion, setDireccion] = useState('');
    const [telefono, setTelefono] = useState('');
    const [instagram, setInstagram] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    useEffect(() => {
        loadTenantData();
    }, [tenantId]);

    const loadTenantData = async () => {
        setLoading(true);
        try {
            const data = await getTenant(tenantId);
            if (data) {
                setNombreSalon(data.nombre_salon || '');
                setConfigBoxes(data.config_boxes || 7);
                setTemaVisual(data.tema_visual || 'nude');
                setWhatsapp(data.datos_contacto?.whatsapp || '');
                setDireccion(data.datos_contacto?.direccion || '');
                setTelefono(data.datos_contacto?.telefono || '');
                setInstagram(data.datos_contacto?.instagram || '');
                setDescripcion(data.datos_contacto?.descripcion || '');
                setLogoUrl(data.logo_url || '');
            }
        } catch (error) {
            toast.error("Error al cargar configuración");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await createOrUpdateTenant(tenantId, {
                nombre_salon: nombreSalon,
                config_boxes: configBoxes,
                tema_visual: temaVisual,
                logo_url: logoUrl,
                datos_contacto: {
                    whatsapp,
                    direccion,
                    telefono,
                    instagram,
                    descripcion,
                },
            });
            toast.success("Configuración guardada con éxito");
        } catch (error) {
            toast.error("Error al guardar configuración");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 w-full max-w-5xl animate-in fade-in duration-500">
                <Toaster />
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-montserrat">Configuración</h1>
                        <p className="text-gray-500 mt-1">Personaliza y gestiona los accesos de tu salón.</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-gray-100 rounded-2xl self-start">
                    <button
                        onClick={() => setActiveTab('salon')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'salon' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Store className="w-4 h-4" />
                        Detalles del Salón
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users className="w-4 h-4" />
                        Gestión de Usuarios
                    </button>
                </div>

                {activeTab === 'salon' ? (
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 border-b border-gray-50">
                            <h2 className="text-2xl font-bold text-gray-900">Datos Generales</h2>
                            <p className="text-sm text-gray-500 mt-1">Información pública y operativa de la sucursal.</p>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4" />
                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Cargando Configuración</span>
                            </div>
                        ) : (
                            <div className="p-8 space-y-12">
                                {/* Logo Section */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start border-b border-gray-50 pb-12">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-gray-900">Logo del Salón</h3>
                                        <p className="text-sm text-gray-500 italic">Este logo aparecerá en la página pública, tickets y comunicaciones.</p>
                                    </div>
                                    <div className="md:col-span-2 max-w-md">
                                        <LogoUploader 
                                            tenantId={tenantId} 
                                            currentLogo={logoUrl} 
                                            onLogoChange={setLogoUrl} 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none">Nombre del Salón</label>
                                        <Input
                                            value={nombreSalon}
                                            onChange={(e) => setNombreSalon(e.target.value)}
                                            className="rounded-xl border-gray-200 h-12"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none">Cantidad de Boxes / Estaciones</label>
                                        <Input
                                            type="number"
                                            value={configBoxes}
                                            onChange={(e) => setConfigBoxes(Number(e.target.value))}
                                            className="rounded-xl border-gray-200 h-12"
                                        />
                                        <p className="text-xs text-gray-400 mt-2">Define cuántos turnos simultáneos se pueden agendar.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none">Tema Visual</label>
                                        <select
                                            value={temaVisual}
                                            onChange={(e) => setTemaVisual(e.target.value as any)}
                                            className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                        >
                                            <option value="nude">Nude & Rose Gold (Default)</option>
                                            <option value="lavender">Minimalist Lavender</option>
                                            <option value="sage">Sage & Cream</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none">Zona Horaria</label>
                                        <select className="flex h-12 w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm text-gray-500" disabled>
                                            <option value="UTC-3">Buenos Aires (UTC-3)</option>
                                        </select>
                                        <p className="text-[10px] text-gray-400 mt-2 italic">Ajustable únicamente por Superadmin.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-emerald-500" />
                                            WhatsApp del Salón
                                        </label>
                                        <Input
                                            value={whatsapp}
                                            onChange={(e) => setWhatsapp(e.target.value)}
                                            placeholder="+54 9 11 6476-0590"
                                            className="rounded-xl border-gray-200 h-12"
                                        />
                                        <p className="text-xs text-gray-400 mt-2">Número al que los clientes enviarán solicitudes de turno desde la web.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none">Dirección</label>
                                        <Input
                                            value={direccion}
                                            onChange={(e) => setDireccion(e.target.value)}
                                            placeholder="Dirección del local"
                                            className="rounded-xl border-gray-200 h-12"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none">Teléfono</label>
                                        <Input
                                            value={telefono}
                                            onChange={(e) => setTelefono(e.target.value)}
                                            placeholder="Teléfono fijo o celular"
                                            className="rounded-xl border-gray-200 h-12"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none">Instagram</label>
                                        <Input
                                            value={instagram}
                                            onChange={(e) => setInstagram(e.target.value)}
                                            placeholder="@tuinstagram"
                                            className="rounded-xl border-gray-200 h-12"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 leading-none">Descripción Pública</label>
                                    <textarea
                                        value={descripcion}
                                        onChange={(e) => setDescripcion(e.target.value)}
                                        placeholder="Breve descripción del salón para la página pública..."
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black h-24 resize-none"
                                    />
                                </div>

                                <div className="md:col-span-2 pt-4">
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="bg-black text-white rounded-2xl px-10 h-14 font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-gray-200 flex items-center gap-2"
                                    >
                                        {saving ? (
                                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                        ) : (
                                            <Save className="w-5 h-5" />
                                        )}
                                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <UsersManagementTab tenantId={tenantId} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
