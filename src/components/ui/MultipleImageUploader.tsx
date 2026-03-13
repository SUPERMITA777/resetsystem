"use client";

import React, { useState, useRef } from "react";
import { storage } from "@/lib/firebase";
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

interface MultipleImageUploaderProps {
    tenantId: string;
    existingImages?: string[];
    onImagesChange: (urls: string[]) => void;
}

export function MultipleImageUploader({ tenantId, existingImages = [], onImagesChange }: MultipleImageUploaderProps) {
    const [images, setImages] = useState<string[]>(existingImages);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);
        setProgress(0);

        try {
            const uploadedUrls: string[] = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // Basic validation
                if (!file.type.startsWith("image/")) {
                    toast.error(`El archivo ${file.name} no es una imagen`);
                    continue;
                }
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    toast.error(`La imagen ${file.name} es muy pesada (máx 5MB)`);
                    continue;
                }

                const timestamp = Date.now();
                const storageRef = ref(storage, `tenants/${tenantId}/services_images/${timestamp}_${file.name}`);
                const uploadTask = uploadBytesResumable(storageRef, file);

                await new Promise<void>((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setProgress(Math.round(p));
                        },
                        (error) => {
                            console.error("Upload error:", error);
                            reject(error);
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            uploadedUrls.push(downloadURL);
                            resolve();
                        }
                    );
                });
            }

            const newImages = [...images, ...uploadedUrls];
            setImages(newImages);
            onImagesChange(newImages);
            toast.success("Imágenes subidas correctamente");
            
            // Clear input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
            console.error("Error uploading images:", error);
            toast.error("Error al subir las imágenes");
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const handleRemoveImage = async (indexToRemove: number, urlToRemove: string) => {
        try {
            // Optional: Remove from Firebase Storage if it's a firebase URL
            // It might be better to just leave it or handle cleanup somewhere else if the form is cancelled, 
            // but for simplicity we'll just remove it from the array here.
            
            const newImages = images.filter((_, i) => i !== indexToRemove);
            setImages(newImages);
            onImagesChange(newImages);
        } catch (error) {
            console.error("Error removing image:", error);
            toast.error("Error al remover la imagen");
        }
    };

    return (
        <div className="space-y-4">
            <div 
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${uploading ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-black cursor-pointer'}`}
                onClick={() => !uploading && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={uploading}
                />
                
                <div className="flex flex-col items-center gap-3">
                    {uploading ? (
                        <>
                            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                            <div className="w-full max-w-xs space-y-2">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Subiendo... {progress}%</p>
                                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-black transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                                <UploadCloud className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">Haz clic para subir fotos</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">PNG, JPG hasta 5MB</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                            <Image
                                src={url}
                                alt={`Uploaded image ${idx + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveImage(idx, url);
                                    }}
                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg transform scale-90 group-hover:scale-100"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
