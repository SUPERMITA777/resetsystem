"use client";

import React, { useState, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, User, Phone, Mail, Calendar, Edit2, Trash2, MoreVertical, Plus, Filter, Download, Upload, LayoutGrid, List, MessageCircle, Zap } from "lucide-react";
import { clienteService, Cliente } from "@/lib/services/clienteService";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from 'xlsx';
import { NuevoClienteModal } from "@/components/admin/clientes/NuevoClienteModal";
import { ImportarClientesModal } from "@/components/admin/clientes/ImportClientesModal";
import { EditarClienteModal } from "@/components/admin/clientes/EditarClienteModal";
import { AddCreditsModal } from "@/components/admin/clientes/AddCreditsModal";

export default function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // UI States
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

    const currentTenant = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

    const loadClientes = async () => {
        setLoading(true);
        try {
            const data = await clienteService.getClientes(currentTenant);
            setClientes(data);
            setFilteredClientes(data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar clientes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClientes();
    }, [currentTenant]);

    useEffect(() => {
        const filtered = clientes.filter(c => 
            `${c.nombre} ${c.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.telefono.includes(searchTerm) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredClientes(filtered);
    }, [searchTerm, clientes]);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este cliente?")) return;
        const loadingToast = toast.loading("Eliminando cliente...");
        try {
            await clienteService.deleteCliente(currentTenant, id);
            toast.success("Cliente eliminado", { id: loadingToast });
            loadClientes();
        } catch (error) {
            toast.error("Error al eliminar", { id: loadingToast });
        }
    };

    const handleEdit = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setIsEditModalOpen(true);
    };

    const handleExportExcel = () => {
        const exportData = filteredClientes.map(c => ({
            Nombre: c.nombre,
            Apellido: c.apellido,
            Telefono: c.telefono,
            Email: c.email || "",
            "Ultima Visita": c.ultimaVisita || "Sin visitas",
            Notas: c.notas || ""
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        // Ajustar ancho
        worksheet["!cols"] = [
            { wpx: 100 }, // Nombre
            { wpx: 100 }, // Apellido
            { wpx: 120 }, // Telefono
            { wpx: 150 }, // Email
            { wpx: 120 }, // Visita
            { wpx: 200 }  // Notas
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
        XLSX.writeFile(workbook, "clientes_resetsystem.xlsx");
    };

    return (
        <>
            <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
                <Toaster />
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-montserrat uppercase">Clientes</h1>
                        <p className="text-gray-500 mt-1 font-medium">Base de datos centralizada de tus clientes.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={() => setIsImportModalOpen(true)} variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl px-6 h-12 font-bold transition-all">
                            <Upload className="w-5 h-5 mr-2" />
                            Importar
                        </Button>
                        <Button onClick={handleExportExcel} variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl px-6 h-12 font-bold transition-all">
                            <Download className="w-5 h-5 mr-2" />
                            Exportar
                        </Button>
                        <Button onClick={() => setIsNewClientModalOpen(true)} className="bg-black text-white hover:bg-gray-800 rounded-2xl px-8 h-12 font-bold shadow-xl transition-all active:scale-95 group">
                            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                            Nuevo Cliente
                        </Button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-[2rem] shadow-premium-soft border border-gray-100">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input 
                            placeholder="Buscar por nombre, teléfono o email..." 
                            className="pl-14 h-14 bg-gray-50/50 border-none rounded-[1.5rem] font-bold text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-black"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center bg-gray-50/50 p-1 rounded-2xl border border-gray-100 h-14">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`flex items-center justify-center w-12 h-10 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Vista en Tarjetas"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`flex items-center justify-center w-12 h-10 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Vista en Planilla"
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>

                    <button className="h-14 px-6 flex items-center gap-2 text-gray-400 font-bold hover:text-black hover:bg-gray-50 rounded-[1.5rem] transition-all">
                        <Filter className="w-5 h-5" />
                        Filtros
                    </button>
                </div>

                {/* Clients Grid/List */}
                <div className="grid gap-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="animate-spin w-10 h-10 border-4 border-black border-t-transparent rounded-full" />
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Buscando Clientes</span>
                        </div>
                    ) : filteredClientes.length === 0 ? (
                        <Card className="p-20 text-center border-none shadow-premium-soft rounded-[2.5rem]">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                    <User className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-900">No se encontraron clientes</p>
                                    <p className="text-gray-400 text-sm mt-1">Intenta con otro término de búsqueda o crea uno nuevo.</p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        viewMode === 'cards' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredClientes.map(cliente => (
                                    <Card key={cliente.id} className="overflow-hidden border-none shadow-premium-soft group hover:shadow-premium transition-all duration-300 rounded-[2rem]">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all duration-300">
                                                    <User className="w-6 h-6" />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <a href={`https://wa.me/${cliente.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-300 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all" title="Contactar por WhatsApp">
                                                        <MessageCircle className="w-4 h-4" />
                                                    </a>
                                                    <button 
                                                        onClick={() => { setSelectedCliente(cliente); setIsCreditsModalOpen(true); }}
                                                        className="p-2 text-gray-300 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                                                        title="Cargar Créditos"
                                                    >
                                                        <Zap className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleEdit(cliente)} className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Editar cliente">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(cliente.id)}
                                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Eliminar cliente"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-1 mb-6">
                                                <h3 className="text-xl font-black text-gray-900 truncate">
                                                    {cliente.nombre} {cliente.apellido}
                                                </h3>
                                                <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${ (cliente.creditos || 0) <= 1 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                    <span className={`w-2 h-2 rounded-full animate-pulse ${ (cliente.creditos || 0) <= 1 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                    {cliente.creditos || 0} Créditos
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                                                    <Phone className="w-4 h-4 text-gray-300" />
                                                    {cliente.telefono}
                                                </div>
                                                {cliente.email && (
                                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                                                        <Mail className="w-4 h-4 text-gray-300" />
                                                        {cliente.email}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                                                    <Calendar className="w-4 h-4 text-gray-300" />
                                                    <span className="text-[10px] uppercase tracking-wider text-gray-400">Última visita:</span>
                                                    {cliente.ultimaVisita || "Sin visitas"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center group-hover:bg-gray-50 transition-colors">
                                            <button className="text-[10px] font-black text-black uppercase tracking-widest hover:underline">
                                                Ver Historial
                                            </button>
                                            <div className="flex -space-x-2">
                                                <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-100" />
                                                <div className="w-6 h-6 rounded-full border-2 border-white bg-emerald-100" />
                                                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold">+2</div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="border-none shadow-premium-soft rounded-[2rem] overflow-hidden bg-white">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                                <th className="p-4 pl-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Cliente</th>
                                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Contacto</th>
                                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Última Visita</th>
                                                <th className="p-4 pr-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredClientes.map(cliente => (
                                                <tr key={cliente.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="p-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 shrink-0">
                                                                <User className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900">{cliente.nombre} {cliente.apellido}</p>
                                                                <div className={`flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-widest mt-0.5 ${ (cliente.creditos || 0) <= 1 ? 'text-red-600' : 'text-amber-600'}`}>
                                                                    <Zap className="w-2.5 h-2.5" />
                                                                    {cliente.creditos || 0} PTR
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                                {cliente.telefono}
                                                            </div>
                                                            {cliente.email && (
                                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                                    {cliente.email}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                            {cliente.ultimaVisita || "Sin visitas"}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 pr-6 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <a href={`https://wa.me/${cliente.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all" title="Contactar por WhatsApp">
                                                                <MessageCircle className="w-4 h-4" />
                                                            </a>
                                                            <button 
                                                                onClick={() => { setSelectedCliente(cliente); setIsCreditsModalOpen(true); }}
                                                                className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                                                                title="Cargar Créditos"
                                                            >
                                                                <Zap className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleEdit(cliente)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Editar cliente">
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(cliente.id)}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Eliminar cliente"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )
                    )}
                </div>
            </div>

            {/* Modals */}
            <NuevoClienteModal 
                isOpen={isNewClientModalOpen}
                onClose={() => setIsNewClientModalOpen(false)}
                onSave={loadClientes}
                tenantId={currentTenant}
            />
            
            <ImportarClientesModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportFinished={loadClientes}
                tenantId={currentTenant}
            />

            <EditarClienteModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedCliente(null);
                }}
                onSave={loadClientes}
                tenantId={currentTenant}
                cliente={selectedCliente}
            />

            <AddCreditsModal 
                isOpen={isCreditsModalOpen}
                onClose={() => {
                    setIsCreditsModalOpen(false);
                    setSelectedCliente(null);
                }}
                onSave={loadClientes}
                tenantId={currentTenant}
                cliente={selectedCliente}
            />
        </>
    );
}
