"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { TenantData, createOrUpdateTenant, getTenant } from '@/lib/services/tenantService';
import { GenericImageUploader } from '@/components/ui/GenericImageUploader';
import toast from 'react-hot-toast';
import { 
    Settings, Save, X, Type, MessageSquare, Layout, 
    Palette, Image as ImageIcon, Globe, Share2, 
    Smartphone, MousePointer2, Sparkles, Instagram, 
    Phone, MapPin, ExternalLink
} from 'lucide-react';

interface WebConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string;
    onSaveSuccess: () => void;
}

export function WebConfigModal({ isOpen, onClose, tenantId, onSaveSuccess }: WebConfigModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [activeTab, setActiveTab] = useState<'content' | 'appearance' | 'contact'>('content');
    
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
        
        public_title: 'Cronograma de Clases',
        public_subtitle: 'Encuentra el momento perfecto para renovarte',
        public_description: 'Una experiencia revitalizante diseñada para resetear tu cuerpo y mente en un ambiente exclusivo.',
        
        direccion: '',
        descripcion_contacto: '',
        telefono: '',
        instagram: '',
        whatsapp: '',
    });

    useEffect(() => {
        if (isOpen && tenantId) {
            loadTenantData();
        }
    }, [isOpen, tenantId]);

    const loadTenantData = async () => {
        setFetching(true);
        try {
            const data = await getTenant(tenantId);
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
                });
            }
        } catch (error) {
            toast.error("Error al cargar la configuración");
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
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
            onSaveSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la configuración");
        } finally {
            setLoading(false);
        }
    };

    if (fetching && isOpen) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Cargando..." maxWidth="max-w-3xl">
                <div className="py-20 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest text-xs">Obteniendo configuración...</div>
            </Modal>
        );
    }

    const tabs = [
        { id: 'content', label: 'Contenido', icon: Layout },
        { id: 'appearance', label: 'Apariencia', icon: Palette },
        { id: 'contact', label: 'Contacto & Redes', icon: Share2 },
    ];

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Personalizar Experiencia Web"
            maxWidth="max-w-3xl"
        >
            <div className="flex flex-col gap-6 py-2">
                {/* Tab Bar */}
                <div className="flex p-1 bg-gray-100 rounded-[2rem] self-start mb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {activeTab === 'content' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Nombre del Salón</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <Input 
                                            value={config.nombre_salon}
                                            onChange={e => setConfig({...config, nombre_salon: e.target.value})}
                                            className="h-12 pl-12 rounded-2xl bg-gray-50 border-none shadow-sm focus:ring-2 focus:ring-black font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Título Hero (Web Clases)</Label>
                                    <div className="relative">
                                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <Input 
                                            value={config.public_title}
                                            onChange={e => setConfig({...config, public_title: e.target.value})}
                                            className="h-12 pl-12 rounded-2xl bg-gray-50 border-none shadow-sm focus:ring-2 focus:ring-black font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Subtítulo Hero</Label>
                                    <div className="relative">
                                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <Input 
                                            value={config.public_subtitle}
                                            onChange={e => setConfig({...config, public_subtitle: e.target.value})}
                                            className="h-12 pl-12 rounded-2xl bg-gray-50 border-none shadow-sm focus:ring-2 focus:ring-black font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Descripción de la Experiencia</Label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-gray-300" />
                                        <textarea 
                                            value={config.public_description}
                                            onChange={e => setConfig({...config, public_description: e.target.value})}
                                            className="w-full min-h-[160px] pl-12 pr-4 pt-3.5 rounded-2xl bg-gray-50 border-none shadow-sm focus:ring-2 focus:ring-black transition-all font-medium text-sm outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Logo Principal</Label>
                                    <GenericImageUploader 
                                        tenantId={tenantId}
                                        currentImage={config.logo_url}
                                        onImageChange={url => setConfig({...config, logo_url: url})}
                                        label="Logo"
                                        aspectRatio="square"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Tema de Color</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['nude', 'lavender', 'sage'].map(theme => (
                                            <button
                                                key={theme}
                                                type="button"
                                                onClick={() => setConfig({...config, tema_visual: theme as any})}
                                                className={`h-16 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${config.tema_visual === theme ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full shadow-inner ${theme === 'nude' ? 'bg-[#D4A5B2]' : theme === 'lavender' ? 'bg-[#9381FF]' : 'bg-[#7D9D9C]'}`} />
                                                <span className="text-[8px] font-black uppercase tracking-widest">{theme}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Imagen Hero / Portada</Label>
                                    <GenericImageUploader 
                                        tenantId={tenantId}
                                        currentImage={config.hero_image_url}
                                        onImageChange={url => setConfig({...config, hero_image_url: url})}
                                        label="Portada"
                                        aspectRatio="video"
                                    />
                                </div>
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <p className="text-[9px] font-bold text-amber-700 leading-relaxed uppercase tracking-widest">
                                        💡 La imagen de portada es lo primero que ven tus clientes. Recomendamos usar una foto de alta calidad de tu salón o equipo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contact' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">WhatsApp de Reservas</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                        <Input 
                                            value={config.whatsapp}
                                            onChange={e => setConfig({...config, whatsapp: e.target.value})}
                                            placeholder="+54 9 11 ..."
                                            className="h-12 pl-12 rounded-2xl bg-gray-50 border-none shadow-sm focus:ring-2 focus:ring-black font-bold"
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
                                            className="h-12 pl-12 rounded-2xl bg-gray-50 border-none shadow-sm focus:ring-2 focus:ring-black font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Dirección del Local</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                        <Input 
                                            value={config.direccion}
                                            onChange={e => setConfig({...config, direccion: e.target.value})}
                                            className="h-12 pl-12 rounded-2xl bg-gray-50 border-none shadow-sm focus:ring-2 focus:ring-black font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center text-center gap-4">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <ExternalLink className="w-8 h-8 text-black" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tight">Tu Web Pública</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">resetsystem.vercel.app/{tenantId}</p>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="mt-4 rounded-xl border-[#9381FF] text-[#9381FF] hover:bg-[#9381FF] hover:text-white transition-all w-full h-11 text-[10px] font-black uppercase tracking-widest"
                                        onClick={() => window.open(`/${tenantId}`, '_blank')}
                                    >
                                        Previsualizar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 h-14 bg-black text-white hover:bg-gray-800 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : <Save className="w-4 h-4" />}
                            {loading ? "Guardando..." : "Aplicar Cambios a mi Web"}
                        </Button>
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-6 h-14 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}