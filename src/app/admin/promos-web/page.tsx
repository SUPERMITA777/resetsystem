"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Gift, Trophy, Plus, Trash2, Edit3, RotateCcw, Copy, Check, X, Save, Power, ExternalLink, Shuffle } from "lucide-react";
import toast from "react-hot-toast";
import {
    PromoWeb, Premio, RuletaSlice,
    getPromos, createPromo, updatePromo,
    getPremios, createPremio, updatePremio, deletePremio,
    getParticipantes, resetParticipante,
    reserveShortLink, releaseShortLink,
    getRuletaSlices, createRuletaSlice, updateRuletaSlice, deleteRuletaSlice, uploadRuletaImage
} from "@/lib/services/promoWebService";


type MainTab = "sorteos" | "ruletas";
type SubTab = "premios" | "ganadores";

interface PremioForm {
    nombre: string;
    descripcion: string;
    tipo: "descuento" | "regalo" | "otro";
    vencimientoStr: string;
    probabilidad: number;
    stock?: number | "";
    activo: boolean;
}
const emptyPremioForm = (): PremioForm => ({
    nombre: "",
    descripcion: "",
    tipo: "descuento",
    vencimientoStr: "",
    probabilidad: 5,
    stock: "",
    activo: true,
});

interface SliceForm {
    nombre: string;
    descripcion: string;
    probabilidad: number;
    color: string;
    activo: boolean;
    imagenUrl?: string;
}
const ROULETTE_COLORS = [
    "#FF6384", "#FF9F40", "#FFCD56", "#4BC0C0", "#36A2EB",
    "#9966FF", "#FF6B9D", "#C9CBCF", "#7BC67E", "#F7A35C",
    "#8085E9", "#F15C80", "#E4D354", "#2B908F", "#F45B5B",
    "#91E8E1", "#D7503D", "#5DB8BE", "#A0A0A0", "#8BC34A",
];
const emptySliceForm = (index = 0): SliceForm => ({
    nombre: "",
    descripcion: "",
    probabilidad: 10,
    color: ROULETTE_COLORS[index % ROULETTE_COLORS.length],
    activo: true,
    imagenUrl: "",
});

// Helper para convertir fechas que vienen del proxy
function parseProxyDate(dateObj: any): Date | null {
    if (!dateObj) return null;
    if (typeof dateObj === 'string') return new Date(dateObj);
    if (dateObj._seconds) return new Date(dateObj._seconds * 1000);
    if (dateObj.seconds) return new Date(dateObj.seconds * 1000);
    return null;
}

