"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Sparkles, Phone, User, Star } from "lucide-react";
import {
    getPromo,
    getPremios,
    checkParticipante,
    registrarParticipante,
    sortearPremio,
    Premio,
} from "@/lib/services/promoWebService";
import { Timestamp as FirebaseTimestamp } from "firebase/firestore";

type Stage = "form" | "spinning" | "prize" | "already_played" | "no_prizes" | "inactive";

const SPARKLES_POS = [
    { top: "5%", left: "8%", size: 28, delay: "0s" },
    { top: "12%", right: "10%", size: 20, delay: "0.4s" },
    { top: "30%", left: "3%", size: 16, delay: "0.8s" },
    { top: "25%", right: "5%", size: 22, delay: "1.2s" },
    { bottom: "20%", left: "6%", size: 18, delay: "0.6s" },
    { bottom: "10%", right: "8%", size: 24, delay: "1s" },
];

export default function PromoPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;
    const promoId = params.promoId as string;

    const [stage, setStage] = useState<Stage>("form");
    const [nombre, setNombre] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [loading, setLoading] = useState(false);
    const [promoNombre, setPromoNombre] = useState("");
    const [whatsappNegocio, setWhatsappNegocio] = useState("");
    const [premio, setPremio] = useState<Premio | null>(null);
    const [confettiShown, setConfettiShown] = useState(false);
    const [dots, setDots] = useState(".");

    // load tenant promo info
    useEffect(() => {
        if (!tenantId || !promoId) return;
        getPromo(tenantId, promoId).then(p => {
            if (!p) return;
            if (!p.activa) { setStage("inactive"); return; }
            setPromoNombre(p.nombre);
            setWhatsappNegocio(p.whatsapp_negocio);
        });
    }, [tenantId, promoId]);

    // animated dots during spinning
    useEffect(() => {
        if (stage !== "spinning") return;
        const interval = setInterval(() => {
            setDots(d => d.length >= 3 ? "." : d + ".");
        }, 300);
        return () => clearInterval(interval);
    }, [stage]);

    const handleSortear = useCallback(async () => {
        if (!nombre.trim()) return alert("Por favor ingresá tu nombre 💅");
        const cleanPhone = whatsapp.replace(/\D/g, "");
        if (cleanPhone.length < 8) return alert("Por favor ingresá un número de WhatsApp válido 📱");

        setLoading(true);
        try {
            // Anti-fraud check
            const existing = await checkParticipante(tenantId, promoId, cleanPhone);
            if (existing) {
                setStage("already_played");
                setLoading(false);
                return;
            }

            // Raffle
            setStage("spinning");
            const premiosList = await getPremios(tenantId, promoId);
            
            // Artificial suspense 
            await new Promise(r => setTimeout(r, 2800));

            const ganado = sortearPremio(premiosList);
            if (!ganado) {
                setStage("no_prizes");
                setLoading(false);
                return;
            }

            // Register winner
            await registrarParticipante(tenantId, promoId, {
                nombre: nombre.trim(),
                whatsapp: cleanPhone,
                premioId: ganado.id,
                premioNombre: ganado.nombre,
                ganado_en: FirebaseTimestamp.now(),
            });

            setPremio(ganado);
            setStage("prize");
            setConfettiShown(true);
        } catch (e) {
            console.error(e);
            alert("Hubo un error, intentá de nuevo 💔");
            setStage("form");
        } finally {
            setLoading(false);
        }
    }, [nombre, whatsapp, tenantId, promoId]);

    const handleReclamar = () => {
        if (!premio || !whatsappNegocio) return;
        const text = encodeURIComponent(`Hola! soy ${nombre.trim()} y me gané ${premio.nombre} 🎉`);
        const clean = whatsappNegocio.replace(/\D/g, "");
        window.open(`https://wa.me/${clean}?text=${text}`, "_blank");
    };

    const vencimientoStr = premio?.vencimiento?.toDate?.()?.toLocaleDateString("es-AR", {
        day: "2-digit", month: "long", year: "numeric"
    });

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

                * { box-sizing: border-box; margin: 0; padding: 0; }

                body { 
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    background: linear-gradient(135deg, #FFE4F0 0%, #F8ECFF 50%, #E8E4FF 100%);
                    min-height: 100vh;
                }

                .promo-root {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px 16px;
                    position: relative;
                    overflow: hidden;
                }

                .sparkle-deco {
                    position: fixed;
                    pointer-events: none;
                    z-index: 0;
                    animation: twinkle 3s ease-in-out infinite alternate;
                }
                @keyframes twinkle {
                    0% { opacity: 0.3; transform: scale(0.8) rotate(-10deg); }
                    100% { opacity: 0.9; transform: scale(1.1) rotate(10deg); }
                }

                .card {
                    background: rgba(255,255,255,0.75);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 32px;
                    padding: 40px 32px;
                    width: 100%;
                    max-width: 420px;
                    box-shadow: 0 24px 64px rgba(180, 0, 93, 0.12), 0 4px 16px rgba(0,0,0,0.05);
                    position: relative;
                    z-index: 1;
                }

                .title {
                    font-family: 'Epilogue', sans-serif;
                    font-weight: 900;
                    font-size: 2rem;
                    line-height: 1.1;
                    letter-spacing: -0.02em;
                    background: linear-gradient(135deg, #b4005d, #ff6fa2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-align: center;
                    margin-bottom: 8px;
                }

                .subtitle {
                    text-align: center;
                    color: #5e5b5c;
                    font-size: 0.9rem;
                    font-weight: 500;
                    line-height: 1.5;
                    margin-bottom: 28px;
                }

                .input-field {
                    width: 100%;
                    background: #f5eff1;
                    border: none;
                    border-radius: 16px;
                    padding: 14px 16px 14px 44px;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #302e30;
                    outline: none;
                    transition: all 0.2s;
                    margin-bottom: 12px;
                }
                .input-field:focus {
                    background: #fff;
                    box-shadow: 0 0 0 2px rgba(180, 0, 93, 0.2);
                }
                .input-field::placeholder { color: #b0acae; font-weight: 500; }

                .input-wrapper {
                    position: relative;
                    margin-bottom: 12px;
                }
                .input-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #ff6fa2;
                    pointer-events: none;
                }

                .btn-primary {
                    width: 100%;
                    padding: 18px 24px;
                    background: linear-gradient(135deg, #b4005d, #ff6fa2);
                    color: white;
                    border: none;
                    border-radius: 999px;
                    font-family: 'Epilogue', sans-serif;
                    font-size: 1.05rem;
                    font-weight: 900;
                    letter-spacing: -0.01em;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 12px 32px rgba(180, 0, 93, 0.3);
                    margin-top: 8px;
                }
                .btn-primary:hover { transform: scale(1.02); box-shadow: 0 16px 40px rgba(180, 0, 93, 0.35); }
                .btn-primary:active { transform: scale(0.98); }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

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
                    box-shadow: 0 12px 32px rgba(37, 211, 102, 0.3);
                    margin-top: 16px;
                }
                .btn-whatsapp:hover { transform: scale(1.02); }

                .prize-card {
                    background: linear-gradient(135deg, #fff0f7, #f8ecff);
                    border-radius: 24px;
                    padding: 24px;
                    text-align: center;
                    margin: 20px 0;
                    border: 2px solid rgba(180,0,93,0.1);
                }
                .prize-name {
                    font-family: 'Epilogue', sans-serif;
                    font-weight: 900;
                    font-size: 1.4rem;
                    color: #b4005d;
                    margin-bottom: 8px;
                }

                .spinning-area {
                    text-align: center;
                    padding: 20px 0;
                }
                .spin-circle {
                    width: 100px;
                    height: 100px;
                    border: 5px solid #f5eff1;
                    border-top: 5px solid #ff6fa2;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin: 0 auto 20px;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

                .confetti-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 100;
                    overflow: hidden;
                }
                .confetti-piece {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    border-radius: 2px;
                    animation: fall linear forwards;
                }
                @keyframes fall {
                    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }

                .disclaimer {
                    text-align: center;
                    font-size: 0.72rem;
                    color: #b0acae;
                    margin-top: 20px;
                    line-height: 1.5;
                }

                .already-played-icon {
                    font-size: 4rem;
                    text-align: center;
                    margin-bottom: 12px;
                }
            `}</style>

            {/* Confetti */}
            {confettiShown && stage === "prize" && (
                <div className="confetti-container">
                    {Array.from({ length: 60 }).map((_, i) => (
                        <div
                            key={i}
                            className="confetti-piece"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-${Math.random() * 20}px`,
                                background: ["#ff6fa2", "#b4005d", "#ddc8ff", "#65518a", "#fe97b9", "#FFE4F0"][i % 6],
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

            <div className="promo-root">
                {/* Sparkle decorations */}
                {SPARKLES_POS.map((s, i) => (
                    <div
                        key={i}
                        className="sparkle-deco"
                        style={{ ...s, animationDelay: s.delay }}
                    >
                        <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z"
                                fill="#ff6fa2" opacity="0.7" />
                        </svg>
                    </div>
                ))}

                <div className="card">
                    {/* STAGE: FORM */}
                    {stage === "form" && (
                        <>
                            <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: "8px" }}>✨</div>
                            <h1 className="title">¡HOY ES<br />TU DÍA DE<br />SUERTE!</h1>
                            {promoNombre && (
                                <p style={{ textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "#923f5f", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
                                    {promoNombre}
                                </p>
                            )}
                            <p className="subtitle">Ingresá tu nombre y WhatsApp para participar del sorteo 🎁</p>

                            <div className="input-wrapper">
                                <span className="input-icon"><User size={16} /></span>
                                <input
                                    className="input-field"
                                    placeholder="Tu nombre 💅"
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                />
                            </div>
                            <div className="input-wrapper">
                                <span className="input-icon"><Phone size={16} /></span>
                                <input
                                    className="input-field"
                                    placeholder="Tu WhatsApp 📱 (ej: 1123456789)"
                                    type="tel"
                                    value={whatsapp}
                                    onChange={e => setWhatsapp(e.target.value)}
                                />
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handleSortear}
                                disabled={loading}
                            >
                                🍀 ¡HOY ES MI DÍA DE SUERTE!
                            </button>

                            <p className="disclaimer">
                                🌸 Promociones no acumulables.<br />
                                Una participación por número de WhatsApp.
                            </p>
                        </>
                    )}

                    {/* STAGE: SPINNING */}
                    {stage === "spinning" && (
                        <div className="spinning-area">
                            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🌟</div>
                            <div className="spin-circle" />
                            <h2 style={{ fontFamily: "Epilogue, sans-serif", fontWeight: 900, fontSize: "1.4rem", color: "#b4005d", marginBottom: "8px" }}>
                                Sorteando tu premio{dots}
                            </h2>
                            <p style={{ color: "#5e5b5c", fontSize: "0.9rem" }}>¡El universo está eligiendo algo especial para vos! ✨</p>
                        </div>
                    )}

                    {/* STAGE: PRIZE */}
                    {stage === "prize" && premio && (
                        <>
                            <div style={{ textAlign: "center", fontSize: "3.5rem", marginBottom: "8px" }}>🎉</div>
                            <h1 className="title">¡Felicitaciones<br />{nombre}!</h1>
                            <p className="subtitle">¡Te ganaste un premio! Presioná el botón para reclamarlo por WhatsApp.</p>

                            <div className="prize-card">
                                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🏆</div>
                                <div className="prize-name">{premio.nombre}</div>
                                {premio.descripcion && (
                                    <p style={{ color: "#5e5b5c", fontSize: "0.88rem", marginBottom: "12px" }}>{premio.descripcion}</p>
                                )}
                                {vencimientoStr && (
                                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#923f5f", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                        Válido hasta el {vencimientoStr}
                                    </p>
                                )}
                            </div>

                            <p style={{ fontSize: "0.75rem", color: "#923f5f", textAlign: "center", fontWeight: 600, marginBottom: "4px" }}>
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
                            <div className="already-played-icon">💔</div>
                            <h1 className="title" style={{ fontSize: "1.6rem" }}>Ya participaste</h1>
                            <p className="subtitle" style={{ marginTop: "12px" }}>
                                Este número de WhatsApp ya participó en el sorteo.<br /><br />
                                ¡Una participación por número! Pedile a tu amiga que pruebe con el suyo 😊
                            </p>
                        </>
                    )}

                    {/* STAGE: NO PRIZES */}
                    {stage === "no_prizes" && (
                        <>
                            <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: "12px" }}>😔</div>
                            <h1 className="title" style={{ fontSize: "1.6rem" }}>Sin premios activos</h1>
                            <p className="subtitle" style={{ marginTop: "12px" }}>
                                Por el momento no hay premios disponibles para sortear.<br />
                                ¡Volvé pronto!
                            </p>
                        </>
                    )}

                    {/* STAGE: INACTIVE */}
                    {stage === "inactive" && (
                        <>
                            <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: "12px" }}>🌙</div>
                            <h1 className="title" style={{ fontSize: "1.6rem" }}>Promo no disponible</h1>
                            <p className="subtitle" style={{ marginTop: "12px" }}>
                                Esta promoción no está activa en este momento.<br />
                                ¡Seguinos para no perderte la próxima! ✨
                            </p>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
