"use client";

import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
        <div className="col-span-1 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl italic">R</span>
            </div>
            <span className="text-xl font-black uppercase tracking-tighter">RESEST SYSTEM</span>
          </Link>
          <p className="text-gray-400 text-sm font-medium leading-relaxed">
            La plataforma inteligente para la gestión de modernos centros de estética y salones de belleza.
          </p>
        </div>

        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 mb-6">Plataforma</h4>
          <ul className="space-y-4">
            <li><Link href="#" className="text-sm text-gray-400 hover:text-black font-bold transition-colors">Agenda</Link></li>
            <li><Link href="#" className="text-sm text-gray-400 hover:text-black font-bold transition-colors">Gestión de Clientes</Link></li>
            <li><Link href="#" className="text-sm text-gray-400 hover:text-black font-bold transition-colors">Pagos y Facturación</Link></li>
            <li><Link href="#" className="text-sm text-gray-400 hover:text-black font-bold transition-colors">Marketing</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 mb-6">Compañía</h4>
          <ul className="space-y-4">
            <li><Link href="#" className="text-sm text-gray-400 hover:text-black font-bold transition-colors">Sobre Nosotros</Link></li>
            <li><Link href="#" className="text-sm text-gray-400 hover:text-black font-bold transition-colors">Blog</Link></li>
            <li><Link href="#" className="text-sm text-gray-400 hover:text-black font-bold transition-colors">Soporte</Link></li>
            <li><Link href="#" className="text-sm text-gray-400 hover:text-black font-bold transition-colors">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 mb-6">Legal</h4>
          <ul className="space-y-4">
            <li><Link href="#" className="text-sm text-gray-400 hover:text-black font-bold transition-colors">Términos de Servicio</Link></li>
            <li><Link href="#" className="text-sm text-gray-400 hover:text-black font-bold transition-colors">Privacidad</Link></li>
            <li><Link href="#" className="text-sm text-gray-400 hover:text-black font-bold transition-colors">Seguridad</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 border-t border-gray-100 pt-10 flex flex-col md:row items-center justify-between gap-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
          © 2026 RESEST SYSTEM. TODOS LOS DERECHOS RESERVADOS.
        </p>
        <div className="flex gap-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-black cursor-pointer transition-colors">Instagram</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-black cursor-pointer transition-colors">WhatsApp</span>
        </div>
      </div>
    </footer>
  );
}
