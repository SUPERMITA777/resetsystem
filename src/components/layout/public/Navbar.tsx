"use client";

import { Search } from "lucide-react";

interface PublicNavbarProps {
  salonName?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export function PublicNavbar({ salonName, searchTerm, onSearchChange }: PublicNavbarProps) {
  const displayName = salonName || "RESET SYSTEM";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl italic">{initial}</span>
          </div>
          <span className="text-xl font-black uppercase tracking-tighter hidden sm:inline">{displayName}</span>
        </div>

        {onSearchChange && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              value={searchTerm || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar tratamientos, servicios..."
              className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-300"
            />
          </div>
        )}
      </div>
    </nav>
  );
}
