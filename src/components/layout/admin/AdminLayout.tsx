"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "../Sidebar";
import { Topbar } from "../Topbar";
import { MobileSidebar } from "./MobileSidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { AdminChatWidget } from "@/components/chat/AdminChatWidget";
import { AdminTopbarProvider, useAdminTopbar } from "@/lib/context/AdminTopbarContext";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { role, tenantId: userTenantId } = useAuth();
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [activeTenantId, setActiveTenantId] = useState("");
    const { topbarContent } = useAdminTopbar();

    useEffect(() => {
        let activeTenant = localStorage.getItem("currentTenant") || "resetspa";

        if (role && role !== 'superadmin' && userTenantId) {
            activeTenant = userTenantId;
            localStorage.setItem("currentTenant", activeTenant);
        }

        setActiveTenantId(activeTenant);
        getTenant(activeTenant).then(data => {
            if (data) {
                setTenant(data);
                document.title = data.nombre_salon || "RESETSYSTEM";
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
                    {tenant && activeTenantId && (
                        <AdminChatWidget key={activeTenantId} tenant={{ ...tenant, id: activeTenantId }} />
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminTopbarProvider>
            <AdminLayoutInner>
                {children}
            </AdminLayoutInner>
        </AdminTopbarProvider>
    );
}
