"use client";

import React, { useState, useRef, useEffect } from "react";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { X, UploadCloud, Loader2, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Producto, productService } from "@/lib/services/productService";
import toast from "react-hot-toast";
import Image from "next/image";

interface ProductoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    producto: Producto | null;
    tenantId: string;
}

const MAX_IMAGES = 5;

export function ProductoModal({ isOpen, onClose, onSave, producto, tenantId }: ProductoModalProps) {
    const [form, setForm] = useState({
        nombre: "",
        marca: "",
        categoria: "",
        descripcion: "",
        precio: "",
        precio_costo: "",
    });
    const [imagenes, setImagenes] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "Enter" && !saving) {
                if (e.target instanceof HTMLTextAreaElement) return;
                e.preventDefault();
                formRef.current?.requestSubmit();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, saving]);

    useEffect(() => {
        if (producto) {
            setForm({
                nombre: producto.nombre || "",
                marca: producto.marca || "",
                categoria: producto.categoria || "",
                descripcion: producto.descripcion || "",
                precio: String(producto.precio ?? ""),
                precio_costo: String(producto.precio_costo ?? ""),
            });
            setImagenes(producto.imagenes || []);
        } else {
            setForm({ nombre: "", marca: "", categoria: "", descripcion: "", precio: "", precio_costo: "" });
            setImagenes([]);
        }
    }, [producto]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        if (imagenes.length + files.length > MAX_IMAGES) {
            toast.error(`Máximo ${MAX_IMAGES} fotos por producto`);
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const urls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith("image/")) { toast.error("Solo se permiten imágenes"); continue; }
                if (file.size > 5 * 1024 * 1024) { toast.error("Imagen muy grande (máx 5 MB)"); continue; }

                const timestamp = Date.now();
                const path = `tenants/${tenantId}/productos/${timestamp}_${file.name}`;
                const sRef = storageRef(storage, path);
                const task = uploadBytesResumable(sRef, file);

                const url = await new Promise<string>((resolve, reject) => {
                    task.on(
                        "state_changed",
                        (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
                        reject,
                        async () => resolve(await getDownloadURL(task.snapshot.ref))
                    );
                });
                urls.push(url);
                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }
            setImagenes(prev => [...prev, ...urls]);
            toast.success(`${urls.length} foto(s) subida(s)`);
        } catch (err) {
            console.error(err);
            toast.error("Error al subir imagen");
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeImage = (idx: number) => {
        setImagenes(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
        setSaving(true);
        const loadingToast = toast.loading(producto ? "Guardando cambios..." : "Creando producto...");
        try {
            const data = {
                nombre: form.nombre.trim(),
                marca: form.marca.trim(),
                categoria: form.categoria.trim(),
                descripcion: form.descripcion.trim(),
                precio: parseFloat(form.precio) || 0,
                precio_costo: parseFloat(form.precio_costo) || 0,
                imagenes,
            };
            if (producto) {
                await productService.updateProducto(tenantId, producto.id, data);
                toast.success("Producto actualizado", { id: loadingToast });
            } else {
                await productService.createProducto(tenantId, data);
                toast.success("Producto creado", { id: loadingToast });
            }
            onSave();
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error(`Error: ${err.message || "desconocido"}`, { id: loadingToast });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight uppercase font-montserrat">
                            {producto ? "Editar Producto" : "Nuevo Producto"}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">Completá los datos del producto</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-black transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Row: Nombre + Marca */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Nombre *</label>
                            <input
                                name="nombre"
                                value={form.nombre}
                                onChange={handleChange}
                                placeholder="Ej: Crema Hidratante"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Marca</label>
                            <input
                                name="marca"
                                value={form.marca}
                                onChange={handleChange}
                                placeholder="Ej: L'Oréal"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                            />
                        </div>
                    </div>

                    {/* Categoría */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Categoría</label>
                        <input
                            name="categoria"
                            value={form.categoria}
                            onChange={handleChange}
                            placeholder="Ej: Skincare, Capilar, Maquillaje..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Descripción</label>
                        <textarea
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            placeholder="Descripción del producto..."
                            rows={3}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors resize-none"
                        />
                    </div>

                    {/* Row: Precios */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Precio de Venta</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                                <input
                                    name="precio"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.precio}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Precio de Costo</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                                <input
                                    name="precio_costo"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.precio_costo}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fotos */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                Fotos ({imagenes.length}/{MAX_IMAGES})
                            </label>
                            {imagenes.length < MAX_IMAGES && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex items-center gap-1.5 text-xs font-bold text-black border border-gray-200 hover:border-black rounded-lg px-3 py-1.5 transition-all disabled:opacity-50"
                                >
                                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                                    {uploading ? `Subiendo ${uploadProgress}%` : "Agregar foto"}
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </div>

                        {imagenes.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3">
                                {imagenes.map((url, idx) => (
                                    <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                                        <Image src={url} alt={`Foto ${idx + 1}`} fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {idx === 0 && (
                                            <span className="absolute bottom-1.5 left-1.5 text-[8px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.5 rounded-md">
                                                Principal
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-full border-2 border-dashed border-gray-200 hover:border-black rounded-2xl p-8 flex flex-col items-center gap-2 transition-all text-center disabled:opacity-50"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-gray-300" />
                                </div>
                                <p className="text-sm font-bold text-gray-400">Agregar fotos del producto</p>
                                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Máx 5 fotos · 5 MB c/u</p>
                            </button>
                        )}
                    </div>

                    {/* Footer buttons */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving || uploading}
                            className="bg-black text-white hover:bg-gray-800 rounded-xl px-6 font-bold"
                        >
                            {saving ? "Guardando..." : producto ? "Guardar cambios" : "Crear producto"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
