"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "../Sidebar";
import { Topbar } from "../Topbar";
import { MobileSidebar } from "./MobileSidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTenant } from "@/lib/services/tenantService";

export function AdminLayout({ children, topbarContent }: { children: React.ReactNode, topbarContent?: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { role, tenantId: userTenantId } = useAuth();

    useEffect(() => {
        let activeTenant = localStorage.getItem("currentTenant") || "resetspa";

        // FORCED TENANT ISOLATION: 
        // Si el usuario es superadmin, permitimos que use el tenant que está en localStorage (seteado al hacer click en "Ver Panel")
        // Si no es superadmin, forzamos su tenantId asignado en el perfil.
        if (role && role !== 'superadmin' && userTenantId) {
            activeTenant = userTenantId;
            localStorage.setItem("currentTenant", activeTenant);
        }

        getTenant(activeTenant).then(data => {
            if (data?.nombre_salon) {
                document.title = `${data.nombre_salon}`;
            } else {
                document.title = "RESETSYSTEM";
            }
        });
    }, [role, userTenantId]);

    return (
        <AuthGuard allowedRoles={['superadmin', 'salon_admin']}>
            <div className="flex h-screen overflow-hidden bg-[var(--background)] theme-nude font-sans antialiased selection:bg-[var(--primary)] selection:text-white transition-all duration-500">
                <Sidebar />
                <MobileSidebar 
                    isOpen={isMobileMenuOpen} 
                    onClose={() => setIsMobileMenuOpen(false)} 
                />
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    <Topbar onMenuClick={() => setIsMobileMenuOpen(true)}>
                        {topbarContent}
                    </Topbar>
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 scrollbar-hide">
                        <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
