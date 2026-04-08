"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    isStaff: boolean;
    role: string | null;
    staffId: string | null;
    tenantId: string | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isStaff: false, role: null, staffId: null, tenantId: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isStaff, setIsStaff] = useState<boolean>(false);
    const [role, setRole] = useState<string | null>(null);
    const [staffId, setStaffId] = useState<string | null>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const res = await fetch(`/api/admin/user?uid=${firebaseUser.uid}`);
                    const result = await res.json();
                    
                    if (result.success && result.data) {
                        const profile = result.data;
                        const isUserStaff = profile.role === 'staff' || profile.role === 'salon_admin' || profile.role === 'superadmin';
                        setIsStaff(isUserStaff);
                        setRole(profile.role || null);
                        setStaffId(profile.uid || firebaseUser.uid);
                        setTenantId(profile.tenantId || null);
                    } else {
                        // El usuario existe en Firebase pero no tiene un perfil registrado en la DB
                        console.warn("[Auth] No hay perfil en Firestore para:", firebaseUser.email);
                        setIsStaff(false);
                        setRole(null);
                        setStaffId(null);
                        setTenantId(null);
                    }
                } catch (e) {
                    console.error("[Auth] Error fetching profile:", e);
                    setIsStaff(false);
                    setRole(null);
                    setStaffId(null);
                    setTenantId(null);
                }
            } else {
                setIsStaff(false);
                setRole(null);
                setStaffId(null);
                setTenantId(null);
            }
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isStaff, role, staffId, tenantId, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
