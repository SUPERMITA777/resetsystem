"use client";

import React, { useEffect, useState } from "react";
import {
    Users,
    Plus,
    Mail,
    Trash2,
    Edit2,
    Lock,
    Store,
    ShieldCheck,
    Eye,
    EyeOff,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getUsersByTenant, UserProfile, UserRole } from "@/lib/services/userService";
import { createAuthUser, updateAuthUser, deleteAuthUser } from "@/lib/actions/userActions";
import toast from "react-hot-toast";

interface UsersManagementTabProps {
    tenantId: string;
}

export function UsersManagementTab({ tenantId }: UsersManagementTabProps) {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        role: 'staff' as UserRole,
        status: 'active' as 'active' | 'inactive'
    });

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsersByTenant(tenantId);
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar usuarios");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) loadUsers();
    }, [tenantId]);

    const openCreateModal = () => {
        setSelectedUser(null);
        setFormData({
            displayName: '',
            email: '',
            password: '',
            role: 'staff',
            status: 'active'
        });
        setIsModalOpen(true);
    };

    const openEditModal = (user: UserProfile) => {
        setSelectedUser(user);
        setFormData({
            displayName: user.displayName || '',
            email: user.email,
            password: user.p_shadow || '',
            role: user.role,
            status: user.status
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (selectedUser) {
                // Update
                const res = await updateAuthUser(selectedUser.uid, {
                    displayName: formData.displayName,
                    role: formData.role,
                    status: formData.status,
                    password: formData.password
                });
                if (res.success) {
                    toast.success("Usuario actualizado");
                    setIsModalOpen(false);
                    loadUsers();
                } else {
                    toast.error(res.error || "Error al actualizar");
                }
            } else {
                // Create
                const res = await createAuthUser({
                    ...formData,
                    tenantId
                });
                if (res.success) {
                    toast.success("Usuario creado con éxito");
                    setIsModalOpen(false);
                    loadUsers();
                } else {
                    toast.error(res.error || "Error al crear usuario");
                }
            }
        } catch (error) {
            toast.error("Error en la operación");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (uid: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;
        
        try {
            const res = await deleteAuthUser(uid);
            if (res.success) {
                toast.success("Usuario eliminado");
                loadUsers();
            } else {
                toast.error(res.error || "Error al eliminar");
            }
        } catch (error) {
            toast.error("Error al procesar eliminación");
        }
    };

    const getRoleBadge = (role: UserRole) => {
        switch (role) {
            case 'salon_admin':
                return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Admin</span>;
            case 'staff':
                return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Staff</span>;
            default:
                return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{role}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Usuarios del Salón</h3>
                    <p className="text-sm text-gray-500 mt-1">Gestiona quiénes tienen acceso al panel de administración.</p>
                </div>
                <Button 
                    onClick={openCreateModal}
                    className="bg-black text-white rounded-xl px-6 h-11 shadow-lg shadow-gray-200"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Modal de Creación/Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                                    {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    {selectedUser ? 'Modifica los accesos del sistema' : 'Crea un nuevo acceso al panel'}
                                </p>
                            </div>
                            <button onClick={() => !submitting && setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                <Plus className="w-5 h-5 rotate-45 text-gray-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-8 space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Email de Acceso</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            disabled={!!selectedUser || submitting}
                                            className={`w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none ${!!selectedUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            placeholder="ejemplo@reset.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            disabled={submitting}
                                            className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-12 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none"
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-900 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-gray-400 mt-1 px-1 italic">Esta es la clave que el usuario usará para entrar.</p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nombre Completo</label>
                                    <div className="relative">
                                        <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input
                                            required
                                            value={formData.displayName}
                                            onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                            disabled={submitting}
                                            className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none"
                                            placeholder="Nombre del usuario"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Rol</label>
                                        <select
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                            disabled={submitting}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none appearance-none"
                                        >
                                            <option value="staff">Staff / Profesional</option>
                                            <option value="salon_admin">Administrador</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Estado</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                            disabled={submitting}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all outline-none appearance-none"
                                        >
                                            <option value="active">Activo</option>
                                            <option value="inactive">Inactivo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-black text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 mt-4"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    selectedUser ? 'Guardar Cambios' : 'Crear Usuario'
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre y Email</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Rol</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <tr key={i}>
                                    <td colSpan={4} className="px-8 py-6 h-20 animate-pulse bg-gray-50/20" />
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-12 text-center text-gray-400 italic">
                                    No hay usuarios registrados para este salón.
                                </td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.uid} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-400">
                                                {user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{user.displayName || 'Sin nombre'}</div>
                                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {user.status === 'active' ? 'ACTIVO' : 'INACTIVO'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right space-x-2">
                                        <button 
                                            onClick={() => openEditModal(user)}
                                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(user.uid)}
                                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
