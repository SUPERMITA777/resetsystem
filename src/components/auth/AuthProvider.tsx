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
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                try {
                    const snap = await getDoc(userDocRef);
                    if (snap.exists()) {
                        const profile = snap.data();
                        const isUserStaff = profile.role === 'staff' || profile.role === 'salon_admin';
                        setIsStaff(isUserStaff);
                        setStaffId(isUserStaff ? firebaseUser.uid : null);
                    } else {
                        setIsStaff(false);
                        setStaffId(null);
                    }
                } catch (e) {
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
