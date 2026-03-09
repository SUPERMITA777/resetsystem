"use client";

import React from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
    return (
        <AdminLayout>
            <div className="flex flex-col gap-6 w-full max-w-3xl animate-in fade-in duration-300">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)]">Configuración</h1>
                    <p className="text-gray-500 mt-1">Ajustes generales del salón.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-[var(--secondary)] overflow-hidden">
                    <div className="p-6 border-b border-[var(--secondary)]">
                        <h2 className="text-xl font-semibold text-[var(--foreground)]">Datos del Salón</h2>
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <Input defaultValue="RESET SPA" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Boxes</label>
                            <Input type="number" defaultValue={7} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tema Visual</label>
                            <select className="flex h-10 w-full rounded-md border border-[var(--secondary)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                                <option value="nude">Nude & Rose Gold</option>
                                <option value="lavender">Minimalist Lavender</option>
                                <option value="sage">Sage & Cream</option>
                            </select>
                        </div>

                        <div className="pt-4">
                            <Button>Guardar Cambios</Button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
