"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { tarotService, TarotCard, TarotReading } from "@/lib/services/tarotService";
import { getTarotReading } from "@/lib/actions/tarotActions";
import { Loader2, Sparkles, Send, RotateCcw, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

type SpreadType = 1 | 3 | 5;
type Stage = "setup" | "shuffle" | "pick" | "reveal" | "reading";

interface ChosenCard {
    card: TarotCard;
    invertida: boolean;
    posicion?: string;
}

export default function TarotPublicPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;

    const [stage, setStage] = useState<Stage>("setup");
    const [name, setName] = useState("");
    const [question, setQuestion] = useState("");
    const [spreadType, setSpreadType] = useState<SpreadType>(3);
    
    const [allCards, setAllCards] = useState<TarotCard[]>([]);
    const [deck, setDeck] = useState<{id: string, invertida: boolean}[]>([]);
    const [chosenIndices, setChosenIndices] = useState<number[]>([]);
    const [reading, setReading] = useState("");
    const [loading, setLoading] = useState(false);

    // Initial load
    useEffect(() => {
        tarotService.getAllCards().then(setAllCards);
    }, []);

    const startShuffle = () => {
        if (!name.trim()) return toast.error("Por favor, dinos tu nombre ✨");
        if (!question.trim()) return toast.error("La pregunta es necesaria para la conexión 🔮");
        
        setStage("shuffle");
        // Create a deck of 21 cards, shuffled and with random inversion
        const newDeck = [...allCards]
            .sort(() => Math.random() - 0.5)
            .map(c => ({ id: c.id, invertida: Math.random() > 0.7 })); // 30% chance of being inverted
        
        setDeck(newDeck);

        setTimeout(() => setStage("pick"), 2500);
    };

    const handlePick = (index: number) => {
        if (chosenIndices.includes(index)) return;
        if (chosenIndices.length >= spreadType) return;

        const newChosen = [...chosenIndices, index];
        setChosenIndices(newChosen);

        if (newChosen.length === spreadType) {
            setTimeout(() => setStage("reveal"), 800);
        }
    };

    const revealAndRead = async () => {
        setStage("reading");
        setLoading(true);

        const selected = chosenIndices.map((idx, i) => {
            const d = deck[idx];
            const card = allCards.find(c => c.id === d.id)!;
            const pos = spreadType === 1 ? "Única" : 
                        spreadType === 3 ? ["Pasado", "Presente", "Futuro"][i] :
                        ["Pasado", "Presente", "Futuro", "Desafío", "Resultado"][i];
            
            return {
                id: card.id,
                nombre: card.nombre,
                invertida: d.invertida,
                posicion: pos,
                significado: d.invertida ? card.significado_invertido : card.significado_normal
            };
        });

        const res = await getTarotReading(name, question, selected);
        if (res.success) {
            setReading(res.text || "");
            
            // Save to Firestore
            try {
                await tarotService.saveReading({
                    tenantId,
                    usuario: name,
                    pregunta: question,
                    cartas: selected,
                    interpretacion: res.text || "",
                    createdAt: new Date().toISOString()
                });
            } catch (err) {
                console.error("Error saving reading:", err);
                // Don't toast error here, user already got their reading
            }
        } else {
            toast.error(res.error || "Algo salió mal con la conexión mística");
            setStage("reveal");
        }
        setLoading(false);
    };

    const reset = () => {
        setStage("setup");
        setChosenIndices([]);
        setReading("");
        setQuestion("");
    };

    return (
        <div className="min-h-screen bg-[#0a0612] text-white font-serif selection:bg-purple-500/30 overflow-x-hidden">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
                
                body {
                    background-image: 
                        radial-gradient(circle at 20% 30%, rgba(67, 24, 122, 0.15) 0%, transparent 40%),
                        radial-gradient(circle at 80% 70%, rgba(121, 40, 202, 0.15) 0%, transparent 40%);
                    font-family: 'Cormorant Garamond', serif;
                }

                .cinzel { font-family: 'Cinzel', serif; }
                
                .mystic-input {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    transition: all 0.3s ease;
                }
                .mystic-input:focus {
                    background: rgba(255, 255, 255, 0.07);
                    border-color: rgba(139, 92, 246, 0.5);
                    box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
                    outline: none;
                }

                .card-back {
                    background-image: url('/assets/tarot/reverso.png');
                    background-size: cover;
                    background-position: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .shuffle-animation {
                    animation: shuffle 0.6s infinite alternate cubic-bezier(0.45, 0.05, 0.55, 0.95);
                }
                @keyframes shuffle {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    100% { transform: translate(20px, -10px) rotate(5deg); }
                }

                .card-reveal {
                    animation: reveal 0.8s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes reveal {
                    0% { transform: rotateY(180deg) scale(0.8); opacity: 0; }
                    100% { transform: rotateY(0deg) scale(1); opacity: 1; }
                }

                .typewriter {
                    overflow: hidden;
                    white-space: pre-wrap;
                }

                .star {
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                    pointer-events: none;
                }
            `}</style>

            {/* Stars Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {Array.from({ length: 50 }).map((_, i) => (
                    <div 
                        key={i} 
                        className="star animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 3}px`,
                            height: `${Math.random() * 3}px`,
                            animationDelay: `${Math.random() * 5}s`,
                            opacity: Math.random() * 0.5
                        }}
                    />
                ))}
            </div>

            <main className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center min-h-screen">
                <header className="text-center mb-12 animate-in fade-in slide-in-from-top duration-1000">
                    <h1 className="cinzel text-5xl md:text-7xl font-black mb-2 tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-purple-200 to-purple-500">
                        TAROT
                    </h1>
                    <p className="text-purple-300/60 uppercase tracking-[0.4em] text-sm">Consultorio Astral e Interpretación por IA</p>
                </header>

                {/* STAGE: SETUP */}
                {stage === "setup" && (
                    <div className="w-full max-w-xl bg-purple-900/10 backdrop-blur-md border border-purple-500/20 p-8 md:p-12 rounded-[2rem] shadow-2xl animate-in zoom-in slide-in-from-bottom duration-700">
                        <div className="space-y-8">
                            <div>
                                <label className="cinzel block text-xs tracking-widest text-purple-300/80 mb-3 uppercase">Tu Nombre Terrenal</label>
                                <input 
                                    className="mystic-input w-full px-6 py-4 rounded-2xl text-xl font-bold placeholder:text-purple-300/20"
                                    placeholder="¿Cómo te llaman en este plano?"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="cinzel block text-xs tracking-widest text-purple-300/80 mb-3 uppercase">Tu Consulta al Oráculo</label>
                                <textarea 
                                    rows={3}
                                    className="mystic-input w-full px-6 py-4 rounded-2xl text-lg placeholder:text-purple-300/20"
                                    placeholder="Concentra tu energía en una pregunta clara..."
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="cinzel block text-xs tracking-widest text-purple-300/80 mb-4 uppercase text-center">Profundidad de la Tirada</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[1, 3, 5].map(n => (
                                        <button 
                                            key={n}
                                            onClick={() => setSpreadType(n as SpreadType)}
                                            className={`py-4 rounded-xl border cinzel transition-all duration-500 ${
                                                spreadType === n 
                                                ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-105" 
                                                : "bg-purple-900/30 border-purple-500/30 text-purple-300 hover:bg-purple-800/40"
                                            }`}
                                        >
                                            {n} {n === 1 ? "Carta" : "Cartas"}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-center text-xs text-purple-400/50 mt-4 italic">
                                    {spreadType === 1 ? "Lectura rápida y directa." : 
                                     spreadType === 3 ? "Análisis de Pasado, Presente y Futuro." : 
                                     "Lectura completa de situación, desafíos y resultados."}
                                </p>
                            </div>

                            <button 
                                onClick={startShuffle}
                                className="group w-full py-5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 rounded-2xl cinzel font-black tracking-widest text-lg transition-all shadow-xl shadow-purple-900/20 flex items-center justify-center gap-3 active:scale-95"
                            >
                                <Sparkles className="group-hover:animate-spin" size={20} />
                                INVOCAR LECTURA
                            </button>
                        </div>
                    </div>
                )}

                {/* STAGE: SHUFFLE */}
                {stage === "shuffle" && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-1000">
                        <div className="relative w-48 h-72">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div 
                                    key={i}
                                    className="absolute inset-0 card-back rounded-[1rem] shuffle-animation"
                                    style={{ animationDelay: `${i * 0.1}s`, zIndex: 10 - i }}
                                />
                            ))}
                        </div>
                        <h2 className="cinzel text-2xl mt-12 tracking-[0.3em] text-purple-300 animate-pulse">Mezclando energías...</h2>
                    </div>
                )}

                {/* STAGE: PICK */}
                {stage === "pick" && (
                    <div className="w-full max-w-7xl animate-in fade-in duration-1000 flex flex-col items-center">
                        <div className="text-center mb-12">
                            <h2 className="cinzel text-2xl text-purple-200 mb-2">ELIGE {spreadType} {spreadType === 1 ? "CARTA" : "CARTAS"}</h2>
                            <p className="text-purple-400 italic">Concentra tu intención y selecciona las que vibren contigo ({chosenIndices.length}/{spreadType})</p>
                        </div>
                        
                        <div className="relative w-full h-[50vh] flex items-center justify-center overflow-visible">
                            <div className="absolute flex justify-center w-full">
                                {deck.map((_, i) => {
                                    const isChosen = chosenIndices.includes(i);
                                    const angle = (i - (deck.length / 2)) * 6;
                                    const spreadOffset = (i - (deck.length / 2)) * 30;
                                    
                                    return (
                                        <div 
                                            key={i}
                                            onClick={() => handlePick(i)}
                                            className={`absolute w-32 h-48 md:w-40 md:h-60 rounded-[1rem] border border-white/10 cursor-pointer card-back hover:-translate-y-12 transition-all duration-500 origin-bottom select-none ${
                                                isChosen ? "opacity-0 scale-0 pointer-events-none" : ""
                                            }`}
                                            style={{
                                                transform: `rotate(${angle}deg) translateX(${spreadOffset}px)`,
                                                zIndex: i
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Picked queue */}
                        <div className="mt-12 flex gap-4">
                            {Array.from({ length: spreadType }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-16 h-24 border-2 border-dashed border-purple-500/30 rounded-lg flex items-center justify-center ${
                                        chosenIndices[i] !== undefined ? "bg-purple-600/20 border-purple-400" : ""
                                    }`}
                                >
                                    {chosenIndices[i] !== undefined ? <Sparkles className="text-purple-300 animate-pulse" /> : <span className="text-purple-300/20 text-xs cinzel">{i+1}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STAGE: REVEAL */}
                {stage === "reveal" && (
                    <div className="w-full max-w-6xl animate-in fade-in duration-1000 flex flex-col items-center">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-16 w-full px-4 content-center justify-center place-items-center">
                            {chosenIndices.map((idx, i) => {
                                const d = deck[idx];
                                const card = allCards.find(c => c.id === d.id)!;
                                const spreadLabel = spreadType === 1 ? "El Oráculo" : 
                                                   spreadType === 3 ? ["Pasado", "Presente", "Futuro"][i] :
                                                   ["Pasado", "Presente", "Futuro", "Desafío", "Resultado"][i];

                                return (
                                    <div key={i} className="flex flex-col items-center w-full">
                                        <p className="cinzel text-xs tracking-widest text-purple-400 mb-4 uppercase">{spreadLabel}</p>
                                        <div className="relative aspect-[2/3] w-full max-w-[240px] rounded-[1.5rem] overflow-hidden shadow-2xl border-4 border-purple-900/50 card-reveal">
                                            <img 
                                                src={card.imagen_url} 
                                                className={`w-full h-full object-cover ${d.invertida ? "rotate-180" : ""}`}
                                                alt={card.nombre}
                                            />
                                        </div>
                                        <h3 className="cinzel text-lg mt-6 font-bold text-purple-200">{card.nombre}</h3>
                                        {d.invertida && <p className="text-xs text-orange-400/80 uppercase tracking-widest">Invertida</p>}
                                    </div>
                                );
                            })}
                        </div>

                        <button 
                            onClick={revealAndRead}
                            className="py-5 px-12 bg-white text-purple-900 cinzel font-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-110 transition-all flex items-center gap-3 active:scale-95"
                        >
                            <Sparkles size={20} /> INTERPRETAR TIRADA
                        </button>
                    </div>
                )}

                {/* STAGE: READING */}
                {stage === "reading" && (
                    <div className="w-full max-w-4xl animate-in slide-in-from-bottom duration-1000">
                        <div className="bg-purple-900/10 backdrop-blur-xl border border-purple-500/20 rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
                            {/* Mystical icon ornaments */}
                            <div className="absolute top-8 left-8 text-purple-500/20"><Sparkles size={60} /></div>
                            <div className="absolute bottom-8 right-8 text-purple-500/20 rotate-180"><Sparkles size={60} /></div>

                            <div className="relative z-10">
                                <p className="cinzel text-center text-purple-300/60 mb-8 tracking-[0.3em]">Lectura para {name}</p>
                                
                                <div className="space-y-6 text-xl leading-relaxed text-purple-100/90 whitespace-pre-wrap Cormorant">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <Loader2 className="animate-spin text-purple-500" size={48} />
                                            <p className="cinzel text-sm animate-pulse tracking-widest text-purple-400">Canalizando la sabiduría del Universo...</p>
                                        </div>
                                    ) : (
                                        <div className="typewriter">
                                            {reading}
                                        </div>
                                    )}
                                </div>

                                {!loading && reading && (
                                    <div className="mt-16 flex justify-center">
                                        <button 
                                            onClick={reset}
                                            className="flex items-center gap-2 text-purple-400 hover:text-white transition-colors cinzel tracking-widest text-sm py-4 px-8 border border-purple-500/20 rounded-full hover:bg-purple-500/10"
                                        >
                                            <RotateCcw size={16} /> Realizar otra consulta
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Footer cards summary */}
                        {!loading && reading && (
                            <div className="mt-12 grid grid-cols-3 md:grid-cols-5 gap-4 opacity-50 contrast-75">
                                {chosenIndices.map((idx, i) => {
                                    const d = deck[idx];
                                    const card = allCards.find(c => c.id === d.id)!;
                                    return (
                                        <img 
                                            key={i}
                                            src={card.imagen_url} 
                                            className={`rounded-lg w-full ${d.invertida ? "rotate-180" : ""}`}
                                            alt={card.nombre}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            <footer className="relative z-10 py-12 text-center text-purple-300/30 cinzel text-xs tracking-widest">
                <p>&copy; {new Date().getFullYear()} RESET HOME SPA WEB • ORÁCULO IA</p>
                <p className="mt-2 Cormorant italic normal-case tracking-normal">El destino está en tus manos, la IA solo ilumina el camino.</p>
            </footer>
        </div>
    );
}
