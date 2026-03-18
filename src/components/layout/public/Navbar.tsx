"use client";

import { Search, Menu, MessageCircle } from "lucide-react";
import { useState } from "react";

interface PublicNavbarProps {
  salonName?: string;
  logoUrl?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export function PublicNavbar({ salonName, logoUrl, searchTerm, onSearchChange }: PublicNavbarProps) {
  const displayName = salonName || "RESET SYSTEM";
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass fine-line">
      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-20 flex items-center justify-between gap-4">
        {/* Left: hamburger on mobile */}
        <button
          className="md:hidden p-2 rounded-xl text-[var(--foreground)]/40 hover:text-[var(--foreground)] transition-colors"
          onClick={() => setMobileSearchOpen(v => !v)}
          aria-label="Buscar"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Logo center on mobile, left on desktop */}
        <div className="flex items-center gap-3 shrink-0 group cursor-pointer mx-auto md:mx-0">
          <div className="relative w-24 h-9 md:w-32 md:h-12">
            <img
              src={logoUrl || "/logo.png"}
              alt={displayName}
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Search bar – desktop only inline */}
        {onSearchChange && (
          <div className="relative flex-1 max-w-md group hidden md:flex">
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

        {/* Right actions */}
        <div className="flex items-center gap-3 md:gap-8">
          {/* WhatsApp icon on mobile */}
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="md:hidden p-2 rounded-xl text-[var(--foreground)]/40 hover:text-[var(--primary)] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <button className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity">Inicio</button>
            <button className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity">Servicios</button>
            <button className="btn-elegant !py-3 !px-6 !text-[10px]">Reservar</button>
          </div>
        </div>
      </div>

      {/* Mobile search drawer */}
      {mobileSearchOpen && onSearchChange && (
        <div className="md:hidden px-4 pb-3 animate-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--foreground)]/30" />
            <input
              type="text"
              value={searchTerm || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar tratamiento..."
              autoFocus
              className="w-full h-10 pl-11 pr-4 bg-[var(--secondary)]/60 border border-black/5 rounded-full text-xs font-medium outline-none focus:bg-white focus:border-[var(--primary)]/30 transition-all placeholder:text-[var(--foreground)]/30"
            />
          </div>
        </div>
      )}
    </nav>
  );
}
