"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { clienteService } from "@/lib/services/clienteService";
import { X, Upload, Download, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from 'xlsx';

interface ImportarClientesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportFinished: () => void;
    tenantId: string;
}

export function ImportarClientesModal({ isOpen, onClose, onImportFinished, tenantId }: ImportarClientesModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape" && !isUploading) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, isUploading]);

    if (!isOpen) return null;

    const handleDownloadSample = () => {
        const sampleData = [
            {
                Nombre: "Juan",
                Apellido: "Perez",
                Telefono: "5491122334455",
                Email: "juan@example.com",
                Notas: "Cliente frecuente"
            },
            {
                Nombre: "Maria",
                Apellido: "Gomez",
                Telefono: "5491155443322",
                Email: "",
                Notas: ""
            }
        ];
        
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        
        // Formatear el ancho de las columnas
        worksheet["!cols"] = [
            { wpx: 100 }, // Nombre
            { wpx: 100 }, // Apellido
            { wpx: 120 }, // Telefono
            { wpx: 150 }, // Email
            { wpx: 200 }  // Notas
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
        
        XLSX.writeFile(workbook, "clientes_ejemplo_resetsystem.xlsx");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const loadingToast = toast.loading("Importando clientes...");

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

            let importedCount = 0;
            let errorCount = 0;

            for (const row of jsonData) {
                try {
                    // Mapeo flexible de columnas
                    const nombre = row["Nombre"] || row["nombre"] || "";
                    const apellido = row["Apellido"] || row["apellido"] || "";
                    const telefono = row["Telefono"] || row["Teléfono"] || row["telefono"] || "";
                    const email = row["Email"] || row["email"] || row["Correo"] || "";
                    const notas = row["Notas"] || row["notas"] || "";

                    if (!nombre || !apellido || !telefono) {
                        errorCount++;
                        continue; 
                    }

                    const existing = await clienteService.getClienteByTelefono(tenantId, telefono.toString());
                    if (!existing) {
                        await clienteService.createCliente(tenantId, {
                            nombre: String(nombre).trim(),
                            apellido: String(apellido).trim(),
                            telefono: String(telefono).trim(),
                            email: email ? String(email).trim() : undefined,
                            notas: notas ? String(notas).trim() : undefined,
                            tenantId: tenantId
                        });
                        importedCount++;
                    } else {
                        errorCount++; 
                    }
                } catch (err) {
                    console.error("Error importing row:", row, err);
                    errorCount++;
                }
            }

            toast.success(`Importación finalizada. ${importedCount} importados, ${errorCount} omitidos/errores.`, { id: loadingToast, duration: 5000 });
            onImportFinished();
            onClose();
        } catch (error: any) {
             console.error("Error al leer el archivo:", error);
             toast.error("Error al procesar el archivo Excel.", { id: loadingToast });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                            Importar Clientes
                        </h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Desde archivo Excel (.xlsx)</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm" disabled={isUploading}>
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-[1.5rem] p-5">
                        <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4" /> 1. Descarga la plantilla
                        </h3>
                        <p className="text-xs text-blue-700/80 mb-4 leading-relaxed">
                            Para evitar errores, descarga el archivo de ejemplo y completa tus datos siguiendo el mismo formato de columnas. 
                            <strong> Nombre, Apellido y Teléfono son obligatorios.</strong>
                        </p>
                        <Button 
                            onClick={handleDownloadSample}
                            variant="outline"
                            className="w-full bg-white border-blue-200 text-blue-600 hover:bg-blue-50 font-bold rounded-xl h-12"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar Ejemplo
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Upload className="w-4 h-4" /> 2. Sube tu archivo
                        </h3>
                        <p className="text-xs text-gray-500">
                            Una vez que tengas tu archivo .xlsx listo, súbelo aquí. Los clientes que ya existan con el mismo WhatsApp serán omitidos.
                        </p>
                        
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                        
                        <Button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full bg-gray-900 text-white hover:bg-black h-14 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
                        >
                            <FileSpreadsheet className="w-5 h-5" />
                            {isUploading ? "Procesando..." : "Seleccionar Excel..."}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
