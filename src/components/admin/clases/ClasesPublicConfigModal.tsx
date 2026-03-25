import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { TenantData, createOrUpdateTenant } from '@/lib/services/tenantService';
import toast from 'react-hot-toast';
import { Settings, Save, X, Type, MessageSquare, Layout } from 'lucide-react';

interface ClasesPublicConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: TenantData | null;
    onSaveSuccess: () => void;
}

export function ClasesPublicConfigModal({ isOpen, onClose, tenant, onSaveSuccess }: ClasesPublicConfigModalProps) {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        public_title: tenant?.config_clases?.public_title || "Cronograma de Clases",
        public_subtitle: tenant?.config_clases?.public_subtitle || "Encuentra el momento perfecto para renovarte",
        public_description: tenant?.config_clases?.public_description || "Una experiencia revitalizante diseñada para resetear tu cuerpo y mente en un ambiente exclusivo."
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant) return;

        setLoading(true);
        try {
            await createOrUpdateTenant(tenant.slug, {
                config_clases: config
            });
            toast.success("Configuración guardada correctamente");
            onSaveSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la configuración");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Configurar Página Pública"
            maxWidth="max-w-xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6 py-2">
                <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 space-y-6">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Título Principal</Label>
                        <div className="relative">
                            <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <Input 
                                value={config.public_title}
                                onChange={e => setConfig({...config, public_title: e.target.value})}
                                placeholder="Ej: Cronograma de Clases"
                                className="h-12 pl-12 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-black transition-all font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Subtítulo / Eslogan</Label>
                        <div className="relative">
                            <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <Input 
                                value={config.public_subtitle}
                                onChange={e => setConfig({...config, public_subtitle: e.target.value})}
                                placeholder="Ej: Encuentra el momento perfecto..."
                                className="h-12 pl-12 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-black transition-all font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Descripción Corta</Label>
                        <div className="relative">
                            <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-gray-300" />
                            <textarea 
                                value={config.public_description}
                                onChange={e => setConfig({...config, public_description: e.target.value})}
                                placeholder="Escribe una breve descripción para tus alumnos..."
                                className="w-full min-h-[100px] pl-12 pr-4 pt-3.5 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-black transition-all font-medium text-sm outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <Button 
                        type="submit" 
                        disabled={loading}
                        className="flex-1 h-14 bg-black text-white hover:bg-gray-800 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all"
                    >
                        {loading ? "Guardando..." : "Guardar Cambios"}
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
        </Modal>
    );
}
