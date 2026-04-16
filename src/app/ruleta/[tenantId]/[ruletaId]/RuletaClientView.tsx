"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Phone, User } from "lucide-react";
import {
    getRuletaSlices,
    checkParticipante,
    registrarParticipante,
    RuletaSlice,
    PromoWeb as PromoData,
} from "@/lib/services/promoWebService";
import { clienteService } from "@/lib/services/clienteService";
import { TenantData } from "@/lib/services/tenantService";


type Stage = "form" | "spinning" | "prize" | "already_played" | "no_prizes" | "inactive";

interface Props {
    tenantId: string;
    ruletaId: string;
    initialPromo: PromoData;
    initialTenant: TenantData | null;
}

const SPARKLES_POS = [
    { top: "5%", left: "8%", size: 28, delay: "0s" },
    { top: "12%", right: "10%", size: 20, delay: "0.4s" },
    { top: "30%", left: "3%", size: 16, delay: "0.8s" },
    { top: "25%", right: "5%", size: 22, delay: "1.2s" },
    { bottom: "20%", left: "6%", size: 18, delay: "0.6s" },
    { bottom: "10%", right: "8%", size: 24, delay: "1s" },
];

// Sort slices by probabilidad weighted random
function selectWinner(slices: RuletaSlice[]): RuletaSlice | null {
    const active = slices.filter(s => s.activo);
    if (!active.length) return null;
    const total = active.reduce((acc, s) => acc + s.probabilidad, 0);
    let rand = Math.random() * total;
    for (const s of active) {
        rand -= s.probabilidad;
        if (rand <= 0) return s;
    }
    return active[active.length - 1];
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function RuletaClientView({ tenantId, ruletaId, initialPromo, initialTenant }: Props) {
    const [stage, setStage] = useState<Stage>(initialPromo.activa ? "form" : "inactive");
    const [nombre, setNombre] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [loading, setLoading] = useState(false);
    const [winner, setWinner] = useState<RuletaSlice | null>(null);
    const [confettiShown, setConfettiShown] = useState(false);

    // Wheel state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [slices, setSlices] = useState<RuletaSlice[]>([]);
    const [slicesLoaded, setSlicesLoaded] = useState(false);
    const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
    const rotationRef = useRef(0);       // current visual rotation (degrees)
    const spinningRef = useRef(false);
    const animFrameRef = useRef<number>(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [displayRotation, setDisplayRotation] = useState(0); // for re-render

    const promoNombre = initialPromo.nombre;
    const whatsappNegocio = initialTenant?.datos_contacto?.whatsapp || initialPromo.whatsapp_negocio;
    const subtitle = initialPromo.subtitulo_logo || "¡Girá y ganá! 🎡";
    const salonNombre = initialTenant?.nombre_salon || "";
    const logoUrl = initialTenant?.logo_url || null;
    const instagram = initialTenant?.datos_contacto?.instagram || null;
    const instagramHandle = instagram?.startsWith("@") ? instagram : instagram ? `@${instagram}` : null;
    const instagramUrl = instagram ? `https://instagram.com/${instagram.replace("@", "")}` : null;

    // Load slices on mount
    useEffect(() => {
        if (!initialPromo.activa) return;
        getRuletaSlices(tenantId, ruletaId).then(async list => {
            const imgs: Record<string, HTMLImageElement> = {};
            await Promise.all(list.map(s => {
                if (s.imagenUrl) {
                    return new Promise(resolve => {
                        const img = new Image();
                        img.crossOrigin = "Anonymous";
                        img.onload = () => { imgs[s.id] = img; resolve(true); };
                        img.onerror = () => resolve(true);
                        img.src = s.imagenUrl!;
                    });
                }
                return Promise.resolve(true);
            }));
            setLoadedImages(imgs);
            setSlices(list);
            setSlicesLoaded(true);
        });
    }, [tenantId, ruletaId, initialPromo.activa]);

    // Draw the wheel on canvas
    const drawWheel = useCallback((rotation: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const size = canvas.width / dpr;
        const cx = size / 2, cy = size / 2;
        const r = size / 2 - 6;
        const active = slices.filter(s => s.activo);
        if (active.length === 0) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Shadow
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 24 * dpr;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = "#222";
        ctx.fill();
        ctx.restore();

        let startAngle = rotation;
        const sliceAngle = 360 / active.length; // ← todos iguales visualmente
        active.forEach((s) => {
            const endAngle = startAngle + sliceAngle;

            const startRad = ((startAngle - 90) * Math.PI) / 180;
            const endRad = ((endAngle - 90) * Math.PI) / 180;

            // Segment
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, startRad, endRad);
            ctx.closePath();
            ctx.fillStyle = s.color;
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.25)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Text or Image
            const midAngle = startAngle + sliceAngle / 2;
            const textRad = ((midAngle - 90) * Math.PI) / 180;
            const textR = r * 0.65;
            const tx = cx + textR * Math.cos(textRad);
            const ty = cy + textR * Math.sin(textRad);

            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(textRad + Math.PI / 2);
            
            const img = loadedImages[s.id];
            if (img) {
                 const imgSize = r * 0.45;
                 ctx.drawImage(img, -imgSize/2, -imgSize/2, imgSize, imgSize);
            } else {
                 ctx.fillStyle = "#fff";
                 ctx.font = `bold ${size < 280 ? 9 : 11}px 'Plus Jakarta Sans', sans-serif`;
                 ctx.textAlign = "center";
                 ctx.textBaseline = "middle";
                 ctx.shadowColor = "rgba(0,0,0,0.6)";
                 ctx.shadowBlur = 4;

                 const maxWidth = (2 * Math.PI * textR * (sliceAngle / 360)) * 0.8;
                 const words = s.nombre.split(" ");
                 let line = "";
                 const lines: string[] = [];
                 for (const w of words) {
                     const test = line ? line + " " + w : w;
                     if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
                     else line = test;
                 }
                 lines.push(line);

                 const lineH = size < 280 ? 11 : 13;
                 lines.slice(0, 3).forEach((l, li) => {
                     ctx.fillText(l, 0, (li - (Math.min(lines.length, 3) - 1) / 2) * lineH);
                 });
            }
            ctx.restore();

            startAngle = endAngle;
        });

        // Center circle
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.09, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Outer border
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 3;
        ctx.stroke();
    }, [slices, loadedImages]);

    // Init canvas size with DPR
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !slicesLoaded) return;
        const dpr = window.devicePixelRatio || 1;
        const size = Math.min(window.innerWidth - 40, 340);
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.scale(dpr, dpr);
        drawWheel(rotationRef.current);
    }, [slicesLoaded, drawWheel]);

    useEffect(() => {
        if (slicesLoaded) drawWheel(rotationRef.current);
    }, [slices, drawWheel, slicesLoaded]);

    // Easing
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    const spinTo = useCallback((targetSlice: RuletaSlice) => {
        const active = slices.filter(s => s.activo);

        // Find the center angle of the winning slice using EQUAL segments (visual)
        const sliceAngle = 360 / active.length;
        let accumulated = 0;
        let winCenter = 0;
        for (const s of active) {
            if (s.id === targetSlice.id) {
                winCenter = accumulated + sliceAngle / 2;
                break;
            }
            accumulated += sliceAngle;
        }

        // The needle points UP (top center = 0°). We need to rotate the wheel so the winning segment aligns with the top.
        // finalRotation = 360*5 (5 full spins) + (360 - winCenter), to bring winCenter to 0 position (top)
        const extraSpins = 5 + Math.floor(Math.random() * 3);
        const targetRotation = rotationRef.current + extraSpins * 360 + (360 - (winCenter % 360));

        const startRotation = rotationRef.current;
        const totalDelta = targetRotation - startRotation;
        const duration = 4500 + Math.random() * 1000;
        const startTime = performance.now();

        spinningRef.current = true;
        setIsSpinning(true);

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOut(progress);
            const current = startRotation + totalDelta * eased;
            rotationRef.current = current % 360;
            drawWheel(rotationRef.current);

            if (progress < 1) {
                animFrameRef.current = requestAnimationFrame(animate);
            } else {
                rotationRef.current = targetRotation % 360;
                drawWheel(rotationRef.current);
                spinningRef.current = false;
                setIsSpinning(false);
            }
        };
        animFrameRef.current = requestAnimationFrame(animate);
    }, [slices, drawWheel]);

    useEffect(() => () => cancelAnimationFrame(animFrameRef.current), []);

    // Celebration sound
    useEffect(() => {
        if (stage === "prize") {
            const audio = new Audio("https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {});
        }
    }, [stage]);

    // Spin click sound
    const playSpinSound = () => {
        const audio = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_e7e1b70a3e.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {});
    };

    const handleSortear = useCallback(async () => {
        if (!nombre.trim()) return alert("Por favor ingresá tu nombre 😊");
        const cleanPhone = whatsapp.replace(/\D/g, "");
        if (cleanPhone.length < 8) return alert("Por favor ingresá un número de WhatsApp válido 📱");
        if (isSpinning) return;
        if (slices.filter(s => s.activo).length === 0) { setStage("no_prizes"); return; }

        setLoading(true);
        try {
            const existing = await checkParticipante(tenantId, ruletaId, cleanPhone);
            if (existing) { setStage("already_played"); setLoading(false); return; }

            // Select winner BEFORE animation
            const winnerSlice = selectWinner(slices);
            if (!winnerSlice) { setStage("no_prizes"); setLoading(false); return; }

            // Start spin animation
            setStage("spinning");
            playSpinSound();
            spinTo(winnerSlice);

            // Wait for animation to finish (we'll poll)
            await new Promise<void>((resolve) => {
                const check = setInterval(() => {
                    if (!spinningRef.current) { clearInterval(check); resolve(); }
                }, 100);
                setTimeout(() => { clearInterval(check); resolve(); }, 8000);
            });

            // Register participation
            await registrarParticipante(tenantId, ruletaId, {
                nombre: nombre.trim(),
                whatsapp: cleanPhone,
                premioId: winnerSlice.id,
                premioNombre: winnerSlice.nombre,
                ganado_en: new Date().toISOString(),
            });

            // Create/update client
            try {
                const fechaHora = new Date().toLocaleString("es-AR");
                const nota = `Participó en ruleta promo web: "${promoNombre}" — Premio: "${winnerSlice.nombre}" — Fecha: ${fechaHora}`;
                
                const existingCliente = await clienteService.getClienteByTelefono(tenantId, cleanPhone);
                if (!existingCliente) {
                    const [firstName, ...rest] = nombre.trim().split(" ");
                    await clienteService.createCliente(tenantId, {
                        nombre: firstName || nombre.trim(),
                        apellido: rest.join(" ") || "",
                        telefono: cleanPhone,
                        tenantId,
                        notas: `Registrado via promo web ruleta: "${promoNombre}" — Premio: "${winnerSlice.nombre}" — Fecha: ${fechaHora}`,
                    });
                } else {
                    // Append note
                    const notasActuales = existingCliente.notas || "";
                    const nuevasNotas = notasActuales ? `${notasActuales}\n${nota}` : nota;
                    await clienteService.updateCliente(tenantId, existingCliente.id, { notas: nuevasNotas });
                }
            } catch (clientErr) {
                console.warn("No se pudo registrar como cliente:", clientErr);
            }

            setWinner(winnerSlice);
            setStage("prize");
            setConfettiShown(true);
        } catch (e) {
            console.error(e);
            alert("Hubo un error, intentá de nuevo 💔");
            setStage("form");
        } finally {
            setLoading(false);
        }
    }, [nombre, whatsapp, tenantId, ruletaId, slices, isSpinning, spinTo, promoNombre]);

    const handleReclamar = () => {
        if (!winner || !whatsappNegocio) return;
        const text = encodeURIComponent(`Hola! soy ${nombre.trim()} y me gané "${winner.nombre}" en la ruleta 🎡🎉`);
        const clean = whatsappNegocio.replace(/\D/g, "");
        window.open(`https://wa.me/${clean}?text=${text}`, "_blank");
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
                    min-height: 100vh;
                }
                .ruleta-root {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    padding: 20px 16px 32px;
                    position: relative;
                    overflow: hidden;
                    gap: 0;
                }
                .sparkle-deco {
                    position: fixed;
                    pointer-events: none;
                    z-index: 0;
                    animation: twinkle 3s ease-in-out infinite alternate;
                }
                @keyframes twinkle {
                    0% { opacity: 0.25; transform: scale(0.8) rotate(-10deg); }
                    100% { opacity: 0.8; transform: scale(1.1) rotate(10deg); }
                }
                .brand-header {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 20px;
                    position: relative;
                    z-index: 1;
                }
                .logo-ring {
                    width: 110px;
                    height: auto;
                    min-height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 6px;
                }
                .logo-inner img {
                    width: 100%;
                    height: auto;
                    max-height: 90px;
                    object-fit: contain;
                    filter: drop-shadow(0 0 12px rgba(255,255,255,0.2));
                }
                .logo-placeholder {
                    font-family: 'Epilogue', sans-serif;
                    font-weight: 900;
                    font-size: 2.2rem;
                    background: linear-gradient(135deg, #a78bfa, #f0abfc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: -0.04em;
                }
                .salon-tagline {
                    font-size: 0.82rem;
                    font-weight: 700;
                    color: rgba(196,181,253,0.9);
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                }
                .card {
                    background: rgba(255,255,255,0.07);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border-radius: 32px;
                    padding: 28px 22px;
                    width: 100%;
                    max-width: 440px;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
                    position: relative;
                    z-index: 1;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .title {
                    font-family: 'Epilogue', sans-serif;
                    font-weight: 900;
                    font-size: 1.9rem;
                    line-height: 1.1;
                    letter-spacing: -0.02em;
                    background: linear-gradient(135deg, #a78bfa, #f472b6, #fb923c);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-align: center;
                    margin-bottom: 8px;
                }
                .subtitle {
                    text-align: center;
                    color: rgba(196,181,253,0.8);
                    font-size: 0.88rem;
                    font-weight: 500;
                    line-height: 1.5;
                    margin-bottom: 24px;
                }
                .promo-badge {
                    text-align: center;
                    font-size: 0.72rem;
                    font-weight: 800;
                    color: rgba(196,181,253,0.7);
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    margin-bottom: 10px;
                }
                .input-wrapper {
                    position: relative;
                    margin-bottom: 12px;
                }
                .input-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #a78bfa;
                    pointer-events: none;
                }
                .input-field {
                    width: 100%;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 16px;
                    padding: 14px 16px 14px 44px;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #fff;
                    outline: none;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    background: rgba(255,255,255,0.12);
                    border-color: rgba(167,139,250,0.5);
                    box-shadow: 0 0 0 3px rgba(167,139,250,0.15);
                }
                .input-field::placeholder { color: rgba(196,181,253,0.4); font-weight: 500; }

                /* WHEEL CONTAINER */
                .wheel-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin: 0 auto 20px;
                    position: relative;
                }
                .wheel-wrapper {
                    position: relative;
                    display: inline-block;
                    transform: scale(0.85);
                    margin: -20px auto;
                }
                .center-spin-btn {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 72px;
                    height: 72px;
                    border-radius: 50%;
                    background: radial-gradient(circle at top left, #c026d3, #db2777);
                    border: 4px solid #fff;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5), inset 0 -4px 8px rgba(0,0,0,0.3);
                    color: white;
                    font-family: 'Epilogue', sans-serif;
                    font-weight: 900;
                    font-size: 0.95rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    transition: transform 0.2s, box-shadow 0.2s;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.4);
                }
                .center-spin-btn:active:not(:disabled) {
                    transform: translate(-50%, -50%) scale(0.92);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                }
                .center-spin-btn:disabled {
                    cursor: not-allowed;
                    filter: saturate(0) brightness(0.8);
                }
                .needle {
                    position: absolute;
                    top: -14px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 10px solid transparent;
                    border-right: 10px solid transparent;
                    border-top: 28px solid #FFD700;
                    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
                    z-index: 10;
                }
                .needle::after {
                    content: '';
                    position: absolute;
                    top: -28px;
                    left: -6px;
                    width: 12px;
                    height: 12px;
                    background: #FFD700;
                    border-radius: 50%;
                }
                .btn-spin {
                    width: 100%;
                    padding: 18px 24px;
                    background: linear-gradient(135deg, #7c3aed, #a855f7, #e879f9);
                    color: white;
                    border: none;
                    border-radius: 999px;
                    font-family: 'Epilogue', sans-serif;
                    font-size: 1.05rem;
                    font-weight: 900;
                    letter-spacing: -0.01em;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 12px 32px rgba(124,58,237,0.4);
                    margin-top: 8px;
                    position: relative;
                    overflow: hidden;
                }
                .btn-spin::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
                    transform: translateX(-100%);
                    transition: transform 0.5s;
                }
                .btn-spin:hover::before { transform: translateX(100%); }
                .btn-spin:hover { transform: scale(1.02); box-shadow: 0 16px 40px rgba(124,58,237,0.5); }
                .btn-spin:active { transform: scale(0.98); }
                .btn-spin:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
                .btn-spin.spinning {
                    background: linear-gradient(135deg, #4b1d96, #6d28d9);
                    animation: pulse-glow 1s ease-in-out infinite;
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 12px 32px rgba(124,58,237,0.4); }
                    50% { box-shadow: 0 12px 48px rgba(168,85,247,0.7); }
                }
                .btn-whatsapp {
                    width: 100%;
                    padding: 18px 24px;
                    background: linear-gradient(135deg, #25D366, #128C7E);
                    color: white;
                    border: none;
                    border-radius: 999px;
                    font-family: 'Epilogue', sans-serif;
                    font-size: 1.05rem;
                    font-weight: 900;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 12px 32px rgba(37,211,102,0.3);
                    margin-top: 16px;
                }
                .btn-whatsapp:hover { transform: scale(1.02); }
                .prize-card {
                    background: linear-gradient(135deg, rgba(167,139,250,0.15), rgba(244,114,182,0.1));
                    border-radius: 24px;
                    padding: 24px;
                    text-align: center;
                    margin: 20px 0;
                    border: 1px solid rgba(167,139,250,0.3);
                    position: relative;
                    overflow: hidden;
                }
                .prize-card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 60%);
                    animation: shimmer 3s linear infinite;
                }
                @keyframes shimmer { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .prize-name {
                    font-family: 'Epilogue', sans-serif;
                    font-weight: 900;
                    font-size: 1.5rem;
                    background: linear-gradient(135deg, #a78bfa, #f472b6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 8px;
                    position: relative;
                }
                .prize-swatch {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    margin: 0 auto 12px;
                    border: 3px solid rgba(255,255,255,0.3);
                    box-shadow: 0 0 20px rgba(167,139,250,0.5);
                }
                .confetti-container {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    pointer-events: none;
                    z-index: 100;
                    overflow: hidden;
                }
                .confetti-piece {
                    position: absolute;
                    border-radius: 2px;
                    animation: fall linear forwards;
                }
                @keyframes fall {
                    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .ig-footer {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 20px;
                    position: relative;
                    z-index: 1;
                    text-decoration: none;
                }
                .ig-chip {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.08);
                    backdrop-filter: blur(8px);
                    border-radius: 999px;
                    border: 1px solid rgba(255,255,255,0.12);
                }
                .ig-handle {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 0.78rem;
                    font-weight: 700;
                    color: rgba(196,181,253,0.85);
                }
                .disclaimer {
                    text-align: center;
                    font-size: 0.72rem;
                    color: rgba(196,181,253,0.4);
                    margin-top: 20px;
                    line-height: 1.5;
                }
                .spinning-indicator {
                    text-align: center;
                    color: rgba(196,181,253,0.8);
                    font-size: 0.88rem;
                    font-weight: 600;
                    margin-top: 8px;
                    animation: pulse-text 1.5s ease-in-out infinite;
                }
                @keyframes pulse-text {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                .glow-ring {
                    position: absolute;
                    border-radius: 50%;
                    animation: glow-pulse 2s ease-in-out infinite;
                    pointer-events: none;
                }
                @keyframes glow-pulse {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.04); }
                }
            `}</style>

            {/* Confetti */}
            {confettiShown && stage === "prize" && (
                <div className="confetti-container">
                    {Array.from({ length: 70 }).map((_, i) => (
                        <div
                            key={i}
                            className="confetti-piece"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-${Math.random() * 20}px`,
                                background: ["#a78bfa", "#f472b6", "#fb923c", "#34d399", "#60a5fa", "#fbbf24"][i % 6],
                                animationDuration: `${1.5 + Math.random() * 2}s`,
                                animationDelay: `${Math.random() * 1}s`,
                                width: `${6 + Math.random() * 8}px`,
                                height: `${6 + Math.random() * 8}px`,
                                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="ruleta-root">
                {/* Sparkles */}
                {SPARKLES_POS.map((s, i) => (
                    <div key={i} className="sparkle-deco" style={{ ...s, animationDelay: s.delay }}>
                        <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z" fill="#a78bfa" opacity="0.7" />
                        </svg>
                    </div>
                ))}

                {/* Brand Header */}
                <div className="brand-header">
                    <div className="logo-ring">
                        <div className="logo-inner" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {logoUrl ? (
                                <img src={logoUrl} alt={salonNombre || "Logo"} style={{ width: "100%", height: "auto", maxHeight: "90px", objectFit: "contain" }} />
                            ) : (
                                <span className="logo-placeholder">{(salonNombre || "RS").slice(0, 2).toUpperCase()}</span>
                            )}
                        </div>
                    </div>
                    <span className="salon-tagline">{subtitle}</span>
                </div>

                <div className="card">
                    {/* STAGE: FORM */}
                    {stage === "form" && (
                        <>
                            <h1 className="title">🎡 ¡GIRÁ Y<br />GANÁ!</h1>
                            {promoNombre && <p className="promo-badge">{promoNombre}</p>}
                            <p className="subtitle">Ingresá tus datos y girá la ruleta para descubrir tu premio 🎁</p>

                            <div className="input-wrapper">
                                <span className="input-icon"><User size={16} /></span>
                                <input className="input-field" placeholder="Tu nombre 😊" value={nombre} onChange={e => setNombre(e.target.value)} />
                            </div>
                            <div className="input-wrapper">
                                <span className="input-icon"><Phone size={16} /></span>
                                <input className="input-field" placeholder="Tu WhatsApp 📱 (ej: 1123456789)" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
                            </div>

                            {/* WHEEL */}
                            {slicesLoaded && slices.filter(s => s.activo).length > 0 && (
                                <div className="wheel-container" style={{ marginTop: "20px" }}>
                                    <div className="wheel-wrapper">
                                        {/* Glow ring */}
                                        {isSpinning && (
                                            <div className="glow-ring" style={{
                                                inset: "-8px",
                                                background: "transparent",
                                                border: "3px solid rgba(167,139,250,0.5)",
                                                boxShadow: "0 0 30px rgba(167,139,250,0.4)"
                                            }} />
                                        )}
                                        <div className="needle" />
                                        <canvas ref={canvasRef} style={{ display: "block", borderRadius: "50%" }} />
                                        <button 
                                            className="center-spin-btn" 
                                            onClick={handleSortear} 
                                            disabled={loading || isSpinning || !slicesLoaded}
                                        >
                                            {isSpinning ? "⏳" : "GIRAR"}
                                        </button>
                                    </div>
                                    {isSpinning && (
                                        <p className="spinning-indicator">✨ ¡La ruleta está girando!</p>
                                    )}
                                </div>
                            )}

                            {!slicesLoaded && (
                                <div style={{ textAlign: "center", padding: "30px 0", color: "rgba(196,181,253,0.6)" }}>
                                    <div style={{ width: "40px", height: "40px", border: "3px solid rgba(167,139,250,0.3)", borderTop: "3px solid #a78bfa", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                                    Cargando ruleta...
                                </div>
                            )}

                            <p className="disclaimer">
                                🌟 Una participación por número de WhatsApp.<br />
                                Promociones no acumulables.
                            </p>
                        </>
                    )}

                    {/* STAGE: SPINNING — wheel is drawn on canvas, just show indicator */}
                    {stage === "spinning" && (
                        <>
                            <h1 className="title" style={{ marginBottom: "16px" }}>⏳ ¡Girando!</h1>
                            <div className="wheel-container">
                                <div className="wheel-wrapper">
                                    <div className="glow-ring" style={{
                                        inset: "-8px",
                                        background: "transparent",
                                        border: "3px solid rgba(167,139,250,0.6)",
                                        boxShadow: "0 0 40px rgba(167,139,250,0.5)"
                                    }} />
                                    <div className="needle" />
                                    <canvas ref={canvasRef} style={{ display: "block", borderRadius: "50%" }} />
                                    <button className="center-spin-btn" disabled>
                                         ⏳
                                    </button>
                                </div>
                                <p className="spinning-indicator" style={{ marginTop: "16px", fontSize: "1rem" }}>
                                    ✨ ¡El universo está eligiendo tu premio!
                                </p>
                            </div>
                        </>
                    )}

                    {/* STAGE: PRIZE */}
                    {stage === "prize" && winner && (
                        <>
                            <h1 className="title">¡Felicitaciones<br />{nombre}! 🎉</h1>
                            <p className="subtitle">¡La ruleta eligió tu premio! Reclamalo por WhatsApp.</p>

                            {/* Show final wheel position */}
                            <div className="wheel-container" style={{ marginBottom: "16px" }}>
                                <div className="wheel-wrapper">
                                    <div className="needle" />
                                    <canvas ref={canvasRef} style={{ display: "block", borderRadius: "50%" }} />
                                </div>
                            </div>

                            <div className="prize-card">
                                {winner.imagenUrl ? (
                                    <img src={winner.imagenUrl} alt={winner.nombre} style={{ width: "96px", height: "96px", objectFit: "contain", margin: "0 auto 12px", borderRadius: "12px", filter: "drop-shadow(0 0 20px rgba(167,139,250,0.5))" }} />
                                ) : (
                                    <div className="prize-swatch" style={{ background: winner.color }} />
                                )}
                                <div className="prize-name">{winner.nombre}</div>
                                {winner.descripcion && (
                                    <p style={{ color: "rgba(196,181,253,0.8)", fontSize: "0.88rem", marginBottom: "8px", position: "relative" }}>{winner.descripcion}</p>
                                )}
                            </div>

                            <p style={{ fontSize: "0.75rem", color: "rgba(196,181,253,0.6)", textAlign: "center", fontWeight: 600, marginBottom: "4px" }}>
                                ⚠️ Promociones no acumulables
                            </p>
                            <button className="btn-whatsapp" onClick={handleReclamar}>
                                💬 RECLAMAR MI PREMIO
                            </button>
                            <p className="disclaimer">
                                Al hacer clic se abrirá WhatsApp con el mensaje de tu premio.<br />
                                Envialo al negocio para hacerlo válido.
                            </p>
                        </>
                    )}

                    {/* STAGE: ALREADY PLAYED */}
                    {stage === "already_played" && (
                        <>
                            <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: "12px" }}>🎭</div>
                            <h1 className="title" style={{ fontSize: "1.6rem" }}>Ya participaste</h1>
                            <p className="subtitle" style={{ marginTop: "12px" }}>
                                Este número de WhatsApp ya giró la ruleta.<br /><br />
                                ¡Una participación por número! Pedile a tu amigo/a que pruebe con el suyo 😊
                            </p>
                        </>
                    )}

                    {/* STAGE: NO PRIZES */}
                    {stage === "no_prizes" && (
                        <>
                            <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: "12px" }}>😔</div>
                            <h1 className="title" style={{ fontSize: "1.6rem" }}>Sin premios activos</h1>
                            <p className="subtitle" style={{ marginTop: "12px" }}>
                                Por el momento no hay premios disponibles.<br />¡Volvé pronto!
                            </p>
                        </>
                    )}

                    {/* STAGE: INACTIVE */}
                    {stage === "inactive" && (
                        <>
                            <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: "12px" }}>🌙</div>
                            <h1 className="title" style={{ fontSize: "1.6rem" }}>Ruleta no disponible</h1>
                            <p className="subtitle" style={{ marginTop: "12px" }}>
                                Esta ruleta no está activa en este momento.<br />
                                ¡Seguinos para no perderte la próxima! ✨
                            </p>
                        </>
                    )}
                </div>

                {/* Instagram Footer */}
                {instagramHandle && instagramUrl && (
                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="ig-footer">
                        <div className="ig-chip">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <rect x="2" y="2" width="20" height="20" rx="5" stroke="rgba(196,181,253,0.8)" strokeWidth="2" />
                                <circle cx="12" cy="12" r="4" stroke="rgba(196,181,253,0.8)" strokeWidth="2" />
                                <circle cx="17.5" cy="6.5" r="1" fill="rgba(196,181,253,0.8)" />
                            </svg>
                            <span className="ig-handle">Seguinos en Instagram {instagramHandle}</span>
                        </div>
                    </a>
                )}
            </div>

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}
