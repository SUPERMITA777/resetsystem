import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { serviceManagement, Tratamiento, Subtratamiento } from '@/lib/services/serviceManagement';
import { clienteService, Cliente } from '@/lib/services/clienteService';
import { getUsersByTenant, UserProfile } from '@/lib/services/userService';
import { historiaClinicaService } from '@/lib/services/historiaClinicaService';
import { productService, Producto, CarritoItem } from '@/lib/services/productService';
import {
    Clock, Tag, User, Phone, DollarSign, X, Trash2, Calendar,
    Plus, Bell, Search, ShoppingCart, Minus, Package, ChevronDown
} from 'lucide-react';
import { TurnoData } from './TurnoCard';
import toast from 'react-hot-toast';

interface NuevoTurnoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (turno: any) => void;
    onDelete?: (turnoId: string) => void;
    initialHora?: string;
    initialBox?: string;
    initialFecha?: string;
    initialTratamientoId?: string;
    editTurno?: TurnoData | null;
    agendaConfig?: any;
}

const FIELD = "w-full h-10 px-3 bg-[#f2f4f4] rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-black/10 transition-all border-0 appearance-none";
const LABEL = "block text-[9px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1";
const SECTION = "space-y-3";
const SECTION_TITLE = "flex items-center gap-2 mb-3";
const SECTION_BADGE = "text-[9px] font-black uppercase tracking-widest text-white bg-black px-2 py-0.5 rounded-full";
const SECTION_LINE = "flex-1 h-px bg-gray-100";

