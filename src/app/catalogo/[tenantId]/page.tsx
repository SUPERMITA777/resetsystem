"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { serviceManagement, Tratamiento, Subtratamiento } from "@/lib/services/serviceManagement";
import { PublicNavbar } from "@/components/layout/public/Navbar";
import { PublicFooter } from "@/components/layout/public/Footer";
import { Info, Clock, DollarSign, ChevronRight, ImageIcon } from "lucide-react";

export default function PublicCatalogPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [subtratamientos, setSubtratamientos] = useState<Record<string, Subtratamiento[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!tenantId) return;
      try {
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
      <PublicNavbar />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-black uppercase tracking-tighter">Catálogo de Servicios</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">RESEST SYSTEM | Estética & Bienestar</p>
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
                      <h2 className="text-4xl font-black uppercase tracking-tighter leading-none tracking-tight">
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
                          <div className="flex justify-between items-start mb-6">
                            <h4 className="text-lg font-black uppercase tracking-tight leading-tight max-w-[70%]">
                              {sub.nombre}
                            </h4>
                            <div className="flex items-center gap-1 text-black bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                              <DollarSign className="w-3.5 h-3.5" />
                              <span className="text-sm font-black">{sub.precio}</span>
                            </div>
                          </div>

                          {sub.descripcion && (
                            <p className="text-gray-400 text-sm font-medium mb-6 line-clamp-2 italic">
                              "{sub.descripcion}"
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs font-bold">{sub.duracion_minutos} min</span>
                            </div>
                            <button className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors">
                              Reservar
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
    </div>
  );
}
