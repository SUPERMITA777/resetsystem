"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTenant, TenantData } from "@/lib/services/tenantService";
import { Producto, productService } from "@/lib/services/productService";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, MessageCircle, ChevronLeft, MapPin, Instagram } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PublicNavbar } from "@/components/layout/public/Navbar";
import { PublicFooter } from "@/components/layout/public/Footer";
import Link from "next/link";

export default function PublicProductsPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        
        console.log("Iniciando listener para productos del salón:", slug);
        const unsubscribe = onSnapshot(doc(db, "tenants", slug), (docSnap) => {
            if (docSnap.exists()) {
                const tenantData = docSnap.data() as TenantData;
                setTenant(tenantData);
                
                // Fetch products
                productService.getProductos(slug).then(data => {
                    setProductos(data);
                });
            }
            setLoading(false);
        }, (error) => {
            console.error("Error en onSnapshot (tenant):", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#faf9f9] flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-[#D4A5B2] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!tenant) return <div className="p-20 text-center font-black uppercase tracking-widest text-gray-400">Salón no encontrado</div>;

    const config = tenant.web_config || {};
    const primary = config.primary_color || '#7b5460';
    const accent = config.accent_color || '#D4A5B2';
    const secondary = config.secondary_color || '#faf9f9';
    const font = config.font_family || 'sans';
    const bgImage = config.background_image_url;

    const customStyles = `
        :root {
            --tenant-primary: ${primary};
            --tenant-accent: ${accent};
            --tenant-secondary: ${secondary};
        }
        .tenant-font { 
            font-family: ${
                font === 'serif' ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' : 
                font === 'mono' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' : 
                font === 'display' ? '"Playfair Display", serif' :
                font === 'elegant' ? '"Montserrat", sans-serif' :
                'inherit'
            }; 
            ${font === 'elegant' ? 'letter-spacing: 0.05em;' : ''}
        }
        ${bgImage ? `
        .tenant-bg-image {
            background-image: url('${bgImage}');
            background-attachment: fixed;
            background-size: cover;
            background-position: center;
        }
        ` : ''}
    `;

    return (
        <div className={`min-h-screen bg-tenant-secondary flex flex-col tenant-font ${bgImage ? 'tenant-bg-image' : ''}`}>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            <PublicNavbar 
                salonName={tenant.nombre_salon} 
                logoUrl={tenant.logo_url} 
                slug={slug}
            />

            <main className="flex-1 max-w-5xl w-full mx-auto px-6 pt-24 pb-20">
                <div className="mb-12 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-premium-soft border border-tenant-accent/30">
                        <ShoppingBag className="w-10 h-10 text-tenant-accent" />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tight text-tenant-primary mb-2 leading-none">
                        Nuestros Productos
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                        Calidad profesional para cuidar tu bienestar en casa
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {productos.length > 0 ? (
                        productos.map((producto) => (
                            <div key={producto.id} className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-premium-soft border border-white/20 transition-all duration-500 hover:scale-[1.02]">
                                <div className="relative aspect-square overflow-hidden">
                                    {producto.imagenes && producto.imagenes.length > 0 ? (
                                        <img 
                                            src={producto.imagenes[0]} 
                                            alt={producto.nombre} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-tenant-secondary flex items-center justify-center">
                                            <ShoppingBag className="w-12 h-12 text-tenant-accent/20" />
                                        </div>
                                    )}
                                    <div className="absolute top-6 right-6">
                                        <div className="bg-white/90 backdrop-blur-md rounded-full px-4 py-2 font-black text-xs text-tenant-primary shadow-sm border border-black/5">
                                            ${producto.precio}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 space-y-4">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-tenant-accent mb-1">{producto.categoria}</p>
                                        <h3 className="text-xl font-black text-tenant-primary uppercase tracking-tight leading-none">{producto.nombre}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{producto.marca}</p>
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed">
                                        {producto.descripcion}
                                    </p>
                                    <Button 
                                        className="w-full h-14 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest gap-2"
                                        onClick={() => {
                                            const message = `¡Hola! Me interesa el producto: ${producto.nombre} de ${producto.marca}. ¿Tienen stock?`;
                                            const encodedMessage = encodeURIComponent(message);
                                            window.open(`https://wa.me/${tenant.datos_contacto?.whatsapp?.replace(/\D/g, '') || ''}?text=${encodedMessage}`, '_blank');
                                        }}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Consultar Stock
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center opacity-30">
                            <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-black uppercase tracking-widest text-lg">Próximamente publicaremos nuestros productos</p>
                        </div>
                    )}
                </div>

                <footer className="mt-20 pt-10 border-t border-tenant-accent/20 text-center space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Reset System Experience</p>
                    <div className="flex justify-center gap-6">
                        {tenant.datos_contacto?.instagram && (
                            <a href={`https://instagram.com/${tenant.datos_contacto.instagram.replace('@','')}`} target="_blank" className="text-tenant-accent hover:scale-110 transition-transform">
                                <Instagram className="w-6 h-6" />
                            </a>
                        )}
                        {tenant.datos_contacto?.direccion && (
                            <a href={`https://maps.google.com/?q=${tenant.datos_contacto.direccion}`} target="_blank" className="text-tenant-accent hover:scale-110 transition-transform">
                                <MapPin className="w-6 h-6" />
                            </a>
                        )}
                    </div>
                </footer>
            </main>
            <PublicFooter logoUrl={tenant.logo_url} />
        </div>
    );
}
