"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app, db } from "@/lib/firebase";

import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    isStaff: boolean;
    staffId: string | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isStaff: false, staffId: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isStaff, setIsStaff] = useState<boolean>(false);
    const [staffId, setStaffId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // En producción, primero verificaríamos en 'users' globales para saber 
                // a qué tenant pertenece. Por ahora chequeamos 'empleados' en 'resetspa' directamente.
                const staffDocRef = doc(db, 'tenants/resetspa/empleados', firebaseUser.uid);
                try {
                    const snap = await getDoc(staffDocRef);
                    if (snap.exists()) {
                        setIsStaff(true);
                        setStaffId(snap.id);
                    } else {
                        setIsStaff(false);
                        setStaffId(null);
                    }
                } catch (e) {
                    // Fallback para admin
                    setIsStaff(false);
                    setStaffId(null);
                }
            } else {
                setIsStaff(false);
                setStaffId(null);
            }
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isStaff, staffId, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
