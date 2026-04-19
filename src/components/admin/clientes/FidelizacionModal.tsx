import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Search, MessageCircle, Calendar, Package, AlertCircle } from "lucide-react";
import { getTurnosPorRango, TurnoDB } from "@/lib/services/agendaService";
import { Cliente } from "@/lib/services/clienteService";
import { Subtratamiento, serviceManagement } from "@/lib/services/serviceManagement";
import toast from "react-hot-toast";

interface FidelizacionModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string;
    mode: 'CON_VENTAS' | 'SIN_VENTAS';
    clientes: Cliente[];
}

export function FidelizacionModal({ isOpen, onClose, tenantId, mode, clientes }: FidelizacionModalProps) {
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [productoFiltro, setProductoFiltro] = useState("TODOS");
    
    const [isLoading, setIsLoading] = useState(false);
    const [resultados, setResultados] = useState<Cliente[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    
    // Lista de servicios/productos para el filtro
    const [opcionesFiltro, setOpcionesFiltro] = useState<{id: string, nombre: string}[]>([]);

    useEffect(() => {
        if (isOpen) {
            setFechaInicio("");
            setFechaFin("");
            setProductoFiltro("TODOS");
            setResultados([]);
            setHasSearched(false);
            cargarOpcionesFiltro();
        }
    }, [isOpen]);

    const cargarOpcionesFiltro = async () => {
        try {
            // Obtenemos todos los subtratamientos
            const subs = await serviceManagement.getAllSubtratamientos(tenantId);
            const opciones = subs.map(s => ({ id: s.id, nombre: s.nombre }));
            setOpcionesFiltro(opciones);
        } catch (error) {
            console.error("Error al cargar opciones:", error);
        }
    };

    const handleSearch = async () => {
        if (!fechaInicio || !fechaFin) {
            toast.error("Seleccione un rango de fechas");
            return;
        }

        setIsLoading(true);
        try {
            // 1. Obtener todos los turnos en ese rango
            const turnosRango = await getTurnosPorRango(tenantId, fechaInicio, fechaFin);
            
            // 2. Filtrar turnos según el producto/servicio (si no es TODOS)
            let turnosValidos = turnosRango;
            if (productoFiltro !== "TODOS") {
                const nombreProducto = opcionesFiltro.find(o => o.id === productoFiltro)?.nombre?.toLowerCase();
                turnosValidos = turnosRango.filter(t => {
                    // Verificar nombre en subtratamientosSnap o tratamientoAbreviado
                    const matchesTratamiento = t.tratamientoAbreviado?.toLowerCase().includes(nombreProducto || "");
                    const matchesSubSnap = t.subtratamientosSnap?.some(s => s.nombre.toLowerCase().includes(nombreProducto || ""));
                    const matchesSubAbrv = t.subtratamientoAbreviado?.toLowerCase().includes(nombreProducto || "");
                    return matchesTratamiento || matchesSubSnap || matchesSubAbrv;
                });
            }

            // Consideramos solo turnos que no estén cancelados (y opcionalmente completados, pero dejaremos no-cancelados)
            turnosValidos = turnosValidos.filter(t => t.status !== 'CANCELADO');

            // 3. Extraer los números de teléfono o identidades de los clientes con ventas
            // normalizamos el teléfono para comparar
            const telefonosConVentas = new Set(
                turnosValidos
                    .map(t => t.whatsapp?.replace(/\D/g, '') || t.clienteWhatsapp?.replace(/\D/g, '') || "")
                    .filter(t => t.length > 0)
            );

            // 4. Filtrar la lista principal de clientes según el modo
            const clientesFiltrados = clientes.filter(c => {
                const telNormalizado = c.telefono.replace(/\D/g, '');
                const tieneVentas = telefonosConVentas.has(telNormalizado);
                
                if (mode === 'CON_VENTAS') {
                    return tieneVentas;
                } else {
                    return !tieneVentas;
                }
            });

            setResultados(clientesFiltrados);
            setHasSearched(true);
        } catch (error) {
            console.error(error);
            toast.error("Error al buscar ventas");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] p-0 rounded-[2.5rem] overflow-hidden max-h-[90vh] flex flex-col">
                <div className={`p-6 border-b ${mode === 'CON_VENTAS' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <DialogHeader>
                        <DialogTitle className={`text-2xl font-black uppercase flex items-center gap-2 ${mode === 'CON_VENTAS' ? 'text-emerald-800' : 'text-rose-800'}`}>
                            <MessageCircle className="w-6 h-6" />
                            Campaña: {mode === 'CON_VENTAS' ? 'Clientes CON Ventas' : 'Clientes SIN Ventas'}
                        </DialogTitle>
                        <DialogDescription className={`font-medium ${mode === 'CON_VENTAS' ? 'text-emerald-600/80' : 'text-rose-600/80'}`}>
                            Selecciona un período de tiempo para generar una lista de contactos y fidelizar según tus necesidades.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                    {/* Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Fecha Inicio
                            </label>
                            <Input 
                                type="date" 
                                value={fechaInicio} 
                                onChange={(e) => setFechaInicio(e.target.value)} 
                                className="h-12 border-gray-200 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Fecha Fin
                            </label>
                            <Input 
                                type="date" 
                                value={fechaFin} 
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="h-12 border-gray-200 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Package className="w-3 h-3" /> Servicio/Producto
                            </label>
                            <Select value={productoFiltro} onValueChange={setProductoFiltro}>
                                <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                                    <SelectValue placeholder="Limitar a..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODOS" className="font-bold text-gray-900">TODOS</SelectItem>
                                    {opcionesFiltro.map(op => (
                                        <SelectItem key={op.id} value={op.id}>{op.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button 
                        onClick={handleSearch} 
                        disabled={isLoading}
                        className={`w-full h-14 rounded-2xl font-black text-white text-lg tracking-wide uppercase transition-all shadow-xl active:scale-[0.98] ${mode === 'CON_VENTAS' ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-500/20'}`}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> 
                                Buscando...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Search className="w-5 h-5" /> Generar Lista
                            </span>
                        )}
                    </Button>

                    {/* Resultados */}
                    {hasSearched && (
                        <div className="mt-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-black tracking-widest uppercase text-gray-900 border-l-4 border-black pl-3">
                                    Resultados ({resultados.length})
                                </h4>
                            </div>

                            {resultados.length === 0 ? (
                                <div className="p-10 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center gap-3 bg-gray-50/50">
                                    <AlertCircle className="w-10 h-10 text-gray-300" />
                                    <div>
                                        <p className="font-black text-gray-900">No se encontraron clientes</p>
                                        <p className="text-sm font-medium text-gray-500 mt-1">Prueba con otras fechas u otro filtro de servicio.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">
                                    {resultados.map(c => (
                                        <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 truncate">
                                                    {c.nombre} {c.apellido}
                                                </span>
                                                <span className="text-xs font-bold text-gray-500 font-mono mt-0.5">
                                                    {c.telefono}
                                                </span>
                                            </div>
                                            <a 
                                                href={`https://wa.me/${c.telefono.replace(/\D/g, '')}?text=Hola%20${c.nombre},%20tenemos%20una%20novedad%20para%20vos!`}
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="w-10 h-10 bg-[#25D366] hover:bg-[#1ebd5a] active:scale-95 transition-all text-white rounded-xl shadow-md flex items-center justify-center shrink-0"
                                                title="Contactar por WhatsApp"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
