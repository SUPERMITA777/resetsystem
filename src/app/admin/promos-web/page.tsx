"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Gift, Trophy, Plus, Trash2, Edit3, RotateCcw, Copy, Check, X, Save, Power, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import {
    PromoWeb, Premio,
    getPromos, createPromo, updatePromo,
    getPremios, createPremio, updatePremio, deletePremio,
    getParticipantes, resetParticipante,
    reserveShortLink, releaseShortLink,
} from "@/lib/services/promoWebService";


type Tab = "premios" | "ganadores";

interface PremioForm {
    nombre: string;
    descripcion: string;
    tipo: "descuento" | "regalo" | "otro";
    vencimientoStr: string;
    probabilidad: number;
    stock?: number | "";
    activo: boolean;
}
const emptyForm = (): PremioForm => ({
    nombre: "",
    descripcion: "",
    tipo: "descuento",
    vencimientoStr: "",
    probabilidad: 5,
    stock: "",
    activo: true,
});

// Helper para convertir fechas que vienen del proxy
function parseProxyDate(dateObj: any): Date | null {
    if (!dateObj) return null;
    if (typeof dateObj === 'string') return new Date(dateObj);
    if (dateObj._seconds) return new Date(dateObj._seconds * 1000);
    if (dateObj.seconds) return new Date(dateObj.seconds * 1000);
    return null;
}

