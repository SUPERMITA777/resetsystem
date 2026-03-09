import React from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export default function StaffPage() {
    return (
        <AdminLayout>
            <div className="flex flex-col gap-6 w-full h-full animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--foreground)]">Staff</h1>
                        <p className="text-gray-500 mt-1">Gestión de empleados y comisiones.</p>
                    </div>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Empleado
                    </Button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-[var(--secondary)] flex-1 overflow-hidden">
                    <div className="p-8 text-center text-gray-500">
                        Aún no hay empleados registrados
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
