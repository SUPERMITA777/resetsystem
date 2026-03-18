"use client";

import Link from "next/link";

export function PublicFooter({ logoUrl }: { logoUrl?: string }) {
  return (
    <footer className="bg-[var(--secondary)]/30 border-t border-black/5 pt-12 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto px-5 md:px-6">
        {/* Mobile: stacked compact layout | Desktop: 4-col grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 mb-10 md:mb-24">
          {/* Logo + tagline */}
          <div className="col-span-2 md:col-span-1 space-y-4 md:space-y-8">
            <Link href="/" className="flex items-center gap-3">
               <div className="relative w-32 h-12">
                 <img src={logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain" />
               </div>
            </Link>
            <p className="text-[var(--foreground)]/50 text-xs font-medium leading-relaxed max-w-xs">
              Creamos experiencias digitales sofisticadas para los centros de belleza más exclusivos.
            </p>
          </div>

          {/* Explorar */}
          <div>
            <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--foreground)] mb-4 md:mb-8 opacity-40">Explorar</h4>
            <ul className="space-y-3 md:space-y-4">
              <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Servicios</Link></li>
              <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Tratamientos</Link></li>
              <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Profesionales</Link></li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--foreground)] mb-4 md:mb-8 opacity-40">Soporte</h4>
            <ul className="space-y-3 md:space-y-4">
              <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Sobre Nosotros</Link></li>
              <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Contacto</Link></li>
              <li><Link href="#" className="text-xs text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Newsletter — full width on mobile, 1 col on desktop */}
          <div className="col-span-2 md:col-span-1">
             <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--foreground)] mb-4 md:mb-8 opacity-40">Newsletter</h4>
             <div className="space-y-3">
               <p className="text-[10px] text-[var(--foreground)]/50 leading-relaxed">Suscríbete para recibir tendencias y novedades exclusivas.</p>
               <div className="relative max-w-xs">
                  <input type="text" placeholder="Email Address" className="w-full bg-white border border-black/5 rounded-full px-4 py-2.5 text-[10px] outline-none focus:border-[var(--primary)]/30 transition-all font-sans" />
                  <button className="absolute right-2 top-1.5 bg-[var(--foreground)] text-white p-1.5 rounded-full hover:bg-[var(--primary)] transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
               </div>
             </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 md:pt-12 border-t border-black/5 flex flex-col-reverse md:flex-row items-center justify-between gap-4 md:gap-6">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--foreground)]/30">
            © 2026 RESET SYSTEM. Elevando el estándar de la belleza.
          </p>
          <div className="flex gap-6 md:gap-10">
            <Link href="#" className="text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--foreground)]/30 hover:text-[var(--primary)] transition-colors">Instagram</Link>
            <Link href="#" className="text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--foreground)]/30 hover:text-[var(--primary)] transition-colors">LinkedIn</Link>
            <Link href="#" className="text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--foreground)]/30 hover:text-[var(--primary)] transition-colors">WhatsApp</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
