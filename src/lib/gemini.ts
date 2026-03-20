import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateInterpretacion(prompt: string) {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY no configurada. Por favor, agregala a tus variables de entorno.");
    }
    
    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini Error:", error);
        
        // If 404 or model not found, try fallback to gemini-pro
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            console.log("Intentando fallback con gemini-pro...");
            try {
                const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
                const result = await fallbackModel.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (fallbackError) {
                console.error("Fallback Error:", fallbackError);
                throw new Error("No se pudo conectar con el Oráculo IA. Por favor, verifica tu API Key.");
            }
        }
        
        throw error;
    }
}
