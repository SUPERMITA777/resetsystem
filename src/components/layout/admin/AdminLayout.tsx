import React from "react";
import { Sidebar } from "../Sidebar";
import { Topbar } from "../Topbar";
import { AuthGuard } from "@/components/auth/AuthGuard";

export function AdminLayout({ children, topbarContent }: { children: React.ReactNode, topbarContent?: React.ReactNode }) {
    return (
        <AuthGuard>
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
