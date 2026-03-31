import React from "react";
import { Bell, Menu } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";

export function Topbar({ children, onMenuClick }: { children?: React.ReactNode, onMenuClick?: () => void }) {
    return (
        <header className="h-16 flex items-center justify-between px-6 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--secondary)] sticky top-0 z-20 w-full">
            <div className="flex items-center gap-4 w-full sm:w-auto flex-1 sm:none">
                <button 
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-[var(--secondary)] rounded-xl transition-all active:scale-90"
                >
                    <Menu className="w-5 h-5 text-[var(--primary)]" />
                </button>
            </div>

            <div className="flex items-center gap-4">
                {children}
            </div>
        </header>
    );
}
