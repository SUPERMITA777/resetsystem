"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function AuthGuard({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    const allowedRolesStr = allowedRoles ? JSON.stringify(allowedRoles) : null;

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (allowedRoles && role && !allowedRoles.includes(role)) {
                if (role === 'superadmin') {
                    router.push("/superadmin");
                } else if (role === 'salon_admin') {
                    router.push("/admin/dashboard");
                } else {
                    router.push("/profesional/dashboard");
                }
            }
        }
    }, [user, role, loading, router, allowedRolesStr]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    // If there is no user or unauthorized role, return null while redirecting
    if (!user || (allowedRoles && role && !allowedRoles.includes(role))) {
        return null;
    }

    return <>{children}</>;
}
