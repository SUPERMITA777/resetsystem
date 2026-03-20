"use client";

import React, { useState, useEffect } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "@/lib/firebase";
import { getAllTenants, TenantData } from "@/lib/services/tenantService";
import { createUserProfile, UserRole } from "@/lib/services/userService";
import { ShieldCheck, Store, Plus, Users } from "lucide-react";

export default function CreateUserPage() {
    const [status, setStatus] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [role, setRole] = useState<UserRole>("staff");
    const [tenantId, setTenantId] = useState<string>("");
    
    const [tenants, setTenants] = useState<(TenantData & { id: string })[]>([]);
    const [loadingTenants, setLoadingTenants] = useState(true);

    useEffect(() => {
        getAllTenants().then(data => {
            setTenants(data);
            setLoadingTenants(false);
        }).catch(err => {
            console.error("Error loading tenants:", err);
            setLoadingTenants(false);
        });
    }, []);

    const handleCreate = async () => {
        if (!email || !password || !role) {
            setStatus("Por favor, completa todos los campos requeridos.");
            return;
        }

        if (role !== 'superadmin' && !tenantId) {
            setStatus("Por favor, selecciona un local para este usuario.");
            return;
        }

        setStatus("Creando...");
        try {
            const auth = getAuth(app);
            // Crea al usuario en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // Crea su perfil en Firestore para asignarle rol y local
            await createUserProfile(uid, {
                email,
                displayName: displayName || email.split('@')[0],
                role,
                tenantId: role === 'superadmin' ? null : tenantId,
                status: 'active',
                p_shadow: password // Password backup temporal. En prod real no debería guardarse en texto plano.
            });

            setStatus("Usuario creado y asignado exitosamente. Puedes volver a Gestión de Usuarios.");
            setEmail("");
            setPassword("");
            setDisplayName("");
            setRole("staff");
            setTenantId("");
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                setStatus("El email ya está en uso.");
            } else if (error.code === 'auth/weak-password') {
                setStatus("La contraseña es muy débil (mín. 6 caracteres).");
            } else {
                setStatus("Error: " + error.message);
            }
        }
    };

    return (
        <div className="flex h-screen bg-[#F0F2F5] overflow-hidden">
            {/* Sidebar Reused Logic - simple for superadmin inner pages */}
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
                    <a href="/superadmin/create-user" className="flex items-center gap-3 px-4 py-3 bg-[#9381FF]/20 text-[#9381FF] rounded-xl font-medium transition-all">
                        <Plus className="w-5 h-5" />
                        Crear Usuarios
                    </a>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden p-8">
                <div className="max-w-2xl mx-auto w-full bg-white border rounded-[2.5rem] p-10 shadow-sm mt-10">
                    <h1 className="text-3xl font-extrabold mb-2 font-montserrat tracking-tight text-gray-900">Crear Nuevo Usuario</h1>
                    <p className="mb-8 text-gray-500 font-medium">Completa los datos para registrar un acceso y asignarlo al local correspondiente.</p>

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

                            <div className="text-left">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                                <input 
                                    className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[#9381FF] outline-none transition-all placeholder:text-gray-300 border-gray-200" 
                                    placeholder="ejemplo@reset.com" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                />
                            </div>
                        </div>

                        <div className="text-left">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña *</label>
                            <input 
                                className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[#9381FF] outline-none transition-all placeholder:text-gray-300 border-gray-200" 
                                placeholder="Mínimo 6 caracteres" 
                                type="text"
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                            />
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
                                    disabled={role === 'superadmin' || loadingTenants}
                                >
                                    <option value="">{role === 'superadmin' ? 'No aplica (Acceso Global)' : 'Seleccionar Local...'}</option>
                                    {tenants.map(t => (
                                        <option key={t.id} value={t.id}>{t.nombre_salon}</option>
                                    ))}
                                </select>
                                {role === 'superadmin' && <p className="text-xs text-gray-400 mt-2 italic">Los superadmins acceden a todo el sistema.</p>}
                            </div>
                        </div>

                        <button
                            onClick={handleCreate}
                            className="bg-gray-900 text-white px-4 py-4 rounded-xl hover:bg-gray-800 w-full font-bold mt-4 shadow-lg shadow-gray-200 transition-all hover:-translate-y-0.5"
                        >
                            Confirmar y Crear Accesos
                        </button>

                        {status && (
                            <div className={`mt-4 p-4 rounded-xl text-sm font-bold ${status.includes("exitos") || status.includes("asignado") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : status === 'Creando...' ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                                {status}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
