"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getTenant, TenantData } from "@/lib/services/tenantService";
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
  Smartphone,
  Sparkles,
  Heart,
  Star
} from "lucide-react";

export default function Home() {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const tenantId = "resetspa"; // Default or detect from host

  useEffect(() => {
    async function load() {
      const data = await getTenant(tenantId);
      if (data) setTenant(data);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      <PublicNavbar salonName={tenant?.nombre_salon} logoUrl={tenant?.logo_url} />

      <main>
        {/* Hero Section */}
        <section className="relative pt-48 pb-32 px-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-[var(--secondary)]/20 to-transparent -z-10" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl -z-10" />
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-3 px-4 py-2 glass rounded-full ring-1 ring-black/5">
                <Sparkles className="w-3 h-3 text-[var(--primary)]" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.3em] opacity-60">Elevando el estándar de la belleza</span>
              </div>
              
              <h1 className="text-7xl md:text-8xl font-serif italic leading-[0.85] tracking-tight">
                El Arte de <br />
                <span className="text-[var(--primary)] not-italic font-light">Gestionar</span> <br />
                la Belleza
              </h1>
              
              <p className="text-lg text-[var(--foreground)]/60 font-medium max-w-md leading-relaxed">
                Una plataforma sofisticada diseñada para centros de estética que valoran la elegancia, la precisión y la experiencia del cliente.
              </p>

              <div className="flex flex-wrap gap-6 pt-4">
                <Link href="/login?tab=register">
                  <button className="btn-elegant group">
                    Comenzar Experiencia
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
                <Link href="#features">
                  <button className="btn-outline-elegant">
                    Explorar
                  </button>
                </Link>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-[var(--secondary)]/30 rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
              <div className="relative aspect-[4/5] bg-white rounded-[4rem] overflow-hidden border border-black/5 shadow-2xl flex items-center justify-center p-12">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-[var(--secondary)]/10" />
                 <div className="relative text-center space-y-12 w-full">
                    <div className="w-48 h-24 mx-auto relative transition-transform duration-1000 group-hover:scale-110">
                      <img src={tenant?.logo_url || "/logo.png"} alt={tenant?.nombre_salon || "RESET HOME SPA WEB"} className="w-full h-full object-contain" />
                    </div>
                    <div className="space-y-4">
                      <div className="h-px w-12 bg-[var(--primary)] mx-auto opacity-30" />
                      <p className="text-[9px] font-semibold uppercase tracking-[0.4em] opacity-40 italic">¡TU MEJOR VERSIÓN!</p>
                    </div>
                 </div>
              </div>
              
              {/* Floating element */}
              <div className="absolute -bottom-10 -left-10 glass p-6 rounded-3xl shadow-xl border border-white/50 animate-bounce-slow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-[var(--primary)] fill-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">100% Premium</p>
                    <p className="text-[9px] opacity-40 uppercase tracking-widest mt-1">Garantizado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 border-y border-black/5 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-16 text-center">
              {[
                { label: "Salones Activos", value: "2,000+" },
                { label: "Citas Gestionadas", value: "1M+" },
                { label: "Eficiencia Operativa", value: "45%" },
                { label: "Uptime Premium", value: "99.9%" }
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-5xl font-serif italic tracking-tighter">{stat.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-40 px-6 relative bg-[var(--secondary)]/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-32 space-y-6">
              <h2 className="text-5xl md:text-6xl font-serif italic leading-none">
                La excelencia en cada <br />
                <span className="text-[var(--primary)] not-italic">detalle</span>
              </h2>
              <div className="h-px w-20 bg-[var(--primary)] mx-auto opacity-20" />
              <p className="text-[var(--foreground)]/40 font-semibold uppercase tracking-[0.3em] text-[10px]">
                Funcionalidades diseñadas para la alta estética contemporánea.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  icon: <Calendar className="w-5 h-5" />,
                  title: "Agenda Inteligente",
                  desc: "Sincronización fluida que respeta tu tiempo y el de tus clientes más exigentes."
                },
                {
                  icon: <Sparkles className="w-5 h-5" />,
                  title: "Catálogo Premium",
                  desc: "Muestra tus servicios con una estética de boutique de lujo irresistible."
                },
                {
                  icon: <Users className="w-5 h-5" />,
                  title: "Gestión Concierge",
                  desc: "Trata a cada cliente como un VIP con perfiles detallados y seguimiento personalizado."
                },
                {
                  icon: <BarChart3 className="w-5 h-5" />,
                  title: "Análisis de Lujo",
                  desc: "Métricas claras que te permiten elevar el valor de tu negocio de forma constante."
                },
                {
                  icon: <Heart className="w-5 h-5" />,
                  title: "Fidelización",
                  desc: "Programas de lealtad tan elegantes como la experiencia en tu salón."
                },
                {
                  icon: <Smartphone className="w-5 h-5" />,
                  title: "Experiencia Móvil",
                  desc: "Control absoluto desde la palma de tu mano, con una interfaz fluida y refinada."
                }
              ].map((feature, i) => (
                <div key={i} className="p-12 bg-white rounded-[3rem] border border-black/5 hover:shadow-2xl hover:shadow-[var(--primary)]/10 transition-all duration-700 group cursor-default">
                  <div className="w-14 h-14 bg-[var(--secondary)]/20 rounded-2xl flex items-center justify-center mb-10 group-hover:bg-[var(--foreground)] group-hover:text-white transition-all duration-500">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-serif italic mb-6 group-hover:text-[var(--primary)] transition-colors">{feature.title}</h3>
                  <p className="text-[var(--foreground)]/50 text-sm font-medium leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-40 px-6">
          <div className="max-w-7xl mx-auto bg-[var(--foreground)] rounded-[5rem] p-16 md:p-32 text-center overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--primary)] rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] opacity-10" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[var(--primary)] rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px] opacity-10" />
            
            <div className="relative z-10 space-y-12">
              <h2 className="text-5xl md:text-7xl font-serif italic text-white leading-tight max-w-4xl mx-auto">
                ¿Lista para elevar <br /> tu centro al siguiente nivel?
              </h2>
              <div className="h-px w-24 bg-[var(--primary)] mx-auto opacity-30" />
              <p className="text-white/40 text-lg font-medium max-w-2xl mx-auto uppercase tracking-widest text-xs">
                Únete a la elite de los salones que ya transforman el mañana con RESET HOME SPA WEB.
              </p>
              <div className="pt-8">
                <Link href="/login?tab=register">
                  <button className="bg-white text-[var(--foreground)] px-12 py-6 rounded-full text-xs font-bold uppercase tracking-[0.3em] hover:bg-[var(--silk)] transition-all active:scale-95 shadow-2xl flex items-center gap-4 mx-auto group">
                    Crear mi Cuenta Gratis
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      <PublicFooter logoUrl={tenant?.logo_url} />
    </div>
  );
}
