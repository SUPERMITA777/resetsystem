"use client";

import Link from "next/link";

interface PublicNavbarProps {
  salonName?: string;
}

export function PublicNavbar({ salonName }: PublicNavbarProps) {
  const displayName = salonName || "RESET SYSTEM";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl italic">{initial}</span>
          </div>
          <span className="text-xl font-black uppercase tracking-tighter">{displayName}</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Características</Link>
          <Link href="#solutions" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Soluciones</Link>
          <Link href="#pricing" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Precios</Link>
        </div>
      </div>
    </nav>
  );
}
