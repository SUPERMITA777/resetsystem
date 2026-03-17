"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { serviceManagement, Tratamiento, Subtratamiento } from "@/lib/services/serviceManagement";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { PublicNavbar } from "@/components/layout/public/Navbar";
import { PublicFooter } from "@/components/layout/public/Footer";
import { PublicBookingModal } from "@/components/booking/PublicBookingModal";
import { Clock, DollarSign, ChevronRight, ImageIcon, X, ChevronLeft, ChevronRight as ChevronRightIcon, Sparkles } from "lucide-react";

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

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Expanded treatments state (for showing all subs)
  const [expandedTrats, setExpandedTrats] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      if (!tenantId) return;
      try {
        const [tenantData, trats] = await Promise.all([
          getTenant(tenantId),
          serviceManagement.getTratamientos(tenantId)
        ]);

        if (tenantData) setTenant(tenantData);
        
        const tratsHabilitados = trats
          .filter(t => t.habilitado)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        setTratamientos(tratsHabilitados);
        setLoading(false); // Move this up so shell can render
        
        // Fetch subtratamientos in parallel in background
        const subsResults = await Promise.all(
          tratsHabilitados.map(t => serviceManagement.getSubtratamientos(tenantId, t.id))
        );
        
        const subsMap: Record<string, Subtratamiento[]> = {};
        tratsHabilitados.forEach((t, i) => {
          subsMap[t.id] = subsResults[i];
        });
        
        setSubtratamientos(subsMap);
      } catch (error) {
        console.error("Error loading catalog:", error);
        setLoading(false);
      }
    }
    loadData();
  }, [tenantId]);

  // Search filtering logic
  const term = searchTerm.toLowerCase().trim();

  const filteredTratamientos = tratamientos.filter(t => {
    if (!term) return true;
    if (t.nombre.toLowerCase().includes(term)) return true;
    if (t.descripcion?.toLowerCase().includes(term)) return true;
    const subs = subtratamientos[t.id] || [];
    return subs.some(s =>
      s.nombre.toLowerCase().includes(term) ||
      (s as any).descripcion?.toLowerCase().includes(term)
    );
  });

  const getFilteredSubs = (tratId: string): Subtratamiento[] => {
    const subs = subtratamientos[tratId] || [];
    if (!term) return subs;
    const trat = tratamientos.find(t => t.id === tratId);
    if (trat?.nombre.toLowerCase().includes(term)) return subs;
    if (trat?.descripcion?.toLowerCase().includes(term)) return subs;
    return subs.filter(s =>
      s.nombre.toLowerCase().includes(term) ||
      (s as any).descripcion?.toLowerCase().includes(term)
    );
  };

  if (loading && !tenant) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-12 h-12 border-t-2 border-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  const SkeletonCard = () => (
    <div className="p-10 bg-white/40 rounded-[3rem] border border-black/5 animate-pulse">
      <div className="h-8 bg-black/5 rounded-lg w-2/3 mb-6" />
      <div className="h-4 bg-black/5 rounded-lg w-full mb-3" />
      <div className="h-4 bg-black/5 rounded-lg w-4/5 mb-8" />
      <div className="flex justify-between items-center pt-8 border-t border-black/5">
        <div className="h-4 bg-black/5 rounded-lg w-20" />
        <div className="h-10 bg-black/5 rounded-full w-24" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      <PublicNavbar 
        salonName={tenant?.nombre_salon} 
        logoUrl={tenant?.logo_url}
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />

      <main className="pt-40 pb-32 px-6">
        <div className="max-w-6xl mx-auto space-y-24">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-serif italic tracking-tight pt-8 uppercase">
               <span className="not-italic text-[var(--primary)]">Tratamientos</span>
            </h1>
            <div className="h-px w-20 bg-[var(--primary)] mx-auto opacity-20" />
          </div>

          {/* Catalog items */}
          <div className="space-y-32">
            {filteredTratamientos.length > 0 ? (
              filteredTratamientos.map((tratamiento) => {
                const filteredSubs = getFilteredSubs(tratamiento.id);
                return (
                  <div key={tratamiento.id} className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                      <div className="space-y-6 order-2 lg:order-1">
                        <h2 className="text-5xl font-serif italic leading-none">
                          {tratamiento.nombre}
                        </h2>
                        {tratamiento.descripcion && (
                          <p className="text-[var(--foreground)]/50 font-medium leading-relaxed max-w-sm">
                            {tratamiento.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Image Gallery */}
                      <div className="relative aspect-[16/10] rounded-[4rem] overflow-hidden bg-[var(--secondary)]/10 border border-black/5 shadow-2xl order-1 lg:order-2 group">
                         {tratamiento.imagenes && tratamiento.imagenes.length > 0 ? (
                            <img 
                              src={tratamiento.imagenes[0]} 
                              alt={tratamiento.nombre} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                            />
                         ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--foreground)]/10 gap-3">
                              <ImageIcon className="w-12 h-12 opacity-20" />
                              <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-30">Galería en Preparación</span>
                            </div>
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                      </div>
                    </div>

                    {/* Sub-items (Subtratamientos) */}
                    <div className="glass rounded-[4rem] p-10 md:p-16 ring-1 ring-black/5 mt-8">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {subtratamientos[tratamiento.id] !== undefined ? (
                          filteredSubs.length > 0 ? (
                            (expandedTrats.has(tratamiento.id) ? filteredSubs : filteredSubs.slice(0, 2)).map((sub) => (
                              <div key={sub.id} className="p-10 bg-white/40 rounded-[3rem] border border-black/5 hover:border-[var(--primary)]/20 hover:shadow-2xl hover:shadow-[var(--primary)]/5 transition-all duration-700 group/card">
                                <div className="flex justify-between items-start mb-6">
                                  <h4 className="text-2xl font-serif italic tracking-tight leading-tight max-w-[70%] group-hover/card:text-[var(--primary)] transition-colors">
                                    {sub.nombre}
                                  </h4>
                                  <div className="text-xl font-serif italic text-[var(--primary)]">
                                    ${sub.precio}
                                  </div>
                                </div>

                                {sub.descripcion && (
                                  <p className="text-[var(--foreground)]/40 text-sm font-medium mb-8 line-clamp-2 italic leading-relaxed">
                                    &ldquo;{sub.descripcion}&rdquo;
                                  </p>
                                )}

                                <div className="flex items-center justify-between pt-8 border-t border-black/5">
                                  <div className="flex items-center gap-3 text-[var(--foreground)]/30">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{sub.duracion_minutos} min</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <button
                                      onClick={() => { setDetailSub({ sub, trat: tratamiento }); setDetailImgIdx(0); }}
                                      className="text-[9px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all px-2 py-1"
                                    >
                                      Detalles
                                    </button>
                                    <button 
                                      onClick={() => setBookingData({ sub, trat: tratamiento })}
                                      className="btn-elegant !py-2.5 !px-6 !text-[9px]"
                                    >
                                      Reservar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-1 md:col-span-2 py-12 text-center border border-dashed border-black/5 rounded-[3rem]">
                               <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-20">No hay variaciones disponibles</p>
                            </div>
                          )
                        ) : (
                          // Skeletons while background loading
                          <>
                            <SkeletonCard />
                            <SkeletonCard />
                          </>
                        )}
                      </div>

                      {filteredSubs.length > 2 && (
                        <div className="mt-12 text-center">
                          <button
                            onClick={() => {
                              setExpandedTrats(prev => {
                                const next = new Set(prev);
                                if (next.has(tratamiento.id)) next.delete(tratamiento.id);
                                else next.add(tratamiento.id);
                                return next;
                              });
                            }}
                            className="btn-outline-elegant !py-3 !px-10 !text-[9px]"
                          >
                            {expandedTrats.has(tratamiento.id) ? (
                              <>Ver menos</>  
                            ) : (
                              <>Descubrir más ({filteredSubs.length})</>  
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-32 glass rounded-[4rem] border-dashed border-black/10">
                <p className="text-[var(--foreground)]/30 font-bold uppercase tracking-[0.3em] text-[10px]">
                  {searchTerm ? `No se encontraron resultados para "${searchTerm}"` : 'Colección no disponible temporalmente'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <PublicFooter logoUrl={tenant?.logo_url} />

      {/* Detail Overlay */}
      {detailSub && (
        <div className="fixed inset-0 bg-[var(--dusk)]/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setDetailSub(null)}>
          <div className="bg-[var(--background)] rounded-[4rem] p-10 md:p-16 w-full max-w-3xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetailSub(null)} className="absolute top-10 right-10 w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors">
              <X className="w-5 h-5 opacity-40" />
            </button>

            <div className="flex items-center gap-4 mb-2">
               <div className="h-px w-8 bg-[var(--primary)] opacity-30" />
               <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--primary)]">{detailSub.trat.nombre}</p>
            </div>
            <h2 className="text-5xl font-serif italic mb-10 tracking-tight">{detailSub.sub.nombre}</h2>

            {/* Photo gallery */}
            {detailSub.sub.imagenes && detailSub.sub.imagenes.length > 0 && (
              <div className="relative mb-12 rounded-[3rem] overflow-hidden aspect-video bg-[var(--secondary)]/10 shadow-xl group">
                <img src={detailSub.sub.imagenes[detailImgIdx]} alt={detailSub.sub.nombre} className="w-full h-full object-cover" />
                {detailSub.sub.imagenes.length > 1 && (
                  <>
                    <button onClick={() => setDetailImgIdx(i => i > 0 ? i - 1 : detailSub.sub.imagenes!.length - 1)} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-white transition-colors shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setDetailImgIdx(i => i < detailSub.sub.imagenes!.length - 1 ? i + 1 : 0)} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-white transition-colors shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                      {detailSub.sub.imagenes.map((_, i) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === detailImgIdx ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Description */}
            {detailSub.sub.descripcion && (
              <p className="text-[var(--foreground)]/60 font-medium leading-[1.8] mb-12 text-lg italic pr-8">{detailSub.sub.descripcion}</p>
            )}

            {/* Info row */}
            <div className="flex flex-wrap items-center gap-12 mb-12 p-10 bg-[var(--secondary)]/10 rounded-[2.5rem] border border-black/5">
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-30">Duración</p>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-lg font-serif italic tracking-tight">{detailSub.sub.duracion_minutos} minutos</span>
                </div>
              </div>
              <div className="h-10 w-px bg-black/5 mx-4" />
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-30">Inversión</p>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-lg font-serif italic tracking-tight">${detailSub.sub.precio}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setBookingData({ sub: detailSub.sub, trat: detailSub.trat }); setDetailSub(null); }}
              className="btn-elegant w-full !h-16 !text-xs !tracking-[0.4em]"
            >
              Confirmar Reserva
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