export default function PromosWebPage() {
    const TENANT_ID = typeof window !== "undefined" ? localStorage.getItem("currentTenant") || "resetspa" : "resetspa";
    const [tab, setTab] = useState<Tab>("premios");
    const [promos, setPromos] = useState<PromoWeb[]>([]);
    const [selectedPromo, setSelectedPromo] = useState<PromoWeb | null>(null);
    const [premios, setPremios] = useState<Premio[]>([]);
    const [ganadores, setGanadores] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'ganado_en', direction: 'desc' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    // form for promo config
    const [promoForm, setPromoForm] = useState({ nombre: "", whatsapp_negocio: "", subtitulo_logo: "¡Tu mejor versión! ✨", short_code: "", activa: true });

    // form for prizes
    const [showPremioModal, setShowPremioModal] = useState(false);
    const [editingPremio, setEditingPremio] = useState<Premio | null>(null);
    const [premioForm, setPremioForm] = useState<PremioForm>(emptyForm());

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const list = await getPromos(TENANT_ID);
            setPromos(list);
            if (list.length > 0) {
                const p = list[0];
                setSelectedPromo(p);
                setPromoForm({ nombre: p.nombre, whatsapp_negocio: p.whatsapp_negocio, subtitulo_logo: p.subtitulo_logo || "¡Tu mejor versión! ✨", short_code: p.short_code || "", activa: p.activa });
                const [premiosList, ganList] = await Promise.all([
                    getPremios(TENANT_ID, p.id),
                    getParticipantes(TENANT_ID, p.id),
                ]);
                setPremios(premiosList);
                setGanadores(ganList);
            }
        } catch (e) {
            toast.error("Error al cargar promos");
        } finally {
            setLoading(false);
        }
    }, [TENANT_ID]);

    useEffect(() => { loadData(); }, [loadData]);

    const sortedAndFilteredGanadores = React.useMemo(() => {
        let result = [...ganadores];

        // Filter
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            result = result.filter(g =>
                g.nombre?.toLowerCase().includes(lowSearch) ||
                g.whatsapp?.includes(lowSearch)
            );
        }

        // Sort
        if (sortConfig) {
            result.sort((a, b) => {
                let valA: any = "";
                let valB: any = "";

                switch (sortConfig.key) {
                    case 'nombre':
                        valA = a.nombre?.toLowerCase() || "";
                        valB = b.nombre?.toLowerCase() || "";
                        break;
                    case 'whatsapp':
                        valA = a.whatsapp || "";
                        valB = b.whatsapp || "";
                        break;
                    case 'premio':
                        valA = a.premioNombre?.toLowerCase() || "";
                        valB = b.premioNombre?.toLowerCase() || "";
                        break;
                    case 'fecha':
                        valA = parseProxyDate(a.ganado_en)?.getTime() || 0;
                        valB = parseProxyDate(b.ganado_en)?.getTime() || 0;
                        break;
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [ganadores, searchTerm, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const landingUrl = selectedPromo?.short_code
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${selectedPromo.short_code}`
        : selectedPromo
            ? `${typeof window !== "undefined" ? window.location.origin : ""}/promo/${TENANT_ID}/${selectedPromo.id}`
            : "";

    const handleCopyLink = () => {
        navigator.clipboard.writeText(landingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSavePromo = async () => {
        if (!promoForm.nombre || !promoForm.whatsapp_negocio) {
            toast.error("Completá el nombre y el WhatsApp del negocio");
            return;
        }
        
        let finalShortCode = promoForm.short_code.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
        
        setSaving(true);
        try {
            let promoIdToUse = selectedPromo?.id;

            if (!promoIdToUse) {
                promoIdToUse = await createPromo(TENANT_ID, { ...promoForm, short_code: "", activa: true });
                toast.success("¡Promo creada!");
            }

            if (finalShortCode) {
                try {
                    await reserveShortLink(finalShortCode, TENANT_ID, promoIdToUse);
                } catch (err: any) {
                    toast.error(err.message || "Ese link corto ya está en uso.");
                    setSaving(false);
                    return;
                }
            }

            if (selectedPromo && selectedPromo.short_code && selectedPromo.short_code !== finalShortCode) {
                await releaseShortLink(selectedPromo.short_code);
            }

            await updatePromo(TENANT_ID, promoIdToUse, { ...promoForm, short_code: finalShortCode });
            if (selectedPromo) toast.success("¡Promo actualizada!");

            await loadData();
        } catch (e) {
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const handleOpenPremioModal = (premio?: Premio) => {
        if (premio) {
            setEditingPremio(premio);
            const d = parseProxyDate(premio.vencimiento);
            setPremioForm({
                nombre: premio.nombre,
                descripcion: premio.descripcion,
                tipo: premio.tipo,
                vencimientoStr: d ? d.toISOString().split("T")[0] : "",
                probabilidad: premio.probabilidad,
                stock: premio.stock ?? "",
                activo: premio.activo,
            });
        } else {
            setEditingPremio(null);
            setPremioForm(emptyForm());
        }
        setShowPremioModal(true);
    };

    const handleSavePremio = async () => {
        if (!selectedPromo) { toast.error("Primero crea una promo"); return; }
        if (!premioForm.nombre || !premioForm.vencimientoStr) {
            toast.error("Completá nombre y fecha de vencimiento");
            return;
        }
        
        // Enviamos la fecha como string ISO para que el Proxy la maneje
        const vencimiento = new Date(premioForm.vencimientoStr + "T23:59:59").toISOString();
        const data = { ...premioForm, vencimiento } as any;
        if (data.stock === "") {
            delete data.stock;
        } else {
            data.stock = Number(data.stock);
        }
        delete data.vencimientoStr;
        setSaving(true);
        try {
            if (editingPremio) {
                await updatePremio(TENANT_ID, selectedPromo.id, editingPremio.id, data);
                toast.success("Premio actualizado ✨");
            } else {
                await createPremio(TENANT_ID, selectedPromo.id, data);
                toast.success("Premio creado 🎁");
            }
            setShowPremioModal(false);
            const list = await getPremios(TENANT_ID, selectedPromo.id);
            setPremios(list);
        } catch (e) {
            toast.error("Error al guardar premio");
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePremio = async (premioId: string) => {
        if (!selectedPromo) return;
        if (!confirm("¿Eliminar este premio?")) return;
        await deletePremio(TENANT_ID, selectedPromo.id, premioId);
        setPremios(prev => prev.filter(p => p.id !== premioId));
        toast.success("Premio eliminado");
    };

    const handleResetGanador = async (phone: string, premioId: string) => {
        if (!selectedPromo) return;
        if (!confirm("¿Resetear este ganador? Podrá volver a participar.")) return;
        await resetParticipante(TENANT_ID, selectedPromo.id, phone);
        // decrement winner count on prize
        const pr = premios.find(p => p.id === premioId);
        if (pr && pr.ganadores > 0) {
            await updatePremio(TENANT_ID, selectedPromo.id, premioId, { ganadores: pr.ganadores - 1 });
        }
        setGanadores(prev => prev.filter(g => g.whatsapp !== phone.replace(/\D/g, "")));
        toast.success("Ganador reseteado ♻️");
    };

    if (loading) return (
        <>
            <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">
                Cargando Promos Web...
            </div>
        </>
    );

    return (
        <>
            <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto p-4 md:p-8">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter">🎁 Promos Web</h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                            Sorteos de premios para tus clientes
                        </p>
                    </div>
                    {selectedPromo && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopyLink}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${copied ? "bg-green-100 text-green-700" : "bg-pink-50 text-pink-600 hover:bg-pink-100"}`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? "¡Copiado!" : "Copiar Link"}
                            </button>
                            <a
                                href={landingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
                            >
                                <ExternalLink className="w-4 h-4" /> Ver Sorteo
                            </a>
                        </div>
                    )}
                </div>


                {/* Promo Config Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Configuración de la Promo</p>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Nombre de la promo</label>
                            <input
                                className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none transition-all border border-gray-100"
                                placeholder="Ej: Sorteo de Marzo 💅"
                                value={promoForm.nombre}
                                onChange={e => setPromoForm({ ...promoForm, nombre: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">WhatsApp del negocio</label>
                            <input
                                className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none transition-all border border-gray-100"
                                placeholder="5491112345678"
                                value={promoForm.whatsapp_negocio}
                                onChange={e => setPromoForm({ ...promoForm, whatsapp_negocio: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Subtítulo del Logo</label>
                            <input
                                className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none transition-all border border-gray-100"
                                placeholder="Ej: ¡Tu mejor versión! ✨"
                                value={promoForm.subtitulo_logo}
                                onChange={e => setPromoForm({ ...promoForm, subtitulo_logo: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Link Personalizado (Opcional)</label>
                            <div className="flex items-center">
                                <span className="bg-gray-100 border border-r-0 border-gray-100 rounded-l-xl px-3 py-3 text-sm text-gray-400">/p/</span>
                                <input
                                    className="w-full bg-gray-50 rounded-r-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none transition-all border border-gray-100"
                                    placeholder="ej: mi-sorteo"
                                    value={promoForm.short_code}
                                    onChange={e => setPromoForm({ ...promoForm, short_code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                        {/* Active toggle */}
                        <button
                            onClick={() => setPromoForm(prev => ({ ...prev, activa: !prev.activa }))}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${promoForm.activa ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                        >
                            <Power className="w-3 h-3" />
                            {promoForm.activa ? "PROMO ACTIVA" : "PROMO INACTIVA"}
                        </button>

                        {/* Save button */}
                        <button
                            onClick={handleSavePromo}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50"
                        >
                            <Save className="w-3 h-3" />
                            {saving ? "Guardando..." : "Guardar"}
                        </button>

                        {/* Copy link */}
                        {selectedPromo && (
                            <button
                                onClick={handleCopyLink}
                                className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-full text-xs font-black uppercase tracking-widest hover:bg-pink-100 transition-all"
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? "¡Copiado!" : "Link de la promo"}
                            </button>
                        )}
                        {selectedPromo && (
                            <a href={landingUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 text-gray-400 rounded-full text-xs font-black uppercase tracking-widest hover:text-gray-600 transition-all">
                                <ExternalLink className="w-3 h-3" /> Ver landing
                            </a>
                        )}
                    </div>

                    {!selectedPromo && (
                        <div className="text-center py-4 text-gray-400 text-sm">
                            Completá el formulario y guardá para crear tu primera promo. Luego podrás agregar premios.
                        </div>
                    )}
                </div>

                {/* Tabs */}
                {selectedPromo && (
                    <>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTab("premios")}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${tab === "premios" ? "bg-black text-white shadow-xl" : "bg-white text-gray-400 hover:bg-gray-50"}`}
                            >
                                <Gift className="w-4 h-4" /> Premios
                            </button>
                            <button
                                onClick={() => { setTab("ganadores"); getParticipantes(TENANT_ID, selectedPromo.id).then(setGanadores); }}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${tab === "ganadores" ? "bg-black text-white shadow-xl" : "bg-white text-gray-400 hover:bg-gray-50"}`}
                            >
                                <Trophy className="w-4 h-4" /> Ganadores ({ganadores.length})
                            </button>
                        </div>

                        {/* PREMIOS TAB */}
                        {tab === "premios" && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-500 font-medium">{premios.length} premio{premios.length !== 1 ? "s" : ""} configurado{premios.length !== 1 ? "s" : ""}</p>
                                    <button
                                        onClick={() => handleOpenPremioModal()}
                                        className="flex items-center gap-2 px-5 py-2 bg-pink-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-pink-600 transition-all shadow-lg shadow-pink-200"
                                    >
                                        <Plus className="w-4 h-4" /> Agregar Premio
                                    </button>
                                </div>

                                {premios.length === 0 && (
                                    <div className="text-center py-16 bg-gray-50 rounded-3xl text-gray-400">
                                        <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">No hay premios todavía.</p>
                                        <p className="text-sm">¡Agregá el primer premio para empezar! 🎁</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {premios.map(p => (
                                        <div key={p.id} className={`bg-white rounded-3xl border shadow-sm p-5 space-y-2 transition-all ${p.activo ? "border-gray-100" : "border-gray-200 opacity-50"}`}>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${p.tipo === "descuento" ? "bg-pink-100 text-pink-600" : p.tipo === "regalo" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"}`}>
                                                        {p.tipo}
                                                    </span>
                                                    <h3 className="font-black text-base mt-2">{p.nombre}</h3>
                                                    <p className="text-sm text-gray-500">{p.descripcion}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">
                                                <span>Prob: {p.probabilidad}/10</span>
                                                <span>•</span>
                                                <span>Stock: {typeof p.stock === "number" ? p.stock : "∞"}</span>
                                                <span>•</span>
                                                <span>Vence: {parseProxyDate(p.vencimiento)?.toLocaleDateString("es-AR") || "—"}</span>
                                                <span>•</span>
                                                <span>🏆 {p.ganadores || 0}</span>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => handleOpenPremioModal(p)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                                                >
                                                    <Edit3 className="w-3 h-3" /> Editar
                                                </button>
                                                <button
                                                    onClick={() => updatePremio(TENANT_ID, selectedPromo.id, p.id, { activo: !p.activo }).then(() => getPremios(TENANT_ID, selectedPromo.id).then(setPremios))}
                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${p.activo ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                                                >
                                                    <Power className="w-3 h-3" /> {p.activo ? "Desactivar" : "Activar"}
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePremio(p.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* GANADORES TAB */}
                        {tab === "ganadores" && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center gap-4">
                                    <div className="relative flex-1 max-w-sm">
                                        <input
                                            type="text"
                                            placeholder="Buscar ganador o whatsapp..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-pink-300 transition-all shadow-sm"
                                        />
                                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        {sortedAndFilteredGanadores.length} ganadores
                                    </p>
                                </div>

                                {sortedAndFilteredGanadores.length === 0 && (
                                    <div className="text-center py-16 bg-gray-50 rounded-3xl text-gray-400">
                                        <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">{searchTerm ? "No se encontraron resultados." : "Aún no hay ganadores."}</p>
                                        <p className="text-sm">{searchTerm ? "Intentá con otro nombre o número." : "Cuando alguien juegue, aparecerá aquí. 🎉"}</p>
                                    </div>
                                )}
                                {sortedAndFilteredGanadores.length > 0 && (
                                    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-50 bg-gray-50">
                                                    <th 
                                                        onClick={() => requestSort('nombre')}
                                                        className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-pink-500 transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Nombre
                                                            <span className={`opacity-0 group-hover:opacity-100 ${sortConfig?.key === 'nombre' ? 'opacity-100 text-pink-500' : ''}`}>
                                                                {sortConfig?.key === 'nombre' && sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        </div>
                                                    </th>
                                                    <th 
                                                        onClick={() => requestSort('whatsapp')}
                                                        className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-pink-500 transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            WhatsApp
                                                            <span className={`opacity-0 group-hover:opacity-100 ${sortConfig?.key === 'whatsapp' ? 'opacity-100 text-pink-500' : ''}`}>
                                                                {sortConfig?.key === 'whatsapp' && sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        </div>
                                                    </th>
                                                    <th 
                                                        onClick={() => requestSort('premio')}
                                                        className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-pink-500 transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Premio
                                                            <span className={`opacity-0 group-hover:opacity-100 ${sortConfig?.key === 'premio' ? 'opacity-100 text-pink-500' : ''}`}>
                                                                {sortConfig?.key === 'premio' && sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        </div>
                                                    </th>
                                                    <th 
                                                        onClick={() => requestSort('fecha')}
                                                        className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-pink-500 transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Fecha
                                                            <span className={`opacity-0 group-hover:opacity-100 ${sortConfig?.key === 'fecha' ? 'opacity-100 text-pink-500' : ''}`}>
                                                                {sortConfig?.key === 'fecha' && sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        </div>
                                                    </th>
                                                    <th className="px-5 py-3"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedAndFilteredGanadores.map((g, i) => (
                                                    <tr key={i} className="border-b border-gray-50 hover:bg-pink-50/30 transition-colors">
                                                        <td className="px-5 py-3 font-medium">{g.nombre}</td>
                                                        <td className="px-5 py-3 text-gray-500 font-mono text-xs">{g.whatsapp}</td>
                                                        <td className="px-5 py-3">
                                                            <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                                {g.premioNombre}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-400 text-xs">
                                                            {parseProxyDate(g.ganado_en)?.toLocaleDateString("es-AR") || "—"}
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <button
                                                                onClick={() => handleResetGanador(g.whatsapp, g.premioId)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all"
                                                                title="Resetear para que pueda volver a jugar"
                                                            >
                                                                <RotateCcw className="w-3 h-3" /> Resetear
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MODAL: Premio */}
            {showPremioModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-black text-lg">{editingPremio ? "Editar Premio" : "Nuevo Premio 🎁"}</h2>
                            <button onClick={() => setShowPremioModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nombre del Premio *</label>
                                <input
                                    className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none border border-gray-100"
                                    placeholder="Ej: 20% OFF en tratamiento facial"
                                    value={premioForm.nombre}
                                    onChange={e => setPremioForm({ ...premioForm, nombre: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Descripción</label>
                                <textarea
                                    className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none border border-gray-100 min-h-[80px]"
                                    placeholder="Detallá el premio..."
                                    value={premioForm.descripcion}
                                    onChange={e => setPremioForm({ ...premioForm, descripcion: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                                    <select
                                        className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none border border-gray-100"
                                        value={premioForm.tipo}
                                        onChange={e => setPremioForm({ ...premioForm, tipo: e.target.value as any })}
                                    >
                                        <option value="descuento">Descuento</option>
                                        <option value="regalo">Regalo</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Probabilidad (1-10)</label>
                                    <input
                                        type="number" min={1} max={10}
                                        className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none border border-gray-100"
                                        value={premioForm.probabilidad}
                                        onChange={e => setPremioForm({ ...premioForm, probabilidad: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1" title="Para premios ilimitados, dejar vacío">Stock (opcional)</label>
                                    <input
                                        type="number" min={1} placeholder="∞"
                                        className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none border border-gray-100"
                                        value={premioForm.stock}
                                        onChange={e => setPremioForm({ ...premioForm, stock: e.target.value === "" ? "" : Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Fecha de vencimiento *</label>
                                <input
                                    type="date"
                                    className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none border border-gray-100"
                                    value={premioForm.vencimientoStr}
                                    onChange={e => setPremioForm({ ...premioForm, vencimientoStr: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowPremioModal(false)}
                                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSavePremio}
                                disabled={saving}
                                className="flex-1 py-3 rounded-2xl bg-pink-500 text-white text-xs font-black uppercase tracking-widest hover:bg-pink-600 transition-all shadow-lg shadow-pink-200 disabled:opacity-50"
                            >
                                {saving ? "Guardando..." : "Guardar Premio"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
