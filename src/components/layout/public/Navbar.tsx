"use client";

import { Search, Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface PublicNavbarProps {
  salonName?: string;
  logoUrl?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  slug?: string;
}

export function PublicNavbar({ salonName, logoUrl, searchTerm, onSearchChange, slug }: PublicNavbarProps) {
  const displayName = salonName || "RESET HOME SPA WEB";
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Tratamientos", href: slug ? `/${slug}?view=tratamientos` : "#" },
    { name: "Clases", href: slug ? `/${slug}/clases?view=clases` : "#" },
    { name: "Productos", href: slug ? `/${slug}/productos?view=productos` : "#" },
  ];

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
          <div className="relative flex items-center gap-3 h-9 md:h-12">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={displayName}
                className="w-auto h-full object-contain transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <span className="text-lg md:text-xl font-black uppercase tracking-tighter text-[var(--primary)]">
                {displayName}
              </span>
            )}
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
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-[10px] font-semibold uppercase tracking-[0.2em] transition-opacity ${
                  pathname === link.href || (link.name === 'Tratamientos' && pathname === `/${slug}`)
                    ? 'opacity-100 text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1'
                    : 'opacity-40 hover:opacity-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link href={slug ? `/${slug}#booking` : "#"} className="btn-elegant !py-3 !px-6 !text-[10px]">Reservar</Link>
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
