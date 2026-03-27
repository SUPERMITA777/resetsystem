"use client";

import React, { useState, useRef } from "react";
import { storage } from "@/lib/firebase";
import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from "firebase/storage";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

interface GenericImageUploaderProps {
    tenantId: string;
    currentImage?: string;
    onImageChange: (url: string) => void;
    label?: string;
    folder?: string;
    aspectRatio?: "video" | "square" | "portrait";
}

export function GenericImageUploader({ 
    tenantId, 
    currentImage, 
    onImageChange, 
    label = "imagen",
    folder = "brand",
    aspectRatio = "video"
}: GenericImageUploaderProps) {
    const [image, setImage] = useState<string | undefined>(currentImage);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("El archivo no es una imagen");
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("La imagen es muy pesada (máx 5MB)");
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            const timestamp = Date.now();
            const storageRef = ref(storage, `tenants/${tenantId}/${folder}/img_${timestamp}_${file.name}`);
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
                        setImage(downloadURL);
                        onImageChange(downloadURL);
                        resolve();
                    }
                );
            });

            toast.success(`Imagen de ${label} actualizada`);
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Error al subir la imagen");
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImage(undefined);
        onImageChange("");
    };

    const aspectRatioClasses = {
        video: "aspect-video",
        square: "aspect-square",
        portrait: "aspect-[3/4]"
    };

    return (
        <div className="space-y-2">
            <div 
                className={`relative group ${aspectRatioClasses[aspectRatio]} rounded-2xl overflow-hidden border-2 border-dashed transition-all flex items-center justify-center p-2 ${uploading ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 hover:border-black cursor-pointer'}`}
                onClick={() => !uploading && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={uploading}
                />
                
                {uploading ? (
                    <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-black h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{progress}% subiendo</span>
                    </div>
                ) : image ? (
                    <>
                        <img 
                            src={image} 
                            alt={label}
                            className="w-full h-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button className="p-3 bg-white rounded-xl text-black shadow-lg hover:scale-110 transition-transform">
                                <UploadCloud className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={handleRemove}
                                className="p-3 bg-red-500 rounded-xl text-white shadow-lg hover:scale-110 transition-transform"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-black transition-colors">
                        <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-gray-100 transition-colors">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Subir {label}</span>
                    </div>
                )}
            </div>
        </div>
    );
}