"use client";

import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { Play, Pause, RefreshCcw, Settings, Activity, Music, Loader2, ArrowLeft, Cloud } from "lucide-react";
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

        try {
            // Using Tone GrainPlayer
            const player = new Tone.GrainPlayer({
                url: track.url,
                onload: () => {
                    setIsLoaded(true);
                    setIsLoadingTrack(false);
                    setBaseBPM(track.bpm);
                    setTargetBPM(track.bpm);
                    
                    // Reset stopwatch
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

    // Tone Audio Context Start
    useEffect(() => {
        if (isPlaying) {
            Tone.start();
        }
    }, [isPlaying]);

    // BPM Sync
    useEffect(() => {
        if (playerRef.current && baseBPM > 0) {
            playerRef.current.playbackRate = targetBPM / baseBPM;
        }

        // Setup metronome visual pulse
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
            // Disable loop
            playerRef.current.loop = false;
            setActiveLoop(null);
        } else {
            // Enable loop precisely at current buffer time.
            // 1 beat duration in original buffer = 60 / baseBPM seconds.
            const beatDurationInSecs = 60 / baseBPM;
            const loopDuration = beats * beatDurationInSecs;
            const currentPositionInSecs = bufferTimeMsRef.current / 1000;
            
            playerRef.current.loopStart = currentPositionInSecs;
            // Add a small safety pad for ToneJS buffer ends or strict maths
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
            
            // Increment the buffer time according to the current playback rate
            const playbackRate = baseBPM > 0 ? (targetBPM / baseBPM) : 1;
            bufferTimeMsRef.current += delta * playbackRate;
            
            // Loop adjustment: if we passed the loop end, reset bufferTime to loop start
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

    const handlePlayPause = () => {
        if (!isLoaded) return;
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
        <div className="relative min-h-screen bg-[#0e0e0e] text-white font-sans overflow-hidden p-6 md:p-12">
            {/* Visual Pulse Overlay */}
            <div 
                ref={pulseOverlayRef} 
                className="pointer-events-none absolute inset-0 bg-[#00F0FF] opacity-0 mix-blend-screen z-0" 
            />

            <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-10">
                
                {/* Header */}
                <header className="flex justify-between items-center bg-[#131313]/80 backdrop-blur-xl p-4 rounded-3xl border border-[#00F0FF]/10 shadow-[0_0_30px_rgba(0,240,255,0.05)]">
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                            <button className="p-3 bg-[#1a1a1a] rounded-xl hover:bg-[#2a2a2a] transition-colors">
                                <ArrowLeft className="w-5 h-5 text-[#00F0FF]" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase text-[#00F0FF]">BPM Fitness System</h1>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">Pro Sync Engine</p>
                        </div>
                    </div>
                </header>

                {/* Main Controls Area */}
                <main className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Left Column: Player & Timer */}
                    <div className="md:col-span-8 flex flex-col gap-6">
                        
                        {/* Audio Source Cloud Selector */}
                        <section className="bg-[#131313] p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold uppercase tracking-widest text-[#00F0FF] flex items-center gap-2">
                                    <Cloud className="w-4 h-4" /> Cloud Tracks
                                </label>
                                <Link href="/admin/fitness/config">
                                    <button className="p-2 bg-[#1a1a1a] rounded-lg hover:bg-[#00F0FF]/20 hover:text-[#00F0FF] transition-colors">
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </Link>
                            </div>
                            
                            <div className="relative">
                                <select 
                                    onChange={handleTrackSelect}
                                    defaultValue=""
                                    className="w-full bg-[#1a1a1a] text-white font-bold p-4 rounded-xl border border-white/10 outline-none focus:border-[#00F0FF]/50 appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Seleccionar un track...</option>
                                    {tracks.map(track => (
                                        <option key={track.id} value={track.id}>{track.name} ({track.bpm} BPM)</option>
                                    ))}
                                </select>
                                <Music className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Base Track BPM</label>
                                    <div className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white font-mono opacity-50 flex items-center gap-3">
                                        <Activity className="w-4 h-4" />
                                        {baseBPM} BPM
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Stopwatch & Player */}
                        <section className="bg-[#131313] p-8 rounded-3xl border border-[#00F0FF]/20 shadow-[0_0_50px_rgba(0,240,255,0.05)] flex flex-col items-center justify-center py-12 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#00F0FF]/5 to-transparent opacity-50"></div>
                            
                            <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(0,240,255,0.3)] tabular-nums z-10">
                                {timeFormatted}
                            </h2>
                            <p className="text-[12px] uppercase tracking-[0.4em] text-[#00F0FF] mt-4 font-bold z-10">Active Stopwatch</p>

                            <div className="flex items-center gap-6 mt-12 z-10">
                                <button 
                                    onClick={handleReset}
                                    className="p-4 rounded-2xl bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-all active:scale-95"
                                >
                                    <RefreshCcw className="w-6 h-6" />
                                </button>
                                
                                <button 
                                    onClick={handlePlayPause}
                                    disabled={!isLoaded}
                                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-90 ${isLoaded ? (isPlaying ? 'bg-[#ff3366] text-white shadow-[0_0_30px_rgba(255,51,102,0.3)]' : 'bg-[#00F0FF] text-black shadow-[0_0_30px_rgba(0,240,255,0.3)]') : 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed'}`}
                                >
                                    {isLoadingTrack ? <Loader2 className="w-10 h-10 animate-spin text-[#00F0FF]" /> : 
                                    (!isLoaded ? <Music className="w-8 h-8 opacity-20" /> : (isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />))}
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: BPM Slider & Controls */}
                    <div className="md:col-span-4 flex flex-col gap-6">
                        
                        {/* Target BPM Slider */}
                        <section className="flex-1 bg-gradient-to-b from-[#131313] to-[#0a0a0a] rounded-3xl border border-[#00F0FF]/15 flex flex-col items-center p-8 relative">
                            <div className="text-center mb-8">
                                <span className="font-black text-6xl tracking-tighter text-white tabular-nums drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]">{targetBPM}</span>
                                <p className="text-[10px] text-[#00F0FF] uppercase tracking-[0.3em] font-bold mt-2">Target BPM</p>
                            </div>

                            <div className="relative flex-1 w-full max-h-[300px] flex justify-center py-4">
                                <input 
                                    type="range" 
                                    min="60" 
                                    max="200" 
                                    value={targetBPM} 
                                    onChange={(e) => setTargetBPM(Number(e.target.value))}
                                    className="h-[300px] hover:cursor-grab active:cursor-grabbing appearance-none bg-transparent w-8 z-10 relative"
                                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                                />
                                {/* Custom track visual */}
                                <div className="absolute inset-y-8 w-2 bg-[#1a1a1a] rounded-full overflow-hidden flex flex-col justify-end">
                                    <div 
                                        className="w-full bg-gradient-to-b from-[#00F0FF] to-[#00f0ff8c]"
                                        style={{ height: `${((targetBPM - 60) / 140) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </section>

                        {/* Status Blocks */}
                        <section className="bg-[#131313] rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
                            <div className="flex items-center gap-4 bg-[#1a1a1a] p-4 rounded-2xl">
                                <div className="p-3 bg-[#00F0FF]/10 text-[#00F0FF] rounded-xl"><Activity className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Time Stretch</p>
                                    <p className="text-sm font-black text-white">{baseBPM > 0 ? (targetBPM / baseBPM).toFixed(2) : '1.00'}x</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-[#1a1a1a] p-4 rounded-2xl">
                                <div className="p-3 bg-[#00F0FF]/10 text-[#00F0FF] rounded-xl"><RefreshCcw className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Auto Loop</p>
                                    <p className="text-sm font-black text-white">{activeLoop ? `ACTIVE (${activeLoop} Beats)` : 'DISABLED'}</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>

                {/* LOOP SECTION */}
                <section className="bg-[#131313] p-6 rounded-3xl border border-white/5 disabled:opacity-50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-[10px] text-[#00F0FF] uppercase tracking-[0.4em] font-black px-6">Loop Control</span>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <button 
                            onClick={() => triggerLoop(4)}
                            disabled={!isLoaded || baseBPM === 0}
                            className={`group relative h-28 rounded-2xl overflow-hidden flex items-center justify-center transition-all border-b-4 ${activeLoop === 4 ? 'bg-[#00F0FF]/20 border-[#00F0FF]' : 'bg-[#1a1a1a] border-transparent hover:border-[#00F0FF]/50'}`}
                        >
                            <div className="flex flex-col items-center z-10">
                                <span className={`font-black text-4xl tracking-tighter transition-colors ${activeLoop === 4 ? 'text-[#00F0FF]' : 'text-white group-hover:text-[#00F0FF]'}`}>4 BEATS</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Instant Cycle</span>
                            </div>
                            <div className="absolute inset-0 bg-[#00F0FF]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>

                        <button 
                            onClick={() => triggerLoop(8)}
                            disabled={!isLoaded || baseBPM === 0}
                            className={`group relative h-28 rounded-2xl overflow-hidden flex items-center justify-center transition-all border-b-4 ${activeLoop === 8 ? 'bg-[#00F0FF]/20 border-[#00F0FF]' : 'bg-[#1a1a1a] border-transparent hover:border-[#00F0FF]/50'}`}
                        >
                            <div className="flex flex-col items-center z-10">
                                <span className={`font-black text-4xl tracking-tighter transition-colors ${activeLoop === 8 ? 'text-[#00F0FF]' : 'text-white group-hover:text-[#00F0FF]'}`}>8 BEATS</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Phased Loop</span>
                            </div>
                            <div className="absolute inset-0 bg-[#00F0FF]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    </div>
                </section>

                {/* Bottom Spacer */}
                <div className="h-20 md:h-0"></div>
            </div>
            
            {/* Mobile Nav Overrides */}
            <style dangerouslySetInnerHTML={{__html: `
                input[type='range']::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 32px;
                    width: 32px;
                    border-radius: 50%;
                    background: #00F0FF;
                    cursor: pointer;
                    margin-top: -12px;
                    box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
                }
                input[type='range']::-webkit-slider-runnable-track {
                    width: 8px;
                    cursor: pointer;
                    background: transparent;
                    border-radius: 10px;
                }
            `}} />
        </div>
    );
}
