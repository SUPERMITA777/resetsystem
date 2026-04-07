"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getTenant, TenantData } from "@/lib/services/tenantService";
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
  Star,
  Check,
  Package,
  Target
} from "lucide-react";

export default function Home() {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const tenantId = "resetspa"; // Default or detect from host
  const [isAnnual, setIsAnnual] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getTenant(tenantId);
      if (data) setTenant(data);
    }
    load();
  }, []);

  const plans = [
    {
      name: "Individual",
      price: isAnnual ? 10750 : 12900,
      description: "Para profesionales que trabajan solos.",
      features: ["Agenda 24/7", "WhatsApp de recordatorio", "Ficha de cliente básica", "App móvil"]
    },
    {
      name: "Básico",
      price: isAnnual ? 26580 : 31900,
      description: "Organiza tu centro de forma profesional.",
      features: ["Todo lo de Individual", "Gestión de stock", "Control de caja", "Reportes de venta"]
    },
    {
      name: "Premium",
      price: isAnnual ? 34910 : 41900,
      description: "Optimiza al máximo tu negocio.",
      popular: true,
      features: ["Todo lo de Básico", "Marketing automatizado", "Fidelización de clientes", "Soporte prioritario"]
    },
    {
      name: "Pro",
      price: isAnnual ? 208250 : 249900,
      description: "Para empresas que buscan escala.",
      features: ["Todo lo de Premium", "API personalizada", "Multi-sucursal", "Account Manager dedicado"]
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcf8ff] text-[#181838] font-sans selection:bg-[#00b4d8] selection:text-white">
      <PublicNavbar salonName={tenant?.nombre_salon || "RESET SYSTEM"} logoUrl={tenant?.logo_url} />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-[#00b4d8]/5 to-transparent -z-10" />
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7209b7]/5 rounded-full border border-[#7209b7]/10">
                <Sparkles className="w-4 h-4 text-[#7209b7]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7209b7]">Software N°1 de Gestión</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-[#1c1c3c]">
                El sistema que hace crecer tu <span className="text-[#00b4d8]">negocio de belleza</span>
              </h1>
              <p className="text-xl text-[#404752] max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Organiza tus citas, automatiza recordatorios, controla tu stock y fideliza clientes con Reset System. 
                Diseñado para profesionales que buscan excelencia.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link href="/login?tab=register">
                  <button className="h-16 px-10 bg-[#1c1c3c] text-white rounded-full font-bold text-lg hover:bg-[#00b4d8] transition-all duration-300 shadow-xl shadow-[#1c1c3c]/20 group flex items-center gap-3 active:scale-95">
                    Prueba Gratis 14 días
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
                <button className="h-16 px-10 bg-white border-2 border-[#1c1c3c]/10 text-[#1c1c3c] rounded-full font-bold text-lg hover:bg-[#f5f2ff] transition-all duration-300 active:scale-95">
                  Ver Demostración
                </button>
              </div>
            </div>
            <div className="lg:w-1/2 relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#7209b7]/20 to-[#00b4d8]/20 rounded-[4rem] blur-3xl opacity-50 group-hover:opacity-70 transition-opacity" />
              <div className="relative rounded-[3rem] overflow-hidden border border-[#1c1c3c]/5 shadow-2xl bg-white p-2">
                <img src="/images/landing/hero_dashboard.png" alt="Reset System Dashboard" className="rounded-[2.5rem] w-full h-auto shadow-inner" />
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="py-20 bg-white border-y border-[#1c1c3c]/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <p className="text-xs font-bold uppercase tracking-[.3em] text-[#00b4d8]">Confiado por líderes internacionales</p>
              <h2 className="text-3xl md:text-4xl font-bold">Más de 20.000 negocios ya son parte de la elite</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-8 h-8 bg-[#1c1c3c] rounded-full" /> SPA HUB</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-8 h-8 bg-[#1c1c3c] rounded-full" /> ESTETICA PRO</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-8 h-8 bg-[#1c1c3c] rounded-full" /> BEAUTY CARE</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-8 h-8 bg-[#1c1c3c] rounded-full" /> RESET SPA</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mt-20 text-center">
              {[
                { label: "Negocios activos", value: "20k+" },
                { label: "Citas mensuales", value: "1M+" },
                { label: "Satisfacción", value: "98%" },
                { label: "Países", value: "15+" }
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-4xl md:text-5xl font-bold text-[#1c1c3c] tracking-tighter">{stat.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#404752] opacity-60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="py-32 bg-[#fcf8ff] px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-24 space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Herramientas diseñadas para <span className="text-[#7209b7]">potenciar</span> tu flujo de trabajo</h2>
              <p className="text-lg text-[#404752] font-medium">Olvídate del papel y las complicaciones. Reset System centraliza tu éxito.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Feature 1: Agenda */}
              <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] border border-[#1c1c3c]/5 hover:shadow-2xl transition-all duration-700 group">
                <div className="flex flex-col xl:flex-row gap-12 items-center">
                  <div className="xl:w-1/2 space-y-6">
                    <div className="w-14 h-14 bg-[#00b4d8]/10 rounded-2xl flex items-center justify-center text-[#00b4d8] group-hover:bg-[#00b4d8] group-hover:text-white transition-all">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <h3 className="text-3xl font-bold tracking-tight">Agenda 24/7 y Reservas Online</h3>
                    <p className="text-[#404752] leading-relaxed font-medium">Permite que tus clientes reserven en cualquier momento desde tu propio enlace personalizado. Integrado totalmente a WhatsApp.</p>
                    <ul className="space-y-3 pt-2">
                       {["Recordatorios automáticos", "Sincronización en la nube", "Cancelación inteligente"].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 font-semibold text-sm opacity-70">
                           <CheckCircle2 className="w-4 h-4 text-[#00b4d8]" />
                           {item}
                         </li>
                       ))}
                    </ul>
                  </div>
                  <div className="xl:w-1/2 p-4 bg-[#f5f2ff] rounded-[3rem]">
                    <img src="/images/landing/feature_agenda.png" alt="Agenda Feature" className="w-full h-auto rounded-[2rem] shadow-xl transform group-hover:scale-[1.03] transition-transform duration-700" />
                  </div>
                </div>
              </div>

              {/* Feature 2: CRM */}
              <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] border border-[#1c1c3c]/5 hover:shadow-2xl transition-all duration-700 group">
                <div className="flex flex-col xl:flex-row gap-12 items-center">
                  <div className="xl:w-1/2 space-y-6">
                    <div className="w-14 h-14 bg-[#7209b7]/10 rounded-2xl flex items-center justify-center text-[#7209b7] group-hover:bg-[#7209b7] group-hover:text-white transition-all">
                      <Users className="w-7 h-7" />
                    </div>
                    <h3 className="text-3xl font-bold tracking-tight">Gestión de Clientes (CRM)</h3>
                    <p className="text-[#404752] leading-relaxed font-medium">Fichas digitales detalladas con historial de visitas, fotos, notas técnicas y preferencias de cada cliente VIP.</p>
                    <ul className="space-y-3 pt-2">
                       {["Historia clínica/técnica", "Estadística de fidelidad", "Notas personalizadas"].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 font-semibold text-sm opacity-70">
                           <CheckCircle2 className="w-4 h-4 text-[#7209b7]" />
                           {item}
                         </li>
                       ))}
                    </ul>
                  </div>
                  <div className="xl:w-1/2 p-4 bg-[#f5f2ff] rounded-[3rem]">
                    <img src="/images/landing/feature_crm.png" alt="CRM Feature" className="w-full h-auto rounded-[2rem] shadow-xl transform group-hover:scale-[1.03] transition-transform duration-700" />
                  </div>
                </div>
              </div>

              {/* Feature 3: Inventario */}
              <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] border border-[#1c1c3c]/5 hover:shadow-2xl transition-all duration-700 group">
                <div className="flex flex-col xl:flex-row gap-12 items-center">
                  <div className="xl:w-1/2 space-y-6">
                    <div className="w-14 h-14 bg-[#1c1c3c]/10 rounded-2xl flex items-center justify-center text-[#1c1c3c] group-hover:bg-[#1c1c3c] group-hover:text-white transition-all">
                      <Package className="w-7 h-7" />
                    </div>
                    <h3 className="text-3xl font-bold tracking-tight">Inventario y Ventas</h3>
                    <p className="text-[#404752] leading-relaxed font-medium">Controla tu stock en tiempo real. Alertas automáticas de faltantes y gestión integrada de comisiones para profesionales.</p>
                    <ul className="space-y-3 pt-2">
                       {["Alertas automáticas", "Gestión de comisiones", "Ventas multicanal"].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 font-semibold text-sm opacity-70">
                           <CheckCircle2 className="w-4 h-4 text-[#1c1c3c]" />
                           {item}
                         </li>
                       ))}
                    </ul>
                  </div>
                  <div className="xl:w-1/2 p-4 bg-[#f5f2ff] rounded-[3rem]">
                    <img src="/images/landing/feature_inventory.png" alt="Inventory Feature" className="w-full h-auto rounded-[2rem] shadow-xl transform group-hover:scale-[1.03] transition-transform duration-700" />
                  </div>
                </div>
              </div>

              {/* Feature 4: Marketing */}
              <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] border border-[#1c1c3c]/5 hover:shadow-2xl transition-all duration-700 group">
                <div className="flex flex-col xl:flex-row gap-12 items-center">
                  <div className="xl:w-1/2 space-y-6">
                    <div className="w-14 h-14 bg-[#00b4d8]/10 rounded-2xl flex items-center justify-center text-[#00b4d8] group-hover:bg-[#00b4d8] group-hover:text-white transition-all">
                      <Target className="w-7 h-7" />
                    </div>
                    <h3 className="text-3xl font-bold tracking-tight">Marketing Automatizado</h3>
                    <p className="text-[#404752] leading-relaxed font-medium">Campañas de fidelización, cupones de descuento y automatizaciones inteligentes para reactivar clientes perdidos.</p>
                    <ul className="space-y-3 pt-2">
                       {["Email y SMS Marketing", "Cupones dinámicos", "Segmentación inteligente"].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 font-semibold text-sm opacity-70">
                           <CheckCircle2 className="w-4 h-4 text-[#00b4d8]" />
                           {item}
                         </li>
                       ))}
                    </ul>
                  </div>
                  <div className="xl:w-1/2 p-4 bg-[#f5f2ff] rounded-[3rem]">
                    <img src="/images/landing/feature_marketing.png" alt="Marketing Feature" className="w-full h-auto rounded-[2rem] shadow-xl transform group-hover:scale-[1.03] transition-transform duration-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-32 bg-white px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-6">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Planes diseñados para tu éxito</h2>
              <div className="flex items-center justify-center gap-4">
                <span className={`text-sm font-bold ${!isAnnual ? "text-[#1c1c3c]" : "text-[#404752] opacity-60"}`}>Mensual</span>
                <button 
                  onClick={() => setIsAnnual(!isAnnual)}
                  className="w-16 h-8 bg-[#1c1c3c]/10 rounded-full relative p-1 transition-colors outline-none ring-offset-2 focus:ring-2 focus:ring-[#00b4d8]"
                >
                  <div className={`w-6 h-6 bg-[#00b4d8] rounded-full transition-transform duration-300 ${isAnnual ? "translate-x-8" : "translate-x-0"}`} />
                </button>
                <div className="flex items-center gap-2">
                   <span className={`text-sm font-bold ${isAnnual ? "text-[#1c1c3c]" : "text-[#404752] opacity-60"}`}>Anual</span>
                   <span className="bg-[#7209b7] text-white text-[9px] px-2 py-1 rounded-full font-black uppercase tracking-tighter">2 meses gratis</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {plans.map((plan, i) => (
                 <div key={i} className={`p-10 rounded-[3rem] border transition-all duration-500 flex flex-col relative group ${plan.popular ? "bg-[#1c1c3c] text-white border-transparent shadow-2xl lg:scale-105 z-10" : "bg-white border-[#1c1c3c]/5 hover:border-[#00b4d8]/30"}`}>
                   {plan.popular && (
                     <div className="bg-[#00b4d8] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full w-fit mb-6 absolute -top-4 left-1/2 -translate-x-1/2 shadow-lg">Más Popular</div>
                   )}
                   <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                   <div className="flex items-baseline gap-1 mb-4">
                     <span className="text-sm font-bold opacity-60">AR$</span>
                     <span className="text-5xl font-black">{plan.price.toLocaleString()}</span>
                     <span className="text-xs font-bold opacity-60">/mes</span>
                   </div>
                   <p className={`text-sm font-medium mb-8 ${plan.popular ? "text-white/60" : "text-[#404752] opacity-60"}`}>{plan.description}</p>
                   
                   <div className="flex-1 space-y-4 mb-10">
                     {plan.features.map((feature, j) => (
                       <div key={j} className="flex items-center gap-3 text-sm font-semibold">
                         <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? "bg-[#00b4d8]/20 text-[#00b4d8]" : "bg-[#f5f2ff] text-[#00b4d8]"}`}>
                           <Check className="w-3 h-3" strokeWidth={3} />
                         </div>
                         <span className={plan.popular ? "text-white/90" : "text-[#1c1c3c]/80"}>{feature}</span>
                       </div>
                     ))}
                   </div>

                   <Link href="/login?tab=register" className="mt-auto">
                     <button className={`w-full py-5 rounded-full font-bold text-sm transition-all duration-300 active:scale-95 shadow-lg ${plan.popular ? "bg-[#00b4d8] text-white hover:bg-white hover:text-[#1c1c3c]" : "bg-[#1c1c3c] text-white hover:bg-[#00b4d8]"}`}>
                       Elegir Plan {plan.name}
                     </button>
                   </Link>
                 </div>
               ))}
            </div>
            
            <div className="mt-16 text-center text-[#404752]/60 text-sm font-medium italic">
              * Precios en Pesos Argentinos (ARS). Los planes anuales se facturan en un solo pago bonificado.
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="py-20 lg:py-40 px-6">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#1c1c3c] to-[#39008c] rounded-[5rem] p-16 md:p-32 text-center overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00b4d8] rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] opacity-20" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#7209b7] rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px] opacity-20" />
            
            <div className="relative z-10 space-y-10">
              <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                ¿Lista para elevar <br /> tu centro hoy?
              </h2>
              <p className="text-white/60 text-lg font-medium max-w-2xl mx-auto">
                No esperes más para digitalizar tu éxito. Miles de profesionales confían en Reset System para gestionar cada detalle.
              </p>
              <div className="pt-6">
                <Link href="/login?tab=register">
                  <button className="bg-[#00b4d8] text-white px-12 py-6 rounded-full font-bold text-lg hover:bg-white hover:text-[#1c1c3c] transition-all active:scale-95 shadow-2xl shadow-[#00b4d8]/30 flex items-center gap-4 mx-auto group">
                    Comenzar Gratis Ahora
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      <PublicFooter logoUrl={tenant?.logo_url || "/logo.png"} />
    </div>
  );
}
