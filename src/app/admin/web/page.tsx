"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import {
    Globe, Layout as LayoutIcon, Palette, Image as ImageIcon,
    MessageSquare, Save, ChevronRight, Check, Sparkles,
    Instagram, Phone, MapPin, Search, Smartphone, Eye,
    Type
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getTenant, createOrUpdateTenant, TenantData } from "@/lib/services/tenantService";
import { useAuth } from "@/components/auth/AuthProvider";
import { GenericImageUploader } from "@/components/ui/GenericImageUploader";
import toast, { Toaster } from "react-hot-toast";

type ConfigSection = 'layout' | 'appearance' | 'multimedia' | 'contact' | 'seo';

export default function WebConfigPage() {
    const { tenantId: authTenantId, role } = useAuth();
    const [tenantId, setTenantId] = useState("resetspa");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<ConfigSection>('layout');

    const [config, setConfig] = useState({
        nombre_salon: '',
        logo_url: '',
        tema_visual: 'nude' as TenantData['tema_visual'],
        
        // Web Config specific
        layout_type: 'classic' as 'classic' | 'modern' | 'minimal',
        primary_color: '#000000',
        secondary_color: '#ffffff',
        accent_color: '#D4A5B2',
        hero_image_url: '',
        background_image_url: '',
        font_family: 'sans' as 'serif' | 'sans' | 'mono' | 'display' | 'elegant',
        
        public_title: '',
        public_subtitle: '',
        public_description: '',
        
        direccion: '',
        descripcion_contacto: '',
        telefono: '',
        instagram: '',
        whatsapp: '',
        
        seo_title: '',
        seo_description: '',
    });

    useEffect(() => {
        // Priorizar el tenantId de useAuth si no es superadmin, o el de localStorage si lo es
        const id = (role === 'superadmin' ? localStorage.getItem('currentTenant') : authTenantId) || localStorage.getItem('currentTenant') || 'resetspa';
        console.log("WebConfigPage: Usando tenantId:", id);
        setTenantId(id);
        loadTenantData(id);
    }, [authTenantId, role]);

    const loadTenantData = async (id: string) => {
        setLoading(true);
        try {
            const data = await getTenant(id);
            if (data) {
                setConfig({
                    nombre_salon: data.nombre_salon || '',
                    logo_url: data.logo_url || '',
                    tema_visual: data.tema_visual || 'nude',
                    
                    layout_type: data.web_config?.layout_type || 'classic',
                    primary_color: data.web_config?.primary_color || (data.tema_visual === 'nude' ? '#7b5460' : data.tema_visual === 'lavender' ? '#9381FF' : '#7D9D9C'),
                    secondary_color: data.web_config?.secondary_color || '#faf9f9',
                    accent_color: data.web_config?.accent_color || (data.tema_visual === 'nude' ? '#D4A5B2' : data.tema_visual === 'lavender' ? '#B8B8FF' : '#B4CFB0'),
                    hero_image_url: data.web_config?.hero_image_url || '',
                    background_image_url: data.web_config?.background_image_url || '',
                    font_family: (data.web_config?.font_family as any) || 'sans',
                    
                    public_title: data.config_clases?.public_title || "Cronograma de Clases",
                    public_subtitle: data.config_clases?.public_subtitle || "Encuentra el momento perfecto para renovarte",
                    public_description: data.config_clases?.public_description || "Una experiencia revitalizante diseñada para resetear tu cuerpo y mente en un ambiente exclusivo.",
                    
                    direccion: data.datos_contacto?.direccion || '',
                    descripcion_contacto: data.datos_contacto?.descripcion || '',
                    telefono: data.datos_contacto?.telefono || '',
                    instagram: data.datos_contacto?.instagram || '',
                    whatsapp: data.datos_contacto?.whatsapp || '',
                    
                    seo_title: data.web_config?.seo_title || data.nombre_salon,
                    seo_description: data.web_config?.seo_description || data.datos_contacto?.descripcion || '',
                });
            }
        } catch (error) {
            toast.error("Error al cargar la configuración");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!tenantId) {
            toast.error("Error: No se pudo identificar el salón");
            return;
        }
        setSaving(true);
        console.log("Guardando configuración para:", tenantId, config);
        try {
            await createOrUpdateTenant(tenantId, {
                nombre_salon: config.nombre_salon,
                logo_url: config.logo_url,
                tema_visual: config.tema_visual,
                web_config: {
                    layout_type: config.layout_type,
                    primary_color: config.primary_color,
                    secondary_color: config.secondary_color,
                    accent_color: config.accent_color,
                    hero_image_url: config.hero_image_url,
                    background_image_url: config.background_image_url,
                    seo_title: config.seo_title,
                    seo_description: config.seo_description,
                    font_family: config.font_family,
                },
                config_clases: {
                    public_title: config.public_title,
                    public_subtitle: config.public_subtitle,
                    public_description: config.public_description,
                },
                datos_contacto: {
                    direccion: config.direccion,
                    descripcion: config.descripcion_contacto,
                    telefono: config.telefono,
                    instagram: config.instagram,
                    whatsapp: config.whatsapp,
                },
            });
            
            toast.success("Configuración web guardada con éxito");
            console.log("Guardado exitoso!");
        } catch (error) {
            console.error("Error al guardar:", error);
            toast.error("Error al guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    const previewUrl = `/${tenantId}`;

    const sections = [
        { id: 'layout', icon: <LayoutIcon />, title: "Estructura & Layout", desc: "Elige entre diferentes plantillas para tu página principal." },
        { id: 'appearance', icon: <Palette />, title: "Colores & Estética", desc: "Define tu paleta de colores, tipografía y estilo visual." },
        { id: 'multimedia', icon: <ImageIcon />, title: "Banner & Multimedia", desc: "Gestiona las imágenes principales del hero y secciones." },
        { id: 'contact', icon: <MessageSquare />, title: "Contacto & Redes", desc: "Configura tus links de WhatsApp, Instagram y ubicación." },
        { id: 'seo', icon: <Globe />, title: "Dominio & SEO", desc: "Personaliza tu URL y metadatos para buscadores." }
    ];

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full animate-spin border-4 border-black border-t-transparent" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cargando Configuración...</span>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
                <Toaster />
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Configuración Web</h1>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-4 flex items-center gap-3">
                            <Globe className="w-4 h-4 text-black" /> Personaliza tu presencia online de forma profesional
                        </p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button 
                            variant="outline"
                            onClick={() => window.open(previewUrl, '_blank')}
                            className="flex-1 md:flex-none h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            Ver mi Web
                        </Button>
                        <Button 
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 md:flex-none bg-black text-white h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-black/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                            {saving ? (
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : <Save className="w-4 h-4" />}
                            {saving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Sidebar navigation */}
                    <div className="lg:col-span-3 space-y-3">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id as ConfigSection)}
                                className={`w-full p-6 rounded-[2rem] border transition-all flex items-center gap-5 text-left group ${
                                    activeSection === section.id 
                                        ? 'bg-black text-white border-black shadow-xl shadow-black/10' 
                                        : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                    activeSection === section.id ? 'bg-white/10 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-black group-hover:text-white'
                                }`}>
                                    {React.cloneElement(section.icon as React.ReactElement<{ className: string }>, { className: "w-4 h-4" })}
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-black uppercase tracking-widest leading-none">{section.title}</h3>
                                    <p className={`text-[9px] font-bold mt-1 leading-tight ${activeSection === section.id ? 'text-white/60' : 'text-gray-300'}`}>
                                        {section.id === activeSection ? "Editando ahora" : "Personalizar"}
                                    </p>
                                </div>
                                {activeSection === section.id && <ChevronRight className="w-4 h-4 ml-auto opacity-40" />}
                            </button>
                        ))}
                    </div>

                    {/* Main configuration area */}
                    <div className="lg:col-span-9 bg-white border border-gray-100 rounded-[3.5rem] p-10 shadow-sm min-h-[600px] animate-in slide-in-from-right-4 duration-500">
                        {activeSection === 'layout' && (
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                                        <LayoutIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight">Estructura & Layout</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Define cómo se organiza la información en tu web</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { id: 'classic', label: 'Clásico', desc: 'Ideal para salones de belleza tradicionales.' },
                                        { id: 'modern', label: 'Moderno', desc: 'Enfoque visual con grandes imágenes y tipografías.' },
                                        { id: 'minimal', label: 'Minimalista', desc: 'Limpio y directo, centrado en la reserva.' }
                                    ].map((layout) => (
                                        <div 
                                            key={layout.id}
                                            onClick={() => setConfig({...config, layout_type: layout.id as 'classic' | 'modern' | 'minimal'})}
                                            className={`relative p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer group ${
                                                config.layout_type === layout.id ? 'border-black bg-gray-50' : 'border-gray-50 hover:border-gray-200'
                                            }`}
                                        >
                                            {config.layout_type === layout.id && (
                                                <div className="absolute top-6 right-6 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center animate-in zoom-in">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                            )}
                                            <div className={`w-full aspect-video rounded-2xl mb-6 bg-white border border-gray-100 flex items-center justify-center transition-transform group-hover:scale-105 ${config.layout_type === layout.id ? 'shadow-inner' : 'shadow-sm'}`}>
                                                <LayoutIcon className={`w-8 h-8 ${config.layout_type === layout.id ? 'text-black' : 'text-gray-100'}`} />
                                            </div>
                                            <h4 className="text-[11px] font-black uppercase tracking-widest mb-2">{layout.label}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold leading-relaxed">{layout.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSection === 'appearance' && (
                            <div className="space-y-10">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                                        <Palette className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight">Colores & Estética</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Personaliza la identidad visual de tu marca</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Preajustes de Tema</Label>
                                            <div className="grid grid-cols-1 gap-3 mt-3">
                                                {[
                                                    { id: 'nude', label: 'Nude & Rose Gold', color: 'bg-[#D4A5B2]', primary: '#7b5460', accent: '#D4A5B2' },
                                                    { id: 'lavender', label: 'Minimalist Lavender', color: 'bg-[#9381FF]', primary: '#9381FF', accent: '#B8B8FF' },
                                                    { id: 'sage', label: 'Sage & Cream', color: 'bg-[#7D9D9C]', primary: '#7D9D9C', accent: '#B4CFB0' }
                                                ].map((theme) => (
                                                    <button
                                                        key={theme.id}
                                                        type="button"
                                                        onClick={() => setConfig({
                                                            ...config, 
                                                            tema_visual: theme.id as any,
                                                            primary_color: theme.primary,
                                                            accent_color: theme.accent
                                                        })}
                                                        className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                                                            config.tema_visual === theme.id ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-full shadow-inner ${theme.color} transition-transform group-hover:scale-110`} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{theme.label}</span>
                                                        </div>
                                                        {config.tema_visual === theme.id && <Check className="w-4 h-4" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Tipografía Principal</Label>
                                            <div className="grid grid-cols-5 gap-3 mt-3">
                                                {[
                                                    { id: 'serif', label: 'Serif', font: 'font-serif' },
                                                    { id: 'sans', label: 'Sans-Serif', font: 'font-sans' },
                                                    { id: 'mono', label: 'Monospace', font: 'font-mono' },
                                                    { id: 'display', label: 'Display', font: 'font-serif italic' },
                                                    { id: 'elegant', label: 'Elegante', font: 'font-sans tracking-widest' }
                                                ].map((f) => (
                                                    <button
                                                        key={f.id}
                                                        type="button"
                                                        onClick={() => setConfig({...config, font_family: f.id as any})}
                                                        className={`p-4 rounded-2xl border-2 transition-all text-center ${
                                                            config.font_family === f.id ? 'border-black bg-black text-white' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                                                        }`}
                                                    >
                                                        <span className={`text-xl block mb-1 ${f.font}`}>Aa</span>
                                                        <span className="text-[8px] font-black uppercase tracking-widest leading-none block h-4">{f.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Colores Personalizados</Label>
                                        
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                                <div className="space-y-1">
                                                    <h4 className="text-[11px] font-black uppercase tracking-widest">Color Primario</h4>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Títulos y elementos destacados</p>
                                                </div>
                                                <input 
                                                    type="color" 
                                                    value={config.primary_color}
                                                    onChange={e => setConfig({...config, primary_color: e.target.value})}
                                                    className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                                <div className="space-y-1">
                                                    <h4 className="text-[11px] font-black uppercase tracking-widest">Color de Acento</h4>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Botones y llamadas a la acción</p>
                                                </div>
                                                <input 
                                                    type="color" 
                                                    value={config.accent_color}
                                                    onChange={e => setConfig({...config, accent_color: e.target.value})}
                                                    className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                                <div className="space-y-1">
                                                    <h4 className="text-[11px] font-black uppercase tracking-widest">Color de Fondo</h4>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Fondo general de la web</p>
                                                </div>
                                                <input 
                                                    type="color" 
                                                    value={config.secondary_color}
                                                    onChange={e => setConfig({...config, secondary_color: e.target.value})}
                                                    className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'multimedia' && (
                            <div className="space-y-10">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight">Banner & Multimedia</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Gestiona las imágenes de tu salón</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Logo del Salón</Label>
                                        <GenericImageUploader 
                                            tenantId={tenantId}
                                            currentImage={config.logo_url}
                                            onImageChange={url => setConfig({...config, logo_url: url})}
                                            label="Logo"
                                            aspectRatio="square"
                                        />
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2">Formato recomendado: PNG transparente (512x512px)</p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Imagen de Portada (Hero)</Label>
                                        <GenericImageUploader 
                                            tenantId={tenantId}
                                            currentImage={config.hero_image_url}
                                            onImageChange={url => setConfig({...config, hero_image_url: url})}
                                            label="Portada"
                                            aspectRatio="video"
                                        />
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2">Banner principal. Formato recomendado: JPG/WebP (1920x1080px)</p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Imagen de Fondo (General)</Label>
                                        <GenericImageUploader 
                                            tenantId={tenantId}
                                            currentImage={config.background_image_url}
                                            onImageChange={url => setConfig({...config, background_image_url: url})}
                                            label="Fondo"
                                            aspectRatio="video"
                                        />
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2">Se muestra como fondo de la página. Formato recomendado: JPG suave/textura.</p>
                                    </div>
                                </div>

                                <div className="pt-10 space-y-6">
                                    <div className="p-8 bg-black rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
                                        <div className="max-w-md">
                                            <h4 className="text-lg font-black uppercase tracking-tight mb-2">Títulos & Textos Hero</h4>
                                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Personaliza el mensaje principal que ven tus clientes al ingresar.</p>
                                        </div>
                                        <div className="space-y-4 w-full md:w-80">
                                            <div className="relative">
                                                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                <Input 
                                                    value={config.public_title}
                                                    onChange={e => setConfig({...config, public_title: e.target.value})}
                                                    className="h-12 pl-12 rounded-2xl bg-white/10 border-none text-white font-bold text-sm focus:ring-2 focus:ring-white/20"
                                                    placeholder="Título principal"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                <Input 
                                                    value={config.public_subtitle}
                                                    onChange={e => setConfig({...config, public_subtitle: e.target.value})}
                                                    className="h-12 pl-12 rounded-2xl bg-white/10 border-none text-white font-bold text-sm focus:ring-2 focus:ring-white/20"
                                                    placeholder="Subtítulo corto"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'contact' && (
                            <div className="space-y-10">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight">Contacto & Redes</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cómo y dónde encontrarte</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">WhatsApp Reservas</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                                <Input 
                                                    value={config.whatsapp}
                                                    onChange={e => setConfig({...config, whatsapp: e.target.value})}
                                                    placeholder="+54 9 11 ..."
                                                    className="h-12 pl-12 rounded-2xl bg-gray-50 border-none font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Instagram (@usuario)</Label>
                                            <div className="relative">
                                                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                                                <Input 
                                                    value={config.instagram}
                                                    onChange={e => setConfig({...config, instagram: e.target.value})}
                                                    placeholder="@resetsystem"
                                                    className="h-12 pl-12 rounded-2xl bg-gray-50 border-none font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Ubicación / Dirección</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                                <Input 
                                                    value={config.direccion}
                                                    onChange={e => setConfig({...config, direccion: e.target.value})}
                                                    placeholder="Av. Santa Fe 1234, CABA"
                                                    className="h-12 pl-12 rounded-2xl bg-gray-50 border-none font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Descripción de Contacto</Label>
                                        <textarea 
                                            value={config.descripcion_contacto}
                                            onChange={e => setConfig({...config, descripcion_contacto: e.target.value})}
                                            className="w-full h-full min-h-[160px] p-6 rounded-[2.5rem] bg-gray-50 border-none font-medium text-sm outline-none resize-none focus:ring-2 focus:ring-black transition-all"
                                            placeholder="Información adicional sobre horarios, estacionamiento o cómo llegar..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'seo' && (
                            <div className="space-y-10">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight">Dominio & SEO</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Optimiza tu presencia en buscadores</p>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="p-10 bg-gray-900 rounded-[3rem] text-white space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                                <Search className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-lg font-black uppercase tracking-tight">Previsualización en Google</h4>
                                        </div>

                                        <div className="bg-white rounded-3xl p-8 space-y-2">
                                            <p className="text-emerald-700 text-xs font-medium">resetsystem.vercel.app › salon › {tenantId}</p>
                                            <h5 className="text-blue-700 text-xl font-medium hover:underline cursor-pointer">
                                                {config.seo_title || config.nombre_salon}
                                            </h5>
                                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                                                {config.seo_description || config.descripcion_contacto || "Reserva tu turno online en nuestro salón. Calidad y exclusividad garantizada."}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Título SEO</Label>
                                                <Input 
                                                    value={config.seo_title}
                                                    onChange={e => setConfig({...config, seo_title: e.target.value})}
                                                    className="h-12 bg-white/10 border-none text-white rounded-2xl font-bold"
                                                    placeholder="Título para buscadores"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Descripción SEO</Label>
                                                <Input 
                                                    value={config.seo_description}
                                                    onChange={e => setConfig({...config, seo_description: e.target.value})}
                                                    className="h-12 bg-white/10 border-none text-white rounded-2xl font-bold"
                                                    placeholder="Resumen para buscadores"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Live Preview / Landing Page Link */}
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-[4rem] p-16 border border-white/5 text-center space-y-8 shadow-2xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl">
                            <Smartphone className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Presencia Web</p>
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Tu web está lista para vender</h2>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-white/50 text-sm font-medium max-w-md mx-auto">
                            Puedes acceder a tu sitio público en cualquier momento desde el botón <b>"VER MI WEB"</b> del panel lateral izquierdo.
                        </p>
                        <div className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-full border border-white/10">
                            <Globe className="w-3 h-3 text-white/40" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">URL de tu salón:</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">{window.location.origin}/{tenantId}</span>
                        </div>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Cualquier cambio guardado se reflejará instantáneamente</p>
                </div>
            </div>
        </AdminLayout>
    );
}
