"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AgendaGrid } from "@/components/agenda/AgendaGrid";
import { NuevoTurnoModal } from "@/components/agenda/NuevoTurnoModal";

export default function AgendaPage() {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Turno
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden mt-4">
                    <AgendaGrid boxesCount={3} />
                </div>
            </div>

            <NuevoTurnoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={(turno) => {
                    console.log("Nuevo turno guardado:", turno);
                    // TODO: Lógica de vinculación con Firebase y Grid
                }}
            />
        </AdminLayout>
    );
}
