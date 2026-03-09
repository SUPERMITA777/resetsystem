"use client";

import React from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AgendaPage() {
    const [currentDate, setCurrentDate] = React.useState(new Date());

    return (
        <AdminLayout>
            <div className="flex flex-col h-full w-full animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--foreground)]">Agenda</h1>
                        <p className="text-gray-500 mt-1">Gestión de turnos diarios.</p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex items-center bg-white border border-[var(--secondary)] rounded-lg p-1">
                            <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="px-4 py-1 flex items-center gap-2 font-medium min-w-[140px] justify-center">
                                <CalendarIcon className="w-4 h-4 text-[var(--primary)]" />
                                <span className="capitalize">{format(currentDate, "EEEE d 'de' MMMM", { locale: es })}</span>
                            </div>
                            <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <Button className="shrink-0">
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Turno
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-[var(--secondary)] flex-1 overflow-hidden flex flex-col">
                    {/* Skeleton of Agenda grid */}
                    <div className="grid grid-cols-4 border-b border-[var(--secondary)]">
                        <div className="p-4 border-r border-[var(--secondary)] text-center font-medium text-[var(--foreground)]">Hora</div>
                        <div className="p-4 border-r border-[var(--secondary)] text-center font-medium bg-[var(--secondary)]/30">Box 1</div>
                        <div className="p-4 border-r border-[var(--secondary)] text-center font-medium bg-[var(--secondary)]/30">Box 2</div>
                        <div className="p-4 text-center font-medium bg-[var(--secondary)]/30">Box 3</div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-4 border-b border-gray-100 h-20 group">
                                <div className="border-r border-[var(--secondary)] flex items-center justify-center text-sm text-gray-500 bg-gray-50">
                                    {i + 9}:00
                                </div>
                                <div className="border-r border-gray-100 p-1 group-hover:bg-gray-50 transition-colors cursor-pointer">
                                </div>
                                <div className="border-r border-gray-100 p-1 group-hover:bg-gray-50 transition-colors cursor-pointer">
                                </div>
                                <div className="p-1 group-hover:bg-gray-50 transition-colors cursor-pointer">
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
