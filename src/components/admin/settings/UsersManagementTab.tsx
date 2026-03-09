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
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getUsersByTenant, UserProfile, UserRole } from "@/lib/services/userService";
import toast from "react-hot-toast";

interface UsersManagementTabProps {
    tenantId: string;
}

export function UsersManagementTab({ tenantId }: UsersManagementTabProps) {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUsers() {
            try {
                const data = await getUsersByTenant(tenantId);
                setUsers(data);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar usuarios");
            } finally {
                setLoading(false);
            }
        }
        if (tenantId) loadUsers();
    }, [tenantId]);

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
                <Button className="bg-black text-white rounded-xl px-6 h-11 shadow-lg shadow-gray-200">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

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
                                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
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
