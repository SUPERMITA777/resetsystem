"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { productService, Producto } from "@/lib/services/productService";
import { PublicNavbar } from "@/components/layout/public/Navbar";
import { PublicFooter } from "@/components/layout/public/Footer";
import { XCircle, ShoppingBag, ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PublicProductosPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            if (!slug) {
                setLoading(false);
                return;
            }
            
            try {
                // Fetch tenant and products in parallel
                const [tenantData, productsData] = await Promise.all([
                    getTenant(slug),
                    productService.getProductos(slug)
                ]);

                if (tenantData) {
                    setTenant(tenantData);
                    setProductos(productsData || []);
                    
                    // SEO
                    const webConfig = tenantData.web_config;
                    document.title = `Productos - ${tenantData.nombre_salon} | RESETSYSTEM`;
                    const seoDesc = webConfig?.seo_description || 'Compra nuestros productos online';
                    const metaDesc = document.querySelector('meta[name="description"]');
                    if (metaDesc) metaDesc.setAttribute('content', seoDesc);
                } else {
                    setError("Salón no encontrado.");
                }
            } catch (err: any) {
                setError(`Error de conexión: ${err.message}`);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [slug]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cargando productos...</p>
        </div>
    );
    
    if (error || !tenant) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h1 className="text-xl font-black uppercase mb-2">Hubo un problema</h1>
            <p className="text-gray-500 text-sm mb-8">{error || "No pudimos encontrar la información del salón."}</p>
            <Button className="mt-8 bg-black text-white px-8 rounded-xl h-12 uppercase text-[10px] font-black tracking-widest" onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
    );

    const handleWhatsAppConsult = (producto: Producto) => {
        const phone = tenant.datos_contacto?.whatsapp || '5491112345678';
        const message = encodeURIComponent(`¡Hola! 👋 Me interesa el producto "${producto.nombre}" en ${tenant.nombre_salon}. ¿Tienen stock disponible? ✨`);
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PublicNavbar 
                salonName={tenant.nombre_salon} 
                logoUrl={tenant.logo_url} 
                slug={slug}
            />
            
            <main className="flex-1 max-w-7xl mx-auto px-6 py-32 w-full">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-gray-900 italic animate-in fade-in slide-in-from-bottom-4 duration-700">Catálogo de Productos</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-200">
                        CUIDA TU PIEL CON LO MEJOR EN ESTÉTICA PROFESIONAL
                    </p>
                </div>

                {productos.length === 0 ? (
                    <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100 max-w-2xl mx-auto">
                        <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-6" />
                        <h2 className="text-xl font-black uppercase text-gray-400">Próximamente</h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Estamos actualizando nuestro catálogo de productos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {productos.map((producto, idx) => (
                            <div 
                                key={producto.id} 
                                className="bg-white p-8 rounded-[3.5rem] shadow-premium-soft border border-gray-100 space-y-6 group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 animate-in fade-in zoom-in-95"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="aspect-square bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-5xl group-hover:bg-black group-hover:text-white transition-all transform duration-500 overflow-hidden">
                                    {producto.imagenes && producto.imagenes[0] ? (
                                        <img src={producto.imagenes[0]} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <span className="opacity-40">✨</span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-tenant-accent">{producto.categoria || 'Skin Care'}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">{producto.marca}</span>
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-tight line-clamp-1">{producto.nombre}</h3>
                                    {producto.descripcion && <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest line-clamp-2 leading-relaxed">{producto.descripcion}</p>}
                                    <p className="text-2xl font-black text-gray-900 tracking-tighter">${producto.precio}</p>
                                </div>
                                <Button 
                                    className="w-full rounded-2xl h-14 bg-black text-white font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl"
                                    onClick={() => handleWhatsAppConsult(producto)}
                                >
                                    Consultar Stock
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <PublicFooter logoUrl={tenant.logo_url} />
        </div>
    );
}
