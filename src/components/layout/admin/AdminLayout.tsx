"use client";

import React, { useEffect } from "react";
import { Sidebar } from "../Sidebar";
import { Topbar } from "../Topbar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTenant } from "@/lib/services/tenantService";

export function AdminLayout({ children, topbarContent }: { children: React.ReactNode, topbarContent?: React.ReactNode }) {
    const { role, tenantId: userTenantId } = useAuth();

    useEffect(() => {
        let activeTenant = localStorage.getItem("currentTenant") || "resetspa";

        // FORCED TENANT ISOLATION: 
        if (role === 'salon_admin' && userTenantId) {
            activeTenant = userTenantId;
            localStorage.setItem("currentTenant", activeTenant);
        }

        getTenant(activeTenant).then(data => {
            if (data?.nombre_salon) {
                document.title = `${data.nombre_salon} Web`;
            } else {
                document.title = "RESET HOME SPA WEB";
            }
        });
    }, [role, userTenantId]);

    return (
        <AuthGuard allowedRoles={['superadmin', 'salon_admin']}>
            <div className="flex h-screen overflow-hidden bg-[var(--background)] theme-nude">
                <Sidebar />
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    <Topbar children={topbarContent} />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto w-full h-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
