"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app, db } from "@/lib/firebase";

import { doc, getDoc } from "firebase/firestore";

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
                        const isUserStaff = profile.role === 'staff' || profile.role === 'salon_admin';
                        setIsStaff(isUserStaff);
                        setRole(profile.role || null);
                        setStaffId(isUserStaff ? firebaseUser.uid : null);
                        setTenantId(profile.tenantId || null);
                    } else {
                        setIsStaff(false);
                        setRole(null);
                        setStaffId(null);
                        setTenantId(null);
                    }
                } catch (e) {
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
