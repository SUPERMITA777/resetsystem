"use server";

import { generateInterpretacion } from "../gemini";

export interface TarotSelection {
    nombre: string;
    invertida: boolean;
    posicion?: string;
    significado: string;
}

export async function getTarotReading(
    usuario: string,
    pregunta: string,
    cartas: TarotSelection[]
) {
    let prompt = "";

    if (cartas.length === 1) {
        const c = cartas[0];
        prompt = `Eres un experto tarotista con décadas de experiencia. 
Debes proporcionar una interpretación profunda y detallada de una ÚNICA carta de tarot.

La carta es: ${c.nombre} ${c.invertida ? "(Invertida)" : ""}
Significado: ${c.significado}

INSTRUCCIÓN CRÍTICA: Debes analizar esta carta en profundidad, considerando todos sus aspectos simbólicos, 
su significado tradicional, y ${c.invertida ? "especialmente su significado invertido" : "su significado en posición normal"}.

Estás realizando esta lectura para ${usuario}. Dirígete a esta persona por su nombre varias veces durante la lectura para hacerla más personal.

La persona ha formulado la siguiente pregunta o intención: "${pregunta}"
Asegúrate de abordar esta pregunta específica en tu interpretación.

ESTRUCTURA OBLIGATORIA:
1. Introducción breve sobre la carta y su significado general
2. Análisis profundo de la carta y su simbolismo
3. Interpretación específica en el contexto de la pregunta o situación del consultante
4. Consejo práctico basado en la energía de la carta
5. Conclusión que resuma el mensaje principal

Responde en español, con un tono místico pero accesible, en aproximadamente 300-400 palabras.
Asegúrate de mencionar el nombre de la carta (${c.nombre}) varias veces en tu interpretación.`;
    } else {
        const lastCard = cartas[cartas.length - 1];
        const cartasStr = cartas.map((c, i) => 
            `Carta ${i + 1} - ${c.posicion || "Posición " + (i+1)}: ${c.nombre} ${c.invertida ? "(Invertida)" : ""} - ${c.significado}`
        ).join("\n");

        prompt = `INSTRUCCIÓN CRÍTICA: Eres un experto tarotista. Debes interpretar TODAS las cartas, pero ESPECIALMENTE la última carta que es LA MÁS IMPORTANTE.

LA ÚLTIMA CARTA ES: ${lastCard.posicion || "Posición final"}: ${lastCard.nombre} ${lastCard.invertida ? "(Invertida)" : ""} - ${lastCard.significado}

Esta última carta es ABSOLUTAMENTE CRUCIAL y DEBES dedicarle un párrafo completo al final de tu interpretación.

Ahora, aquí están todas las cartas en orden:
${cartasStr}

RECUERDA: DEBES analizar CADA UNA de las cartas en tu interpretación, una por una, y NO OMITIR NINGUNA.

Estás realizando esta lectura para ${usuario}. Dirígete a esta persona por su nombre varias veces durante la lectura para hacerla más personal.

La persona ha formulado la siguiente pregunta o intención: "${pregunta}"
Asegúrate de abordar esta pregunta específica en tu interpretación.

ESTRUCTURA OBLIGATORIA:
1. Introducción general
${cartas.map((c, i) => `${i + 1 === cartas.length ? "UN PÁRRAFO COMPLETO DEDICADO A LA ÚLTIMA CARTA" : "Análisis de la carta " + (i+1)} (${c.posicion || "Posición " + (i+1)}: ${c.nombre})`).join("\n")}
6. Conclusión con consejo

RECUERDA: DEBES ANALIZAR TODAS LAS CARTAS. LA ÚLTIMA CARTA (${lastCard.nombre}) ES LA MÁS IMPORTANTE Y DEBES DEDICARLE UN PÁRRAFO COMPLETO.

Responde en español, con un tono místico pero accesible.`;
    }

    try {
        const response = await generateInterpretacion(prompt);
        return { success: true, text: response };
    } catch (error: any) {
        console.error("Error in tarot reading:", error);
        return { success: false, error: error.message };
    }
}
