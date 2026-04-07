"use client";

import React, { useEffect, useState } from "react";
import {
    Users,
    Plus,
    ShieldCheck,
    Store,
    Search,
    MoreVertical,
    Mail,
    UserPlus,
    Tag,
    ShieldAlert,
    Trash2,
    Edit2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAllUsers, UserProfile, UserRole } from "@/lib/services/userService";
import { deleteAuthUser } from "@/lib/actions/userActions";
import { getAllTenants, TenantData } from "@/lib/services/tenantService";
import toast from "react-hot-toast";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [tenants, setTenants] = useState<Record<string, string>>({}); // id -> nombre
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [usersData, tenantsData] = await Promise.all([
                    getAllUsers(),
                    getAllTenants()
                ]);
                setUsers(usersData);

                const tenantMap: Record<string, string> = {};
                tenantsData.forEach(t => tenantMap[t.id] = t.nombre_salon);
                setTenants(tenantMap);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar datos");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const filteredUsers = users.filter(user => {
        const safeEmail = user.email || "";
        const safeName = user.displayName || "";
        const search = searchQuery.toLowerCase();
        
        return safeEmail.toLowerCase().includes(search) || safeName.toLowerCase().includes(search);
    });

    const getRoleBadge = (role: UserRole) => {
        switch (role) {
            case 'superadmin':
                return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider"><ShieldCheck className="w-3 h-3" /> Superadmin</span>;
            case 'salon_admin':
                return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider"><Store className="w-3 h-3" /> Admin Salón</span>;
            default:
                return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider"><Tag className="w-3 h-3" /> Staff</span>;
        }
    };

    const handleDeleteUser = async (uid: string) => {
        if (!window.confirm("¿Estás seguro de que deseas ELIMINAR permanentemente a este usuario?")) return;
        
        try {
            setOpenDropdownId(null);
            const loadingToast = toast.loading("Eliminando usuario...");
            const res = await deleteAuthUser(uid);
            if (res.success) {
                setUsers(prev => prev.filter(u => u.uid !== uid));
                toast.success("Usuario eliminado", { id: loadingToast });
            } else {
                toast.error("Error: " + res.error, { id: loadingToast });
            }
        } catch (error: any) {
            toast.error("Hubo un error al eliminar");
            console.error(error);
        }
    };

    return (
        <AuthGuard allowedRoles={['superadmin']}>
        <div className="flex h-screen bg-[#F0F2F5] overflow-hidden">

            {/* Sidebar Reused Logic */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-[#9381FF]">
                        <ShieldCheck className="w-6 h-6" />
                        Superadmin
                    </h2>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <a href="/superadmin" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all font-medium">
                        <Store className="w-5 h-5" />
                        Salones Activos
                    </a>
                    <a href="/superadmin/users" className="flex items-center gap-3 px-4 py-3 bg-[#9381FF]/20 text-[#9381FF] rounded-xl font-medium transition-all">
                        <Users className="w-5 h-5" />
                        Gestión Usuarios
                    </a>
                    <a href="/superadmin/create-user" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all font-medium">
                        <Plus className="w-5 h-5" />
                        Crear Usuarios
                    </a>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
                    <h1 className="text-lg font-bold text-gray-800">Gestión de Usuarios</h1>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por email o nombre..."
                                className="pl-10 h-10 w-64 rounded-xl border-gray-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Link href="/superadmin/create-user">
                            <Button className="bg-gray-900 hover:bg-gray-800 rounded-xl px-6 h-10 transition-all hover:-translate-y-0.5 shadow-lg shadow-gray-200">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Nuevo Usuario
                            </Button>
                        </Link>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <h2 className="text-3xl font-extrabold text-gray-900 font-montserrat tracking-tight">Cuentas Registradas</h2>
                            <p className="text-gray-500 mt-1">Administra el acceso global y específico de cada salón.</p>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-20 bg-white/50 animate-pulse rounded-2xl border border-gray-100" />
                                ))}
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] p-20 text-center border border-gray-100">
                                <Users className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                                <h3 className="text-xl font-bold text-gray-900">No se encontraron usuarios</h3>
                                <p className="text-gray-500 mt-2">Intenta con otros términos de búsqueda.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Usuario</th>
                                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Rol</th>
                                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Asignación</th>
                                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredUsers.map(user => (
                                            <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-400 group-hover:bg-[#9381FF]/10 group-hover:text-[#9381FF] transition-colors uppercase">
                                                            {(user.email || 'U')[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900">{user.displayName || 'Sin Nombre'}</div>
                                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                                <Mail className="w-3 h-3" />
                                                                {user.email || 'Sin Correo'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex justify-center">
                                                        {getRoleBadge(user.role)}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    {user.tenantId ? (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                                            <Store className="w-4 h-4 text-gray-300" />
                                                            {tenants[user.tenantId] || user.tenantId}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-sm text-indigo-400 font-bold italic">
                                                            <ShieldAlert className="w-4 h-4" />
                                                            Acceso Maestro
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        {user.status === 'active' ? 'ACTIVO' : 'INACTIVO'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right relative">
                                                    <button 
                                                        onClick={() => setOpenDropdownId(openDropdownId === user.uid ? null : user.uid)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors focus:outline-none"
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                    {openDropdownId === user.uid && (
                                                        <div className="absolute right-8 top-12 z-50 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden text-left py-1 animate-in fade-in zoom-in-95 duration-100">
                                                            <Link href={`/superadmin/users/${user.uid}/edit`} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 font-medium transition-colors">
                                                                Editar Usuario
                                                            </Link>
                                                            <button 
                                                                onClick={() => handleDeleteUser(user.uid)}
                                                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors border-t border-gray-50"
                                                            >
                                                                Eliminar permanentemente
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
        </AuthGuard>
    );
}
