"use client";

import React, { useState, useEffect } from "react";
import { tarotService, TarotCard } from "@/lib/services/tarotService";
import { Loader2, Save, Edit2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

const INITIAL_CARDS = [
    { id: "el-carro", nombre: "El Carro", img: "/assets/tarot/el-carro.png" },
    { id: "el-colgado", nombre: "El Colgado", img: "/assets/tarot/el-colgado.png" },
    { id: "el-diablo", nombre: "El Diablo", img: "/assets/tarot/el-diablo.png" },
    { id: "el-emperador", nombre: "El Emperador", img: "/assets/tarot/el-emperador.png" },
    { id: "el-ermitano", nombre: "El Ermitaño", img: "/assets/tarot/el-ermitano.png" },
    { id: "el-hierofante", nombre: "El Hierofante", img: "/assets/tarot/el-hierofante.png" },
    { id: "el-juicio", nombre: "El Juicio", img: "/assets/tarot/el-juicio.png" },
    { id: "el-loco", nombre: "El Loco", img: "/assets/tarot/el-loco.png" },
    { id: "el-mago", nombre: "El Mago", img: "/assets/tarot/el-mago.png" },
    { id: "el-mundo", nombre: "El Mundo", img: "/assets/tarot/el-mundo.png" },
    { id: "el-sol", nombre: "El Sol", img: "/assets/tarot/el-sol.png" },
    { id: "la-emperatriz", nombre: "La Emperatriz", img: "/assets/tarot/la-emperatriz.png" },
    { id: "la-estrella", nombre: "La Estrella", img: "/assets/tarot/la-estrella.png" },
    { id: "la-fuerza", nombre: "La Fuerza", img: "/assets/tarot/la-fuerza.png" },
    { id: "la-justicia", nombre: "La Justicia", img: "/assets/tarot/la-justicia.png" },
    { id: "la-muerte", nombre: "La Muerte", img: "/assets/tarot/la-muerte.png" },
    { id: "la-rueda", nombre: "La Rueda de la Fortuna", img: "/assets/tarot/la-rueda.png" },
    { id: "la-sacerdotisa", nombre: "La Sacerdotisa", img: "/assets/tarot/la-sacerdotisa.png" },
    { id: "la-templanza", nombre: "La Templanza", img: "/assets/tarot/la-templanza.png" },
    { id: "la-torre", nombre: "La Torre", img: "/assets/tarot/la-torre.png" },
    { id: "los-enamorados", nombre: "Los Enamorados", img: "/assets/tarot/los-enamorados.png" },
];

export default function TarotAdminPage() {
    const [cards, setCards] = useState<TarotCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCard, setEditingCard] = useState<TarotCard | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        setLoading(true);
        try {
            const data = await tarotService.getAllCards();
            if (data.length === 0) {
                // Auto-seed
                const seed: TarotCard[] = INITIAL_CARDS.map(c => ({
                    id: c.id,
                    nombre: c.nombre,
                    imagen_url: c.img,
                    significado_normal: `Significado tradicional de ${c.nombre}.`,
                    significado_invertido: `Significado invertido de ${c.nombre}.`
                }));
                await tarotService.seedCards(seed);
                setCards(seed);
            } else {
                setCards(data);
            }
        } catch (error) {
            toast.error("Error al cargar las cartas");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (card: TarotCard) => {
        setEditingCard({ ...card });
    };

    const handleSave = async () => {
        if (!editingCard) return;
        setSaving(true);
        try {
            await tarotService.saveCard(editingCard);
            toast.success("Carta guardada correctamente");
            setEditingCard(null);
            loadCards();
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-purple-600" size={40} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Tarot Configuration</h1>
                    <p className="text-gray-500">Configura los significados y nombres de tus arcanos mayores.</p>
                </div>
                <button 
                    onClick={loadCards}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50"
                >
                    <RotateCcw size={16} /> Refrescar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map(card => (
                    <div key={card.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-[2/3] relative bg-gray-100">
                            <img 
                                src={card.imagen_url} 
                                alt={card.nombre}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">{card.nombre}</h3>
                            <button 
                                onClick={() => handleEdit(card)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
                            >
                                <Edit2 size={18} /> Configurar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal / Slide-over */}
            {editingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
                            <h2 className="text-2xl font-bold text-gray-800">Editando {editingCard.nombre}</h2>
                            <button 
                                onClick={() => setEditingCard(null)}
                                className="text-gray-400 hover:text-gray-600 p-2"
                            >
                                <RotateCcw className="rotate-45" size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la carta</label>
                                <input 
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 font-bold"
                                    value={editingCard.nombre}
                                    onChange={e => setEditingCard({...editingCard, nombre: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-purple-600 mb-2">Significado Normal</label>
                                <textarea 
                                    rows={4}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500"
                                    value={editingCard.significado_normal}
                                    onChange={e => setEditingCard({...editingCard, significado_normal: e.target.value})}
                                    placeholder="Instrucciones para la IA..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-orange-600 mb-2">Significado Invertido</label>
                                <textarea 
                                    rows={4}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500"
                                    value={editingCard.significado_invertido}
                                    onChange={e => setEditingCard({...editingCard, significado_invertido: e.target.value})}
                                    placeholder="Instrucciones para la IA cuando la carta está invertida..."
                                />
                            </div>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-2xl font-bold text-lg hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-200"
                            >
                                {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