export function NuevoTurnoModal({
    isOpen, onClose, onSave, onDelete,
    initialHora, initialBox, initialFecha, initialTratamientoId,
    editTurno, agendaConfig
}: NuevoTurnoModalProps) {

    // ── Datos básicos ──────────────────────────────────────
    const [cliente, setCliente] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [fecha, setFecha] = useState(initialFecha || '');
    const [hora, setHora] = useState(initialHora || '09:00');
    const [status, setStatus] = useState<'PENDIENTE' | 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO'>('RESERVADO');

    // ── Tratamiento ────────────────────────────────────────
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
    const [selectedTratamientoId, setSelectedTratamientoId] = useState('');
    const [subtratamientos, setSubtratamientos] = useState<Subtratamiento[]>([]);
    const [selectedSubs, setSelectedSubs] = useState<Subtratamiento[]>([]);
    const [profesionales, setProfesionales] = useState<UserProfile[]>([]);
    const [selectedProfesionalId, setSelectedProfesionalId] = useState('');
    const [loadingSubs, setLoadingSubs] = useState(false);

    // ── Pagos ──────────────────────────────────────────────
    const [sena, setSena] = useState(0);
    const [pagoSaldo, setPagoSaldo] = useState(0);
    const [ajustePrecio, setAjustePrecio] = useState(0);
    const [metodoPagoSena, setMetodoPagoSena] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
    const [metodoPagoSaldo, setMetodoPagoSaldo] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
    const [saldoPagado, setSaldoPagado] = useState(false);
    const [historialPagos, setHistorialPagos] = useState<any[]>([]);
    const [initialSena, setInitialSena] = useState(0);
    const [initialPagoSaldo, setInitialPagoSaldo] = useState(0);

    // ── Carrito de productos ───────────────────────────────
    const [productos, setProductos] = useState<Producto[]>([]);
    const [carrito, setCarrito] = useState<CarritoItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);

    // ── Autocomplete cliente ───────────────────────────────
    const [clientesDb, setClientesDb] = useState<Cliente[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);

    // ── Loading / UI ───────────────────────────────────────
    const [saving, setSaving] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    const currentTenant = typeof window !== 'undefined'
        ? localStorage.getItem('currentTenant') || 'resetspa'
        : 'resetspa';

    // ── Totales calculados ─────────────────────────────────
    const subtotalServicios = selectedSubs.reduce((acc, s) => acc + s.precio, 0);
    const subtotalProductos = carrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
    const totalBruto = subtotalServicios + subtotalProductos + ajustePrecio;
    const totalCobrado = sena + pagoSaldo;
    const saldoPendiente = Math.max(0, totalBruto - totalCobrado);
    const duracionTotal = selectedSubs.reduce((acc, s) => acc + s.duracion_minutos, 0);

    // ── Inicialización ─────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        loadTratamientos();
        loadClientes();
        loadProfesionales();
        loadProductos();

        if (editTurno) {
            setCliente(editTurno.clienteAbreviado || '');
            setTelefono(editTurno.whatsapp || '');
            setEmail(editTurno.email || '');
            setHora(editTurno.horaInicio.substring(0, 5));
            setSena(editTurno.sena || 0);
            setAjustePrecio(editTurno.ajustePrecio || 0);
            setMetodoPagoSena(editTurno.metodoPagoSena || 'EFECTIVO');
            setMetodoPagoSaldo(editTurno.metodoPagoSaldo || 'EFECTIVO');
            setPagoSaldo(editTurno.pagoSaldo || 0);
            setSaldoPagado(editTurno.saldoPagado || false);
            setHistorialPagos(editTurno.historialPagos || []);
            setInitialSena(editTurno.sena || 0);
            setInitialPagoSaldo(editTurno.pagoSaldo || 0);
            setStatus(editTurno.status || 'RESERVADO');
            setFecha(editTurno.fecha || '');
            setSelectedTratamientoId(editTurno.tratamientoId || '');
            setSelectedProfesionalId(editTurno.profesionalId || '');
            // Restore carrito if exists
            if (editTurno.carrito) {
                setCarrito(editTurno.carrito.map(c => ({
                    producto: {
                        id: c.productoId,
                        nombre: c.nombre || '',
                        marca: c.marca || '',
                        precio: c.precio || 0,
                        precio_costo: 0,
                        categoria: ''
                    } as Producto,
                    cantidad: c.cantidad
                })));
            } else {
                setCarrito([]);
            }
            if (editTurno.tratamientoId) {
                loadSubAndSync(editTurno.tratamientoId, editTurno.subIds || [], editTurno.tratamientoAbreviado);
            }
        } else {
            resetForm();
            if (initialTratamientoId) handleTratamientoChange(initialTratamientoId);
        }
    }, [isOpen, editTurno, initialHora, initialFecha, initialTratamientoId]);

    // ESC key
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    // Product search
    useEffect(() => {
        if (!productSearch.trim()) { setFilteredProductos([]); return; }
        const q = productSearch.toLowerCase();
        setFilteredProductos(
            productos.filter(p =>
                p.nombre.toLowerCase().includes(q) ||
                p.marca?.toLowerCase().includes(q)
            ).slice(0, 8)
        );
    }, [productSearch, productos]);

    const resetForm = () => {
        setCliente(''); setTelefono(''); setEmail('');
        setFecha(initialFecha || ''); setHora(initialHora || '09:00');
        setSena(0); setPagoSaldo(0); setAjustePrecio(0);
        setMetodoPagoSena('EFECTIVO'); setMetodoPagoSaldo('EFECTIVO');
        setSaldoPagado(false); setHistorialPagos([]);
        setInitialSena(0); setInitialPagoSaldo(0);
        setSelectedSubs([]); setStatus('RESERVADO');
        setSelectedTratamientoId(''); setSelectedProfesionalId('');
        setCarrito([]); setProductSearch('');
    };

    const getArgentinaTimeData = () => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('sv-SE', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });
        const parts = formatter.formatToParts(now);
        const get = (t: string) => parts.find(p => p.type === t)?.value || '';
        return {
            fecha: `${get('year')}-${get('month')}-${get('day')}`,
            hora: `${get('hour')}:${get('minute')}`,
            timestamp: now.getTime()
        };
    };

    // ── Loaders ────────────────────────────────────────────
    const loadProfesionales = async () => {
        try {
            const users = await getUsersByTenant(currentTenant);
            setProfesionales(users.filter(u => u.role === 'staff' || u.role === 'salon_admin'));
        } catch { }
    };
    const loadClientes = async () => {
        try { setClientesDb(await clienteService.getClientes(currentTenant)); } catch { }
    };
    const loadTratamientos = async () => {
        try {
            const data = await serviceManagement.getTratamientos(currentTenant);
            setTratamientos(data.filter(t => t.habilitado));
        } catch { }
    };
    const loadProductos = async () => {
        try { setProductos(await productService.getProductos(currentTenant)); } catch { }
    };

    // ── Handlers tratamiento ───────────────────────────────
    const handleTratamientoChange = async (id: string) => {
        setSelectedTratamientoId(id);
        setSubtratamientos([]);
        setSelectedSubs([]);
        if (!id) return;
        setLoadingSubs(true);
        try {
            const data = await serviceManagement.getSubtratamientos(currentTenant, id);
            setSubtratamientos(data);
        } catch { } finally { setLoadingSubs(false); }
    };
    const loadSubAndSync = async (tratId: string, subIds: string[], subAbreviado?: string) => {
        setLoadingSubs(true);
        try {
            const data = await serviceManagement.getSubtratamientos(currentTenant, tratId);
            setSubtratamientos(data);
            
            let matched = data.filter(s => subIds.includes(s.id));
            
            // Fallback: Si no hay match por ID pero tenemos nombre abreviado
            if (matched.length === 0 && subAbreviado) {
                const subNames = subAbreviado.split(',').map(n => n.trim().toLowerCase());
                matched = data.filter(s => subNames.some(name => s.nombre.toLowerCase().includes(name)));
            }
            
            setSelectedSubs(matched);
        } catch { } finally { setLoadingSubs(false); }
    };
    const handleAddSub = (id: string) => {
        if (!id) return;
        const sub = subtratamientos.find(s => s.id === id);
        if (sub && !selectedSubs.find(s => s.id === id)) setSelectedSubs(prev => [...prev, sub]);
    };
    const handleRemoveSub = (id: string) => setSelectedSubs(prev => prev.filter(s => s.id !== id));

    // ── Handlers cliente ───────────────────────────────────
    const handleClienteInput = (val: string) => {
        setCliente(val);
        if (val.length > 1) {
            const r = clientesDb.filter(c =>
                `${c.nombre} ${c.apellido}`.toLowerCase().includes(val.toLowerCase()) ||
                c.telefono.includes(val)
            );
            setFilteredClientes(r);
            setShowSuggestions(r.length > 0);
        } else { setShowSuggestions(false); }
    };
    const handleSelectCliente = (c: Cliente) => {
        setCliente(`${c.nombre} ${c.apellido}`);
        setTelefono(c.telefono);
        setEmail(c.email || '');
        setShowSuggestions(false);
    };

    // ── Handlers carrito ───────────────────────────────────
    const addToCarrito = (p: Producto) => {
        setCarrito(prev => {
            const existing = prev.find(item => item.producto.id === p.id);
            if (existing) return prev.map(item =>
                item.producto.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item
            );
            return [...prev, { producto: p, cantidad: 1 }];
        });
        setProductSearch('');
        setShowProductDropdown(false);
    };
    const updateCantidad = (productoId: string, delta: number) => {
        setCarrito(prev => prev
            .map(item => item.producto.id === productoId
                ? { ...item, cantidad: Math.max(0, item.cantidad + delta) }
                : item
            )
            .filter(item => item.cantidad > 0)
        );
    };
    const removeFromCarrito = (productoId: string) =>
        setCarrito(prev => prev.filter(item => item.producto.id !== productoId));

    // ── Guardar historial ──────────────────────────────────
    const registrarHistoriaClinica = async (
        tratNombre: string, subNombre: string, profNombre: string
    ) => {
        try {
            const wa = telefono.replace(/\D/g, '');
            if (!wa) return;
            let clienteFound = await clienteService.getClienteByTelefono(currentTenant, wa);
            if (!clienteFound) {
                // Intentar crear cliente básico
                const nameParts = cliente.trim().split(' ');
                const newId = await clienteService.createCliente(currentTenant, {
                    nombre: nameParts[0] || cliente,
                    apellido: nameParts.slice(1).join(' ') || '',
                    telefono: wa,
                    tenantId: currentTenant
                });
                clienteFound = { id: newId, nombre: nameParts[0], apellido: nameParts.slice(1).join(' '), telefono: wa, tenantId: currentTenant };
            }
            const { fecha: argFecha, hora: argHora } = getArgentinaTimeData();
            const productosText = carrito.length > 0
                ? 'Productos: ' + carrito.map(i => `${i.producto.nombre} x${i.cantidad}`).join(', ')
                : '';
            const prof = profesionales.find(p => p.uid === selectedProfesionalId);

            await historiaClinicaService.addEntrada(currentTenant, clienteFound.id, {
                fecha: argFecha,
                hora: argHora,
                profesionalId: selectedProfesionalId || '',
                profesionalNombre: profNombre,
                tratamiento: tratNombre,
                subtratamiento: subNombre,
                nota: `Pago completado.${productosText ? ' ' + productosText : ''}`
            });
        } catch (err) {
            console.error('Error guardando historia clínica:', err);
        }
    };

    // ── Submit ─────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!onSave) return;
        if (!fecha || !hora || !cliente) { toast.error("Completá fecha, hora y cliente"); return; }
        if (selectedSubs.length === 0) { toast.error("Seleccioná al menos un servicio"); return; }

        setSaving(true);
        try {
            const trat = tratamientos.find(t => t.id === selectedTratamientoId);
            if (!trat) { toast.error("Seleccioná un tratamiento"); return; }

            const nameParts = cliente.trim().split(' ');
            const subNames = selectedSubs.map(s => s.nombre).join(', ');
            const prof = profesionales.find(p => p.uid === selectedProfesionalId);

            const subtratamientosSnap = selectedSubs.map(s => ({
                id: s.id, nombre: s.nombre, precio: s.precio, duracion: s.duracion_minutos
            }));

            const argData = getArgentinaTimeData();
            const newHistorial = [...historialPagos];

            if (sena > initialSena) newHistorial.push({
                monto: sena - initialSena, metodo: metodoPagoSena, tipo: 'SEÑA',
                fecha: argData.fecha, timestamp: argData.timestamp
            });
            if (pagoSaldo > initialPagoSaldo) newHistorial.push({
                monto: pagoSaldo - initialPagoSaldo, metodo: metodoPagoSaldo, tipo: 'SALDO',
                fecha: argData.fecha, timestamp: argData.timestamp
            });

            const pagoCompleto = totalCobrado >= totalBruto && totalBruto > 0;

            // Descontar stock de productos si pago completo
            if (pagoCompleto && carrito.length > 0) {
                for (const item of carrito) {
                    await productService.decrementStock(currentTenant, item.producto.id, item.cantidad);
                }
            }

            // Registrar en historia clínica si COMPLETADO y pago completo
            if (status === 'COMPLETADO' && pagoCompleto) {
                await registrarHistoriaClinica(
                    trat.nombre,
                    subNames,
                    prof ? prof.displayName || prof.email : ''
                );
            }

            onSave({
                clienteAbreviado: cliente,
                nombre: nameParts[0] || '',
                apellido: nameParts.slice(1).join(' ') || '',
                whatsapp: telefono,
                email,
                tratamientoAbreviado: subNames,
                duracionMinutos: duracionTotal,
                horaInicio: hora,
                boxId: initialBox || trat.boxId || 'box-1',
                fecha,
                sena,
                total: totalBruto,
                status,
                tratamientoId: selectedTratamientoId,
                subIds: selectedSubs.map(s => s.id),
                profesionalId: selectedProfesionalId,
                profesionalNombre: prof ? prof.displayName || prof.email : '',
                ajustePrecio,
                subtratamientosSnap,
                metodoPagoSena,
                metodoPagoSaldo,
                pagoSaldo,
                saldoPagado: pagoCompleto,
                historialPagos: newHistorial,
                carrito: carrito.map(i => ({ productoId: i.producto.id, nombre: i.producto.nombre, marca: i.producto.marca, precio: i.producto.precio, cantidad: i.cantidad })),
                subtotalProductos,
            });

            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Error al guardar el turno");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (editTurno && onDelete && window.confirm("¿Eliminar este turno?")) {
            onDelete(editTurno.id);
            onClose();
        }
    };

    const handleSendReminder = () => {
        if (!telefono) { toast.error("Sin teléfono asignado"); return; }
        const trat = tratamientos.find(t => t.id === selectedTratamientoId);
        let template = agendaConfig?.reminder_message ||
            "Hola! te recordamos que el turno del dia %fecha% a las %hora% para %tratamiento%. Dirección: VELES SARSFIELD 59.";
        const msg = template
            .replace(/%fecha%/g, fecha ? format(new Date(fecha + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es }) : fecha)
            .replace(/%hora%/g, hora)
            .replace(/%tratamiento%/g, trat?.nombre || 'Tratamiento')
            .replace(/%subtratamiento%/g, selectedSubs.map(s => s.nombre).join(', '));
        window.open(`https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    if (!isOpen) return null;

    // ── Disponibles para agregar ───────────────────────────
    const availableSubs = subtratamientos.filter(s => !selectedSubs.find(sel => sel.id === s.id));

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div
                className="relative bg-[#f9f9f9] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[97vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 leading-none">
                            {editTurno ? 'Editar Turno' : 'Nuevo Turno'}
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                            Reset Spa — Panel Admin
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {editTurno && (
                            <button
                                onClick={handleDelete}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Body — dos columnas ── */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x lg:divide-gray-100">

                        {/* ════ COL IZQUIERDA ════ */}
                        <div className="p-5 space-y-5 overflow-y-auto">

                            {/* SECCIÓN 1: DATOS BÁSICOS */}
                            <div className={SECTION}>
                                <div className={SECTION_TITLE}>
                                    <span className={SECTION_BADGE}>1</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Datos Básicos</span>
                                    <div className={SECTION_LINE} />
                                </div>

                                {/* Fecha + Hora + Estado */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-1">
                                        <label className={LABEL}>Fecha</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                            <input
                                                type="date"
                                                value={fecha}
                                                onChange={e => setFecha(e.target.value)}
                                                className={`${FIELD} pl-8`}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <label className={LABEL}>Hora</label>
                                        <div className="relative">
                                            <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                            <input
                                                type="time"
                                                value={hora}
                                                onChange={e => setHora(e.target.value)}
                                                className={`${FIELD} pl-8`}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <label className={LABEL}>Estado</label>
                                        <select
                                            value={status}
                                            onChange={e => setStatus(e.target.value as any)}
                                            className={FIELD}
                                        >
                                            <option value="RESERVADO">RESERVADO</option>
                                            <option value="CONFIRMADO">CONFIRMADO</option>
                                            <option value="COMPLETADO">COMPLETADO</option>
                                            <option value="PENDIENTE">PENDIENTE</option>
                                            <option value="CANCELADO">CANCELADO</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Cliente */}
                                <div className="relative">
                                    <label className={LABEL}>Cliente</label>
                                    <div className="relative">
                                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Nombre y apellido"
                                            value={cliente}
                                            onChange={e => handleClienteInput(e.target.value)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                            className={`${FIELD} pl-8`}
                                        />
                                    </div>
                                    {showSuggestions && (
                                        <div className="absolute z-50 w-full mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-44 overflow-y-auto">
                                            {filteredClientes.map(c => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onMouseDown={() => handleSelectCliente(c)}
                                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex justify-between items-center border-b border-gray-50 last:border-0"
                                                >
                                                    <span className="text-xs font-bold text-gray-900">{c.nombre} {c.apellido}</span>
                                                    <span className="text-[10px] text-gray-400">{c.telefono}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* WhatsApp */}
                                <div>
                                    <label className={LABEL}>WhatsApp</label>
                                    <div className="relative">
                                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="tel"
                                            placeholder="Ej: 54911..."
                                            value={telefono}
                                            onChange={e => setTelefono(e.target.value)}
                                            className={`${FIELD} pl-8`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 2: TRATAMIENTO */}
                            <div className={SECTION}>
                                <div className={SECTION_TITLE}>
                                    <span className={SECTION_BADGE}>2</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Tratamiento</span>
                                    <div className={SECTION_LINE} />
                                </div>

                                {/* Tratamiento principal */}
                                <div>
                                    <label className={LABEL}>Tratamiento principal</label>
                                    <div className="relative">
                                        <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <select
                                            value={selectedTratamientoId}
                                            onChange={e => handleTratamientoChange(e.target.value)}
                                            className={`${FIELD} pl-8`}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {tratamientos.map(t => (
                                                <option key={t.id} value={t.id}>{t.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Subtratamientos */}
                                <div>
                                    <label className={LABEL}>Servicios a realizar</label>
                                    <div className="relative">
                                        <Plus className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <select
                                            disabled={!selectedTratamientoId || loadingSubs}
                                            value=""
                                            onChange={e => handleAddSub(e.target.value)}
                                            className={`${FIELD} pl-8 disabled:opacity-50`}
                                        >
                                            <option value="">
                                                {loadingSubs ? 'Cargando...' : availableSubs.length === 0 && selectedTratamientoId ? 'Sin más servicios' : 'Agregar servicio...'}
                                            </option>
                                            {availableSubs.map(s => (
                                                <option key={s.id} value={s.id}>{s.nombre} — ${s.precio}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Selected subs */}
                                {selectedSubs.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedSubs.map(s => (
                                            <span
                                                key={s.id}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-black text-white text-[10px] font-black rounded-full"
                                            >
                                                {s.nombre} · ${s.precio}
                                                <button onClick={() => handleRemoveSub(s.id)} className="ml-0.5 hover:text-red-300 transition-colors">
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Profesional */}
                                <div>
                                    <label className={LABEL}>Profesional asignado</label>
                                    <div className="relative">
                                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <select
                                            value={selectedProfesionalId}
                                            onChange={e => setSelectedProfesionalId(e.target.value)}
                                            className={`${FIELD} pl-8`}
                                        >
                                            <option value="">Cualquiera</option>
                                            {profesionales.map(p => (
                                                <option key={p.uid} value={p.uid}>{p.displayName || p.email}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ════ COL DERECHA ════ */}
                        <div className="p-5 space-y-5 overflow-y-auto bg-white lg:bg-[#f9f9f9]">

                            {/* SECCIÓN 3: PAGOS */}
                            <div className={SECTION}>
                                <div className={SECTION_TITLE}>
                                    <span className={SECTION_BADGE}>3</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Pagos</span>
                                    <div className={SECTION_LINE} />
                                </div>

                                {/* Seña + Saldo */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={LABEL + " text-emerald-600"}>Seña ($)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={sena}
                                            onChange={e => {
                                                const v = Number(e.target.value) || 0;
                                                setSena(v);
                                                if (v > 1 && status === 'RESERVADO') setStatus('CONFIRMADO');
                                            }}
                                            className={FIELD + " text-emerald-700 font-black"}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL + " text-blue-600"}>Saldo ($)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={pagoSaldo}
                                            onChange={e => {
                                                const v = Number(e.target.value) || 0;
                                                setPagoSaldo(v);
                                                setSaldoPagado(v > 0 && v >= (totalBruto - sena));
                                            }}
                                            className={FIELD + " text-blue-700 font-black"}
                                        />
                                    </div>
                                </div>

                                {/* Método de pago */}
                                <div>
                                    <label className={LABEL}>Método de pago</label>
                                    <div className="flex gap-1">
                                        {(['EFECTIVO', 'TRANSFERENCIA'] as const).map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => { setMetodoPagoSena(m); setMetodoPagoSaldo(m); }}
                                                className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all uppercase tracking-widest ${metodoPagoSena === m ? 'bg-black text-white shadow' : 'bg-[#f2f4f4] text-gray-400'}`}
                                            >
                                                {m === 'EFECTIVO' ? '💵 Efectivo' : '🏦 Trans.'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Ajuste */}
                                <div>
                                    <label className={LABEL}>Ajuste Manual ($)</label>
                                    <input
                                        type="number"
                                        value={ajustePrecio}
                                        onChange={e => setAjustePrecio(Number(e.target.value) || 0)}
                                        className={FIELD}
                                        placeholder="+/-"
                                    />
                                </div>

                                {/* Resumen de precios */}
                                <div className="bg-[#f2f4f4] rounded-2xl p-4 space-y-1.5">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-500 font-medium">Servicios</span>
                                        <span className="font-black text-gray-800">${subtotalServicios.toFixed(2)}</span>
                                    </div>
                                    {subtotalProductos > 0 && (
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-gray-500 font-medium">Productos</span>
                                            <span className="font-black text-gray-800">${subtotalProductos.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {ajustePrecio !== 0 && (
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-gray-500 font-medium">Ajuste</span>
                                            <span className={`font-black ${ajustePrecio > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {ajustePrecio > 0 ? '+' : ''}${ajustePrecio.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 pt-1.5 flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total</span>
                                        <span className="text-lg font-black text-black">${totalBruto.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-400 font-medium">Cobrado</span>
                                        <span className="font-black text-emerald-600">${totalCobrado.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-400 font-medium">Saldo pendiente</span>
                                        <span className={`font-black ${saldoPendiente > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                            {saldoPendiente > 0 ? `-$${saldoPendiente.toFixed(2)}` : '✓ Pagado'}
                                        </span>
                                    </div>
                                    {duracionTotal > 0 && (
                                        <div className="flex justify-between text-[11px] pt-1 border-t border-gray-200 mt-1">
                                            <span className="text-gray-400 font-medium">Duración</span>
                                            <span className="font-black text-blue-600">{duracionTotal} min</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SECCIÓN 4: PRODUCTOS */}
                            <div className={SECTION}>
                                <div className={SECTION_TITLE}>
                                    <span className={SECTION_BADGE}>4</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Productos</span>
                                    <div className={SECTION_LINE} />
                                </div>

                                {/* Buscador */}
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        placeholder="Buscar producto por nombre o marca..."
                                        value={productSearch}
                                        onChange={e => {
                                            setProductSearch(e.target.value);
                                            setShowProductDropdown(true);
                                        }}
                                        onFocus={() => setShowProductDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowProductDropdown(false), 150)}
                                        className={`${FIELD} pl-8`}
                                    />
                                    {showProductDropdown && filteredProductos.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-48 overflow-y-auto">
                                            {filteredProductos.map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onMouseDown={() => addToCarrito(p)}
                                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                                                >
                                                    <div>
                                                        <p className="text-xs font-black text-gray-900">{p.nombre}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium">{p.marca}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-gray-700">${p.precio}</span>
                                                        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                                                            <Plus className="w-3 h-3 text-white" />
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Carrito */}
                                {carrito.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                                        <ShoppingCart className="w-8 h-8 text-gray-200 mb-2" />
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Carrito vacío</p>
                                        <p className="text-[9px] text-gray-300 mt-0.5">Buscá un producto para agregar</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {carrito.map(item => (
                                            <div key={item.producto.id} className="flex items-center gap-2 bg-[#f2f4f4] rounded-2xl p-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-gray-900 truncate">{item.producto.nombre}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">{item.producto.marca} · ${item.producto.precio} c/u</p>
                                                </div>
                                                {/* Controls */}
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCantidad(item.producto.id, -1)}
                                                        className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-100 transition-all"
                                                    >
                                                        <Minus className="w-3 h-3 text-gray-600" />
                                                    </button>
                                                    <span className="text-xs font-black text-gray-900 w-5 text-center">{item.cantidad}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCantidad(item.producto.id, 1)}
                                                        className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-100 transition-all"
                                                    >
                                                        <Plus className="w-3 h-3 text-gray-600" />
                                                    </button>
                                                </div>
                                                <span className="text-xs font-black text-gray-900 w-16 text-right flex-shrink-0">
                                                    ${(item.producto.precio * item.cantidad).toFixed(2)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCarrito(item.producto.id)}
                                                    className="w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-all flex-shrink-0"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {/* Total productos */}
                                        <div className="flex justify-between items-center px-3 py-1.5">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total productos</span>
                                            <span className="text-sm font-black text-gray-900">${subtotalProductos.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex-shrink-0 bg-white border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Total */}
                    <div className="flex-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total del Turno</p>
                        <p className="text-2xl font-black text-black leading-none">${totalBruto.toFixed(2)}</p>
                        {saldoPendiente > 0 && (
                            <p className="text-[9px] font-bold text-red-500 mt-0.5">Saldo pendiente: ${saldoPendiente.toFixed(2)}</p>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex flex-wrap gap-2 justify-end">
                        {editTurno && (
                            <button
                                onClick={handleSendReminder}
                                className="h-10 px-4 rounded-full border border-emerald-400 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center gap-1.5"
                            >
                                <Bell className="w-3 h-3" /> Recordatorio
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="h-10 px-5 rounded-full bg-gray-100 text-gray-600 text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="h-10 px-6 rounded-full bg-black text-white text-[9px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-60 flex items-center gap-1.5 shadow-lg shadow-black/20"
                        >
                            {saving ? (
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                    Guardando...
                                </span>
                            ) : (
                                editTurno ? 'Guardar Cambios' : 'Confirmar Turno'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
