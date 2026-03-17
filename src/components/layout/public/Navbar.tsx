"use client";

import { Search } from "lucide-react";

interface PublicNavbarProps {
  salonName?: string;
  logoUrl?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export function PublicNavbar({ salonName, logoUrl, searchTerm, onSearchChange }: PublicNavbarProps) {
  const displayName = salonName || "RESET SYSTEM";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass fine-line">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3 shrink-0 group cursor-pointer">
          <div className="relative w-32 h-12">
            <img 
              src={logoUrl || "/logo.png"} 
              alt={displayName} 
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" 
            />
          </div>
        </div>

        {onSearchChange && (
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--foreground)]/20 transition-colors group-focus-within:text-[var(--primary)]" />
            <input
              type="text"
              value={searchTerm || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Explorar tratamientos..."
              className="w-full h-10 pl-11 pr-4 bg-black/[0.02] border border-black/5 rounded-full text-xs font-medium outline-none focus:bg-white focus:border-[var(--primary)]/30 transition-all placeholder:text-[var(--foreground)]/20"
            />
          </div>
        )}

        <div className="hidden md:flex items-center gap-8">
           <button className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity">Inicio</button>
           <button className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity">Servicios</button>
           <button className="btn-elegant !py-3 !px-6 !text-[10px]">Reservar</button>
        </div>
      </div>
    </nav>
  );
}
