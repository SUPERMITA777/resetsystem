"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Trash2, Activity, Music, Loader2, Save } from "lucide-react";
import { FitnessTrack, uploadTrackFile, addFitnessTrack, getFitnessTracks, deleteFitnessTrack } from "@/lib/services/fitnessService";
import { analyze } from "web-audio-beat-detector";

export default function FitnessConfigPage() {
    const [tenantId, setTenantId] = useState("resetspa");
    const [tracks, setTracks] = useState<FitnessTrack[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [trackName, setTrackName] = useState("");
    const [detectedBpm, setDetectedBpm] = useState<number>(128);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const id = localStorage.getItem('currentTenant') || 'resetspa';
        setTenantId(id);
        fetchTracks(id);
    }, []);

    const fetchTracks = async (id: string) => {
        setIsLoading(true);
        try {
            const data = await getFitnessTracks(id);
            setTracks(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        // Default name without extension
        setTrackName(file.name.replace(/\.[^/.]+$/, ""));
        
        // Analyze BPM
        setIsAnalyzing(true);
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const tempo = await analyze(audioBuffer);
            setDetectedBpm(Math.round(tempo));
        } catch (error) {
            console.error("Error detecting BPM", error);
            // Fallback to default
            setDetectedBpm(128);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !trackName) return;

        setIsUploading(true);
        try {
            const url = await uploadTrackFile(selectedFile, tenantId);
            await addFitnessTrack({
                name: trackName,
                url: url,
                bpm: detectedBpm,
                tenantId: tenantId,
                createdAt: new Date()
            } as any);
            
            // alert("Track uploaded successfully!");
            setSelectedFile(null);
            setTrackName("");
            setDetectedBpm(128);
            if (document.getElementById('file-upload') as HTMLInputElement) {
                (document.getElementById('file-upload') as HTMLInputElement).value = "";
            }
            await fetchTracks(tenantId);
        } catch (error) {
            console.error(error);
            alert("Error uploading track.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (track: FitnessTrack) => {
        if (!confirm(`¿Estás seguro de eliminar el track "${track.name}"?`)) return;
        
        try {
            if (track.id) {
                await deleteFitnessTrack(track.id, track.url);
                await fetchTracks(tenantId);
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting track");
        }
    };

    return (
        <div className="min-h-screen bg-[#0e0e0e] text-white p-6 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto flex flex-col gap-10">
                {/* Header */}
                <header className="flex justify-between items-center bg-[#131313]/80 backdrop-blur-xl p-4 rounded-3xl border border-[#00F0FF]/10">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/fitness">
                            <button className="p-3 bg-[#1a1a1a] rounded-xl hover:bg-[#2a2a2a] transition-colors">
                                <ArrowLeft className="w-5 h-5 text-[#00F0FF]" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase text-[#00F0FF]">Fitness Tracks</h1>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">Configuración</p>
                        </div>
                    </div>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Add New Track */}
                    <section className="bg-[#131313] p-8 rounded-3xl border border-white/5 flex flex-col gap-6 h-fit">
                        <h2 className="font-black text-xl uppercase tracking-widest flex items-center gap-3">
                            <Upload className="w-5 h-5 text-[#00F0FF]" />
                            Subir Track
                        </h2>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">Archivo de Audio</label>
                                <input 
                                    id="file-upload"
                                    type="file" 
                                    accept="audio/*" 
                                    onChange={handleFileSelect}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:uppercase file:tracking-widest file:bg-[#00F0FF]/10 file:text-[#00F0FF] hover:file:bg-[#00F0FF]/20 transition-all cursor-pointer bg-[#1a1a1a] rounded-xl"
                                />
                            </div>

                            {selectedFile && (
                                <>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">Nombre del Track</label>
                                        <input 
                                            type="text" 
                                            value={trackName}
                                            onChange={e => setTrackName(e.target.value)}
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-[#00F0FF]/50 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">BPM (Detectado/Manual)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={detectedBpm}
                                                onChange={e => setDetectedBpm(Number(e.target.value))}
                                                disabled={isAnalyzing}
                                                className={`w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-[#00F0FF]/50 transition-colors ${isAnalyzing && 'opacity-50'}`}
                                            />
                                            {isAnalyzing && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[#00F0FF]">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-[10px] uppercase tracking-widest font-bold">Analizando...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleUpload}
                                        disabled={isUploading || isAnalyzing || !trackName}
                                        className="mt-4 w-full bg-[#00F0FF] text-black font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-[#00e0ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        {isUploading ? 'Subiendo...' : 'Guardar Track'}
                                    </button>
                                </>
                            )}
                        </div>
                    </section>

                    {/* Existing Tracks */}
                    <section className="bg-[#131313] p-8 rounded-3xl border border-white/5 flex flex-col gap-6">
                        <h2 className="font-black text-xl uppercase tracking-widest flex items-center gap-3">
                            <Music className="w-5 h-5 text-[#00F0FF]" />
                            Tracks Existentes
                        </h2>

                        {isLoading ? (
                            <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-[#00F0FF]" /></div>
                        ) : tracks.length === 0 ? (
                            <div className="text-center p-10 text-gray-500 text-sm font-bold uppercase tracking-widest">No hay tracks subidos</div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {tracks.map(track => (
                                    <div key={track.id} className="flex items-center justify-between bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 group hover:border-[#00F0FF]/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-black rounded-xl">
                                                <Activity className="w-4 h-4 text-[#00F0FF]" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{track.name}</p>
                                                <p className="font-mono text-[10px] text-[#00F0FF] tracking-widest uppercase mt-1">{track.bpm} BPM</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(track)}
                                            className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-50 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}
