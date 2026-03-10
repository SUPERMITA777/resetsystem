import React from "react";
import { Bell, Menu } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";

export function Topbar({ children }: { children?: React.ReactNode }) {
    return (
        <header className="h-16 flex items-center justify-between px-6 bg-[var(--background)] border-b border-[var(--secondary)] sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 w-full sm:w-auto flex-1 sm:flex-none">
                <button className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-[var(--secondary)] rounded-lg">
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center gap-4">
                {children}
            </div>
        </header>
    );
}
