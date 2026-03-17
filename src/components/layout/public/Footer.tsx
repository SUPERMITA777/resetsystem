"use client";

import Link from "next/link";

export function PublicFooter({ logoUrl }: { logoUrl?: string }) {
  return (
    <footer className="bg-[var(--secondary)]/30 border-t border-black/5 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
        <div className="col-span-1 md:col-span-1 space-y-8">
          <Link href="/" className="flex items-center gap-3">
             <div className="relative w-40 h-16">
               <img src={logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain" />
             </div>
          </Link>
          <p className="text-[var(--foreground)]/50 text-xs font-medium leading-relaxed max-w-xs">
            Creamos experiencias digitales sofisticadas para los centros de belleza más exclusivos del mundo.
          </p>
        </div>

        <div>
          <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--foreground)] mb-8 opacity-40">Explorar</h4>
          <ul className="space-y-4">
            <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Servicios</Link></li>
            <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Tratamientos</Link></li>
            <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Profesionales</Link></li>
            <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Membresías</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--foreground)] mb-8 opacity-40">Soporte</h4>
          <ul className="space-y-4">
            <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Sobre Nosotros</Link></li>
            <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Contacto</Link></li>
            <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Preguntas Frecuentes</Link></li>
            <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Ayuda</Link></li>
          </ul>
        </div>

        <div>
           <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--foreground)] mb-8 opacity-40">Newsletter</h4>
           <div className="space-y-4">
             <p className="text-[10px] text-[var(--foreground)]/50 leading-relaxed">Suscríbete para recibir tendencias y novedades exclusivas.</p>
             <div className="relative">
                <input type="text" placeholder="Email Address" className="w-full bg-white border border-black/5 rounded-full px-4 py-3 text-[10px] outline-none focus:border-[var(--primary)]/30 transition-all font-sans" />
                <button className="absolute right-2 top-1.5 bg-[var(--foreground)] text-white p-1.5 rounded-full hover:bg-[var(--primary)] transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
             </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--foreground)]/30">
          © 2026 RESET SYSTEM. Elevando el estándar de la belleza.
        </p>
        <div className="flex gap-10">
          <Link href="#" className="text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--foreground)]/30 hover:text-[var(--primary)] transition-colors">Instagram</Link>
          <Link href="#" className="text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--foreground)]/30 hover:text-[var(--primary)] transition-colors">LinkedIn</Link>
          <Link href="#" className="text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--foreground)]/30 hover:text-[var(--primary)] transition-colors">WhatsApp</Link>
        </div>
      </div>
    </footer>
  );
}
