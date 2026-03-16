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
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isStaff: false, role: null, staffId: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isStaff, setIsStaff] = useState<boolean>(false);
    const [role, setRole] = useState<string | null>(null);
    const [staffId, setStaffId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                try {
                    const snap = await getDoc(userDocRef);
                    if (snap.exists()) {
                        const profile = snap.data();
                        const isUserStaff = profile.role === 'staff' || profile.role === 'salon_admin';
                        setIsStaff(isUserStaff);
                        setRole(profile.role || null);
                        setStaffId(isUserStaff ? firebaseUser.uid : null);
                    } else {
                        setIsStaff(false);
                        setRole(null);
                        setStaffId(null);
                    }
                } catch (e) {
                    setIsStaff(false);
                    setRole(null);
                    setStaffId(null);
                }
            } else {
                setIsStaff(false);
                setRole(null);
                setStaffId(null);
            }
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isStaff, role, staffId, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
