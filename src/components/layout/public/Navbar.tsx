"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function PublicNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl italic">R</span>
          </div>
          <span className="text-xl font-black uppercase tracking-tighter">RESEST SYSTEM</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Características</Link>
          <Link href="#solutions" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Soluciones</Link>
          <Link href="#pricing" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Precios</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-xs font-black uppercase tracking-widest">
              Ingresar
            </Button>
          </Link>
          <Link href="/login?tab=register">
            <Button className="bg-black text-white px-6 h-12 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10">
              Empezar Gratis
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