// Mini Ruleta SVG preview
function RuletaPreview({ slices }: { slices: RuletaSlice[] }) {
    const activeSlices = slices.filter(s => s.activo);
    if (activeSlices.length === 0) return (
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">
            Sin segmentos
        </div>
    );
    const total = activeSlices.reduce((s, sl) => s + sl.probabilidad, 0);
    let currentAngle = 0;
    const cx = 50, cy = 50, r = 46;

    const paths = activeSlices.map((sl, i) => {
        const angle = (sl.probabilidad / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle += angle;
        const start = polarToCartesian(cx, cy, r, startAngle - 90);
        const end = polarToCartesian(cx, cy, r, endAngle - 90);
        const largeArc = angle > 180 ? 1 : 0;
        const d = `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
        return <path key={i} d={d} fill={sl.color} stroke="white" strokeWidth="1.5" />;
    });

    return (
        <svg viewBox="0 0 100 100" className="w-24 h-24 rounded-full shadow-lg border-4 border-white">
            {paths}
        </svg>
    );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const angleRad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

export default function PromosWebPage() {
    const TENANT_ID = typeof window !== "undefined" ? localStorage.getItem("currentTenant") || "resetspa" : "resetspa";
    const [mainTab, setMainTab] = useState<MainTab>("sorteos");

    // ── SORTEOS STATE ────────────────────────────────────────────────────────────
    const [tab, setTab] = useState<SubTab>("premios");
    const [sorteos, setSorteos] = useState<PromoWeb[]>([]);
    const [selectedSorteo, setSelectedSorteo] = useState<PromoWeb | null>(null);
    const [premios, setPremios] = useState<Premio[]>([]);
    const [ganadores, setGanadores] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'ganado_en', direction: 'desc' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [promoForm, setPromoForm] = useState({ nombre: "", whatsapp_negocio: "", subtitulo_logo: "¡Tu mejor versión! ✨", short_code: "", activa: true });
    const [showPremioModal, setShowPremioModal] = useState(false);
    const [editingPremio, setEditingPremio] = useState<Premio | null>(null);
    const [premioForm, setPremioForm] = useState<PremioForm>(emptyPremioForm());

    // ── RULETAS STATE ────────────────────────────────────────────────────────────
    const [rtab, setRtab] = useState<SubTab>("premios");
    const [ruletas, setRuletas] = useState<PromoWeb[]>([]);
    const [selectedRuleta, setSelectedRuleta] = useState<PromoWeb | null>(null);
    const [slices, setSlices] = useState<RuletaSlice[]>([]);
    const [ruletaGanadores, setRuletaGanadores] = useState<any[]>([]);
    const [ruletaSearchTerm, setRuletaSearchTerm] = useState("");
    const [ruletaLoading, setRuletaLoading] = useState(false);
    const [ruletaSaving, setRuletaSaving] = useState(false);
    const [ruletaCopied, setRuletaCopied] = useState(false);
    const [ruletaForm, setRuletaForm] = useState({ nombre: "", whatsapp_negocio: "", subtitulo_logo: "¡Girá y ganá! 🎡", short_code: "", activa: true });
    const [showSliceModal, setShowSliceModal] = useState(false);
    const [editingSlice, setEditingSlice] = useState<RuletaSlice | null>(null);
    const [sliceForm, setSliceForm] = useState<SliceForm>(emptySliceForm());

    // ── LOAD SORTEOS ─────────────────────────────────────────────────────────────
    const loadSorteos = useCallback(async () => {
        setLoading(true);
        try {
            const list = (await getPromos(TENANT_ID)).filter(p => !p.tipo || p.tipo === "sorteo");
            setSorteos(list);
            if (list.length > 0) {
                const p = list[0];
                setSelectedSorteo(p);
                setPromoForm({ nombre: p.nombre, whatsapp_negocio: p.whatsapp_negocio, subtitulo_logo: p.subtitulo_logo || "¡Tu mejor versión! ✨", short_code: p.short_code || "", activa: p.activa });
                const [premiosList, ganList] = await Promise.all([
                    getPremios(TENANT_ID, p.id),
                    getParticipantes(TENANT_ID, p.id),
                ]);
                setPremios(premiosList);
                setGanadores(ganList);
            }
        } catch (e) {
            toast.error("Error al cargar sorteos");
        } finally {
            setLoading(false);
        }
    }, [TENANT_ID]);

    // ── LOAD RULETAS ─────────────────────────────────────────────────────────────
    const loadRuletas = useCallback(async () => {
        setRuletaLoading(true);
        try {
            const list = (await getPromos(TENANT_ID)).filter(p => p.tipo === "ruleta");
            setRuletas(list);
            if (list.length > 0) {
                const r = list[0];
                setSelectedRuleta(r);
                setRuletaForm({ nombre: r.nombre, whatsapp_negocio: r.whatsapp_negocio, subtitulo_logo: r.subtitulo_logo || "¡Girá y ganá! 🎡", short_code: r.short_code || "", activa: r.activa });
                const [slicesList, ganList] = await Promise.all([
                    getRuletaSlices(TENANT_ID, r.id),
                    getParticipantes(TENANT_ID, r.id),
                ]);
                setSlices(slicesList);
                setRuletaGanadores(ganList);
            }
        } catch (e) {
            toast.error("Error al cargar ruletas");
        } finally {
            setRuletaLoading(false);
        }
    }, [TENANT_ID]);

    useEffect(() => { loadSorteos(); }, [loadSorteos]);
    useEffect(() => { if (mainTab === "ruletas") loadRuletas(); }, [mainTab, loadRuletas]);

    // ── SORTEO HANDLERS ──────────────────────────────────────────────────────────
    const sortedAndFilteredGanadores = React.useMemo(() => {
        let result = [...ganadores];
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            result = result.filter(g =>
                g.nombre?.toLowerCase().includes(lowSearch) ||
                g.whatsapp?.includes(lowSearch)
            );
        }
        if (sortConfig) {
            result.sort((a, b) => {
                let valA: any = "", valB: any = "";
                switch (sortConfig.key) {
                    case 'nombre': valA = a.nombre?.toLowerCase() || ""; valB = b.nombre?.toLowerCase() || ""; break;
                    case 'whatsapp': valA = a.whatsapp || ""; valB = b.whatsapp || ""; break;
                    case 'premio': valA = a.premioNombre?.toLowerCase() || ""; valB = b.premioNombre?.toLowerCase() || ""; break;
                    case 'fecha': valA = parseProxyDate(a.ganado_en)?.getTime() || 0; valB = parseProxyDate(b.ganado_en)?.getTime() || 0; break;
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
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const landingUrl = selectedSorteo?.short_code
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${selectedSorteo.short_code}`
        : selectedSorteo
            ? `${typeof window !== "undefined" ? window.location.origin : ""}/promo/${TENANT_ID}/${selectedSorteo.id}`
            : "";

    const handleCopyLink = () => {
        navigator.clipboard.writeText(landingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSavePromo = async () => {
        if (!promoForm.nombre || !promoForm.whatsapp_negocio) { toast.error("Completá el nombre y el WhatsApp del negocio"); return; }
        let finalShortCode = promoForm.short_code.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
        setSaving(true);
        try {
            let promoIdToUse = selectedSorteo?.id;
            if (!promoIdToUse) {
                promoIdToUse = await createPromo(TENANT_ID, { ...promoForm, short_code: "", activa: true, tipo: "sorteo" });
                toast.success("¡Sorteo creado!");
            }
            if (finalShortCode) {
                try { await reserveShortLink(finalShortCode, TENANT_ID, promoIdToUse, "sorteo"); }
                catch (err: any) { toast.error(err.message || "Ese link corto ya está en uso."); setSaving(false); return; }
            }
            if (selectedSorteo && selectedSorteo.short_code && selectedSorteo.short_code !== finalShortCode) {
                await releaseShortLink(selectedSorteo.short_code);
            }
            await updatePromo(TENANT_ID, promoIdToUse, { ...promoForm, short_code: finalShortCode, tipo: "sorteo" });
            if (selectedSorteo) toast.success("¡Sorteo actualizado!");
            await loadSorteos();
        } catch (e) { toast.error("Error al guardar"); } finally { setSaving(false); }
    };

    const handleOpenPremioModal = (premio?: Premio) => {
        if (premio) {
            setEditingPremio(premio);
            const d = parseProxyDate(premio.vencimiento);
            setPremioForm({ nombre: premio.nombre, descripcion: premio.descripcion, tipo: premio.tipo, vencimientoStr: d ? d.toISOString().split("T")[0] : "", probabilidad: premio.probabilidad, stock: premio.stock ?? "", activo: premio.activo });
        } else {
            setEditingPremio(null);
            setPremioForm(emptyPremioForm());
        }
        setShowPremioModal(true);
    };

    const handleSavePremio = async () => {
        if (!selectedSorteo) { toast.error("Primero crea un sorteo"); return; }
        if (!premioForm.nombre || !premioForm.vencimientoStr) { toast.error("Completá nombre y fecha de vencimiento"); return; }
        const vencimiento = new Date(premioForm.vencimientoStr + "T23:59:59").toISOString();
        const data = { ...premioForm, vencimiento } as any;
        if (data.stock === "") delete data.stock; else data.stock = Number(data.stock);
        delete data.vencimientoStr;
        setSaving(true);
        try {
            if (editingPremio) { await updatePremio(TENANT_ID, selectedSorteo.id, editingPremio.id, data); toast.success("Premio actualizado ✨"); }
            else { await createPremio(TENANT_ID, selectedSorteo.id, data); toast.success("Premio creado 🎁"); }
            setShowPremioModal(false);
            const list = await getPremios(TENANT_ID, selectedSorteo.id);
            setPremios(list);
        } catch (e) { toast.error("Error al guardar premio"); } finally { setSaving(false); }
    };

    const handleDeletePremio = async (premioId: string) => {
        if (!selectedSorteo) return;
        if (!confirm("¿Eliminar este premio?")) return;
        await deletePremio(TENANT_ID, selectedSorteo.id, premioId);
        setPremios(prev => prev.filter(p => p.id !== premioId));
        toast.success("Premio eliminado");
    };

    const handleResetGanador = async (phone: string, premioId: string) => {
        if (!selectedSorteo) return;
        if (!confirm("¿Resetear este ganador? Podrá volver a participar.")) return;
        await resetParticipante(TENANT_ID, selectedSorteo.id, phone);
        const pr = premios.find(p => p.id === premioId);
        if (pr && pr.ganadores > 0) await updatePremio(TENANT_ID, selectedSorteo.id, premioId, { ganadores: pr.ganadores - 1 });
        setGanadores(prev => prev.filter(g => g.whatsapp !== phone.replace(/\D/g, "")));
        toast.success("Ganador reseteado ♻️");
    };

    // ── RULETA HANDLERS ──────────────────────────────────────────────────────────
    const ruletaUrl = selectedRuleta?.short_code
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${selectedRuleta.short_code}`
        : selectedRuleta
            ? `${typeof window !== "undefined" ? window.location.origin : ""}/ruleta/${TENANT_ID}/${selectedRuleta.id}`
            : "";

    const handleRuletaCopyLink = () => {
        navigator.clipboard.writeText(ruletaUrl);
        setRuletaCopied(true);
        setTimeout(() => setRuletaCopied(false), 2000);
    };

    const handleSaveRuleta = async () => {
        if (!ruletaForm.nombre || !ruletaForm.whatsapp_negocio) { toast.error("Completá el nombre y el WhatsApp del negocio"); return; }
        let finalShortCode = ruletaForm.short_code.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
        setRuletaSaving(true);
        try {
            let ruletaIdToUse = selectedRuleta?.id;
            if (!ruletaIdToUse) {
                ruletaIdToUse = await createPromo(TENANT_ID, { ...ruletaForm, short_code: "", activa: true, tipo: "ruleta" });
                toast.success("¡Ruleta creada 🎡!");
            }
            if (finalShortCode) {
                try { await reserveShortLink(finalShortCode, TENANT_ID, ruletaIdToUse, "ruleta"); }
                catch (err: any) { toast.error(err.message || "Ese link corto ya está en uso."); setRuletaSaving(false); return; }
            }
            if (selectedRuleta && selectedRuleta.short_code && selectedRuleta.short_code !== finalShortCode) {
                await releaseShortLink(selectedRuleta.short_code);
            }
            await updatePromo(TENANT_ID, ruletaIdToUse, { ...ruletaForm, short_code: finalShortCode, tipo: "ruleta" });
            if (selectedRuleta) toast.success("¡Ruleta actualizada!");
            await loadRuletas();
        } catch (e) { toast.error("Error al guardar"); } finally { setRuletaSaving(false); }
    };

    const handleOpenSliceModal = (slice?: RuletaSlice) => {
        if (slice) {
            setEditingSlice(slice);
            setSliceForm({ nombre: slice.nombre, descripcion: slice.descripcion || "", probabilidad: slice.probabilidad, color: slice.color, activo: slice.activo });
        } else {
            setEditingSlice(null);
            setSliceForm(emptySliceForm(slices.length));
        }
        setShowSliceModal(true);
    };

    const handleSaveSlice = async () => {
        if (!selectedRuleta) { toast.error("Primero creá una ruleta"); return; }
        if (!sliceForm.nombre) { toast.error("Completá el nombre del segmento"); return; }
        if (sliceForm.probabilidad <= 0) { toast.error("La probabilidad debe ser mayor a 0"); return; }
        setRuletaSaving(true);
        try {
            if (editingSlice) {
                await updateRuletaSlice(TENANT_ID, selectedRuleta.id, editingSlice.id, sliceForm);
                toast.success("Segmento actualizado ✨");
            } else {
                await createRuletaSlice(TENANT_ID, selectedRuleta.id, sliceForm);
                toast.success("Segmento agregado 🎡");
            }
            setShowSliceModal(false);
            const list = await getRuletaSlices(TENANT_ID, selectedRuleta.id);
            setSlices(list);
        } catch (e) { toast.error("Error al guardar segmento"); } finally { setRuletaSaving(false); }
    };

    const handleDeleteSlice = async (sliceId: string) => {
        if (!selectedRuleta) return;
        if (!confirm("¿Eliminar este segmento?")) return;
        await deleteRuletaSlice(TENANT_ID, selectedRuleta.id, sliceId);
        setSlices(prev => prev.filter(s => s.id !== sliceId));
        toast.success("Segmento eliminado");
    };

    const handleResetRuletaGanador = async (phone: string) => {
        if (!selectedRuleta) return;
        if (!confirm("¿Resetear este ganador? Podrá volver a participar.")) return;
        await resetParticipante(TENANT_ID, selectedRuleta.id, phone);
        setRuletaGanadores(prev => prev.filter(g => g.whatsapp !== phone.replace(/\D/g, "")));
        toast.success("Ganador reseteado ♻️");
    };

    const totalProbabilidad = slices.filter(s => s.activo).reduce((acc, s) => acc + s.probabilidad, 0);

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">
            Cargando Promos Web...
        </div>
    );

    return (
        <>
            <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto p-4 md:p-8">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter">🎁 Promos Web</h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                            Herramientas de marketing para fidelizar clientes
                        </p>
                    </div>
                </div>

                {/* MAIN TABS */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
                    <button
                        onClick={() => setMainTab("sorteos")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mainTab === "sorteos" ? "bg-white shadow-md text-black" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        <Gift className="w-4 h-4" /> Sorteos
                    </button>
                    <button
                        onClick={() => setMainTab("ruletas")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mainTab === "ruletas" ? "bg-white shadow-md text-black" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        <Shuffle className="w-4 h-4" /> Ruletas
                    </button>
                </div>

                {/* ═══════════════════════════════════════════════════════ SORTEOS TAB */}
                {mainTab === "sorteos" && (
                    <>
                        {/* Header sorteo */}
                        {selectedSorteo && (
                            <div className="flex items-center gap-2 justify-end">
                                <button onClick={handleCopyLink} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${copied ? "bg-green-100 text-green-700" : "bg-pink-50 text-pink-600 hover:bg-pink-100"}`}>
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? "¡Copiado!" : "Copiar Link"}
                                </button>
                                <a href={landingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg">
                                    <ExternalLink className="w-4 h-4" /> Ver Sorteo
                                </a>
                            </div>
                        )}

                        {/* Promo Config Card */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Configuración del Sorteo</p>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nombre del sorteo</label>
                                    <input className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none transition-all border border-gray-100" placeholder="Ej: Sorteo de Marzo 💅" value={promoForm.nombre} onChange={e => setPromoForm({ ...promoForm, nombre: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">WhatsApp del negocio</label>
                                    <input className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none transition-all border border-gray-100" placeholder="5491112345678" value={promoForm.whatsapp_negocio} onChange={e => setPromoForm({ ...promoForm, whatsapp_negocio: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Subtítulo del Logo</label>
                                    <input className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none transition-all border border-gray-100" placeholder="Ej: ¡Tu mejor versión! ✨" value={promoForm.subtitulo_logo} onChange={e => setPromoForm({ ...promoForm, subtitulo_logo: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Link Personalizado (Opcional)</label>
                                    <div className="flex items-center">
                                        <span className="bg-gray-100 border border-r-0 border-gray-100 rounded-l-xl px-3 py-3 text-sm text-gray-400">/p/</span>
                                        <input className="w-full bg-gray-50 rounded-r-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none transition-all border border-gray-100" placeholder="ej: mi-sorteo" value={promoForm.short_code} onChange={e => setPromoForm({ ...promoForm, short_code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                                <button onClick={() => setPromoForm(prev => ({ ...prev, activa: !prev.activa }))} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${promoForm.activa ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                                    <Power className="w-3 h-3" /> {promoForm.activa ? "SORTEO ACTIVO" : "SORTEO INACTIVO"}
                                </button>
                                <button onClick={handleSavePromo} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50">
                                    <Save className="w-3 h-3" /> {saving ? "Guardando..." : "Guardar"}
                                </button>
                                {selectedSorteo && (<>
                                    <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-full text-xs font-black uppercase tracking-widest hover:bg-pink-100 transition-all">
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "¡Copiado!" : "Link del sorteo"}
                                    </button>
                                    <a href={landingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-gray-400 rounded-full text-xs font-black uppercase tracking-widest hover:text-gray-600 transition-all">
                                        <ExternalLink className="w-3 h-3" /> Ver landing
                                    </a>
                                </>)}
                            </div>
                            {!selectedSorteo && <div className="text-center py-4 text-gray-400 text-sm">Completá el formulario y guardá para crear tu primer sorteo. Luego podrás agregar premios.</div>}
                        </div>

                        {/* SUB TABS */}
                        {selectedSorteo && (
                            <>
                                <div className="flex gap-2">
                                    <button onClick={() => setTab("premios")} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${tab === "premios" ? "bg-black text-white shadow-xl" : "bg-white text-gray-400 hover:bg-gray-50"}`}>
                                        <Gift className="w-4 h-4" /> Premios
                                    </button>
                                    <button onClick={() => { setTab("ganadores"); getParticipantes(TENANT_ID, selectedSorteo.id).then(setGanadores); }} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${tab === "ganadores" ? "bg-black text-white shadow-xl" : "bg-white text-gray-400 hover:bg-gray-50"}`}>
                                        <Trophy className="w-4 h-4" /> Ganadores ({ganadores.length})
                                    </button>
                                </div>
                                {tab === "premios" && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-gray-500 font-medium">{premios.length} premio{premios.length !== 1 ? "s" : ""} configurado{premios.length !== 1 ? "s" : ""}</p>
                                            <button onClick={() => handleOpenPremioModal()} className="flex items-center gap-2 px-5 py-2 bg-pink-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-pink-600 transition-all shadow-lg shadow-pink-200">
                                                <Plus className="w-4 h-4" /> Agregar Premio
                                            </button>
                                        </div>
                                        {premios.length === 0 && (<div className="text-center py-16 bg-gray-50 rounded-3xl text-gray-400"><Gift className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No hay premios todavía.</p><p className="text-sm">¡Agregá el primer premio para empezar! 🎁</p></div>)}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {premios.map(p => (
                                                <div key={p.id} className={`bg-white rounded-3xl border shadow-sm p-5 space-y-2 transition-all ${p.activo ? "border-gray-100" : "border-gray-200 opacity-50"}`}>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${p.tipo === "descuento" ? "bg-pink-100 text-pink-600" : p.tipo === "regalo" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"}`}>{p.tipo}</span>
                                                            <h3 className="font-black text-base mt-2">{p.nombre}</h3>
                                                            <p className="text-sm text-gray-500">{p.descripcion}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">
                                                        <span>Prob: {p.probabilidad}/10</span><span>•</span>
                                                        <span>Stock: {typeof p.stock === "number" ? p.stock : "∞"}</span><span>•</span>
                                                        <span>Vence: {parseProxyDate(p.vencimiento)?.toLocaleDateString("es-AR") || "—"}</span><span>•</span>
                                                        <span>🏆 {p.ganadores || 0}</span>
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <button onClick={() => handleOpenPremioModal(p)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"><Edit3 className="w-3 h-3" /> Editar</button>
                                                        <button onClick={() => updatePremio(TENANT_ID, selectedSorteo.id, p.id, { activo: !p.activo }).then(() => getPremios(TENANT_ID, selectedSorteo.id).then(setPremios))} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${p.activo ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}><Power className="w-3 h-3" /> {p.activo ? "Desactivar" : "Activar"}</button>
                                                        <button onClick={() => handleDeletePremio(p.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {tab === "ganadores" && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center gap-4">
                                            <div className="relative flex-1 max-w-sm">
                                                <input type="text" placeholder="Buscar ganador o whatsapp..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-pink-300 transition-all shadow-sm" />
                                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{sortedAndFilteredGanadores.length} ganadores</p>
                                        </div>
                                        {sortedAndFilteredGanadores.length === 0 && (<div className="text-center py-16 bg-gray-50 rounded-3xl text-gray-400"><Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-medium">{searchTerm ? "No se encontraron resultados." : "Aún no hay ganadores."}</p></div>)}
                                        {sortedAndFilteredGanadores.length > 0 && (
                                            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                                                <table className="w-full text-sm">
                                                    <thead><tr className="border-b border-gray-50 bg-gray-50">
                                                        <th onClick={() => requestSort('nombre')} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-pink-500">Nombre {sortConfig?.key === 'nombre' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                                        <th onClick={() => requestSort('whatsapp')} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-pink-500">WhatsApp {sortConfig?.key === 'whatsapp' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                                        <th onClick={() => requestSort('premio')} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-pink-500">Premio {sortConfig?.key === 'premio' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                                        <th onClick={() => requestSort('fecha')} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-pink-500">Fecha {sortConfig?.key === 'fecha' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                                        <th className="px-5 py-3"></th>
                                                    </tr></thead>
                                                    <tbody>
                                                        {sortedAndFilteredGanadores.map((g, i) => (
                                                            <tr key={i} className="border-b border-gray-50 hover:bg-pink-50/30 transition-colors">
                                                                <td className="px-5 py-3 font-medium">{g.nombre}</td>
                                                                <td className="px-5 py-3 text-gray-500 font-mono text-xs">{g.whatsapp}</td>
                                                                <td className="px-5 py-3"><span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-[10px] font-black uppercase tracking-wider">{g.premioNombre}</span></td>
                                                                <td className="px-5 py-3 text-gray-400 text-xs">{parseProxyDate(g.ganado_en)?.toLocaleDateString("es-AR") || "—"}</td>
                                                                <td className="px-5 py-3"><button onClick={() => handleResetGanador(g.whatsapp, g.premioId)} className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all"><RotateCcw className="w-3 h-3" /> Resetear</button></td>
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
                    </>
                )}

                {/* ═══════════════════════════════════════════════════════ RULETAS TAB */}
                {mainTab === "ruletas" && (
                    <>
                        {ruletaLoading ? (
                            <div className="flex items-center justify-center h-48 text-gray-400 animate-pulse">Cargando ruletas...</div>
                        ) : (
                            <>
                                {/* Header ruleta */}
                                {selectedRuleta && (
                                    <div className="flex items-center gap-2 justify-end">
                                        <button onClick={handleRuletaCopyLink} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${ruletaCopied ? "bg-green-100 text-green-700" : "bg-purple-50 text-purple-600 hover:bg-purple-100"}`}>
                                            {ruletaCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            {ruletaCopied ? "¡Copiado!" : "Copiar Link"}
                                        </button>
                                        <a href={ruletaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg">
                                            <ExternalLink className="w-4 h-4" /> Ver Ruleta
                                        </a>
                                    </div>
                                )}

                                {/* Ruleta Config Card */}
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 flex-1">Configuración de la Ruleta</p>
                                        {slices.length > 0 && <RuletaPreview slices={slices} />}
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Nombre de la ruleta</label>
                                            <input className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-purple-300 outline-none transition-all border border-gray-100" placeholder="Ej: Ruleta de Premios Abril 🎡" value={ruletaForm.nombre} onChange={e => setRuletaForm({ ...ruletaForm, nombre: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">WhatsApp del negocio</label>
                                            <input className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-purple-300 outline-none transition-all border border-gray-100" placeholder="5491112345678" value={ruletaForm.whatsapp_negocio} onChange={e => setRuletaForm({ ...ruletaForm, whatsapp_negocio: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Subtítulo del Logo</label>
                                            <input className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-purple-300 outline-none transition-all border border-gray-100" placeholder="Ej: ¡Girá y ganá! 🎡" value={ruletaForm.subtitulo_logo} onChange={e => setRuletaForm({ ...ruletaForm, subtitulo_logo: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Link Personalizado (Opcional)</label>
                                            <div className="flex items-center">
                                                <span className="bg-gray-100 border border-r-0 border-gray-100 rounded-l-xl px-3 py-3 text-sm text-gray-400">/p/</span>
                                                <input className="w-full bg-gray-50 rounded-r-xl p-3 text-sm font-medium focus:ring-2 focus:ring-purple-300 outline-none transition-all border border-gray-100" placeholder="ej: mi-ruleta" value={ruletaForm.short_code} onChange={e => setRuletaForm({ ...ruletaForm, short_code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                                        <button onClick={() => setRuletaForm(prev => ({ ...prev, activa: !prev.activa }))} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${ruletaForm.activa ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                                            <Power className="w-3 h-3" /> {ruletaForm.activa ? "RULETA ACTIVA" : "RULETA INACTIVA"}
                                        </button>
                                        <button onClick={handleSaveRuleta} disabled={ruletaSaving} className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50">
                                            <Save className="w-3 h-3" /> {ruletaSaving ? "Guardando..." : "Guardar"}
                                        </button>
                                        {selectedRuleta && (<>
                                            <button onClick={handleRuletaCopyLink} className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-xs font-black uppercase tracking-widest hover:bg-purple-100 transition-all">
                                                {ruletaCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {ruletaCopied ? "¡Copiado!" : "Link de la ruleta"}
                                            </button>
                                            <a href={ruletaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-gray-400 rounded-full text-xs font-black uppercase tracking-widest hover:text-gray-600 transition-all">
                                                <ExternalLink className="w-3 h-3" /> Ver landing
                                            </a>
                                        </>)}
                                    </div>
                                    {!selectedRuleta && <div className="text-center py-4 text-gray-400 text-sm">Completá el formulario y guardá para crear tu primera ruleta. Luego podrás agregar los segmentos con los premios.</div>}
                                </div>

                                {/* SUB TABS Ruleta */}
                                {selectedRuleta && (
                                    <>
                                        <div className="flex gap-2">
                                            <button onClick={() => setRtab("premios")} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${rtab === "premios" ? "bg-black text-white shadow-xl" : "bg-white text-gray-400 hover:bg-gray-50"}`}>
                                                <Shuffle className="w-4 h-4" /> Segmentos
                                            </button>
                                            <button onClick={() => { setRtab("ganadores"); getParticipantes(TENANT_ID, selectedRuleta.id).then(setRuletaGanadores); }} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${rtab === "ganadores" ? "bg-black text-white shadow-xl" : "bg-white text-gray-400 hover:bg-gray-50"}`}>
                                                <Trophy className="w-4 h-4" /> Participantes ({ruletaGanadores.length})
                                            </button>
                                        </div>

                                        {/* SLICES TAB */}
                                        {rtab === "premios" && (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm text-gray-500 font-medium">{slices.length} segmento{slices.length !== 1 ? "s" : ""} configurado{slices.length !== 1 ? "s" : ""}</p>
                                                        {slices.length > 0 && (
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                Total peso: <span className="font-bold text-purple-600">{totalProbabilidad}</span>
                                                                {" — "}Los porcentajes se calculan automáticamente.
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button onClick={() => handleOpenSliceModal()} className="flex items-center gap-2 px-5 py-2 bg-purple-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg shadow-purple-200">
                                                        <Plus className="w-4 h-4" /> Agregar Segmento
                                                    </button>
                                                </div>

                                                {slices.length === 0 && (
                                                    <div className="text-center py-16 bg-gray-50 rounded-3xl text-gray-400">
                                                        <Shuffle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                                        <p className="font-medium">No hay segmentos todavía.</p>
                                                        <p className="text-sm">¡Agregá los premios que aparecerán en la ruleta! 🎡</p>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {slices.map((s, idx) => {
                                                        const pct = totalProbabilidad > 0 ? ((s.probabilidad / totalProbabilidad) * 100).toFixed(1) : "0";
                                                        return (
                                                            <div key={s.id} className={`bg-white rounded-3xl border shadow-sm p-5 space-y-2 transition-all ${s.activo ? "border-gray-100" : "border-gray-200 opacity-50"}`}>
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-10 h-10 rounded-xl flex-shrink-0 shadow-sm border-2 border-white" style={{ background: s.color }}></div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="font-black text-base truncate">{s.nombre}</h3>
                                                                        {s.descripcion && <p className="text-sm text-gray-500 truncate">{s.descripcion}</p>}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">
                                                                    <span>Peso: {s.probabilidad}</span><span>•</span>
                                                                    <span className="text-purple-600 font-black">{pct}% de la ruleta</span>
                                                                    {!s.activo && <><span>•</span><span className="text-red-400">Inactivo</span></>}
                                                                </div>
                                                                {/* Mini progress bar */}
                                                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }}></div>
                                                                </div>
                                                                <div className="flex gap-2 pt-2">
                                                                    <button onClick={() => handleOpenSliceModal(s)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"><Edit3 className="w-3 h-3" /> Editar</button>
                                                                    <button onClick={() => updateRuletaSlice(TENANT_ID, selectedRuleta.id, s.id, { activo: !s.activo }).then(() => getRuletaSlices(TENANT_ID, selectedRuleta.id).then(setSlices))} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${s.activo ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}><Power className="w-3 h-3" /> {s.activo ? "Desactivar" : "Activar"}</button>
                                                                    <button onClick={() => handleDeleteSlice(s.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* PARTICIPANTES RULETA TAB */}
                                        {rtab === "ganadores" && (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center gap-4">
                                                    <div className="relative flex-1 max-w-sm">
                                                        <input type="text" placeholder="Buscar participante..." value={ruletaSearchTerm} onChange={(e) => setRuletaSearchTerm(e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-purple-300 transition-all shadow-sm" />
                                                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{ruletaGanadores.length} resultados</p>
                                                </div>
                                                {ruletaGanadores.length === 0 && (
                                                    <div className="text-center py-16 bg-gray-50 rounded-3xl text-gray-400">
                                                        <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                                        <p className="font-medium">Aún no hay participantes.</p>
                                                        <p className="text-sm">Cuando alguien gire la ruleta, aparecerá aquí. 🎡</p>
                                                    </div>
                                                )}
                                                {ruletaGanadores.length > 0 && (
                                                    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                                                        <table className="w-full text-sm">
                                                            <thead><tr className="border-b border-gray-50 bg-gray-50">
                                                                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre</th>
                                                                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">WhatsApp</th>
                                                                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Premio</th>
                                                                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Fecha</th>
                                                                <th className="px-5 py-3"></th>
                                                            </tr></thead>
                                                            <tbody>
                                                                {ruletaGanadores
                                                                    .filter(g => !ruletaSearchTerm || g.nombre?.toLowerCase().includes(ruletaSearchTerm.toLowerCase()) || g.whatsapp?.includes(ruletaSearchTerm))
                                                                    .map((g, i) => (
                                                                        <tr key={i} className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors">
                                                                            <td className="px-5 py-3 font-medium">{g.nombre}</td>
                                                                            <td className="px-5 py-3 text-gray-500 font-mono text-xs">{g.whatsapp}</td>
                                                                            <td className="px-5 py-3"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-wider">{g.premioNombre}</span></td>
                                                                            <td className="px-5 py-3 text-gray-400 text-xs">{parseProxyDate(g.ganado_en)?.toLocaleString("es-AR") || "—"}</td>
                                                                            <td className="px-5 py-3"><button onClick={() => handleResetRuletaGanador(g.whatsapp)} className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all"><RotateCcw className="w-3 h-3" /> Resetear</button></td>
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
                            </>
                        )}
                    </>
                )}
            </div>

            {/* MODAL: Premio (Sorteo) */}
            {showPremioModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-black text-lg">{editingPremio ? "Editar Premio" : "Nuevo Premio 🎁"}</h2>
                            <button onClick={() => setShowPremioModal(false)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nombre del Premio *</label>
                                <input className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none border border-gray-100" placeholder="Ej: 20% OFF en tratamiento facial" value={premioForm.nombre} onChange={e => setPremioForm({ ...premioForm, nombre: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Descripción</label>
                                <textarea className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none border border-gray-100 min-h-[80px]" placeholder="Detallá el premio..." value={premioForm.descripcion} onChange={e => setPremioForm({ ...premioForm, descripcion: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                                    <select className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none border border-gray-100" value={premioForm.tipo} onChange={e => setPremioForm({ ...premioForm, tipo: e.target.value as any })}>
                                        <option value="descuento">Descuento</option>
                                        <option value="regalo">Regalo</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Probabilidad (1-10)</label>
                                    <input type="number" min={1} max={10} className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none border border-gray-100" value={premioForm.probabilidad} onChange={e => setPremioForm({ ...premioForm, probabilidad: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1" title="Para premios ilimitados, dejar vacío">Stock (opcional)</label>
                                    <input type="number" min={1} placeholder="∞" className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none border border-gray-100" value={premioForm.stock} onChange={e => setPremioForm({ ...premioForm, stock: e.target.value === "" ? "" : Number(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Fecha de vencimiento *</label>
                                <input type="date" className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-pink-300 outline-none border border-gray-100" value={premioForm.vencimientoStr} onChange={e => setPremioForm({ ...premioForm, vencimientoStr: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowPremioModal(false)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Cancelar</button>
                            <button onClick={handleSavePremio} disabled={saving} className="flex-1 py-3 rounded-2xl bg-pink-500 text-white text-xs font-black uppercase tracking-widest hover:bg-pink-600 transition-all shadow-lg shadow-pink-200 disabled:opacity-50">{saving ? "Guardando..." : "Guardar Premio"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Slice (Ruleta) */}
            {showSliceModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-black text-lg">{editingSlice ? "Editar Segmento" : "Nuevo Segmento 🎡"}</h2>
                            <button onClick={() => setShowSliceModal(false)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nombre del Premio *</label>
                                <input className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-purple-300 outline-none border border-gray-100" placeholder="Ej: 20% OFF / Producto gratis" value={sliceForm.nombre} onChange={e => setSliceForm({ ...sliceForm, nombre: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Descripción (opcional)</label>
                                <textarea className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-purple-300 outline-none border border-gray-100 min-h-[70px]" placeholder="Detallá el premio..." value={sliceForm.descripcion} onChange={e => setSliceForm({ ...sliceForm, descripcion: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Imagen (opcional)</label>
                                <div className="flex items-center gap-2">
                                    {sliceForm.imagenUrl && (
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                                            <img src={sliceForm.imagenUrl} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="w-full bg-gray-50 rounded-xl p-2 text-sm font-medium focus:ring-2 focus:ring-purple-300 outline-none border border-gray-100" 
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setRuletaSaving(true);
                                            try {
                                                const url = await uploadRuletaImage(file, TENANT_ID);
                                                setSliceForm({ ...sliceForm, imagenUrl: url });
                                                toast.success("Imagen subida 🖼️");
                                            } catch (err) {
                                                toast.error("Error al subir imagen");
                                            } finally {
                                                setRuletaSaving(false);
                                            }
                                        }} 
                                    />
                                    {sliceForm.imagenUrl && (
                                        <button onClick={() => setSliceForm({ ...sliceForm, imagenUrl: undefined })} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Si subís una imagen, aparecerá en el segmento en lugar del texto</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Peso / Probabilidad *</label>
                                    <input type="number" min={1} className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-purple-300 outline-none border border-gray-100" value={sliceForm.probabilidad} onChange={e => setSliceForm({ ...sliceForm, probabilidad: Number(e.target.value) })} />
                                    <p className="text-[10px] text-gray-400 mt-1">Mayor peso = más espacio en la ruleta</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Color del segmento</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1" value={sliceForm.color} onChange={e => setSliceForm({ ...sliceForm, color: e.target.value })} />
                                        <div className="grid grid-cols-5 gap-1 flex-1">
                                            {ROULETTE_COLORS.slice(0, 10).map(c => (
                                                <button key={c} className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110" style={{ background: c, borderColor: sliceForm.color === c ? "#000" : "transparent" }} onClick={() => setSliceForm({ ...sliceForm, color: c })} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowSliceModal(false)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Cancelar</button>
                            <button onClick={handleSaveSlice} disabled={ruletaSaving} className="flex-1 py-3 rounded-2xl bg-purple-500 text-white text-xs font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg shadow-purple-200 disabled:opacity-50">{ruletaSaving ? "Guardando..." : "Guardar Segmento"}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
