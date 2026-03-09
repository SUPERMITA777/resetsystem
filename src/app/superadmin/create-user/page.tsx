"use client";

import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function CreateUserPage() {
    const [status, setStatus] = useState("Esperando...");
    const [email, setEmail] = useState("sole@reset.com");
    const [password, setPassword] = useState("password1980"); // Firebase requiere min 6 caracteres

    const handleCreate = async () => {
        setStatus("Creando...");
        try {
            const auth = getAuth(app);
            await createUserWithEmailAndPassword(auth, email, password);
            setStatus("Usuario creado exitosamente. Puedes ir a /login a iniciar sesión.");
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                setStatus("El usuario ya existe en Firebase Auth.");
            } else {
                setStatus("Error: " + error.message);
            }
        }
    };

    return (
        <div className="p-10 max-w-md mx-auto mt-20 border rounded-xl shadow-sm text-center">
            <h1 className="text-xl font-bold mb-4">Sembrar Usuario de Prueba</h1>
            <p className="mb-4 text-sm text-gray-600">Esto creará una cuenta en Firebase Authentication de manera directa para desarrollo.</p>

            <div className="mb-4 text-left">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input className="w-full border p-2 rounded" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="mb-4 text-left">
                <label className="block text-sm font-medium mb-1">Contraseña (Mínimo 6 caracteres)</label>
                <input className="w-full border p-2 rounded" value={password} onChange={e => setPassword(e.target.value)} />
                <span className="text-xs text-red-500 block mt-1">Firebase bloquea contraseñas "1980", se usa "password1980" temporalmente.</span>
            </div>

            <button
                onClick={handleCreate}
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 w-full"
            >
                Crear Usuario
            </button>

            <div className="mt-4 p-4 bg-gray-100 rounded text-sm text-gray-700">
                Estado: {status}
            </div>
        </div>
    );
}
