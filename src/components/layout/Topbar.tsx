import React from "react";
import { Bell, Search, Menu } from "lucide-react";
import { Input } from "../ui/Input";

export function Topbar() {
    return (
        <header className="h-16 flex items-center justify-between px-6 bg-[var(--background)] border-b border-[var(--secondary)] sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4">
                <button className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-[var(--secondary)] rounded-lg">
                    <Menu className="w-5 h-5" />
                </button>
                <div className="relative w-64 hidden sm:block">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-9 bg-white" placeholder="Buscar clientes, turnos..." />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 rounded-full hover:bg-[var(--secondary)] transition-colors relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[var(--background)]"></span>
                </button>
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-medium text-sm">
                    A
                </div>
            </div>
        </header>
    );
}
