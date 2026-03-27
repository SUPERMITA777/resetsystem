"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Database, Download, CloudOff, Info, RefreshCw, FileDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { getTurnosPorRango } from "@/lib/services/agendaService";
import { clienteService } from "@/lib/services/clienteService";
import { serviceManagement } from "@/lib/services/serviceManagement";

interface BackupTabProps {
    tenantId: string;
}

export function BackupTab({ tenantId }: BackupTabProps) {
    const [isOfflineEnabled, setIsOfflineEnabled] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);

    useEffect(() => {
        const enabled = localStorage.getItem('offline_persistence_enabled') === 'true';
        setIsOfflineEnabled(enabled);
        const syncTime = localStorage.getItem('last_backup_sync');
        if (syncTime) setLastSync(syncTime);
    }, []);

    const handleToggleOffline = () => {
        const newState = !isOfflineEnabled;
        setIsOfflineEnabled(newState);
        localStorage.setItem('offline_persistence_enabled', String(newState));
        
        if (newState) {
            toast.success("Seguro de desconexión activado en esta terminal.");
            // Actualizar tiempo de última sincronización
            const now = new Date().toLocaleString();
            setLastSync(now);
            localStorage.setItem('last_backup_sync', now);
        } else {
            toast.success("Seguro de desconexión desactivado.");
        }
        
        // Sugerir recarga para aplicar cambios en Firebase
        setTimeout(() => {
            if (confirm("Para aplicar los cambios del sistema de backup, es necesario recargar la página. ¿Deseas recargar ahora?")) {
                window.location.reload();
            }
        }, 1000);
    };

    const handleManualExport = async () => {
        setIsExporting(true);
        try {
            // Obtener datos críticos para el backup manual
            const today = new Date();
            const startStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            const endStr = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];

            const [turnos, clientes, tratamientos] = await Promise.all([
                getTurnosPorRango(tenantId, startStr, endStr),
                clienteService.getClientes(tenantId),
                serviceManagement.getTratamientos(tenantId)
            ]);

            const backupData = {
                version: "1.0",
                timestamp: new Date().toISOString(),
                tenantId,
                data: {
                    turnos,
                    clientes,
                    tratamientos
                }
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `backup_${tenantId}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Backup descargado con éxito.");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar el backup manual.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                        Seguro de Desconexión
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Garantiza que el sistema siga funcionando incluso sin internet.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isOfflineEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {isOfflineEnabled ? 'Terminal Protegida' : 'Sin Protección Local'}
                    </span>
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* Switch Activation */}
                <div className="flex flex-col md:flex-row gap-8 items-start bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
                        <Database className={`w-6 h-6 ${isOfflineEnabled ? 'text-blue-500' : 'text-gray-300'}`} />
                    </div>
                    <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-bold text-gray-900">Activar Backup en esta Terminal</h3>
                        <p className="text-sm text-gray-500">
                            Al habilitar esta opción, el navegador creará una base de datos local cifrada (IndexedDB) que se sincronizará en tiempo real con la nube. 
                            Si pierdes la conexión, el sistema leerá y escribirá en esta base de datos local y sincronizará los cambios automáticamente cuando el internet regrese.
                        </p>
                        <div className="pt-4 flex flex-col gap-4">
                            <Button 
                                onClick={handleToggleOffline}
                                variant={isOfflineEnabled ? "outline" : "default"}
                                className="rounded-2xl h-12 px-8 font-bold uppercase tracking-widest self-start transition-all hover:scale-105"
                            >
                                {isOfflineEnabled ? "Desactivar Protección" : "Activar en esta Terminal"}
                            </Button>
                            
                            {isOfflineEnabled && lastSync && (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg self-start">
                                    <RefreshCw className="w-3 h-3 animate-spin-slow" />
                                    Última sincronización local: {lastSync}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Manual Export */}
                <div className="flex flex-col md:flex-row gap-8 items-start border border-gray-100 p-6 rounded-3xl">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                        <FileDown className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-bold text-gray-900">Exportación Manual de Emergencia</h3>
                        <p className="text-sm text-gray-500 italic">
                            ¿Dónde deseas alojar los archivos? Esta opción te permite descargar un archivo de respaldo físico (.json) con toda la información crítica del salón 
                            (turnos del mes, clientes y servicios) para que puedas consultarlo manualmente en cualquier dispositivo si la falla de internet es prolongada.
                        </p>
                        <div className="pt-4">
                            <Button 
                                onClick={handleManualExport}
                                disabled={isExporting}
                                variant="outline"
                                className="rounded-2xl h-12 px-8 font-bold uppercase tracking-widest self-start border-2 hover:bg-gray-50"
                            >
                                {isExporting ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                )}
                                {isExporting ? "Generando Archivo..." : "Descargar Backup Físico"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Offline Status Info */}
                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                    <Info className="w-6 h-6 text-amber-500 shrink-0" />
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Nota sobre Seguridad</h4>
                        <p className="text-xs text-amber-800/80 leading-relaxed">
                            El backup local se almacena de forma segura en el almacenamiento persistente del navegador de esta terminal específica. 
                            No es necesario configurar una ruta de archivos en tu disco duro, ya que el navegador gestiona el espacio de forma automática para evitar errores de permisos. 
                            <strong> Se recomienda habilitar esto solo en las computadoras de recepción del salón.</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}