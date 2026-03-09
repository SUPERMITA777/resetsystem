"use client";

import React, { useState } from "react";
import { X, Clock, Calendar, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

interface AgendaSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentConfig: {
        intervalo: 10 | 15 | 30 | 60;
        horario_inicio: string;
        horario_fin: string;
    };
    onSave: (config: any) => Promise<void>;
}

export function AgendaSettingsModal({ isOpen, onClose, currentConfig, onSave }: AgendaSettingsModalProps) {
    const [config, setConfig] = useState(currentConfig);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(config);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Configurar Agenda</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Intervalo de Celdas</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[10, 15, 30, 60].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setConfig({ ...config, intervalo: val as any })}
                                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${config.intervalo === val
                                                ? 'bg-black text-white border-black shadow-md'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {val} min
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Hora Inicio</label>
                                <Input
                                    type="time"
                                    value={config.horario_inicio}
                                    onChange={(e) => setConfig({ ...config, horario_inicio: e.target.value })}
                                    className="rounded-xl border-gray-200 h-12"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Hora Final</label>
                                <Input
                                    type="time"
                                    value={config.horario_fin}
                                    onChange={(e) => setConfig({ ...config, horario_fin: e.target.value })}
                                    className="rounded-xl border-gray-200 h-12"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full bg-black text-white rounded-2xl h-14 font-bold text-lg shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                            <Save className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
