"use client";

import React, { useState, useEffect } from "react";
import { tarotService, TarotReading } from "@/lib/services/tarotService";
import { Loader2, ExternalLink, Sparkles, User, MessageCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";

export default function AdminTarotPage() {
    const [readings, setReadings] = useState<TarotReading[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState("");

    useEffect(() => {
        const id = localStorage.getItem('currentTenant') || 'resetspa';
        setTenantId(id);
        loadReadings(id);
    }, []);

    const loadReadings = async (id: string) => {
        setLoading(true);
        try {
            const data = await tarotService.getReadingsByTenant(id);
            setReadings(data);
        } catch (error) {
            toast.error("Error al cargar las lecturas");
        } finally {
            setLoading(false);
        }
    };

    const publicUrl = `${window.location.protocol}//${window.location.host}/tarot/${tenantId}`;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Sparkles className="text-purple-600" /> Tarot Web
                </h1>
                <p className="text-gray-500">Gestiona y visualiza las consultas al oráculo de tus clientes.</p>
            </header>

            {/* Public Link Card */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white mb-10 shadow-lg shadow-purple-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Tu Oráculo Personalizado</h2>
                        <p className="opacity-90">Comparte este link en tus redes para que tus clientes reciban su lectura.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 p-4 rounded-2xl border border-white/20">
                        <code className="text-sm font-bold truncate max-w-[200px] md:max-w-xs">{publicUrl}</code>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(publicUrl);
                                toast.success("Link copiado al portapapeles");
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Copiar Link"
                        >
                            <ExternalLink size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Readings Table */}
            <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800">Lecturas Recientes</h3>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center">
                        <Loader2 className="animate-spin text-purple-600" size={40} />
                    </div>
                ) : readings.length === 0 ? (
                    <div className="p-20 text-center">
                        <p className="text-gray-400 italic">Aún no se han realizado lecturas.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Consultante</th>
                                    <th className="px-6 py-4">Pregunta</th>
                                    <th className="px-6 py-4">Cartas</th>
                                    <th className="px-6 py-4">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {readings.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(r.createdAt.toDate(), "dd MMM, HH:mm", { locale: es })}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-purple-400" />
                                                {r.usuario}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                            {r.pregunta}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                {r.cartas.map((c, i) => (
                                                    <div 
                                                        key={i} 
                                                        className={`w-8 h-8 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-600 ${c.invertida ? "rotate-180" : ""}`}
                                                        title={`${c.nombre} (${c.invertida ? "Invertida" : "Normal"})`}
                                                    >
                                                        {c.nombre.charAt(0)}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => {
                                                    // TODO: Show full interpretation modal
                                                    toast("Próximamente: Ver detalle completo", { icon: "ℹ️" });
                                                }}
                                                className="text-purple-600 hover:text-purple-800 text-sm font-bold"
                                            >
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
