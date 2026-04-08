"use client";

import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, Edit2, Trash2, ShoppingBag, Tag, TrendingDown } from "lucide-react";
import { productService, Producto } from "@/lib/services/productService";
import { ProductoModal } from "@/components/admin/products/ProductoModal";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";

export default function ProductosPage() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

    const currentTenant = typeof window !== "undefined"
        ? localStorage.getItem("currentTenant") || "resetspa"
        : "resetspa";

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await productService.getProductos(currentTenant);
            const sorted = [...data].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setProductos(sorted);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar productos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant]);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este producto?")) return;
        const t = toast.loading("Eliminando...");
        try {
            await productService.deleteProducto(currentTenant, id);
            toast.success("Producto eliminado", { id: t });
            loadData();
        } catch (err: any) {
            toast.error(`Error: ${err.message}`, { id: t });
        }
    };

    const handleEdit = (producto: Producto) => {
        setSelectedProducto(producto);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setSelectedProducto(null);
        setIsModalOpen(true);
    };

    // Calculate margin percentage
    const getMargen = (p: Producto) => {
        if (!p.precio || !p.precio_costo) return null;
        return Math.round(((p.precio - p.precio_costo) / p.precio) * 100);
    };

    return (
        <>
            <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
                <Toaster />

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-montserrat uppercase">
                            Productos
                        </h1>
                        <p className="text-gray-500 mt-1">Gestiona el stock de productos del salón.</p>
                    </div>
                    <Button
                        onClick={handleNew}
                        className="bg-black text-white hover:bg-gray-800 rounded-2xl px-6 font-bold shadow-xl transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nuevo Producto
                    </Button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-3xl bg-gray-100 animate-pulse h-72" />
                        ))}
                    </div>
                ) : productos.length === 0 ? (
                    <Card className="p-16 flex flex-col items-center gap-4 text-center border-none shadow-premium-soft">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-gray-300" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">Sin productos</p>
                            <p className="text-sm text-gray-400 mt-1">Agregá tu primer producto con el botón de arriba.</p>
                        </div>
                        <Button
                            onClick={handleNew}
                            className="bg-black text-white hover:bg-gray-800 rounded-xl px-5 font-bold mt-2 active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Nuevo Producto
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {productos.map((p) => {
                            const margen = getMargen(p);
                            const mainImg = p.imagenes?.[0];
                            return (
                                <div
                                    key={p.id}
                                    className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                                >
                                    {/* Image */}
                                    <div className="relative h-52 bg-gray-50 flex items-center justify-center overflow-hidden">
                                        {mainImg ? (
                                            <Image
                                                src={mainImg}
                                                alt={p.nombre}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <ShoppingBag className="w-12 h-12 text-gray-200" />
                                        )}

                                        {/* Action buttons (overlay) */}
                                        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(p)}
                                                className="p-2 bg-white text-gray-600 hover:text-blue-500 rounded-xl shadow-lg hover:shadow-xl transition-all"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                className="p-2 bg-white text-gray-600 hover:text-red-500 rounded-xl shadow-lg hover:shadow-xl transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Extra images count */}
                                        {p.imagenes && p.imagenes.length > 1 && (
                                            <span className="absolute bottom-2.5 right-2.5 text-[9px] font-black bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                                                +{p.imagenes.length - 1}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 flex flex-col gap-2 flex-1">
                                        <div>
                                            {p.categoria && (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md mb-1.5">
                                                    <Tag className="w-2.5 h-2.5" />
                                                    {p.categoria}
                                                </span>
                                            )}
                                            <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">{p.nombre}</h3>
                                            {p.marca && (
                                                <p className="text-xs text-gray-400 font-medium mt-0.5">{p.marca}</p>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-2 border-t border-gray-50 flex items-end justify-between">
                                            <div>
                                                <p className="text-xl font-black text-gray-900">
                                                    ${p.precio?.toLocaleString("es-AR")}
                                                </p>
                                                {p.precio_costo > 0 && (
                                                    <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                        <TrendingDown className="w-3 h-3" />
                                                        Costo: ${p.precio_costo?.toLocaleString("es-AR")}
                                                    </p>
                                                )}
                                            </div>
                                            {margen !== null && (
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${margen >= 30 ? "bg-emerald-50 text-emerald-600" : margen >= 10 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}`}>
                                                    {margen}% margen
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <ProductoModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={loadData}
                    producto={selectedProducto}
                    tenantId={currentTenant}
                />
            )}
        </>
    );
}
