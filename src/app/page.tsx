"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PublicNavbar } from "@/components/layout/public/Navbar";
import { PublicFooter } from "@/components/layout/public/Footer";
import { 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  Users, 
  CreditCard, 
  BarChart3,
  Zap,
  ShieldCheck,
  Smartphone
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <PublicNavbar />

      <main>
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
                <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Nueva Version 2026 Disponible</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
                Seamless <br />
                <span className="text-gray-300">Beauty Salon</span> <br />
                Management
              </h1>
              
              <p className="text-xl text-gray-500 font-medium max-w-lg leading-relaxed">
                Bridge the gap between your clients and your business. Connect your public booking site with a powerful admin dashboard for a flawless experience.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/login?tab=register">
                  <Button className="bg-black text-white px-8 h-16 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-2xl shadow-black/20 flex items-center gap-2">
                    Empezar Ahora
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="ghost" className="px-8 h-16 rounded-2xl text-sm font-black uppercase tracking-widest text-gray-400 hover:text-black">
                    Ver Funciones
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 to-transparent rounded-[3rem] -rotate-3 transform" />
              <div className="relative bg-gray-50 border border-gray-100 rounded-[3rem] p-8 shadow-2xl overflow-hidden aspect-square flex items-center justify-center group">
                 <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-black rounded-[2rem] mx-auto flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                      <Zap className="w-10 h-10 text-white fill-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black uppercase tracking-tighter text-3xl italic">RESEST SYSTEM</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Powered by Advanced Logic</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-gray-50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              <div>
                <p className="text-4xl font-black tracking-tighter mb-1">2,000+</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Salones Activos</p>
              </div>
              <div>
                <p className="text-4xl font-black tracking-tighter mb-1">1M+</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Turnos Reservados</p>
              </div>
              <div>
                <p className="text-4xl font-black tracking-tighter mb-1">45%</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Aumento Eficiencia</p>
              </div>
              <div>
                <p className="text-4xl font-black tracking-tighter mb-1">99.9%</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Uptime Garantizado</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                Everything you need to grow your salon in one place
              </h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                Diseñado para profesionales modernos que valoran la eficiencia y el estilo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Calendar className="w-6 h-6" />,
                  title: "Real-time Sync",
                  desc: "Sincronización instantánea entre reservas públicas y agenda interna. Sin solapamientos, garantizado."
                },
                {
                  icon: <Zap className="w-6 h-6" />,
                  title: "Automated Scheduling",
                  desc: "Reduce inasistencias en un 45% con recordatorios automáticos por WhatsApp y Email."
                },
                {
                  icon: <Users className="w-6 h-6" />,
                  title: "Treatment Catalog",
                  desc: "Muestra tus servicios con un catálogo digital premium que hace que reservar sea irresistible."
                },
                {
                  icon: <BarChart3 className="w-6 h-6" />,
                  title: "Advanced Analytics",
                  desc: "Entiende tu negocio con dashboards de ingresos, clientes frecuentes y servicios populares."
                },
                {
                  icon: <CreditCard className="w-6 h-6" />,
                  title: "Payments & Invoicing",
                  desc: "Gestiona pagos, señas y facturación de forma integrada y sencilla."
                },
                {
                  icon: <Smartphone className="w-6 h-6" />,
                  title: "Multi-device",
                  desc: "Gestiona tu negocio desde cualquier lugar. Desktop, tablet o móvil."
                }
              ].map((feature, i) => (
                <div key={i} className="p-10 bg-white border border-gray-50 rounded-[2.5rem] hover:shadow-2xl hover:shadow-gray-100 transition-all group">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-black group-hover:text-white transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-4">{feature.title}</h3>
                  <p className="text-gray-400 text-sm font-medium leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto bg-black rounded-[4rem] p-12 md:p-24 text-center overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gray-900 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-900 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-50" />
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none max-w-4xl mx-auto">
                Ready to modernize your beauty business?
              </h2>
              <p className="text-gray-400 text-lg font-medium max-w-2xl mx-auto">
                Únete a los más de 2,000 salones que ya han transformado su flujo de trabajo con RESEST SYSTEM.
              </p>
              <div className="pt-8">
                <Link href="/login?tab=register">
                  <Button className="bg-white text-black px-10 h-18 rounded-2xl text-base font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 shadow-2xl flex items-center gap-3 mx-auto">
                    Crear mi Cuenta Gratis
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
