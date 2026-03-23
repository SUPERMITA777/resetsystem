"use client";

import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { Play, Pause, RefreshCcw, Settings, Activity, Music, Loader2, ArrowLeft, Cloud, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { FitnessTrack, getFitnessTracks } from "@/lib/services/fitnessService";

export default function FitnessSystemPage() {
    const [tenantId, setTenantId] = useState("resetspa");
    const [tracks, setTracks] = useState<FitnessTrack[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<FitnessTrack | null>(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoadingTrack, setIsLoadingTrack] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const [baseBPM, setBaseBPM] = useState(128);
    const [targetBPM, setTargetBPM] = useState(128);
    const [timeFormatted, setTimeFormatted] = useState("00:00:00");
    const [activeLoop, setActiveLoop] = useState<number | null>(null); // 4 or 8
    const [toneStarted, setToneStarted] = useState(false);

    const playerRef = useRef<Tone.GrainPlayer | null>(null);
    const pulseOverlayRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);
    const bufferTimeMsRef = useRef<number>(0);
    const pulseIntervalRef = useRef<number | null>(null);

    // Initial load
    useEffect(() => {
        const id = localStorage.getItem('currentTenant') || 'resetspa';
        setTenantId(id);
        fetchTracks(id);
    }, []);

    const fetchTracks = async (id: string) => {
        try {
            const data = await getFitnessTracks(id);
            setTracks(data);
        } catch (error) {
            console.error("Error fetching tracks", error);
        }
    };

    // Audio load
    const handleTrackSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const trackId = e.target.value;
        if (!trackId) return;

        const track = tracks.find(t => t.id === trackId);
        if (!track) return;

        setSelectedTrack(track);
        setIsLoaded(false);
        setIsLoadingTrack(true);
        setIsPlaying(false);
        
        if (playerRef.current) {
            playerRef.current.dispose();
            playerRef.current = null;
        }

        if (!toneStarted) {
            await Tone.start();
            setToneStarted(true);
        }

        try {
            const player = new Tone.GrainPlayer({
                url: track.url,
                onload: () => {
                    setIsLoaded(true);
                    setIsLoadingTrack(false);
                    setBaseBPM(track.bpm);
                    setTargetBPM(track.bpm);
                    
                    bufferTimeMsRef.current = 0;
                    setTimeFormatted("00:00:00");
                    setActiveLoop(null);
                }
            }).toDestination();
            
            player.loop = false;
            playerRef.current = player;
        } catch (error) {
            console.error("CORS or Loading Error", error);
            setIsLoadingTrack(false);
            alert("Error loading track. It might be a CORS issue from Storage.");
        }
    };

    // BPM Sync
    useEffect(() => {
        if (playerRef.current && baseBPM > 0) {
            playerRef.current.playbackRate = targetBPM / baseBPM;
        }

        if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
        if (isPlaying && targetBPM > 0) {
            const intervalMs = 60000 / targetBPM;
            pulseIntervalRef.current = window.setInterval(() => {
                const overlay = pulseOverlayRef.current;
                if (overlay) {
                    overlay.style.transition = "none";
                    overlay.style.opacity = "0.4";
                    setTimeout(() => {
                        overlay.style.transition = `opacity ${intervalMs * 0.8}ms ease-out`;
                        overlay.style.opacity = "0";
                    }, 50);
                }
            }, intervalMs);
        }

        return () => {
            if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
        };
    }, [targetBPM, baseBPM, isPlaying]);

    // Loop actions (4 or 8 beats)
    const triggerLoop = (beats: number) => {
        if (!playerRef.current || !isPlaying || baseBPM === 0) return;
        
        if (activeLoop === beats) {
            playerRef.current.loop = false;
            setActiveLoop(null);
        } else {
            const beatDurationInSecs = 60 / baseBPM;
            const loopDuration = beats * beatDurationInSecs;
            const currentPositionInSecs = bufferTimeMsRef.current / 1000;
            
            playerRef.current.loopStart = currentPositionInSecs;
            playerRef.current.loopEnd = currentPositionInSecs + loopDuration;
            playerRef.current.loop = true;
            
            setActiveLoop(beats);
        }
    };

    // Stopwatch and playback
    useEffect(() => {
        const updateTimer = (time: number) => {
            if (!isPlaying) return;
            
            const delta = time - lastFrameTimeRef.current;
            lastFrameTimeRef.current = time;
            
            const playbackRate = baseBPM > 0 ? (targetBPM / baseBPM) : 1;
            bufferTimeMsRef.current += delta * playbackRate;
            
            if (playerRef.current && playerRef.current.loop) {
                const loopEndMs = Number(playerRef.current.loopEnd) * 1000;
                const loopStartMs = Number(playerRef.current.loopStart) * 1000;
                if (bufferTimeMsRef.current >= loopEndMs) {
                    bufferTimeMsRef.current = loopStartMs + (bufferTimeMsRef.current - loopEndMs);
                }
            }
            
            const totalMs = bufferTimeMsRef.current;
            const mins = Math.floor(totalMs / 60000);
            const secs = Math.floor((totalMs % 60000) / 1000);
            const cs = Math.floor((totalMs % 1000) / 10);

            setTimeFormatted(
                `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${cs.toString().padStart(2, '0')}`
            );

            timerRef.current = requestAnimationFrame(updateTimer);
        };

        if (isPlaying) {
            lastFrameTimeRef.current = performance.now();
            timerRef.current = requestAnimationFrame(updateTimer);
            if (playerRef.current && playerRef.current.state !== 'started') {
                playerRef.current.start(0, bufferTimeMsRef.current / 1000);
            }
        } else {
            if (timerRef.current) cancelAnimationFrame(timerRef.current);
            if (playerRef.current && playerRef.current.state === 'started') {
                playerRef.current.stop();
            }
        }

        return () => {
            if (timerRef.current) cancelAnimationFrame(timerRef.current);
        };
    }, [isPlaying, baseBPM, targetBPM]);

    const handlePlayPause = async () => {
        if (!isLoaded) return;
        
        if (!toneStarted || Tone.context.state !== "running") {
            await Tone.start();
            setToneStarted(true);
        }
        
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setIsPlaying(false);
        bufferTimeMsRef.current = 0;
        setTimeFormatted("00:00:00");
        setActiveLoop(null);
        if (playerRef.current) {
            playerRef.current.stop();
            playerRef.current.loop = false;
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0e0e0e] text-white font-sans overflow-hidden flex flex-col items-center p-2 sm:p-4 pb-6 sm:pb-8">
            {/* Visual Pulse Overlay */}
            {!toneStarted && (
                <div 
                    onClick={async () => {
                        await Tone.start();
                        setToneStarted(true);
                    }}
                    className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 cursor-pointer"
                >
                    <div className="w-20 h-20 bg-[#00F0FF]/10 rounded-full flex items-center justify-center mb-6 animate-pulse border border-[#00F0FF]/30">
                        <Activity className="w-10 h-10 text-[#00F0FF]" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase text-[#00F0FF] mb-2">Activar Audio</h2>
                    <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-8">
                        Toca cualquier parte de la pantalla para habilitar el sistema de audio en este dispositivo.
                    </p>
                    <div className="px-8 py-4 bg-[#00F0FF] text-black font-black rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.4)]">
                        COMENZAR SESIÓN
                    </div>
                </div>
            )}

            <div 
                ref={pulseOverlayRef} 
                className="pointer-events-none absolute inset-0 bg-[#00F0FF] opacity-0 mix-blend-screen z-0" 
            />

            <div className="relative z-10 w-full max-w-lg flex flex-col h-full gap-3 sm:gap-4 overflow-hidden">
                
                {/* Header (Compact) */}
                <header className="flex justify-between items-center bg-[#131313]/80 backdrop-blur-md p-3 rounded-2xl border border-[#00F0FF]/10 shrink-0">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/admin">
                            <button className="p-2 sm:p-3 bg-[#1a1a1a] rounded-xl text-[#00F0FF] hover:bg-[#2a2a2a] transition-colors">
                                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-sm sm:text-lg font-black tracking-tighter uppercase text-[#00F0FF] leading-none">BPM System</h1>
                        </div>
                    </div>
                    <Link href="/admin/fitness/config">
                        <button className="p-2 sm:p-3 bg-[#1a1a1a] rounded-xl text-gray-400 hover:text-[#00F0FF] hover:bg-[#2a2a2a] transition-colors">
                            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </Link>
                </header>

                {/* Cloud Track Selector */}
                <section className="bg-[#131313] p-3 sm:p-4 rounded-2xl border border-white/5 shrink-0 flex items-center gap-3">
                    <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-[#00F0FF] shrink-0" />
                    <div className="relative flex-1">
                        <select 
                            onChange={handleTrackSelect}
                            defaultValue=""
                            className="w-full bg-[#1a1a1a] text-xs sm:text-sm text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-xl border border-white/10 outline-none appearance-none"
                        >
                            <option value="" disabled>Seleccionar track...</option>
                            {tracks.map(track => (
                                <option key={track.id} value={track.id}>{track.name}</option>
                            ))}
                        </select>
                        <Music className="w-3 h-3 justify-center text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </section>

                {/* Main Content Area: Left Col (Stopwatch + Loop) | Right Col (Slider) */}
                <main className="flex-1 min-h-0 flex gap-3 sm:gap-4 pb-2">
                    
                    {/* Left Column: Player & Loop */}
                    <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-0">
                        {/* Stopwatch & Player */}
                        <section className="flex-1 bg-[#131313] p-4 rounded-3xl border border-[#00F0FF]/20 shadow-[0_0_30px_rgba(0,240,255,0.05)] flex flex-col relative overflow-hidden min-h-0">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#00F0FF]/5 to-transparent opacity-50 z-0 pointer-events-none"></div>
                            
                            {/* Time & Base BPM */}
                            <div className="flex flex-col items-center justify-center flex-1 z-10 space-y-2">
                                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(0,240,255,0.3)] tabular-nums truncate w-full text-center">
                                    {timeFormatted}
                                </h2>
                                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#00F0FF] font-bold bg-black/50 px-3 py-1 rounded-full border border-[#00f0ff]/20">
                                    Base: {baseBPM} BPM
                                </p>
                            </div>
                            
                            {/* Player Controls */}
                            <div className="flex items-center gap-4 sm:gap-6 z-10 w-full justify-center shrink-0 mt-2">
                                <button 
                                    onClick={handleReset}
                                    className="p-3 sm:p-4 rounded-2xl bg-[#1a1a1a] text-gray-400 active:scale-95 hover:text-white transition-colors"
                                >
                                    <RefreshCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                                
                                <button 
                                    onClick={handlePlayPause}
                                    disabled={!isLoaded}
                                    className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full flex items-center justify-center transition-all active:scale-95 border-2 ${isLoaded ? (isPlaying ? 'bg-[#ff3366]/90 border-[#ff3366] text-white shadow-[0_0_30px_rgba(255,51,102,0.4)]' : 'bg-[#00F0FF]/90 border-[#00F0FF] text-black shadow-[0_0_30px_rgba(0,240,255,0.4)]') : 'bg-[#1a1a1a] border-transparent text-gray-600'}`}
                                >
                                    {isLoadingTrack ? <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[#00F0FF]" /> : 
                                    (!isLoaded ? <Music className="w-6 h-6 sm:w-8 sm:h-8 opacity-20" /> : (isPlaying ? <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" /> : <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-2" />))}
                                </button>
                            </div>
                        </section>

                        {/* LOOP SECTION (Now in left column) */}
                        <section className="bg-[#131313] p-2 sm:p-3 rounded-2xl border border-white/5 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <button 
                                    onClick={() => triggerLoop(4)}
                                    disabled={!isLoaded || baseBPM === 0}
                                    className={`group h-12 sm:h-16 rounded-xl overflow-hidden shadow-lg flex flex-col items-center justify-center transition-all border ${activeLoop === 4 ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-white' : 'bg-[#1a1a1a] border-white/5 text-gray-400 hover:text-white hover:border-white/10'}`}
                                >
                                    <span className={`font-black text-lg sm:text-xl tracking-tighter ${activeLoop === 4 ? 'text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]' : ''}`}>4 BEATS</span>
                                </button>

                                <button 
                                    onClick={() => triggerLoop(8)}
                                    disabled={!isLoaded || baseBPM === 0}
                                    className={`group h-12 sm:h-16 rounded-xl overflow-hidden shadow-lg flex flex-col items-center justify-center transition-all border ${activeLoop === 8 ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-white' : 'bg-[#1a1a1a] border-white/5 text-gray-400 hover:text-white hover:border-white/10'}`}
                                >
                                    <span className={`font-black text-lg sm:text-xl tracking-tighter ${activeLoop === 8 ? 'text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]' : ''}`}>8 BEATS</span>
                                </button>
                            </div>
                        </section>
                    </div>
                    
                    {/* Target BPM Slider (Right Column Full Height) */}
                    <section className="w-[80px] sm:w-[100px] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-3xl border border-[#00F0FF]/20 flex flex-col items-center py-3 relative h-full shrink-0 shadow-lg">
                        <div className="shrink-0 text-center z-10 mb-2">
                            <span className="font-black text-2xl sm:text-3xl tracking-tighter text-[#00F0FF] tabular-nums drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">{targetBPM}</span>
                        </div>

                        {/* Precision UP Button */}
                        <button 
                            onClick={() => setTargetBPM(prev => Math.min(200, prev + 2))}
                            className="bg-white/5 hover:bg-white/10 active:bg-white/20 p-2 sm:p-3 rounded-xl transition-all z-10 shrink-0 text-gray-300 hover:text-white shadow-md border border-white/5 active:scale-95"
                        >
                            <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        <div className="relative flex-1 w-full flex justify-center py-2 min-h-[150px]">
                            {/* We use standard HTML slider but rotated via Tailwind to prevent browser-specific bugs with writingMode */}
                            <div className="absolute inset-y-4 right-0 left-0 flex items-center justify-center z-20 pointer-events-none">
                                {/* The physical input rotates around its center, so its width needs to be the container's height */}
                                <input 
                                    type="range" 
                                    min="60" 
                                    max="200" 
                                    value={targetBPM} 
                                    onChange={(e) => setTargetBPM(Number(e.target.value))}
                                    className="custom-range h-10 hover:cursor-grab active:cursor-grabbing appearance-none bg-transparent absolute pointer-events-auto"
                                    style={{ 
                                        width: 'calc(100% + 2rem)', // Stretch effectively equivalent to height
                                        transform: 'rotate(-90deg)' 
                                    }}
                                />
                            </div>

                            {/* Custom track visual under the input */}
                            <div className="absolute top-2 sm:top-4 bottom-2 sm:bottom-4 w-3 sm:w-4 bg-[#0e0e0e] rounded-full overflow-hidden flex flex-col justify-end pointer-events-none shadow-inner border border-white/5 z-0">
                                <div 
                                    className="w-full bg-gradient-to-b from-[#00F0FF] to-[#00f0ff8c] shadow-[0_0_15px_rgba(0,240,255,0.5)]"
                                    style={{ height: `${((targetBPM - 60) / 140) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Precision DOWN Button */}
                        <button 
                            onClick={() => setTargetBPM(prev => Math.max(60, prev - 2))}
                            className="bg-white/5 hover:bg-white/10 active:bg-white/20 p-2 sm:p-3 rounded-xl transition-all z-10 shrink-0 text-gray-300 hover:text-white shadow-md border border-white/5 active:scale-95 mt-1"
                        >
                            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </section>
                </main>

                
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                input.custom-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 28px;
                    width: 28px;
                    border-radius: 50%;
                    background: #00F0FF;
                    cursor: pointer;
                    margin-top: -12px;
                    box-shadow: 0 0 20px rgba(0, 240, 255, 0.6);
                    border: 3px solid #000;
                }
                input.custom-range::-webkit-slider-runnable-track {
                    width: 4px;
                    height: 4px;
                    cursor: pointer;
                    background: transparent;
                }
                /* Firefox */
                input.custom-range::-moz-range-thumb {
                    height: 28px;
                    width: 28px;
                    border-radius: 50%;
                    background: #00F0FF;
                    cursor: pointer;
                    box-shadow: 0 0 20px rgba(0, 240, 255, 0.6);
                    border: 3px solid #000;
                }
                input.custom-range::-moz-range-track {
                    width: 4px;
                    height: 4px;
                    cursor: pointer;
                    background: transparent;
                }
            `}} />
        </div>
    );
}
