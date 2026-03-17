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
import Image from "next/image";

interface LogoUploaderProps {
    tenantId: string;
    currentLogo?: string;
    onLogoChange: (url: string) => void;
}

export function LogoUploader({ tenantId, currentLogo, onLogoChange }: LogoUploaderProps) {
    const [logo, setLogo] = useState<string | undefined>(currentLogo);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            toast.error("El archivo no es una imagen");
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit for logo
            toast.error("El logo es muy pesado (máx 2MB)");
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            const timestamp = Date.now();
            const storageRef = ref(storage, `tenants/${tenantId}/brand/logo_${timestamp}_${file.name}`);
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
                        setLogo(downloadURL);
                        onLogoChange(downloadURL);
                        resolve();
                    }
                );
            });

            toast.success("Logo actualizado correctamente");
        } catch (error) {
            console.error("Error uploading logo:", error);
            toast.error("Error al subir el logo");
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const handleRemove = () => {
        setLogo(undefined);
        onLogoChange("");
    };

    return (
        <div className="space-y-4">
            <div 
                className={`relative group aspect-video rounded-2xl overflow-hidden border-2 border-dashed transition-all flex items-center justify-center p-4 ${uploading ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 hover:border-black cursor-pointer'}`}
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
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Subiendo {progress}%</p>
                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-black transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : logo ? (
                    <>
                        <Image
                            src={logo}
                            alt="Logo preview"
                            fill
                            className="object-contain p-8"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                    className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-xl"
                                >
                                    <UploadCloud className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove();
                                    }}
                                    className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-xl"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-300" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Subir Logo</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Preferiblemente PNG transparente</p>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-[10px] text-gray-400 italic text-center">Recomendado: 400x200px o similar.</p>
        </div>
    );
}
