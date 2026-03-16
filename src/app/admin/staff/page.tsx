"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Plus, User, Mail, Shield, Trash2, X, Save, Settings, MessageSquare, Phone, ExternalLink } from "lucide-react";
import { getUsersByTenant, createUserProfile, updateUserProfile, UserProfile, UserRole } from "@/lib/services/userService";
import Link from "next/link";
import toast from "react-hot-toast";

export default function StaffPage() {
    const [profesionales, setProfesionales] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [tenantId, setTenantId] = useState("");

    const [formData, setFormData] = useState({
        email: "",
        displayName: "",
        role: "staff" as UserRole,
        whatsapp: "",
        status: "active" as "active" | "inactive"
    });

    useEffect(() => {
        const tid = localStorage.getItem('currentTenant') || 'resetspa';
        setTenantId(tid);
        loadProfesionales(tid);
    }, []);

    const loadProfesionales = async (tid: string) => {
        try {
            setLoading(true);
            const users = await getUsersByTenant(tid);
            setProfesionales(users);
        } catch (error) {
            toast.error("Error al cargar profesionales");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedUser) {
                await updateUserProfile(selectedUser.uid, formData);
                toast.success("Profesional actualizado");
            } else {
                // Generar un UID temporal o usar el email como base si no hay Auth flow aquí
                // En un flujo real, esto debería ir de la mano con Firebase Auth
                const uid = `staff-${Date.now()}`;
                await createUserProfile(uid, {
                    ...formData,
                    tenantId,
                    uid
                });
                toast.success("Profesional creado");
            }
            setIsModalOpen(false);
            loadProfesionales(tenantId);
        } catch (error) {
            toast.error("Error al guardar");
        }
    };

    const openEdit = (user: UserProfile) => {
        setSelectedUser(user);
        setFormData({
            email: user.email,
            displayName: user.displayName || "",
            role: user.role,
            whatsapp: user.whatsapp || "",
            status: user.status
        });
        setIsModalOpen(true);
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6 w-full h-full animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">Profesionales</h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Gestión de staff y roles</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/profesional/dashboard" className="h-14 px-6 rounded-2xl border border-gray-100 bg-white flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition-all shadow-sm font-bold text-xs uppercase tracking-widest gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Ver Panel Profesionales
                        </Link>
                        <Button onClick={() => { setSelectedUser(null); setFormData({ email: "", displayName: "", role: "staff", whatsapp: "", status: "active" }); setIsModalOpen(true); }} className="bg-black text-white hover:bg-gray-800 rounded-2xl px-6 py-6 font-bold uppercase tracking-widest text-xs shadow-xl shadow-black/10 transition-all flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Nuevo Profesional
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-2xl shadow-black/5 border border-gray-100 flex-1 overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : profesionales.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/30">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <User className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Sin profesionales</h3>
                            <p className="text-gray-400 text-sm mt-2 max-w-xs">Comienza agregando a tu primer empleado para gestionar la agenda.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Profesional</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rol</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {profesionales.map((p) => (
                                        <tr key={p.uid} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center text-[var(--primary)] font-black uppercase text-xs">
                                                        {(p.displayName || p.email).substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 uppercase tracking-tight">{p.displayName || "Sin nombre"}</div>
                                                        <div className="text-[10px] text-gray-400 font-medium">{p.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${p.role === 'salon_admin' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                                    {p.role === 'salon_admin' ? 'Administrador' : 'Staff'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${p.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`} />
                                                    <span className="text-[10px] font-bold text-gray-600 uppercase">{p.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button onClick={() => openEdit(p)} className="p-2 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-black shadow-sm group-hover:shadow-md border border-transparent hover:border-gray-100">
                                                    <Settings className="w-4 h-4" />
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

            {/* Modal de Profesional */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                    {selectedUser ? "Editar Profesional" : "Nuevo Profesional"}
                                </h2>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Datos de acceso y rol</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Nombre Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input
                                            required
                                            value={formData.displayName}
                                            onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none"
                                            placeholder="Nombre del profesional"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">WhatsApp</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <input
                                                value={formData.whatsapp}
                                                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                                className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none"
                                                placeholder="Ej: 54911..."
                                            />
                                        </div>
                                        {formData.whatsapp && (
                                            <button 
                                                type="button"
                                                onClick={() => window.open(`https://wa.me/${formData.whatsapp.replace(/\D/g, '')}`, '_blank')}
                                                className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                <MessageSquare className="w-6 h-6" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Rol</label>
                                        <div className="relative">
                                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                            <select
                                                value={formData.role}
                                                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                                className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none appearance-none"
                                            >
                                                <option value="staff">Staff / Empleado</option>
                                                <option value="salon_admin">Administrador</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Estado</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none appearance-none"
                                        >
                                            <option value="active">Activo</option>
                                            <option value="inactive">Inactivo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="submit" className="flex-1 bg-black text-white hover:bg-gray-800 h-14 rounded-2xl font-bold shadow-2xl shadow-black/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                                    <Save className="w-5 h-5" />
                                    Guardar Cambios
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
