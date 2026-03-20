import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
// Force v1beta or v1 depending on SDK preference, but 2.5 models are usually stable.
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: "v1beta" });

export async function generateInterpretacion(prompt: string) {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY no configurada. Por favor, agregala a tus variables de entorno.");
    }
    
    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini Flash Error:", error);
        const errorMessage = error.message || String(error);
        
        // If 404 or model not found, try fallback to gemini-2.5-pro
        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
            console.log("Intentando fallback con gemini-2.5-pro...");
            try {
                const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }, { apiVersion: "v1beta" });
                const result = await fallbackModel.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (fallbackError: any) {
                console.error("Fallback Error:", fallbackError);
                throw new Error(`Error en Oráculo (Fallback): ${fallbackError.message || fallbackError}`);
            }
        }
        
        throw new Error(`Error en Oráculo IA: ${errorMessage}`);
    }
}
