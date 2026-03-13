"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { serviceManagement, Tratamiento, Subtratamiento } from "@/lib/services/serviceManagement";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { PublicNavbar } from "@/components/layout/public/Navbar";
import { PublicFooter } from "@/components/layout/public/Footer";
import { PublicBookingModal } from "@/components/booking/PublicBookingModal";
import { Clock, DollarSign, ChevronRight, ImageIcon, X, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";

export default function PublicCatalogPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [subtratamientos, setSubtratamientos] = useState<Record<string, Subtratamiento[]>>({});
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<TenantData | null>(null);

  // Detail overlay state
  const [detailSub, setDetailSub] = useState<{ sub: Subtratamiento; trat: Tratamiento } | null>(null);
  const [detailImgIdx, setDetailImgIdx] = useState(0);

  // Booking modal state
  const [bookingData, setBookingData] = useState<{ sub: Subtratamiento; trat: Tratamiento } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!tenantId) return;
      try {
        const tenantData = await getTenant(tenantId);
        if (tenantData) setTenant(tenantData);
        const trats = await serviceManagement.getTratamientos(tenantId);
        const tratsHabilitados = trats.filter(t => t.habilitado);
        setTratamientos(tratsHabilitados);
        
        const subsMap: Record<string, Subtratamiento[]> = {};
        for (const t of tratsHabilitados) {
          const subs = await serviceManagement.getSubtratamientos(tenantId, t.id);
          subsMap[t.id] = subs;
        }
        setSubtratamientos(subsMap);
      } catch (error) {
        console.error("Error loading catalog:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <PublicNavbar salonName={tenant?.nombre_salon} />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-black uppercase tracking-tighter">Catálogo de Servicios</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{tenant?.nombre_salon || 'Catálogo'} | Estética & Bienestar</p>
          </div>

          {/* Catalog items */}
          <div className="space-y-24">
            {tratamientos.length > 0 ? (
              tratamientos.map((tratamiento) => (
                <div key={tratamiento.id} className="space-y-10 group">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full">
                         <span className="text-[10px] font-black uppercase tracking-widest">Servicio Principal</span>
                      </div>
                      <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">
                        {tratamiento.nombre}
                      </h2>
                      {tratamiento.descripcion && (
                        <p className="text-gray-500 font-medium leading-relaxed">
                          {tratamiento.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Image Gallery */}
                    <div className="relative aspect-video rounded-[3rem] overflow-hidden bg-gray-100 border border-gray-100 shadow-2xl">
                       {tratamiento.imagenes && tratamiento.imagenes.length > 0 ? (
                          <img 
                            src={tratamiento.imagenes[0]} 
                            alt={tratamiento.nombre} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          />
                       ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                            <ImageIcon className="w-10 h-10 opacity-20" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Sin fotos disponibles</span>
                          </div>
                       )}
                    </div>
                  </div>

                  {/* Sub-items (Subtratamientos) */}
                  <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8 px-2 flex items-center gap-2">
                       <ChevronRight className="w-3 h-3 text-black" /> Opciones Disponibles
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {subtratamientos[tratamiento.id]?.map((sub) => (
                        <div key={sub.id} className="p-8 bg-gray-50 rounded-[2rem] border border-gray-50 hover:border-black/10 transition-all group/card">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="text-lg font-black uppercase tracking-tight leading-tight max-w-[70%]">
                              {sub.nombre}
                            </h4>
                            <div className="flex items-center gap-1 text-black bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                              <DollarSign className="w-3.5 h-3.5" />
                              <span className="text-sm font-black">{sub.precio}</span>
                            </div>
                          </div>

                          {sub.descripcion && (
                            <p className="text-gray-400 text-sm font-medium mb-4 line-clamp-2 italic">
                              &ldquo;{sub.descripcion}&rdquo;
                            </p>
                          )}

                          {/* VER MÁS button */}
                          <div className="flex justify-center mb-4">
                            <button
                              onClick={() => { setDetailSub({ sub, trat: tratamiento }); setDetailImgIdx(0); }}
                              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black border border-gray-200 hover:border-black px-6 py-2 rounded-full transition-all"
                            >
                              Ver Más
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs font-bold">{sub.duracion_minutos} min</span>
                            </div>
                            <button 
                              onClick={() => setBookingData({ sub, trat: tratamiento })}
                              className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors active:scale-95"
                            >
                              Agendar Cita
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No hay servicios disponibles en este momento</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />

      {/* Detail Overlay */}
      {detailSub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetailSub(null)}>
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetailSub(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{detailSub.trat.nombre}</p>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-6">{detailSub.sub.nombre}</h2>

            {/* Photo gallery */}
            {detailSub.sub.imagenes && detailSub.sub.imagenes.length > 0 && (
              <div className="relative mb-8 rounded-[2rem] overflow-hidden aspect-video bg-gray-100">
                <img src={detailSub.sub.imagenes[detailImgIdx]} alt={detailSub.sub.nombre} className="w-full h-full object-cover" />
                {detailSub.sub.imagenes.length > 1 && (
                  <>
                    <button onClick={() => setDetailImgIdx(i => i > 0 ? i - 1 : detailSub.sub.imagenes!.length - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors shadow-lg">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setDetailImgIdx(i => i < detailSub.sub.imagenes!.length - 1 ? i + 1 : 0)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors shadow-lg">
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {detailSub.sub.imagenes.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === detailImgIdx ? 'bg-white scale-125' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Description */}
            {detailSub.sub.descripcion && (
              <p className="text-gray-600 font-medium leading-relaxed mb-8">{detailSub.sub.descripcion}</p>
            )}

            {/* Info row */}
            <div className="flex items-center gap-6 mb-8 p-6 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-black">{detailSub.sub.duracion_minutos} minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-black">${detailSub.sub.precio}</span>
              </div>
            </div>

            <button
              onClick={() => { setBookingData({ sub: detailSub.sub, trat: detailSub.trat }); setDetailSub(null); }}
              className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all active:scale-95"
            >
              Agendar Cita
            </button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingData && (
        <PublicBookingModal
          isOpen={!!bookingData}
          onClose={() => setBookingData(null)}
          tratamiento={bookingData.trat}
          subtratamiento={bookingData.sub}
          tenantId={tenantId}
        />
      )}
    </div>
  );
}
