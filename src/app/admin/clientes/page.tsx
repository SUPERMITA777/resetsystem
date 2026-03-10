"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, User, Phone, Mail, Calendar, Edit2, Trash2, MoreVertical, Plus, Filter } from "lucide-react";
import { clienteService, Cliente } from "@/lib/services/clienteService";
import toast, { Toaster } from "react-hot-toast";

export default function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
                <Toaster />
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-montserrat uppercase">Clientes</h1>
                        <p className="text-gray-500 mt-1 font-medium">Base de datos centralizada de tus clientes.</p>
                    </div>
                    <Button className="bg-black text-white hover:bg-gray-800 rounded-2xl px-8 h-12 font-bold shadow-xl transition-all active:scale-95 group">
                        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                        Nuevo Cliente
                    </Button>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredClientes.map(cliente => (
                                <Card key={cliente.id} className="overflow-hidden border-none shadow-premium-soft group hover:shadow-premium transition-all duration-300 rounded-[2rem]">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all duration-300">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(cliente.id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1 mb-6">
                                            <h3 className="text-xl font-black text-gray-900 truncate">
                                                {cliente.nombre} {cliente.apellido}
                                            </h3>
                                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                Cliente Activo
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
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
