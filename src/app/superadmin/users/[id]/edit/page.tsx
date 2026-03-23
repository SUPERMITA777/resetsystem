"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllTenants, TenantData } from "@/lib/services/tenantService";
import { getUserProfile, UserRole } from "@/lib/services/userService";
import { updateAuthUser } from "@/lib/actions/userActions";
import { ShieldCheck, Store, Users, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function EditUserPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const uid = params.id;

    const [status, setStatus] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [role, setRole] = useState<UserRole>("staff");
    const [tenantId, setTenantId] = useState<string>("");
    
    const [tenants, setTenants] = useState<(TenantData & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [tenantData, userProfile] = await Promise.all([
                    getAllTenants(),
                    getUserProfile(uid)
                ]);
                
                setTenants(tenantData);

                if (userProfile) {
                    setEmail(userProfile.email);
                    setDisplayName(userProfile.displayName || "");
                    setRole(userProfile.role || "staff");
                    setTenantId(userProfile.tenantId || "");
                    setPassword(userProfile.p_shadow || "");
                } else {
                    setStatus("Usuario no encontrado.");
                }
            } catch (err) {
                console.error("Error loading data:", err);
                setStatus("Error cargando los datos del usuario.");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [uid]);

    const handleUpdate = async () => {
        if (!email || !role) {
            setStatus("El email y rol son requeridos.");
            return;
        }

        if (role !== 'superadmin' && !tenantId) {
            setStatus("Por favor, selecciona un local para este usuario.");
            return;
        }

        setStatus("Guardando cambios...");
        try {
            const result = await updateAuthUser(uid, {
                displayName,
                role,
                tenantId: role === 'superadmin' ? null : tenantId,
                password, // Will update Auth password and firestore p_shadow
            });

            if (result.success) {
                setStatus("Usuario actualizado exitosamente.");
                setTimeout(() => router.push("/superadmin/users"), 1500);
            } else {
                setStatus("Error: " + result.error);
            }
        } catch (error: any) {
            console.error(error);
            setStatus("Error: " + error.message);
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
                    <a href="/superadmin/users" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all font-medium">
                        <Users className="w-5 h-5" />
                        Gestión Usuarios
                    </a>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden p-8">
                <div className="max-w-2xl mx-auto w-full">
                    <Link href="/superadmin/users" className="inline-flex items-center text-gray-500 hover:text-gray-900 font-medium mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a Gestión
                    </Link>

                    <div className="bg-white border rounded-[2.5rem] p-10 shadow-sm">
                        <h1 className="text-3xl font-extrabold mb-2 font-montserrat tracking-tight text-gray-900">Editar Usuario</h1>
                        <p className="mb-8 text-gray-500 font-medium">Modifica los datos del usuario, reasigna su local o cambia su contraseña.</p>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                <p>Cargando datos del usuario...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-left">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nombre (Opcional)</label>
                                        <input 
                                            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[#9381FF] outline-none transition-all placeholder:text-gray-300 border-gray-200" 
                                            placeholder="Ej: Laura M." 
                                            value={displayName} 
                                            onChange={e => setDisplayName(e.target.value)} 
                                        />
                                    </div>

                                    <div className="text-left opacity-60">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Email (No editable)</label>
                                        <input 
                                            className="w-full border p-3 rounded-xl bg-gray-50 border-gray-200 text-gray-500" 
                                            value={email} 
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="text-left">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña / PIN</label>
                                    <input 
                                        className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[#9381FF] outline-none transition-all placeholder:text-gray-300 border-gray-200" 
                                        placeholder="Mínimo 6 caracteres" 
                                        type="text"
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                    />
                                    <p className="text-xs text-gray-400 mt-2 font-medium">Al editar este campo el sistema actualizará forzosamente su clave de acceso.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-2xl">
                                    <div className="text-left">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Rol *</label>
                                        <select 
                                            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#9381FF] outline-none transition-all bg-white"
                                            value={role}
                                            onChange={e => setRole(e.target.value as UserRole)}
                                        >
                                            <option value="staff">Staff (Genérico)</option>
                                            <option value="salon_admin">Admin de Salón</option>
                                            <option value="superadmin">Superadmin (Global)</option>
                                        </select>
                                    </div>

                                    <div className="text-left">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Local a Asignar *</label>
                                        <select 
                                            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#9381FF] outline-none transition-all bg-white disabled:opacity-50 disabled:bg-gray-100"
                                            value={tenantId}
                                            onChange={e => setTenantId(e.target.value)}
                                            disabled={role === 'superadmin'}
                                        >
                                            <option value="">{role === 'superadmin' ? 'No aplica' : 'Seleccionar Local...'}</option>
                                            {tenants.map(t => (
                                                <option key={t.id} value={t.id}>{t.nombre_salon}</option>
                                            ))}
                                        </select>
                                        {role === 'superadmin' && <p className="text-xs text-gray-400 mt-2 italic">Los superadmins acceden a todo el sistema.</p>}
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpdate}
                                    className="bg-[#9381FF] text-white px-4 py-4 rounded-xl hover:bg-[#8370f0] w-full font-bold mt-4 shadow-lg shadow-[#9381FF]/30 transition-all hover:-translate-y-0.5"
                                >
                                    Guardar Cambios
                                </button>

                                {status && (
                                    <div className={`mt-4 p-4 rounded-xl text-sm font-bold ${status.includes("exitosa") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : status.includes("Guardando") ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                                        {status}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
        </AuthGuard>
    );
}
