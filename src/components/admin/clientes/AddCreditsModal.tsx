"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { clienteService, Cliente } from "@/lib/services/clienteService";
import toast from "react-hot-toast";
import { CreditCard, DollarSign, Calendar, Zap } from "lucide-react";

interface AddCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    cliente: Cliente | null;
    tenantId: string;
}

export function AddCreditsModal({ isOpen, onClose, onSave, cliente, tenantId }: AddCreditsModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: 10,
        monto: 0,
        metodo: "EFECTIVO",
        fecha: new Date().toISOString().split('T')[0],
        duracionDias: 30
    });


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cliente || !tenantId) return;

        setLoading(true);
        try {
            await clienteService.addCredits(tenantId, cliente.id, formData.amount, {
                monto: formData.monto,
                metodo: formData.metodo,
                fecha: formData.fecha
            }, formData.duracionDias);
            toast.success(`Se cargaron ${formData.amount} créditos a ${cliente.nombre}`);
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar créditos");
        } finally {
            setLoading(false);
        }
    };

    if (!cliente) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                        <Zap className="w-6 h-6 text-[var(--primary)]" />
                        Cargar Créditos
                    </DialogTitle>
                </DialogHeader>

                <div className="bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-400 font-bold border border-gray-100">
                        {cliente.nombre.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-black text-gray-900">{cliente.nombre} {cliente.apellido}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saldo actual: {cliente.creditos || 0} PTR</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Cantidad de Créditos</Label>
                                <div className="relative">
                                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                    <Input 
                                        type="number" 
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value)})}
                                        className="h-14 pl-12 rounded-2xl font-black text-xl border-gray-100 focus:ring-black transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Vencimiento (Días)</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                    <Input 
                                        type="number" 
                                        value={formData.duracionDias}
                                        onChange={(e) => setFormData({...formData, duracionDias: parseInt(e.target.value) || 0})}
                                        className="h-14 pl-12 rounded-2xl font-black text-xl border-gray-100 focus:ring-black transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>


                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Monto Cobrado ($)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <Input 
                                        type="number" 
                                        value={formData.monto}
                                        onChange={(e) => setFormData({...formData, monto: parseFloat(e.target.value)})}
                                        className="h-12 pl-10 rounded-xl font-bold border-gray-100"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Fecha de Pago</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <Input 
                                        type="date" 
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                                        className="h-12 pl-10 rounded-xl font-bold border-gray-100"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Método de Pago</Label>
                            <div className="flex gap-2">
                                {["EFECTIVO", "TRANSFERENCIA", "TARJETA"].map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setFormData({...formData, metodo: m})}
                                        className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 
                                            ${formData.metodo === m ? 'border-black bg-black text-white' : 'border-gray-50 bg-white text-gray-400 hover:border-gray-200'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                            {loading ? "Cargando..." : "Confirmar Carga"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
