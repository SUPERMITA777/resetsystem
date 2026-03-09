"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast, { Toaster } from "react-hot-toast";

import { getUserProfile } from "@/lib/services/userService";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const auth = getAuth(app);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fetch profile
            const profile = await getUserProfile(user.uid);

            if (profile?.status === 'inactive') {
                toast.error("Tu cuenta está inactiva. Contacta al administrador.");
                return;
            }

            toast.success("¡Bienvenido/a de nuevo!");

            // Role based redirect
            if (profile?.role === 'superadmin') {
                router.push("/superadmin");
            } else {
                if (profile?.tenantId) {
                    localStorage.setItem('currentTenant', profile.tenantId);
                }
                router.push("/admin/dashboard");
            }

        } catch (error: any) {
            console.error(error);
            toast.error("Error al iniciar sesión. Verifica tus credenciales.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Toaster position="top-center" />
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-center">
                    <div className="w-16 h-16 bg-black rounded-xl mx-auto mb-4 flex items-center justify-center font-bold text-white text-2xl tracking-tighter shadow-md">
                        R
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 font-heading">
                        Iniciar Sesión
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Ingresa al portal de administración de ResetSpa
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Correo Electrónico
                            </label>
                            <Input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="sole@reset.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4"
                            disabled={loading}
                        >
                            {loading ? "Iniciando..." : "Ingresar"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
